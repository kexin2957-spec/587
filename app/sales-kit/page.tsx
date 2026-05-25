import type { Metadata } from "next";
import { SalesKitPage } from "@/components/sales/sales-enablement-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Sales enablement page for AI Agent Marketplace: pitch, launch agents, pricing summary, demo links, delivery process, FAQ, and sales qualification form.",
  image: "/social/marketplace-og.svg",
  path: "/sales-kit",
  title: "Sales Kit | AI Agent Marketplace",
});

export default function SalesKitRoutePage() {
  return <SalesKitPage />;
}
