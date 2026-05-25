import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  LicenseStatus,
  UsageEventType,
} from "@/lib/marketplace/constants";
import type {
  MockAgentLicenseRecord,
  MockDeliveryPackageRecord,
  MockOrderRecord,
  MockUsageLogRecord,
} from "@/lib/server/marketplace-admin-store";
import { getMockUsageLogStore } from "@/lib/server/marketplace-admin-store";

export type UsageSummary = {
  blocked_domain: number;
  chat_message: number;
  lead_created: number;
  license_error: number;
  widget_load: number;
};

const WIDGET_AUTH_TOKEN_TTL_MS = 30 * 60 * 1000;

export const LICENSE_ERROR_MESSAGE_EN =
  "This AI agent is not licensed for this website.";
export const LICENSE_ERROR_MESSAGE_ZH =
  "该 AI Agent 未授权在当前网站使用。";

export function generateLicenseKey() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 20)
    .toUpperCase();

  return `AAM-LIC-${datePart}-${randomPart}`;
}

export function normalizeDomain(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  try {
    const hostname = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    ).hostname;

    return hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.replace(/^www\./, "") ?? "";
  }
}

export function normalizeAllowedDomains(values: string[] | string | null | undefined) {
  const rawValues = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[,\n]/)
      : [];

  return Array.from(
    new Set(rawValues.map(normalizeDomain).filter(Boolean)),
  );
}

export function isDomainAllowed({
  allowedDomains,
  currentDomain,
  platformDomain,
}: {
  allowedDomains: string[];
  currentDomain: string;
  platformDomain: string;
}) {
  const normalizedCurrent = normalizeDomain(currentDomain);
  const normalizedPlatform = normalizeDomain(platformDomain);

  if (!normalizedCurrent) {
    return false;
  }

  if (normalizedPlatform && normalizedCurrent === normalizedPlatform) {
    return true;
  }

  return normalizeAllowedDomains(allowedDomains).includes(normalizedCurrent);
}

export function getOriginFromRequest(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("origin") ||
    new URL(request.url).origin
  );
}

export function getDomainFromRequest(request: Request, explicitDomain?: string | null) {
  const normalizedExplicit = normalizeDomain(explicitDomain);

  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  const referrer = request.headers.get("referer") || request.headers.get("referrer");

  return normalizeDomain(referrer);
}

export function createWidgetAuthToken({
  agentId,
  domain,
  issuedAt = Date.now(),
  licenseKey,
}: {
  agentId: string;
  domain: string;
  issuedAt?: number;
  licenseKey: string;
}) {
  const normalizedDomain = normalizeDomain(domain);
  const payload = [
    agentId.trim(),
    licenseKey.trim(),
    normalizedDomain,
    String(issuedAt),
  ].join(".");
  const signature = signWidgetPayload(payload);

  return `${issuedAt}.${signature}`;
}

export function validateWidgetAuthToken({
  agentId,
  domain,
  licenseKey,
  token,
}: {
  agentId: string;
  domain: string;
  licenseKey: string;
  token: string | null | undefined;
}) {
  if (!token?.trim()) {
    return false;
  }

  const [issuedAtValue, signature] = token.split(".");
  const issuedAt = Number(issuedAtValue);

  if (!Number.isFinite(issuedAt) || !signature) {
    return false;
  }

  if (Date.now() - issuedAt > WIDGET_AUTH_TOKEN_TTL_MS) {
    return false;
  }

  const normalizedDomain = normalizeDomain(domain);
  const payload = [
    agentId.trim(),
    licenseKey.trim(),
    normalizedDomain,
    String(issuedAt),
  ].join(".");
  const expectedSignature = signWidgetPayload(payload);

  return safeEqual(signature, expectedSignature);
}

export function buildDeliveryUrls({
  agentSlug,
  licenseKey,
  origin,
}: {
  agentSlug: string;
  licenseKey: string;
  origin: string;
}): Pick<MockDeliveryPackageRecord, "embed_code" | "hosted_agent_url"> {
  const hostedAgentUrl = `${origin}/embed/agents/${agentSlug}?license=${encodeURIComponent(
    licenseKey,
  )}`;
  const scriptCode = `<script src="${origin}/widget.js" data-agent-id="${agentSlug}" data-license-key="${licenseKey}" async></script>`;
  const iframeCode = `<iframe src="${hostedAgentUrl}" width="100%" height="600" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy" title="AI Agent Chat Widget"></iframe>`;

  return {
    embed_code: `${scriptCode}\n\n<!-- Iframe fallback -->\n${iframeCode}`,
    hosted_agent_url: hostedAgentUrl,
  };
}

export function createLicenseFromOrder({
  allowedDomains,
  licenseKey = generateLicenseKey(),
  order,
  timestamp = new Date().toISOString(),
}: {
  allowedDomains: string[];
  licenseKey?: string;
  order: MockOrderRecord;
  timestamp?: string;
}): MockAgentLicenseRecord {
  return {
    agent_id: order.agent_id,
    allowed_domains: normalizeAllowedDomains(allowedDomains),
    created_at: timestamp,
    customer_email: order.customer_email,
    customer_name: order.customer_name,
    expires_at: null,
    id: crypto.randomUUID(),
    license_key: licenseKey,
    order_id: order.id,
    plan_name: order.plan_name,
    status: "active",
    updated_at: timestamp,
    usage_count_monthly: 0,
    usage_limit_monthly: null,
  };
}

export function canGenerateLicenseForOrder(order: MockOrderRecord | null | undefined) {
  if (!order) {
    return "Order not found.";
  }

  if (!order.agent_id || !order.agent_slug) {
    return "Order is missing an agent.";
  }

  if (!order.customer_email?.trim()) {
    return "Order is missing a customer email.";
  }

  if (!isPaymentApproved(order)) {
    return "Payment must be paid or manually approved before generating a license.";
  }

  return "";
}

export function isPaymentApproved(order: Pick<MockOrderRecord, "order_status" | "payment_status">) {
  return (
    order.payment_status === "paid" ||
    order.payment_status === "manually_approved" ||
    order.order_status === "paid" ||
    order.order_status === "delivered" ||
    order.order_status === "completed"
  );
}

export function summarizeUsageLogs(
  logs: Array<Pick<MockUsageLogRecord, "event_type">>,
): UsageSummary {
  const summary: UsageSummary = {
    blocked_domain: 0,
    chat_message: 0,
    lead_created: 0,
    license_error: 0,
    widget_load: 0,
  };

  for (const log of logs) {
    summary[log.event_type] += 1;
  }

  return summary;
}

export function logMockUsageEvent({
  agentId,
  domain,
  eventType,
  licenseId,
  metadata = {},
}: {
  agentId: string;
  domain: string | null;
  eventType: UsageEventType;
  licenseId: string | null;
  metadata?: Record<string, unknown>;
}) {
  getMockUsageLogStore().push({
    agent_id: agentId,
    created_at: new Date().toISOString(),
    domain,
    event_type: eventType,
    id: crypto.randomUUID(),
    license_id: licenseId,
    metadata,
  });
}

export function getLicenseFailure(
  license: MockAgentLicenseRecord | null | undefined,
  order: MockOrderRecord | null | undefined,
  agentSlug: string,
  domain: string,
  platformDomain: string,
) {
  if (!license) {
    return "license_not_found";
  }

  if (license.agent_id !== agentSlug) {
    return "agent_mismatch";
  }

  if (license.status !== "active") {
    return `license_${license.status}` as const;
  }

  if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
    return "license_expired";
  }

  if (!isPaymentApproved(order ?? { order_status: "cancelled", payment_status: "cancelled" })) {
    return "payment_not_approved";
  }

  if (
    typeof license.usage_limit_monthly === "number" &&
    license.usage_limit_monthly >= 0 &&
    license.usage_count_monthly >= license.usage_limit_monthly
  ) {
    return "usage_limit_reached";
  }

  if (
    !isDomainAllowed({
      allowedDomains: license.allowed_domains,
      currentDomain: domain,
      platformDomain,
    })
  ) {
    return "domain_not_allowed";
  }

  return "";
}

export function usageEventForFailure(reason: string): UsageEventType {
  return reason === "domain_not_allowed" ? "blocked_domain" : "license_error";
}

export function toLicenseStatus(value: unknown): LicenseStatus {
  return value === "active" ||
    value === "inactive" ||
    value === "suspended" ||
    value === "expired"
    ? value
    : "inactive";
}

function signWidgetPayload(payload: string) {
  return createHmac("sha256", getWidgetSigningSecret())
    .update(payload)
    .digest("base64url");
}

function getWidgetSigningSecret() {
  return (
    process.env.WIDGET_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "ai-agent-marketplace-development-widget-secret"
  );
}

function safeEqual(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}
