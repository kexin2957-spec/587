import type { Metadata } from "next";
import { CaseStudiesPage } from "@/components/sales/sales-enablement-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "View demo cases for the Website Sales & Lead Capture Agent and E-commerce Product Support Agent. Clearly labeled demo scenarios for sales enablement.",
  image: "/social/marketplace-og.svg",
  path: "/case-studies",
  title: "Demo Cases | AI Agent Marketplace",
});

export default function CaseStudiesRoutePage() {
  return <CaseStudiesPage />;
}
