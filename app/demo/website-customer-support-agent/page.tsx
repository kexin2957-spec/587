import type { Metadata } from "next";
import { WebsiteSupportProductDemo } from "@/components/demo/website-support-product-demo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Try a customer-facing demo website with an installed AI sales, support, and lead capture agent.",
  image: "/social/website-agent-og.svg",
  path: "/demo/website-customer-support-agent",
  title: "Website Sales & Lead Capture Agent Demo | AI Agent Marketplace",
});

export default function WebsiteCustomerSupportAgentDemoPage() {
  return <WebsiteSupportProductDemo />;
}
