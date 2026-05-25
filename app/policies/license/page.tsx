import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "License terms for hosted AI agents, authorized domains, anti-copy protection, and usage restrictions.",
  path: "/policies/license",
  title: "AI Agent License Policy | AI Agent Marketplace",
});

export default function LicensePolicyPage() {
  return <PolicyPage slug="license" />;
}
