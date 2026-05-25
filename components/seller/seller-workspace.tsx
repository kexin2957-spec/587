"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslation } from "@/components/i18n/language-provider";
import type { PricingType } from "@/lib/marketplace/constants";

type SellerWorkspaceView = "overview" | "agents" | "sales" | "payouts";

type SellerDashboardAgent = {
  created_at: string;
  creator_revenue_rate?: number | null;
  id: string;
  is_featured?: boolean;
  is_verified?: boolean;
  platform_commission_rate?: number | null;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_type?: PricingType;
  review_feedback?: string | null;
  revenue_share_type?: string | null;
  short_description_en?: string;
  short_description_zh?: string;
  slug: string;
  status: string;
  title_en: string;
  title_zh: string;
  updated_at: string;
};

type SellerDashboardSale = {
  agent_title_en: string;
  agent_title_zh: string;
  amount: number;
  created_at: string;
  creator_revenue: number;
  currency: "USD" | "CNY";
  order_number: string;
  order_status: string;
  paid: boolean;
  payment_status: string;
  plan_name: string;
  platform_commission: number;
  revenue_share_label_en: string;
  revenue_share_label_zh: string;
  revenue_share_type: string;
};

type SellerDashboardData = {
  agents: SellerDashboardAgent[];
  applications: Array<{
    admin_note?: string | null;
    created_at: string;
    id: string;
    status: string;
  }>;
  payouts: Array<{
    amount: number | string;
    created_at: string;
    currency: "USD" | "CNY";
    id: string;
    notes?: string | null;
    status: string;
    updated_at: string;
  }>;
  profile: {
    display_name?: string;
    email: string;
    status: string;
    team_name?: string | null;
  } | null;
  sales: SellerDashboardSale[];
  seller_email: string;
  totals: {
    approvedAgents: number;
    creatorRevenueCny: number;
    creatorRevenueUsd: number;
    paidSalesCny: number;
    paidSalesUsd: number;
    pendingPayoutCny: number;
    pendingPayoutUsd: number;
    platformCommissionCny: number;
    platformCommissionUsd: number;
    submittedAgents: number;
    totalAgents: number;
  };
};

type DashboardResponse = {
  data?: SellerDashboardData;
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

type AgentDraft = {
  price_cny: string;
  price_usd: string;
  pricing_type: PricingType;
  short_description_en: string;
  short_description_zh: string;
  title_en: string;
  title_zh: string;
};

const copy = {
  en: {
    agentStatus: "Agent status",
    agents: "Agents",
    approvedAgents: "Approved agents",
    apply: "Apply to sell",
    creatorRevenue: "Creator revenue estimate",
    dashboard: "Seller dashboard",
    dashboardIntro:
      "Manage creator applications, agent submissions, review status, sales estimates, and payout readiness.",
    email: "Seller email",
    emailHelp:
      "Until full seller auth is enabled, this dashboard uses seller email to find application and submission records.",
    load: "Load dashboard",
    loading: "Loading seller workspace...",
    noAgents: "No seller agents yet. Upload a complete agent and submit it for review.",
    noPayouts:
      "No payout records yet. Payout automation is prepared, but settlement remains manual until payment providers are fully enabled.",
    noSales:
      "No paid sales for this seller yet. Approved seller agents will appear publicly and paid orders will be estimated here.",
    overview: "Overview",
    paidSales: "Paid sales",
    payoutPolicy:
      "Prepared revenue-share rules: standard marketplace sale 70% creator / 30% platform, creator referral 85% / 15%, custom service order 80% / 20%, platform-owned 100% platform.",
    payouts: "Payouts",
    platformCommission: "Platform commission",
    profileStatus: "Profile status",
    refresh: "Refresh",
    reviewFeedback: "Review feedback",
    sales: "Sales",
    saveDraft: "Save draft",
    sellerEmailRequired: "Enter a seller email to load dashboard data.",
    submitForReview: "Submit for review",
    submittedAgents: "In review",
    upload: "Upload agent",
  },
  zh: {
    agentStatus: "Agent 状态",
    agents: "Agent",
    approvedAgents: "已批准 Agent",
    apply: "申请成为创作者",
    creatorRevenue: "创作者收入估算",
    dashboard: "创作者后台",
    dashboardIntro:
      "管理创作者申请、Agent 提交、审核状态、销售估算和提现准备信息。",
    email: "创作者邮箱",
    emailHelp:
      "在完整创作者登录开放前，本后台先使用创作者邮箱查询申请和提交记录。",
    load: "加载后台",
    loading: "正在加载创作者后台...",
    noAgents: "还没有提交 Agent。请上传完整 Agent 并提交审核。",
    noPayouts:
      "暂无提现记录。提现自动化已预留，支付渠道完全启用前仍以人工结算为准。",
    noSales:
      "该创作者暂无已付款销售。Agent 审核通过并公开后，已付款订单会在这里估算收入。",
    overview: "概览",
    paidSales: "已付款销售",
    payoutPolicy:
      "预设分成规则：标准商店销售 70% 创作者 / 30% 平台，创作者推荐销售 85% / 15%，定制服务订单 80% / 20%，平台自营 100% 平台。",
    payouts: "提现",
    platformCommission: "平台佣金",
    profileStatus: "资料状态",
    refresh: "刷新",
    reviewFeedback: "审核反馈",
    sales: "销售",
    saveDraft: "保存草稿",
    sellerEmailRequired: "请输入创作者邮箱以加载后台数据。",
    submitForReview: "提交审核",
    submittedAgents: "审核中",
    upload: "上传 Agent",
  },
};

const navItems: Array<{ href: string; key: keyof typeof copy.en; view: SellerWorkspaceView }> = [
  { href: "/seller", key: "overview", view: "overview" },
  { href: "/seller/agents", key: "agents", view: "agents" },
  { href: "/seller/sales", key: "sales", view: "sales" },
  { href: "/seller/payouts", key: "payouts", view: "payouts" },
];

const primaryButtonClass =
  "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";

const secondaryButtonClass =
  "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50";

export function SellerWorkspace({ view }: { view: SellerWorkspaceView }) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const text = copy[language];
  const [sellerEmail, setSellerEmail] = useState(user?.email ?? "");
  const [loadedEmail, setLoadedEmail] = useState("");
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AgentDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadDashboard(nextEmail = sellerEmail) {
    const email = nextEmail.trim().toLowerCase();

    if (!email) {
      setError(text.sellerEmailRequired);
      return;
    }

    setIsLoading(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/seller/dashboard?seller_email=${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Unable to load seller dashboard.");
      }

      setDashboard(result.data);
      setLoadedEmail(email);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load seller dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAgent(agent: SellerDashboardAgent, nextStatus?: "draft" | "submitted") {
    const draft = getAgentDraft(agent, drafts[agent.id]);
    setActionMessage("");
    setError("");

    const response = await fetch("/api/seller-agents", {
      body: JSON.stringify({
        id: agent.id,
        price_cny: parseOptionalNumber(draft.price_cny),
        price_usd: parseOptionalNumber(draft.price_usd),
        pricing_type: draft.pricing_type,
        seller_email: loadedEmail || sellerEmail,
        short_description_en: draft.short_description_en,
        short_description_zh: draft.short_description_zh,
        status: nextStatus,
        title_en: draft.title_en,
        title_zh: draft.title_zh,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: SellerDashboardAgent;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setError(result.error || "Unable to update seller agent.");
      return;
    }

    setActionMessage(
      nextStatus === "submitted" ? text.submitForReview : text.saveDraft,
    );
    await loadDashboard(loadedEmail || sellerEmail);
  }

  const totals = dashboard?.totals;
  const activeEmail = loadedEmail || sellerEmail;

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/85">
        <div className="app-container py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Creator marketplace
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                {text.dashboard}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {text.dashboardIntro}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={secondaryButtonClass} href="/become-a-seller">
                {text.apply}
              </Link>
              <Link className={primaryButtonClass} href="/seller/upload">
                {text.upload}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="app-container grid gap-6 py-10">
        <section className="premium-card grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="text-sm">
            <span className="font-medium text-slate-700">{text.email}</span>
            <input
              className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
              data-testid="seller-dashboard-email"
              inputMode="email"
              onChange={(event) => setSellerEmail(event.target.value)}
              placeholder="Seller email"
              type="email"
              value={sellerEmail}
            />
            <span className="mt-2 block text-xs leading-5 text-slate-500">
              {text.emailHelp}
            </span>
          </label>
          <button
            className={primaryButtonClass}
            data-testid="seller-dashboard-load"
            disabled={isLoading}
            onClick={() => void loadDashboard()}
            type="button"
          >
            {isLoading ? text.loading : text.load}
          </button>
        </section>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                item.view === view
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
              href={item.href}
              key={item.href}
            >
              {text[item.key]}
            </Link>
          ))}
        </nav>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {actionMessage}
          </div>
        ) : null}

        {dashboard ? (
          <>
            {view === "overview" ? (
              <OverviewView dashboard={dashboard} text={text} />
            ) : null}
            {view === "agents" ? (
              <AgentsView
                agents={dashboard.agents}
                drafts={drafts}
                onDraftChange={(agent, draft) =>
                  setDrafts((current) => ({ ...current, [agent.id]: draft }))
                }
                onSave={saveAgent}
                text={text}
              />
            ) : null}
            {view === "sales" ? (
              <SalesView sales={dashboard.sales} text={text} />
            ) : null}
            {view === "payouts" ? (
              <PayoutsView dashboard={dashboard} text={text} />
            ) : null}
          </>
        ) : (
          <div className="premium-card p-5 text-sm leading-6 text-slate-600">
            {text.sellerEmailRequired}
          </div>
        )}

        {totals ? (
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {activeEmail} · {text.paidSales}: USD {totals.paidSalesUsd} / CNY{" "}
            {totals.paidSalesCny}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function OverviewView({
  dashboard,
  text,
}: {
  dashboard: SellerDashboardData;
  text: typeof copy.en;
}) {
  const latestApplication = dashboard.applications[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label={text.profileStatus} value={dashboard.profile?.status ?? "not created"} />
      <MetricCard label={text.approvedAgents} value={dashboard.totals.approvedAgents} />
      <MetricCard label={text.submittedAgents} value={dashboard.totals.submittedAgents} />
      <MetricCard
        label={text.creatorRevenue}
        value={`$${dashboard.totals.creatorRevenueUsd} / ¥${dashboard.totals.creatorRevenueCny}`}
      />
      <section className="premium-card p-5 md:col-span-2 xl:col-span-4">
        <h2 className="text-lg font-semibold text-slate-950">Review and revenue readiness</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text.payoutPolicy}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Field label="Latest application">
            {latestApplication?.status ?? "not submitted"}
          </Field>
          <Field label={text.platformCommission}>
            ${dashboard.totals.platformCommissionUsd} / ¥
            {dashboard.totals.platformCommissionCny}
          </Field>
          <Field label="Seller email">{dashboard.seller_email}</Field>
        </dl>
      </section>
    </div>
  );
}

function AgentsView({
  agents,
  drafts,
  onDraftChange,
  onSave,
  text,
}: {
  agents: SellerDashboardAgent[];
  drafts: Record<string, AgentDraft>;
  onDraftChange: (agent: SellerDashboardAgent, draft: AgentDraft) => void;
  onSave: (agent: SellerDashboardAgent, nextStatus?: "draft" | "submitted") => void;
  text: typeof copy.en;
}) {
  if (agents.length === 0) {
    return <EmptyState>{text.noAgents}</EmptyState>;
  }

  return (
    <div className="grid gap-4">
      {agents.map((agent) => {
        const draft = getAgentDraft(agent, drafts[agent.id]);

        return (
          <article className="premium-card p-5" data-testid="seller-agent-card" key={agent.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {text.agentStatus}: {agent.status}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {agent.title_en || agent.title_zh}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {agent.short_description_en || agent.short_description_zh}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.status === "approved" ? (
                  <Link className={secondaryButtonClass} href={`/agents/${agent.slug}`}>
                    Public page
                  </Link>
                ) : null}
                <button
                  className={secondaryButtonClass}
                  onClick={() => onSave(agent, "draft")}
                  type="button"
                >
                  {text.saveDraft}
                </button>
                <button
                  className={primaryButtonClass}
                  onClick={() => onSave(agent, "submitted")}
                  type="button"
                >
                  {text.submitForReview}
                </button>
              </div>
            </div>

            {agent.review_feedback ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <strong>{text.reviewFeedback}:</strong> {agent.review_feedback}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <DraftInput
                label="English title"
                onChange={(value) => onDraftChange(agent, { ...draft, title_en: value })}
                value={draft.title_en}
              />
              <DraftInput
                label="Chinese title"
                onChange={(value) => onDraftChange(agent, { ...draft, title_zh: value })}
                value={draft.title_zh}
              />
              <DraftInput
                label="USD price"
                onChange={(value) => onDraftChange(agent, { ...draft, price_usd: value })}
                value={draft.price_usd}
              />
              <DraftInput
                label="CNY price"
                onChange={(value) => onDraftChange(agent, { ...draft, price_cny: value })}
                value={draft.price_cny}
              />
            </div>
            <DraftTextarea
              label="English one-line value"
              onChange={(value) =>
                onDraftChange(agent, { ...draft, short_description_en: value })
              }
              value={draft.short_description_en}
            />
            <DraftTextarea
              label="Chinese one-line value"
              onChange={(value) =>
                onDraftChange(agent, { ...draft, short_description_zh: value })
              }
              value={draft.short_description_zh}
            />
          </article>
        );
      })}
    </div>
  );
}

function SalesView({
  sales,
  text,
}: {
  sales: SellerDashboardSale[];
  text: typeof copy.en;
}) {
  if (sales.length === 0) {
    return <EmptyState>{text.noSales}</EmptyState>;
  }

  return (
    <div className="grid gap-4">
      {sales.map((sale) => (
        <article className="premium-card p-5" key={sale.order_number}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {sale.order_number} · {sale.payment_status}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {sale.agent_title_en || sale.agent_title_zh}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{sale.plan_name}</p>
            </div>
            <div className="grid gap-1 text-sm text-slate-700">
              <span>
                {text.paidSales}: {sale.currency} {sale.amount}
              </span>
              <span>
                {text.creatorRevenue}: {sale.currency} {sale.creator_revenue}
              </span>
              <span>
                {text.platformCommission}: {sale.currency} {sale.platform_commission}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function PayoutsView({
  dashboard,
  text,
}: {
  dashboard: SellerDashboardData;
  text: typeof copy.en;
}) {
  return (
    <div className="grid gap-4">
      <section className="premium-card p-5">
        <h2 className="text-lg font-semibold text-slate-950">{text.payouts}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text.payoutPolicy}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Pending USD">${dashboard.totals.pendingPayoutUsd}</Field>
          <Field label="Pending CNY">¥{dashboard.totals.pendingPayoutCny}</Field>
        </dl>
      </section>
      {dashboard.payouts.length === 0 ? (
        <EmptyState>{text.noPayouts}</EmptyState>
      ) : (
        dashboard.payouts.map((payout) => (
          <article className="premium-card p-5" key={payout.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {payout.currency} {payout.amount}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {payout.status}
                </p>
              </div>
              <p className="text-sm text-slate-600">{payout.notes || "No notes"}</p>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <section className="premium-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="premium-card p-5 text-sm leading-6 text-slate-600">
      {children}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-800">{children}</dd>
    </div>
  );
}

function DraftInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function DraftTextarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-3 grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function getAgentDraft(agent: SellerDashboardAgent, draft?: AgentDraft): AgentDraft {
  return (
    draft ?? {
      price_cny: agent.price_cny?.toString() ?? "",
      price_usd: agent.price_usd?.toString() ?? "",
      pricing_type: agent.pricing_type ?? "one_time",
      short_description_en: agent.short_description_en ?? "",
      short_description_zh: agent.short_description_zh ?? "",
      title_en: agent.title_en ?? "",
      title_zh: agent.title_zh ?? "",
    }
  );
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}
