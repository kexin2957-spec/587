import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/marketplace/agent-detail-view";
import { demoAgents } from "@/lib/marketplace/demo-data";
import { loadPublicMarketplaceAgentBySlug } from "@/lib/server/public-agent-service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return demoAgents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { agent } = await loadPublicMarketplaceAgentBySlug(slug);
  const title = agent
    ? `${agent.titleEn || agent.titleZh} | AI Agent Marketplace`
    : "AI Agent | AI Agent Marketplace";
  const description =
    agent?.shortDescriptionEn ||
    "Hosted, license-protected AI agent listing with demo, pricing, delivery details, and setup support.";
  const image =
    slug === "website-customer-support-agent"
      ? "/social/website-agent-og.svg"
      : slug === "ecommerce-product-support-agent"
        ? "/social/ecommerce-agent-og.svg"
        : "/social/marketplace-og.svg";

  return buildPageMetadata({
    description,
    image,
    path: `/agents/${slug}`,
    title,
  });
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { agent } = await loadPublicMarketplaceAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  return <AgentDetailView agent={agent} />;
}
