import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Request custom AI agent development for CRM integration, Shopify support, calendar booking, internal knowledge bases, APIs, and custom business workflows.",
  image: "/social/custom-service-og.svg",
  path: "/custom-service",
  title: "Custom AI Agent Development from $999 | AI Agent Marketplace",
});

export default function CustomServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
