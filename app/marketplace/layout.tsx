import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Explore launch-ready hosted AI agents with live demos, clear pricing, delivery documentation, license protection, and English/Chinese support.",
  image: "/social/marketplace-og.svg",
  path: "/marketplace",
  title: "AI Agent Marketplace | Ready-Made Business Agents",
});

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
