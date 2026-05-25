import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Refund policy for hosted AI agents, setup services, custom AI agent work, and marketplace orders.",
  path: "/policies/refund-policy",
  title: "Refund Policy | AI Agent Marketplace",
});

export default function RefundPolicyPage() {
  return <PolicyPage slug="refund-policy" />;
}
