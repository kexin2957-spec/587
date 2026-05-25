import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Privacy policy for AI Agent Marketplace buyers, sellers, custom requests, customer dashboards, and hosted agent usage.",
  path: "/policies/privacy-policy",
  title: "Privacy Policy | AI Agent Marketplace",
});

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" />;
}
