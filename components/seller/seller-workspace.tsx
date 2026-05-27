"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslation } from "@/components/i18n/language-provider";
import { evaluateAgentQuality } from "@/lib/marketplace/agent-quality";
import type { DeliveryType, PricingType } from "@/lib/marketplace/constants";

type SellerWorkspaceView = "overview" | "agents" | "sales" | "payouts" | "settings";

type SellerDashboardAgent = {
  agent_rights_confirmed?: boolean | null;
  category_slug?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  creator_revenue_rate?: number | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_settings?: Record<string, unknown>;
  delivery_type?: DeliveryType | string | null;
  demo_answers?: string[];
  demo_questions?: string[];
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: Array<{ answer: string; question: string }>;
  faq_zh?: Array<{ answer: string; question: string }>;
  features_en?: string[];
  features_zh?: string[];
  id: string;
  is_featured?: boolean;
  is_verified?: boolean;
  limitations_en?: string | null;
  limitations_zh?: string | null;
  order_count?: number;
  platform_commission_rate?: number | null;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_plans?: Array<Record<string, unknown>>;
  pricing_type?: PricingType;
  review_feedback?: string | null;
  review_reason_code?: string | null;
  revenue_cny?: number;
  revenue_share_type?: string | null;
  revenue_usd?: number;
  sample_conversation?: string | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  short_description_en?: string;
  short_description_zh?: string;
  slug: string;
  status: string;
  tags?: string[];
  title_en: string;
  title_zh: string;
  updated_at: string;
  view_count?: number | null;
};

type SellerDashboardApplication = {
  admin_note?: string | null;
  created_at: string;
  id: string;
  status: string;
};

type SellerDashboardSale = {
  agent_id?: string;
  agent_slug?: string | null;
  agent_title_en: string;
  agent_title_zh: string;
  amount: number;
  created_at: string;
  creator_revenue: number;
  currency: "USD" | "CNY";
  customer_email?: string | null;
  customer_name?: string | null;
  order_number: string;
  order_status: string;
  paid: boolean;
  payout_status?: string | null;
  payment_status: string;
  plan_name: string;
  platform_commission: number;
  revenue_share_label_en: string;
  revenue_share_label_zh: string;
  revenue_share_type: string;
};

type SellerProfile = {
  display_name?: string;
  email: string;
  expertise?: string | null;
  offers_custom_services?: boolean;
  payout_preference?: string | null;
  status: string;
  support_contact?: string | null;
  team_name?: string | null;
  website?: string | null;
};

type SellerDashboardData = {
  agents: SellerDashboardAgent[];
  applications: SellerDashboardApplication[];
  payouts: Array<{
    amount: number | string;
    created_at: string;
    currency: "USD" | "CNY";
    id: string;
    notes?: string | null;
    status: string;
    updated_at: string;
  }>;
  profile: SellerProfile | null;
  sales: SellerDashboardSale[];
  seller_email: string;
  totals: {
    approvedAgents: number;
    creatorRevenueCny: number;
    creatorRevenueUsd: number;
    eligiblePayoutCny?: number;
    eligiblePayoutUsd?: number;
    needsChangesAgents?: number;
    paidPayoutCny?: number;
    paidPayoutUsd?: number;
    paidSalesCny: number;
    paidSalesUsd: number;
    pendingPayoutCny: number;
    pendingPayoutUsd: number;
    platformCommissionCny: number;
    platformCommissionUsd: number;
    publishedAgents?: number;
    submittedAgents: number;
    totalAgents: number;
    totalSales?: number;
  };
};

type DashboardResponse = {
  data?: SellerDashboardData;
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

type SettingsResponse = {
  data?: SellerProfile;
  error?: string;
  ok?: boolean;
};

const copy = {
  en: {
    actionArchive: "Archive",
    actionEdit: "Edit draft",
    actionPreview: "Preview",
    actionResubmit: "Edit and resubmit",
    agentStatus: "Agent status",
    agents: "My agents",
    applicationStatus: "Application status",
    apply: "Apply to sell",
    approvedReady:
      "Your seller profile is approved. You can upload agents and submit them for admin review.",
    archiveDone: "Agent archived.",
    category: "Category",
    created: "Created",
    creatorRevenue: "Creator revenue",
    customServices: "Custom services",
    customServicesDisabled:
      "Custom service offers are not enabled on this seller profile yet.",
    customServicesEnabled:
      "This seller profile can offer custom versions, setup, and implementation services.",
    customer: "Customer",
    dashboard: "Seller Center",
    dashboardIntro:
      "Track your seller status, agents, review feedback, sales, estimated revenue, payout readiness, and profile settings.",
    deliveryType: "Delivery type",
    displayName: "Display name",
    email: "Seller email",
    emailHelp:
      "Use the email from the seller application. Signed-in users can only load their own email unless they are admin.",
    eligibleRevenue: "Eligible revenue",
    estimatedRevenue: "Estimated revenue",
    expertise: "Expertise",
    featured: "Featured",
    inReview: "In review",
    latestApplication: "Latest application",
    load: "Load Seller Center",
    loading: "Loading...",
    locked:
      "Only approved sellers can upload or publish seller agents. Apply or wait for admin review before submitting agents.",
    myAgentsIntro:
      "Manage drafts, review feedback, resubmissions, previews, and archived listings.",
    name: "Name",
    needsChanges: "Needs changes",
    noAgents:
      "No seller agents yet. Approved sellers can upload an agent and submit it for review.",
    noApplication:
      "No seller application found for this email. Submit an application first.",
    noPayouts:
      "No payout records yet. Settlement is prepared, but payout requests remain manual for now.",
    noSales:
      "No sales for this seller yet. Published seller agents will appear publicly after admin approval.",
    notCreated: "not created",
    notProvided: "not provided",
    notSubmitted: "not submitted",
    orderCount: "Orders",
    orderStatus: "Order status",
    paidRevenue: "Paid revenue",
    paidSales: "Paid sales",
    payoutMethodPlaceholder: "Payout method setup",
    payoutPreference: "Payout preference",
    payoutRequestsPlaceholder: "Payout requests",
    payoutStatus: "Payout status",
    payouts: "Payouts",
    pendingPayout: "Pending payout",
    pendingRevenue: "Pending revenue",
    platformCommission: "Platform commission",
    price: "Price",
    profileStatus: "Seller status",
    profileSummary: "Seller profile",
    publicPage: "Public page",
    publishedAgents: "Published agents",
    qualityMissing: "Missing fields",
    qualityScore: "Completeness",
    qualityWarnings: "Warnings",
    refresh: "Refresh",
    reviewFeedback: "Review feedback",
    reviewReason: "Review reason",
    sales: "Sales",
    saveSettings: "Save settings",
    saving: "Saving...",
    settings: "Settings",
    settingsSaved: "Settings saved.",
    supportContact: "Support contact",
    team: "Team",
    totalAgents: "Total agents",
    totalSales: "Total sales",
    upload: "Upload new agent",
    verified: "Verified",
    views: "Views",
    website: "Website",
  },
  zh: {
    actionArchive: "归档",
    actionEdit: "编辑草稿",
    actionPreview: "预览",
    actionResubmit: "编辑并重新提交",
    agentStatus: "Agent 状态",
    agents: "我的 Agent",
    applicationStatus: "申请状态",
    apply: "申请成为创作者",
    approvedReady:
      "你的创作者资料已通过审核，可以上传 Agent 并提交给管理员审核。",
    archiveDone: "Agent 已归档。",
    category: "分类",
    created: "创建时间",
    creatorRevenue: "创作者收入",
    customServices: "定制服务",
    customServicesDisabled: "这个创作者资料暂未开启定制服务。",
    customServicesEnabled:
      "这个创作者可以提供定制版本、部署配置和企业实施服务。",
    customer: "客户",
    dashboard: "创作者中心",
    dashboardIntro:
      "查看创作者状态、Agent、审核反馈、销售、预估收入、提现准备和资料设置。",
    deliveryType: "交付类型",
    displayName: "展示名称",
    email: "创作者邮箱",
    emailHelp:
      "请输入创作者申请时使用的邮箱。已登录用户只能查看自己的邮箱，管理员除外。",
    eligibleRevenue: "可提现收入",
    estimatedRevenue: "预估收入",
    expertise: "专业领域",
    featured: "精选",
    inReview: "审核中",
    latestApplication: "最新申请",
    load: "加载创作者中心",
    loading: "加载中...",
    locked:
      "只有通过审核的创作者可以上传或发布 Agent。请先提交申请，或等待管理员审核。",
    myAgentsIntro: "管理草稿、审核反馈、重新提交、预览和归档列表。",
    name: "名称",
    needsChanges: "需要修改",
    noAgents: "还没有创作者 Agent。审核通过后可以上传 Agent 并提交审核。",
    noApplication: "这个邮箱还没有创作者申请。请先提交申请。",
    noPayouts: "暂无提现记录。结算能力已预留，目前提现申请仍为人工处理。",
    noSales: "该创作者暂无销售。Agent 通过管理员审核后才会公开展示和销售。",
    notCreated: "未创建",
    notProvided: "未填写",
    notSubmitted: "未提交",
    orderCount: "订单",
    orderStatus: "订单状态",
    paidRevenue: "已支付收入",
    paidSales: "已付款销售",
    payoutMethodPlaceholder: "提现方式设置",
    payoutPreference: "收款偏好",
    payoutRequestsPlaceholder: "提现申请",
    payoutStatus: "提现状态",
    payouts: "提现",
    pendingPayout: "待提现",
    pendingRevenue: "待结算收入",
    platformCommission: "平台佣金",
    price: "价格",
    profileStatus: "创作者状态",
    profileSummary: "创作者资料",
    publicPage: "公开页面",
    publishedAgents: "已发布 Agent",
    qualityMissing: "缺失字段",
    qualityScore: "完整度",
    qualityWarnings: "提醒",
    refresh: "刷新",
    reviewFeedback: "审核反馈",
    reviewReason: "审核原因",
    sales: "销售",
    saveSettings: "保存设置",
    saving: "保存中...",
    settings: "设置",
    settingsSaved: "设置已保存。",
    supportContact: "支持联系方式",
    team: "团队",
    totalAgents: "全部 Agent",
    totalSales: "总销售",
    upload: "上传新 Agent",
    verified: "认证",
    views: "浏览",
    website: "网站",
  },
} as const;

type CopyText = Record<keyof typeof copy.en, string>;

const navItems: Array<{
  href: string;
  key: keyof typeof copy.en;
  view: SellerWorkspaceView;
}> = [
  { href: "/seller", key: "dashboard", view: "overview" },
  { href: "/seller/agents", key: "agents", view: "agents" },
  { href: "/seller/sales", key: "sales", view: "sales" },
  { href: "/seller/payouts", key: "payouts", view: "payouts" },
  { href: "/seller/settings", key: "settings", view: "settings" },
];

const primaryButtonClass =
  "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";

const secondaryButtonClass =
  "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50";

export function SellerWorkspace({ view }: { view: SellerWorkspaceView }) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const text = copy[language] as CopyText;
  const [sellerEmail, setSellerEmail] = useState(user?.email ?? "");
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [agentActionId, setAgentActionId] = useState<string | null>(null);

  const latestApplication = dashboard?.applications[0] ?? null;
  const isApprovedSeller = dashboard?.profile?.status === "approved";
  const activeEmail = dashboard?.seller_email || sellerEmail;

  async function loadDashboard(nextEmail = sellerEmail) {
    const email = nextEmail.trim().toLowerCase();

    if (!email) {
      setError(text.noApplication);
      return;
    }

    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/seller/dashboard?seller_email=${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as DashboardResponse;

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Unable to load Seller Center.");
      }

      setDashboard(result.data);
      setSellerEmail(email);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Seller Center.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function archiveAgent(agent: SellerDashboardAgent) {
    if (!dashboard) {
      return;
    }

    setAgentActionId(agent.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/seller-agents", {
        body: JSON.stringify({
          id: agent.id,
          seller_email: activeEmail,
          status: "archived",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        data?: SellerDashboardAgent;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to archive agent.");
      }

      const updatedAgent = result?.data ?? { ...agent, status: "archived" };
      setDashboard((current) =>
        current
          ? {
              ...current,
              agents: current.agents.map((item) =>
                item.id === agent.id ? { ...item, ...updatedAgent } : item,
              ),
            }
          : current,
      );
      setNotice(text.archiveDone);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive agent.",
      );
    } finally {
      setAgentActionId(null);
    }
  }

  const statusSummary = useMemo(
    () => ({
      application: latestApplication?.status ?? "not_submitted",
      profile: dashboard?.profile?.status ?? "not_created",
    }),
    [dashboard?.profile?.status, latestApplication?.status],
  );

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
              {isApprovedSeller ? (
                <Link className={primaryButtonClass} href="/seller/upload">
                  {text.upload}
                </Link>
              ) : (
                <span className={`${primaryButtonClass} cursor-not-allowed bg-slate-400`}>
                  {text.upload}
                </span>
              )}
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
              placeholder="seller@example.com"
              type="text"
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
            {isLoading ? text.loading : dashboard ? text.refresh : text.load}
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

        {notice ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {notice}
          </div>
        ) : null}

        {dashboard ? (
          <>
            {!isApprovedSeller ? (
              <StatusNotice
                applicationStatus={statusSummary.application}
                profileStatus={statusSummary.profile}
                text={text}
              />
            ) : null}
            {view === "overview" ? (
              <OverviewView
                dashboard={dashboard}
                isApprovedSeller={isApprovedSeller}
                text={text}
              />
            ) : null}
            {view === "agents" ? (
              <AgentsView
                activeEmail={activeEmail}
                agentActionId={agentActionId}
                agents={dashboard.agents}
                isApprovedSeller={isApprovedSeller}
                onArchiveAgent={archiveAgent}
                text={text}
              />
            ) : null}
            {view === "sales" ? (
              <SalesView sales={dashboard.sales} text={text} />
            ) : null}
            {view === "payouts" ? (
              <PayoutsView dashboard={dashboard} text={text} />
            ) : null}
            {view === "settings" ? (
              <SettingsView
                dashboard={dashboard}
                onProfileUpdated={(profile) =>
                  setDashboard((current) =>
                    current ? { ...current, profile } : current,
                  )
                }
                text={text}
              />
            ) : null}
          </>
        ) : (
          <div className="premium-card p-5 text-sm leading-6 text-slate-600">
            {text.noApplication}
          </div>
        )}

        {dashboard ? (
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {activeEmail} / {text.paidSales}: USD {dashboard.totals.paidSalesUsd} /
            CNY {dashboard.totals.paidSalesCny}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function StatusNotice({
  applicationStatus,
  profileStatus,
  text,
}: {
  applicationStatus: string;
  profileStatus: string;
  text: CopyText;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
      <p className="font-semibold">{text.locked}</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={text.applicationStatus}>{applicationStatus}</Field>
        <Field label={text.profileStatus}>{profileStatus}</Field>
      </dl>
    </section>
  );
}

function OverviewView({
  dashboard,
  isApprovedSeller,
  text,
}: {
  dashboard: SellerDashboardData;
  isApprovedSeller: boolean;
  text: CopyText;
}) {
  const latestApplication = dashboard.applications[0];
  const profile = dashboard.profile;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label={text.profileStatus} value={profile?.status ?? text.notCreated} />
      <MetricCard label={text.totalAgents} value={dashboard.totals.totalAgents} />
      <MetricCard
        label={text.publishedAgents}
        value={dashboard.totals.publishedAgents ?? dashboard.totals.approvedAgents}
      />
      <MetricCard
        label={text.inReview}
        value={dashboard.totals.submittedAgents}
      />
      <MetricCard
        label={text.needsChanges}
        value={dashboard.totals.needsChangesAgents ?? 0}
      />
      <MetricCard
        label={text.totalSales}
        value={dashboard.totals.totalSales ?? dashboard.sales.length}
      />
      <MetricCard
        label={text.estimatedRevenue}
        value={formatUsdCny(
          dashboard.totals.creatorRevenueUsd,
          dashboard.totals.creatorRevenueCny,
        )}
      />
      <MetricCard
        label={text.pendingPayout}
        value={formatUsdCny(
          dashboard.totals.pendingPayoutUsd,
          dashboard.totals.pendingPayoutCny,
        )}
      />

      <section className="premium-card p-5 md:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">
          {text.profileSummary}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Field label={text.name}>{profile?.display_name ?? text.notCreated}</Field>
          <Field label={text.team}>{profile?.team_name ?? text.notProvided}</Field>
          <Field label="Email">{dashboard.seller_email}</Field>
          <Field label={text.website}>{profile?.website ?? text.notProvided}</Field>
          <Field label={text.expertise}>{profile?.expertise ?? text.notProvided}</Field>
          <Field label={text.payoutPreference}>
            {profile?.payout_preference ?? text.notProvided}
          </Field>
          <Field label={text.supportContact}>
            {profile?.support_contact ?? text.notProvided}
          </Field>
        </dl>
      </section>

      <section className="premium-card p-5 md:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">
          {text.applicationStatus}
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Field label={text.latestApplication}>
            {latestApplication?.status ?? text.notSubmitted}
          </Field>
          <Field label={text.profileStatus}>{profile?.status ?? text.notCreated}</Field>
        </dl>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {isApprovedSeller ? text.approvedReady : text.locked}
        </p>
      </section>

      <section className="premium-card p-5 md:col-span-2 xl:col-span-4">
        <h2 className="text-lg font-semibold text-slate-950">
          {text.customServices}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {profile?.offers_custom_services
            ? text.customServicesEnabled
            : text.customServicesDisabled}
        </p>
      </section>
    </div>
  );
}

function AgentsView({
  activeEmail,
  agentActionId,
  agents,
  isApprovedSeller,
  onArchiveAgent,
  text,
}: {
  activeEmail: string;
  agentActionId: string | null;
  agents: SellerDashboardAgent[];
  isApprovedSeller: boolean;
  onArchiveAgent: (agent: SellerDashboardAgent) => void;
  text: CopyText;
}) {
  if (!isApprovedSeller) {
    return <EmptyState>{text.locked}</EmptyState>;
  }

  if (agents.length === 0) {
    return (
      <div className="premium-card p-5">
        <p className="text-sm leading-6 text-slate-600">{text.noAgents}</p>
        <Link className={`${primaryButtonClass} mt-4 inline-block`} href="/seller/upload">
          {text.upload}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="premium-card p-5">
        <p className="text-sm leading-6 text-slate-600">{text.myAgentsIntro}</p>
      </section>
      {agents.map((agent) => {
        const canEdit = agent.status === "draft" || agent.status === "needs_changes";
        const isPublic = agent.status === "approved" || agent.status === "published";
        const quality = evaluateAgentQuality(agent);
        const showQuality =
          agent.status === "draft" || agent.status === "submitted";

        return (
          <article className="premium-card p-5" data-testid="seller-agent-card" key={agent.id}>
            <div className="grid gap-5 lg:grid-cols-[176px_1fr]">
              <AgentCover agent={agent} />
              <div className="min-w-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge>{agent.status}</StatusBadge>
                      {agent.is_featured ? <StatusBadge>{text.featured}</StatusBadge> : null}
                      {agent.is_verified ? <StatusBadge>{text.verified}</StatusBadge> : null}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">
                      {agent.title_en || agent.title_zh}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {agent.short_description_en || agent.short_description_zh}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit ? (
                      <Link
                        className={secondaryButtonClass}
                        href={`/seller/agents/${agent.id}/edit?seller_email=${encodeURIComponent(
                          activeEmail,
                        )}`}
                      >
                        {agent.status === "needs_changes"
                          ? text.actionResubmit
                          : text.actionEdit}
                      </Link>
                    ) : null}
                    {isPublic ? (
                      <Link className={secondaryButtonClass} href={`/agents/${agent.slug}`}>
                        {text.actionPreview}
                      </Link>
                    ) : null}
                    {agent.status !== "archived" ? (
                      <button
                        className={secondaryButtonClass}
                        disabled={agentActionId === agent.id}
                        onClick={() => onArchiveAgent(agent)}
                        type="button"
                      >
                        {agentActionId === agent.id ? text.loading : text.actionArchive}
                      </button>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <Field label={text.category}>
                    {agent.category_slug || text.notProvided}
                  </Field>
                  <Field label={text.deliveryType}>
                    {formatDeliveryType(agent.delivery_type)}
                  </Field>
                  <Field label={text.price}>{formatPrice(agent)}</Field>
                  <Field label={text.views}>{agent.view_count ?? 0}</Field>
                  <Field label={text.orderCount}>{agent.order_count ?? 0}</Field>
                  <Field label={text.creatorRevenue}>
                    {formatUsdCny(agent.revenue_usd ?? 0, agent.revenue_cny ?? 0)}
                  </Field>
                  <Field label={text.created}>{formatDate(agent.created_at)}</Field>
                  <Field label={text.agentStatus}>{agent.status}</Field>
                </dl>

                {showQuality ? (
                  <div
                    className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
                    data-testid="seller-agent-quality"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-indigo-950">
                        {text.qualityScore}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700">
                        {quality.percentage}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${quality.percentage}%` }}
                      />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <QualitySnippet
                        items={quality.missingFields}
                        label={text.qualityMissing}
                      />
                      <QualitySnippet
                        items={quality.warnings}
                        label={text.qualityWarnings}
                      />
                    </div>
                  </div>
                ) : null}

                {agent.review_feedback || agent.review_reason_code ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    {agent.review_reason_code ? (
                      <p>
                        <strong>{text.reviewReason}:</strong>{" "}
                        {agent.review_reason_code}
                      </p>
                    ) : null}
                    {agent.review_feedback ? (
                      <p>
                        <strong>{text.reviewFeedback}:</strong>{" "}
                        {agent.review_feedback}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
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
  text: CopyText;
}) {
  if (sales.length === 0) {
    return <EmptyState>{text.noSales}</EmptyState>;
  }

  return (
    <div className="grid gap-4">
      {sales.map((sale) => (
        <article className="premium-card p-5" key={sale.order_number}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {sale.order_number} / {sale.payment_status}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {sale.agent_title_en || sale.agent_title_zh}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{sale.plan_name}</p>
              <p className="mt-2 text-xs text-slate-500">
                {text.customer}: {sale.customer_name || text.notProvided}
                {sale.customer_email ? ` / ${sale.customer_email}` : ""}
              </p>
            </div>
            <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:min-w-96">
              <Field label={text.paidSales}>
                {formatMoney(sale.currency, sale.amount)}
              </Field>
              <Field label={text.creatorRevenue}>
                {formatMoney(sale.currency, sale.creator_revenue)}
              </Field>
              <Field label={text.platformCommission}>
                {formatMoney(sale.currency, sale.platform_commission)}
              </Field>
              <Field label={text.payoutStatus}>
                {sale.payout_status || "pending"}
              </Field>
              <Field label={text.orderStatus}>{sale.order_status}</Field>
              <Field label={text.created}>{formatDate(sale.created_at)}</Field>
            </dl>
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
  text: CopyText;
}) {
  return (
    <div className="grid gap-4">
      <section className="premium-card p-5">
        <h2 className="text-lg font-semibold text-slate-950">{text.payouts}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Field label={text.pendingRevenue}>
            {formatUsdCny(dashboard.totals.pendingPayoutUsd, dashboard.totals.pendingPayoutCny)}
          </Field>
          <Field label={text.eligibleRevenue}>
            {formatUsdCny(
              dashboard.totals.eligiblePayoutUsd ?? 0,
              dashboard.totals.eligiblePayoutCny ?? 0,
            )}
          </Field>
          <Field label={text.paidRevenue}>
            {formatUsdCny(
              dashboard.totals.paidPayoutUsd ?? 0,
              dashboard.totals.paidPayoutCny ?? 0,
            )}
          </Field>
          <Field label={text.payoutMethodPlaceholder}>
            {dashboard.profile?.payout_preference ?? text.notProvided}
          </Field>
          <Field label={text.payoutRequestsPlaceholder}>{text.notCreated}</Field>
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

function SettingsView({
  dashboard,
  onProfileUpdated,
  text,
}: {
  dashboard: SellerDashboardData;
  onProfileUpdated: (profile: SellerProfile) => void;
  text: CopyText;
}) {
  const profile = dashboard.profile;
  const [formState, setFormState] = useState({
    display_name: profile?.display_name ?? "",
    expertise: profile?.expertise ?? "",
    payout_preference: profile?.payout_preference ?? "",
    support_contact: profile?.support_contact ?? "",
    team_name: profile?.team_name ?? "",
    website: profile?.website ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!profile) {
    return <EmptyState>{text.noApplication}</EmptyState>;
  }

  async function saveSettings() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/seller/settings", {
        body: JSON.stringify({
          ...formState,
          seller_email: dashboard.seller_email,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Unable to save settings.");
      }

      onProfileUpdated(result.data);
      setMessage(text.settingsSaved);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(name: keyof typeof formState, value: string) {
    setFormState((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="premium-card p-5">
      <h2 className="text-lg font-semibold text-slate-950">{text.settings}</h2>
      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SettingsInput
          label={text.displayName}
          name="display_name"
          onChange={updateField}
          value={formState.display_name}
        />
        <SettingsInput
          label={text.team}
          name="team_name"
          onChange={updateField}
          value={formState.team_name}
        />
        <SettingsInput
          label={text.website}
          name="website"
          onChange={updateField}
          value={formState.website}
        />
        <SettingsInput
          label={text.payoutPreference}
          name="payout_preference"
          onChange={updateField}
          value={formState.payout_preference}
        />
        <SettingsArea
          label={text.expertise}
          name="expertise"
          onChange={updateField}
          value={formState.expertise}
        />
        <SettingsArea
          label={text.supportContact}
          name="support_contact"
          onChange={updateField}
          value={formState.support_contact}
        />
      </div>
      <button
        className={`${primaryButtonClass} mt-5`}
        disabled={isSaving}
        onClick={() => void saveSettings()}
        type="button"
      >
        {isSaving ? text.saving : text.saveSettings}
      </button>
    </section>
  );
}

function AgentCover({ agent }: { agent: SellerDashboardAgent }) {
  if (agent.cover_image_url) {
    return (
      <div
        aria-label={agent.title_en || agent.title_zh}
        className="h-36 w-full rounded-xl border border-slate-200 bg-cover bg-center lg:h-full"
        role="img"
        style={{ backgroundImage: `url(${agent.cover_image_url})` }}
      />
    );
  }

  return (
    <div className="flex h-36 w-full items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-cyan-50 p-4 text-center text-sm font-semibold text-slate-600 lg:h-full">
      {formatDeliveryType(agent.delivery_type)}
    </div>
  );
}

function SettingsInput({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: "display_name" | "payout_preference" | "team_name" | "website";
  onChange: (name: "display_name" | "payout_preference" | "team_name" | "website", value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(name, event.target.value)}
        type="text"
        value={value}
      />
    </label>
  );
}

function SettingsArea({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: "expertise" | "support_contact";
  onChange: (name: "expertise" | "support_contact", value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="polished-input mt-2 min-h-28 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      />
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <section className="premium-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
      {children}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="premium-card p-5 text-sm leading-6 text-slate-600">
      {children}
    </div>
  );
}

function QualitySnippet({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {label}
      </p>
      {items.length ? (
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
          {items.slice(0, 4).map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">OK</p>
      )}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-800">{children}</dd>
    </div>
  );
}

function formatUsdCny(usd: number, cny: number) {
  return `$${usd} / CNY ${cny}`;
}

function formatMoney(currency: "USD" | "CNY", amount: number) {
  return currency === "USD" ? `$${amount}` : `CNY ${amount}`;
}

function formatPrice(agent: SellerDashboardAgent) {
  if (agent.pricing_type === "free") {
    return "Free";
  }

  if (agent.pricing_type === "custom_quote") {
    return "Custom quote";
  }

  return formatUsdCny(agent.price_usd ?? 0, agent.price_cny ?? 0);
}

function formatDeliveryType(value: SellerDashboardAgent["delivery_type"]) {
  return value ? value.replaceAll("_", " ") : "not provided";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
