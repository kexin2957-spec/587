import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/policy-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Seller guidelines for creator applications, originality confirmation, review requirements, and revenue share readiness.",
  path: "/policies/seller-guidelines",
  title: "Seller Guidelines | AI Agent Marketplace",
});

export default function SellerGuidelinesPage() {
  return <PolicyPage slug="seller-guidelines" />;
}
