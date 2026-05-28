import type { Metadata } from "next";
import { CustomerAgentUsagePage } from "@/components/customer/customer-agent-usage-page";

export const metadata: Metadata = {
  title: "Agent 使用页 | AI Agent Marketplace",
  description: "个人中心中的已购 Agent 使用页。",
};

export default async function CustomerAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  return <CustomerAgentUsagePage agentId={agentId} />;
}
