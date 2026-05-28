"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { MediaAccountDiagnosisAgent } from "@/components/tools/media-account-diagnosis-agent";
import type { UserAgentRecord } from "@/components/customer/my-agents-dashboard";

export function CustomerAgentUsagePage({ agentId }: { agentId: string }) {
  const { isLoading, user } = useAuth();
  const [agents, setAgents] = useState<UserAgentRecord[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const decodedAgentId = decodeURIComponent(agentId);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let active = true;

    async function loadAgents() {
      setIsLoadingAgents(true);
      const response = await fetch(`/api/user_agents?user_id=${encodeURIComponent(userId)}`);
      const payload = (await response.json().catch(() => ({}))) as {
        data?: UserAgentRecord[];
      };

      if (active) {
        setAgents(payload.data ?? []);
        setIsLoadingAgents(false);
      }
    }

    void loadAgents().catch(() => {
      if (active) {
        setAgents([]);
        setIsLoadingAgents(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const agent = useMemo(
    () =>
      agents.find((item) => item.id === decodedAgentId || item.agentSlug === decodedAgentId) ??
      null,
    [agents, decodedAgentId],
  );

  if (isLoading) {
    return <UsageGate title="正在确认登录状态..." />;
  }

  if (!user) {
    return <UsageGate title="请先登录后使用已购 Agent。" />;
  }

  if (isLoadingAgents) {
    return <UsageGate title="正在加载 Agent 使用页..." />;
  }

  if (!agent) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="app-container py-10">
          <section className="premium-card max-w-xl p-6">
            <h1 className="text-2xl font-semibold text-slate-950">没有找到这个 Agent</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              请回到个人中心，从“我的 Agent”列表重新进入。
            </p>
            <Link className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/customer/dashboard">
              返回个人中心
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (agent.agentSlug === "media-account-diagnosis-agent") {
    return (
      <div className="bg-slate-50">
        <div className="app-container pt-6">
          <Link className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50" href="/customer/dashboard">
            返回个人中心
          </Link>
        </div>
        <MediaAccountDiagnosisAgent />
      </div>
    );
  }

  const remaining = Math.max(0, agent.dailyLimit - agent.usageToday);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="app-container py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-semibold text-blue-700 hover:text-blue-600" href="/customer/dashboard">
              返回个人中心
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{agent.agentName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{agent.description}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-800">今日剩余使用次数</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">
              {remaining}/{agent.dailyLimit}
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="premium-card p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Agent 使用页</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">已购版本快捷使用</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              这里保留 Marketplace 上的使用入口，但不展示购买按钮。后续可以把每个 Agent 的真实运行组件挂载到这个区域。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a className="rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-600" href={agent.launchUrl}>
                打开 Agent
              </a>
              <button
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50"
                onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}${agent.launchUrl}`)}
                type="button"
              >
                复制使用链接
              </button>
              <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50" type="button">
                导出记录
              </button>
              <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50" type="button">
                查看使用计划
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-950">使用记录</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                <li>今日已使用：{agent.usageToday} 次</li>
                <li>最近使用：{agent.lastUsedAt ? new Date(agent.lastUsedAt).toLocaleString("zh-CN") : "未使用"}</li>
                <li>当前状态：{agent.status === "active" ? "使用中" : agent.status === "unused" ? "未使用" : "已过期"}</li>
              </ul>
            </div>
          </div>

          <aside className="soft-card p-5">
            <h2 className="font-semibold text-slate-950">Agent 信息</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <InfoRow label="分类" value={agent.category} />
              <InfoRow label="行业" value={agent.industry} />
              <InfoRow label="用途" value={agent.useCase} />
              <InfoRow label="标签" value={agent.tags.length ? agent.tags.join("、") : "暂无标签"} />
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}

function UsageGate({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="app-container py-10">
        <section className="premium-card max-w-xl p-6">
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            个人中心里的 Agent 使用页需要登录后访问。
          </p>
          <Link className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/sign-in?next=/customer/dashboard">
            去登录
          </Link>
        </section>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[190px] text-right font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
