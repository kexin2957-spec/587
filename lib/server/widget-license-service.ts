import { createClient } from "@supabase/supabase-js";
import { createDefaultCustomerConfig } from "@/lib/marketplace/customer-config";
import type { UsageEventType } from "@/lib/marketplace/constants";
import {
  getDomainFromRequest,
  getLicenseFailure,
  getOriginFromRequest,
  LICENSE_ERROR_MESSAGE_EN,
  LICENSE_ERROR_MESSAGE_ZH,
  logMockUsageEvent,
  normalizeDomain,
  usageEventForFailure,
  validateWidgetAuthToken,
} from "@/lib/server/license-service";
import {
  getMockAgentLicenseStore,
  getMockCustomerAgentConfigStore,
  getMockOrderStore,
  type MockAgentLicenseRecord,
  type MockCustomerAgentConfigRecord,
  type MockOrderRecord,
} from "@/lib/server/marketplace-admin-store";
import { logSecurityEvent } from "@/lib/server/monitoring";

export type WidgetLicensePayload = {
  agent_id?: string;
  license_key?: string;
  order_number?: string | null;
  parent_domain?: string | null;
  widget_auth_token?: string | null;
};

export type WidgetLicenseContext = {
  agentId: string;
  config: MockCustomerAgentConfigRecord | null;
  domain: string;
  errorCode: string;
  license: MockAgentLicenseRecord | null;
  mode: "mock" | "supabase";
  ok: boolean;
  order: MockOrderRecord | null;
  platformDomain: string;
};

type SupabaseLicenseRecord = MockAgentLicenseRecord & {
  marketplace_agents?: { slug?: string | null } | null;
  orders?: MockOrderRecord | null;
};

type SupabaseConfigClient = {
  from: (table: "customer_agent_configs") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => unknown;
      };
    };
  };
};

export async function validateWidgetLicense(
  request: Request,
  payload: WidgetLicensePayload,
): Promise<WidgetLicenseContext> {
  const agentId = payload.agent_id?.trim() ?? "";
  const licenseKey = payload.license_key?.trim() ?? "";
  const origin = getOriginFromRequest(request);
  const platformDomain = normalizeDomain(origin);
  const explicitDomain = normalizeDomain(payload.parent_domain);
  const observedDomain = getDomainFromRequest(request) || platformDomain;
  const domain = resolveWidgetDomain({
    explicitDomain,
    observedDomain,
    platformDomain,
  });
  const authError = getWidgetAuthError({
    agentId,
    domain,
    explicitDomain,
    licenseKey,
    observedDomain,
    platformDomain,
    token: payload.widget_auth_token,
  });

  if (!agentId || !licenseKey) {
    return {
      agentId,
      config: null,
      domain,
      errorCode: "license_required",
      license: null,
      mode: getMode(),
      ok: false,
      order: null,
      platformDomain,
    };
  }

  if (authError) {
    return {
      agentId,
      config: null,
      domain,
      errorCode: authError,
      license: null,
      mode: getMode(),
      ok: false,
      order: null,
      platformDomain,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return validateSupabaseLicense({
      agentId,
      domain,
      licenseKey,
      platformDomain,
      serviceRoleKey,
      supabaseUrl,
    });
  }

  return validateMockLicense({
    agentId,
    domain,
    licenseKey,
    platformDomain,
  });
}

export async function recordWidgetUsage(
  context: WidgetLicenseContext,
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {},
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && context.mode === "supabase") {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase.from("usage_logs").insert({
      agent_id: context.license?.agent_id ?? null,
      domain: context.domain || null,
      event_type: eventType,
      license_id: context.license?.id ?? null,
      metadata,
    });

    if (
      context.license?.id &&
      (eventType === "widget_load" || eventType === "chat_message")
    ) {
      await supabase
        .from("agent_licenses")
        .update({
          usage_count_monthly: (context.license.usage_count_monthly ?? 0) + 1,
        })
        .eq("id", context.license.id);
    }

    return;
  }

  logMockUsageEvent({
    agentId: context.license?.agent_id ?? context.agentId,
    domain: context.domain || null,
    eventType,
    licenseId: context.license?.id ?? null,
    metadata,
  });

  if (
    context.license &&
    (eventType === "widget_load" || eventType === "chat_message")
  ) {
    context.license.usage_count_monthly += 1;
    context.license.updated_at = new Date().toISOString();
  }
}

export function getLicenseErrorResponse(context: WidgetLicenseContext, status = 403) {
  logSecurityEvent("widget_license_error", {
    agent_id: context.agentId,
    domain: context.domain,
    error_code: context.errorCode,
    mode: context.mode,
  });

  return Response.json(
    {
      error: LICENSE_ERROR_MESSAGE_EN,
      error_code: context.errorCode,
      message_en: LICENSE_ERROR_MESSAGE_EN,
      message_zh: LICENSE_ERROR_MESSAGE_ZH,
      ok: false,
    },
    { status },
  );
}

function validateMockLicense({
  agentId,
  domain,
  licenseKey,
  platformDomain,
}: {
  agentId: string;
  domain: string;
  licenseKey: string;
  platformDomain: string;
}): WidgetLicenseContext {
  const license =
    getMockAgentLicenseStore().find((item) => item.license_key === licenseKey) ??
    null;
  const order = license
    ? getMockOrderStore().find((item) => item.id === license.order_id) ?? null
    : null;
  const normalizedLicense = license
    ? { ...license, agent_id: order?.agent_slug ?? license.agent_id }
    : null;
  const errorCode = getLicenseFailure(
    normalizedLicense,
    order,
    agentId,
    domain,
    platformDomain,
  );
  const config = order ? getMockConfig(order) : null;

  return {
    agentId,
    config,
    domain,
    errorCode,
    license,
    mode: "mock",
    ok: !errorCode,
    order,
    platformDomain,
  };
}

async function validateSupabaseLicense({
  agentId,
  domain,
  licenseKey,
  platformDomain,
  serviceRoleKey,
  supabaseUrl,
}: {
  agentId: string;
  domain: string;
  licenseKey: string;
  platformDomain: string;
  serviceRoleKey: string;
  supabaseUrl: string;
}): Promise<WidgetLicenseContext> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("agent_licenses")
    .select("*, orders(*), marketplace_agents(slug)")
    .eq("license_key", licenseKey)
    .maybeSingle();

  if (error) {
    return {
      agentId,
      config: null,
      domain,
      errorCode: "license_lookup_failed",
      license: null,
      mode: "supabase",
      ok: false,
      order: null,
      platformDomain,
    };
  }

  const record = data as unknown as SupabaseLicenseRecord | null;
  const order = record?.orders ?? null;
  const agentSlug = record?.marketplace_agents?.slug ?? order?.agent_slug ?? "";
  const normalizedLicense = record
    ? ({ ...record, agent_id: agentSlug } as MockAgentLicenseRecord)
    : null;
  const errorCode = getLicenseFailure(
    normalizedLicense,
    order,
    agentId,
    domain,
    platformDomain,
  );
  const config = order
    ? await getSupabaseConfig(supabase as unknown as SupabaseConfigClient, order)
    : null;

  return {
    agentId,
    config,
    domain,
    errorCode,
    license: record,
    mode: "supabase",
    ok: !errorCode,
    order,
    platformDomain,
  };
}

function getMockConfig(order: MockOrderRecord) {
  let config =
    getMockCustomerAgentConfigStore().find(
      (item) => item.order_id === order.id || item.order_number === order.order_number,
    ) ?? null;

  if (!config) {
    config = createDefaultCustomerConfig({
      agentId: order.agent_id,
      agentSlug: order.agent_slug,
      businessName: order.company_name,
      contactEmail: order.customer_email,
      orderId: order.id,
      orderNumber: order.order_number,
    });
    getMockCustomerAgentConfigStore().push(config);
  }

  return config;
}

async function getSupabaseConfig(
  supabase: SupabaseConfigClient,
  order: MockOrderRecord,
) {
  const result = (await supabase
    .from("customer_agent_configs")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle()) as { data?: unknown | null };
  const data = result.data ?? null;

  return (
    (data as MockCustomerAgentConfigRecord | null) ??
    createDefaultCustomerConfig({
      agentId: order.agent_id,
      agentSlug: order.agent_slug,
      businessName: order.company_name,
      contactEmail: order.customer_email,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  );
}

function getMode() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "supabase"
    : "mock";
}

export function eventTypeForWidgetFailure(context: WidgetLicenseContext) {
  return usageEventForFailure(context.errorCode);
}

function resolveWidgetDomain({
  explicitDomain,
  observedDomain,
  platformDomain,
}: {
  explicitDomain: string;
  observedDomain: string;
  platformDomain: string;
}) {
  if (!explicitDomain) {
    return observedDomain || platformDomain;
  }

  if (
    observedDomain &&
    observedDomain !== platformDomain &&
    observedDomain !== explicitDomain
  ) {
    return observedDomain;
  }

  return explicitDomain;
}

function getWidgetAuthError({
  agentId,
  domain,
  explicitDomain,
  licenseKey,
  observedDomain,
  platformDomain,
  token,
}: {
  agentId: string;
  domain: string;
  explicitDomain: string;
  licenseKey: string;
  observedDomain: string;
  platformDomain: string;
  token?: string | null;
}) {
  if (!agentId || !licenseKey || !explicitDomain) {
    return "";
  }

  if (
    observedDomain &&
    observedDomain !== platformDomain &&
    observedDomain !== explicitDomain
  ) {
    return "domain_spoofed";
  }

  if (observedDomain && observedDomain !== platformDomain) {
    return "";
  }

  return validateWidgetAuthToken({
    agentId,
    domain,
    licenseKey,
    token,
  })
    ? ""
    : "widget_auth_invalid";
}
