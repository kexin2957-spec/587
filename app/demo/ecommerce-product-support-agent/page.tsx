import type { Metadata } from "next";
import { EcommerceProductDemo } from "@/components/demo/ecommerce-product-demo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Try a server-side demo of the E-commerce Product Support Agent for product questions, shipping, returns, and purchase intent.",
  image: "/social/ecommerce-agent-og.svg",
  path: "/demo/ecommerce-product-support-agent",
  title: "E-commerce Product Support Agent Demo | AI Agent Marketplace",
});

export default function EcommerceProductSupportAgentDemoPage() {
  return <EcommerceProductDemo />;
}
