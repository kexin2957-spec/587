import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Review policy for AI agent listings, seller submissions, platform verification, and marketplace trust signals.",
  path: "/policies/review-policy",
  title: "Review Policy | AI Agent Marketplace",
});

export default function ReviewPolicyPage() {
  return <PolicyPage slug="review-policy" />;
}
