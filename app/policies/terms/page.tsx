import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Terms for buying, using, embedding, and selling hosted AI agents on AI Agent Marketplace.",
  path: "/policies/terms",
  title: "Terms | AI Agent Marketplace",
});

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
