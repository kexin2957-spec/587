import type { Metadata } from "next";
import { headers } from "next/headers";
import { EmbeddedAgentWidget } from "@/components/widget/embedded-agent-widget";
import {
  createWidgetAuthToken,
  normalizeDomain,
} from "@/lib/server/license-service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Embedded hosted AI agent widget with license validation, authorized-domain protection, lead capture, and customer configuration support.",
  image: "/social/marketplace-og.svg",
  path: "/embed/agents/website-customer-support-agent",
  title: "Hosted AI Agent Widget Demo | AI Agent Marketplace",
});

const publicDemoAgentSlugs = new Set([
  "website-customer-support-agent",
  "ecommerce-product-support-agent",
]);

export default async function EmbeddedAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ license?: string; order?: string; parent_domain?: string }>;
}) {
  const { agentId } = await params;
  const { license, order, parent_domain: parentDomain } = await searchParams;
  const requestHeaders = await headers();
  const hostDomain = normalizeDomain(
    process.env.NEXT_PUBLIC_SITE_URL || requestHeaders.get("host"),
  );
  const referrerDomain = normalizeDomain(
    requestHeaders.get("referer") || requestHeaders.get("referrer"),
  );
  const requestedParentDomain = normalizeDomain(parentDomain);
  const effectiveParentDomain =
    referrerDomain && referrerDomain !== hostDomain
      ? referrerDomain
      : requestedParentDomain || referrerDomain;
  const widgetAuthToken =
    license && effectiveParentDomain
      ? createWidgetAuthToken({
          agentId,
          domain: effectiveParentDomain,
          licenseKey: license,
        })
      : null;

  return (
    <EmbeddedAgentWidget
      agentId={agentId}
      demoMode={!license && publicDemoAgentSlugs.has(agentId)}
      licenseKey={license ?? null}
      orderNumber={order ?? null}
      parentDomain={effectiveParentDomain || null}
      widgetAuthToken={widgetAuthToken}
    />
  );
}
