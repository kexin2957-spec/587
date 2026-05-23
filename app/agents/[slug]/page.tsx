import { notFound } from "next/navigation";
import { AgentDetailView } from "@/components/marketplace/agent-detail-view";
import { demoAgents } from "@/lib/marketplace/demo-data";
import { loadPublicMarketplaceAgentBySlug } from "@/lib/server/public-agent-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return demoAgents.map((agent) => ({ slug: agent.slug }));
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
