import type { Metadata } from "next";
import { MyAgentsDashboard } from "@/components/customer/my-agents-dashboard";

export const metadata: Metadata = {
  title: "个人中心 / 我的 Agent | AI Agent Marketplace",
  description: "登录后管理已购买 Agent、收藏、分类和快捷使用入口。",
};

export default function CustomerDashboardPage() {
  return <MyAgentsDashboard />;
}
