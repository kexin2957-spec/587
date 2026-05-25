import type { Metadata } from "next";
import { AboutWhyUsPage } from "@/components/sales/sales-enablement-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Learn why AI Agent Marketplace sells hosted, license-protected AI agents instead of raw prompt templates.",
  image: "/social/marketplace-og.svg",
  path: "/about",
  title: "About / Why Us | AI Agent Marketplace",
});

export default function AboutPage() {
  return <AboutWhyUsPage />;
}
