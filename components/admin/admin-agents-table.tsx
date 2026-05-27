"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  AGENT_REVIEW_REASON_CODES,
  AGENT_STATUSES,
  DELIVERY_TYPES,
  PRICING_TYPES,
  type AgentReviewReasonCode,
  type AgentStatus,
  type DeliveryType,
  type PricingType,
  type SupportedLanguage,
} from "@/lib/marketplace/constants";
import {
  evaluateAgentQuality,
  getAgentPublishWarnings,
  type AgentQualityResult,
} from "@/lib/marketplace/agent-quality";

type FaqItem = {
  answer: string;
  question: string;
};

type AdminAgentRecord = {
  admin_note?: string | null;
  agent_rights_confirmed?: boolean;
  category_slug: string;
  content_safety_confirmed?: boolean;
  cover_image_url?: string | null;
  created_at: string;
  custom_upgrade_options_en?: string;
  custom_upgrade_options_zh?: string;
  data_permissions_en?: string;
  data_permissions_zh?: string;
  delivery_settings?: Record<string, unknown>;
  delivery_type: DeliveryType;
  demo_answers?: string[];
  demo_enabled?: boolean;
  demo_questions?: string[];
  demo_url?: string | null;
  description_en?: string;
  description_zh?: string;
  faq_en?: FaqItem[];
  faq_zh?: FaqItem[];
  features_en?: string[];
  features_zh?: string[];
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  limitations_en?: string;
  limitations_zh?: string;
  owner_type: "platform" | "seller";
  price_cny: number | null;
  price_usd: number | null;
  pricing_plans?: Array<Record<string, unknown>>;
  pricing_type: PricingType;
  review_feedback?: string | null;
  review_policy_confirmed?: boolean;
  review_reason_code?: AgentReviewReasonCode | null;
  sample_conversation?: string;
  seller_email: string | null;
  sensitive_disclaimer_confirmed?: boolean;
  setup_instructions_en?: string;
  setup_instructions_zh?: string;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  supported_languages?: SupportedLanguage[];
  suspension_policy_confirmed?: boolean;
  tags?: string[];
  title_en: string;
  title_zh: string;
  updated_at: string;
  use_cases_en?: string[];
  use_cases_zh?: string[];
  video_url?: string | null;
  what_customer_receives_en?: string;
  what_customer_receives_zh?: string;
  who_it_is_for_en?: string;
  who_it_is_for_zh?: string;
};

type AdminAgentsResponse = {
  data?: AdminAgentRecord[];
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

type AgentContentDraft = {
  priceCny: string;
  priceUsd: string;
  pricingType: PricingType;
  shortDescriptionEn: string;
  shortDescriptionZh: string;
  titleEn: string;
  titleZh: string;
};

type FilterState = {
  category: string;
  deliveryType: "all" | DeliveryType;
  featured: "all" | "yes" | "no";
  seller: string;
  status: "all" | AgentStatus;
  verified: "all" | "yes" | "no";
};

type ActionPayload = {
  admin_note?: string;
  feedback?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_type?: PricingType;
  review_reason_code?: AgentReviewReasonCode | null;
  short_description_en?: string;
  short_description_zh?: string;
  status?: AgentStatus;
  title_en?: string;
  title_zh?: string;
};

const initialFilters: FilterState = {
  category: "all",
  deliveryType: "all",
  featured: "all",
  seller: "all",
  status: "all",
  verified: "all",
};

const copy = {
  en: {
    all: "All",
    approve: "Approve",
    archive: "Archive",
    bilingual: "Bilingual content",
    compliance: "Compliance",
    cover: "Cover",
    dataPermissions: "Data permissions",
    delivery: "Delivery",
    demo: "Demo",
    detail: "Review detail",
    faq: "FAQ",
    featured: "Featured",
    filters: "Filters",
    internalNote: "Internal note",
    limitations: "Limitations",
    markFeatured: "Mark featured",
    markInReview: "Mark in review",
    markVerified: "Mark verified",
    missing: "Not provided",
    noAgents: "No agents match the current filters.",
    noWarnings: "No publish warnings.",
    owner: "Owner",
    pricing: "Pricing",
    publish: "Publish",
    publishWarnings: "Publish warnings",
    reasonCode: "Reason code",
    reject: "Reject",
    removeFeatured: "Remove featured",
    removeVerified: "Remove verified",
    requestChanges: "Request changes",
    reviewFeedback: "Seller-visible feedback",
    saveContent: "Save content",
    saveInternalNote: "Save internal note",
    seller: "Seller",
    submitted: "Submitted",
    suspend: "Suspend",
    totalAgents: "agents",
    updated: "Updated",
    verified: "Verified",
  },
  zh: {
    all: "全部",
    approve: "批准",
    archive: "归档",
    bilingual: "双语内容",
    compliance: "合规",
    cover: "封面",
    dataPermissions: "数据权限",
    delivery: "交付",
    demo: "演示",
    detail: "审核详情",
    faq: "FAQ",
    featured: "推荐",
    filters: "筛选",
    internalNote: "内部备注",
    limitations: "限制",
    markFeatured: "设为推荐",
    markInReview: "标记审核中",
    markVerified: "设为认证",
    missing: "未填写",
    noAgents: "没有符合当前筛选条件的 Agent。",
    noWarnings: "暂无发布提醒。",
    owner: "来源",
    pricing: "定价",
    publish: "发布",
    publishWarnings: "发布前提醒",
    reasonCode: "原因码",
    reject: "拒绝",
    removeFeatured: "取消推荐",
    removeVerified: "取消认证",
    requestChanges: "要求修改",
    reviewFeedback: "给卖家的反馈",
    saveContent: "保存内容",
    saveInternalNote: "保存内部备注",
    seller: "卖家",
    submitted: "提交时间",
    suspend: "暂停",
    totalAgents: "个 Agent",
    updated: "更新时间",
    verified: "认证",
  },
} as const;

const adminQualityCopy = {
  en: {
    missingFields: "Missing fields",
    noIssues: "No quality issues found.",
    possibleFalseClaims: "Possible false claims",
    qualityScore: "Quality score",
    qualityWarnings: "Quality warnings",
  },
  zh: {
    missingFields: "缺失字段",
    noIssues: "暂无质量问题。",
    possibleFalseClaims: "疑似夸大或不实声明",
    qualityScore: "质量完整度",
    qualityWarnings: "质量提醒",
  },
} as const;

const deliveryLabels: Record<DeliveryType, { en: string; zh: string }> = {
  custom_business_agent: { en: "Custom Business Agent", zh: "定制业务 Agent" },
  hosted_agent: { en: "Hosted Agent", zh: "托管 Agent" },
  prompt_template: { en: "Prompt Template", zh: "提示词模板" },
  website_chatbot: { en: "Website Chatbot", zh: "网站聊天机器人" },
  workflow_template: { en: "Workflow Template", zh: "工作流模板" },
};

const reasonLabels: Record<AgentReviewReasonCode, { en: string; zh: string }> = {
  copyright_risk: { en: "Copyright risk", zh: "版权风险" },
  demo_not_working: { en: "Demo not working", zh: "演示不可用" },
  exaggerated_claims: { en: "Exaggerated claims", zh: "夸大宣传" },
  missing_content: { en: "Missing content", zh: "内容缺失" },
  other: { en: "Other", zh: "其他" },
  poor_cover: { en: "Poor cover", zh: "封面问题" },
  pricing_issue: { en: "Pricing issue", zh: "定价问题" },
  unclear_delivery: { en: "Unclear delivery", zh: "交付不清晰" },
  unsafe_content: { en: "Unsafe content", zh: "不安全内容" },
};

export function AdminAgentsTable() {
  const { language, t } = useTranslation();
  const text = copy[language];
  const qualityText = adminQualityCopy[language];
  const [records, setRecords] = useState<AdminAgentRecord[]>([]);
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [contentDrafts, setContentDrafts] = useState<
    Record<string, AgentContentDraft>
  >({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>({});
  const [reasonCodes, setReasonCodes] = useState<
    Record<string, AgentReviewReasonCode | "">
  >({});
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const sellers = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .filter((agent) => agent.owner_type === "seller" && agent.seller_email)
            .map((agent) => agent.seller_email as string),
        ),
      ).sort(),
    [records],
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(records.map((agent) => agent.category_slug).filter(Boolean))).sort(),
    [records],
  );
  const filteredRecords = useMemo(
    () => records.filter((agent) => matchesFilters(agent, filters)),
    [filters, records],
  );

  async function fetchRecords() {
    const response = await fetch("/api/admin/agents", { cache: "no-store" });
    const result = (await response.json()) as AdminAgentsResponse;

    if (!response.ok) {
      throw new Error(result.error || "Unable to load agents.");
    }

    return result;
  }

  async function loadRecords() {
    setIsLoading(true);
    setError("");

    try {
      const result = await fetchRecords();
      setRecords(result.data ?? []);
      setMode(result.mode ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load agents.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateAgent(agent: AdminAgentRecord, updates: ActionPayload) {
    setActionError("");
    setActionMessage("");

    const response = await fetch("/api/admin/agents", {
      body: JSON.stringify({ id: agent.id, slug: agent.slug, ...updates }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: AdminAgentRecord;
      error?: string;
      warnings?: string[];
    };

    if (!response.ok || !result.data) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    setRecords((current) =>
      current.map((item) =>
        item.id === agent.id || item.slug === agent.slug
          ? (result.data as AdminAgentRecord)
          : item,
      ),
    );

    if (updates.status === "published" && result.warnings?.length) {
      setActionMessage(result.warnings.join(" "));
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialRecords() {
      try {
        const result = await fetchRecords();

        if (!isActive) {
          return;
        }

        setRecords(result.data ?? []);
        setMode(result.mode ?? null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Unable to load agents.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialRecords();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <AdminState>{t("admin.loadingSellerAgents")}</AdminState>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="premium-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {filteredRecords.length} / {records.length} {text.totalAgents}
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {t("admin.dataSource")}: {mode}
            </p>
          ) : null}
        </div>
        <button
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 lg:w-auto"
          onClick={() => void loadRecords()}
          type="button"
        >
          {t("admin.refresh")}
        </button>
      </div>

      <section className="premium-card p-4">
        <h2 className="text-sm font-semibold text-slate-950">{text.filters}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <FilterSelect
            label={t("admin.tableStatus")}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as FilterState["status"],
              }))
            }
            value={filters.status}
          >
            <option value="all">{text.all}</option>
            {AGENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={t("forms.category")}
            onChange={(value) =>
              setFilters((current) => ({ ...current, category: value }))
            }
            value={filters.category}
          >
            <option value="all">{text.all}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={text.seller}
            onChange={(value) =>
              setFilters((current) => ({ ...current, seller: value }))
            }
            value={filters.seller}
          >
            <option value="all">{text.all}</option>
            <option value="platform">platform</option>
            {sellers.map((seller) => (
              <option key={seller} value={seller}>
                {seller}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={t("forms.deliveryType")}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                deliveryType: value as FilterState["deliveryType"],
              }))
            }
            value={filters.deliveryType}
          >
            <option value="all">{text.all}</option>
            {DELIVERY_TYPES.map((deliveryType) => (
              <option key={deliveryType} value={deliveryType}>
                {deliveryLabels[deliveryType][language]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label={text.featured}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                featured: value as FilterState["featured"],
              }))
            }
            value={filters.featured}
          >
            <option value="all">{text.all}</option>
            <option value="yes">{t("common.yes")}</option>
            <option value="no">{t("common.no")}</option>
          </FilterSelect>
          <FilterSelect
            label={text.verified}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                verified: value as FilterState["verified"],
              }))
            }
            value={filters.verified}
          >
            <option value="all">{text.all}</option>
            <option value="yes">{t("common.yes")}</option>
            <option value="no">{t("common.no")}</option>
          </FilterSelect>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          {actionMessage}
        </div>
      ) : null}

      {filteredRecords.length === 0 ? <AdminState>{text.noAgents}</AdminState> : null}

      <div className="grid gap-4">
        {filteredRecords.map((agent) => {
          const title =
            language === "zh"
              ? agent.title_zh || agent.title_en
              : agent.title_en || agent.title_zh;
          const contentDraft = getAgentContentDraft(agent, contentDrafts[agent.id]);
          const feedbackValue =
            feedbackDrafts[agent.id] ?? agent.review_feedback ?? "";
          const internalNoteValue = internalNotes[agent.id] ?? agent.admin_note ?? "";
          const reasonCode = reasonCodes[agent.id] ?? agent.review_reason_code ?? "";
          const quality = evaluateAgentQuality(agent);
          const publishWarnings = getPublishWarnings(agent);

          return (
            <article
              className="premium-card p-5"
              data-testid="admin-agent-row"
              key={`${agent.owner_type}-${agent.id}`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {agent.owner_type}
                    </p>
                    <AdminStatusBadge status={agent.status} />
                    {agent.is_featured ? (
                      <Pill>{text.featured}</Pill>
                    ) : null}
                    {agent.is_verified ? (
                      <Pill>{text.verified}</Pill>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    {title}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                    {language === "zh"
                      ? agent.short_description_zh || agent.short_description_en
                      : agent.short_description_en || agent.short_description_zh}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                    href={`/agents/${agent.slug}`}
                  >
                    {t("admin.viewDetails")}
                  </a>
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                    onClick={() =>
                      void updateAgent(agent, {
                        is_featured: !agent.is_featured,
                      })
                    }
                    type="button"
                  >
                    {agent.is_featured
                      ? text.removeFeatured
                      : text.markFeatured}
                  </button>
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                    onClick={() =>
                      void updateAgent(agent, {
                        is_verified: !agent.is_verified,
                      })
                    }
                    type="button"
                  >
                    {agent.is_verified
                      ? text.removeVerified
                      : text.markVerified}
                  </button>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label={text.owner}>
                  {agent.owner_type === "platform"
                    ? "platform"
                    : agent.seller_email || text.seller}
                </Field>
                <Field label={t("forms.category")}>{agent.category_slug}</Field>
                <Field label={t("forms.deliveryType")}>
                  {deliveryLabels[agent.delivery_type][language]}
                </Field>
                <Field label={t("forms.pricingType")}>{agent.pricing_type}</Field>
                <Field label={t("admin.tableStatus")}>{agent.status}</Field>
                <Field label={text.submitted}>
                  {formatDate(agent.created_at, language)}
                </Field>
                <Field label={text.updated}>
                  {formatDate(agent.updated_at, language)}
                </Field>
                <Field label="Slug">{agent.slug}</Field>
              </dl>

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {text.detail}
                </summary>
                <div className="mt-5 grid gap-5">
                  <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                      {agent.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={title}
                          className="h-40 w-full object-cover"
                          src={agent.cover_image_url}
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-slate-900 px-4 text-center text-sm font-semibold text-white">
                          {text.cover}
                        </div>
                      )}
                    </div>
                    <DetailBlock title={text.bilingual}>
                      <DetailGrid>
                        <DetailItem label="Title EN" value={agent.title_en} />
                        <DetailItem label="Title ZH" value={agent.title_zh} />
                        <DetailItem
                          label="Short EN"
                          value={agent.short_description_en}
                        />
                        <DetailItem
                          label="Short ZH"
                          value={agent.short_description_zh}
                        />
                        <DetailItem
                          label="Description EN"
                          value={agent.description_en}
                        />
                        <DetailItem
                          label="Description ZH"
                          value={agent.description_zh}
                        />
                        <DetailItem
                          label="Who it is for EN"
                          value={agent.who_it_is_for_en}
                        />
                        <DetailItem
                          label="Who it is for ZH"
                          value={agent.who_it_is_for_zh}
                        />
                        <DetailItem
                          label="Receives EN"
                          value={agent.what_customer_receives_en}
                        />
                        <DetailItem
                          label="Receives ZH"
                          value={agent.what_customer_receives_zh}
                        />
                      </DetailGrid>
                    </DetailBlock>
                  </section>

                  <DetailBlock title="Features / use cases / FAQ">
                    <DetailGrid>
                      <ListDetail label="Features EN" values={agent.features_en} />
                      <ListDetail label="Features ZH" values={agent.features_zh} />
                      <ListDetail label="Use cases EN" values={agent.use_cases_en} />
                      <ListDetail label="Use cases ZH" values={agent.use_cases_zh} />
                      <FaqDetail label="FAQ EN" values={agent.faq_en} />
                      <FaqDetail label="FAQ ZH" values={agent.faq_zh} />
                    </DetailGrid>
                  </DetailBlock>

                  <DetailBlock title={text.demo}>
                    <DetailGrid>
                      <DetailItem
                        label="Demo enabled"
                        value={agent.demo_enabled ? t("common.yes") : t("common.no")}
                      />
                      <DetailItem label="Live demo URL" value={agent.demo_url} />
                      <ListDetail
                        label="Demo questions"
                        values={agent.demo_questions}
                      />
                      <ListDetail label="Demo answers" values={agent.demo_answers} />
                      <DetailItem
                        label="Sample conversation"
                        value={agent.sample_conversation}
                      />
                      <DetailItem label="Demo video URL" value={agent.video_url} />
                    </DetailGrid>
                  </DetailBlock>

                  <DetailBlock title={text.pricing}>
                    <DetailGrid>
                      <DetailItem label="Pricing type" value={agent.pricing_type} />
                      <DetailItem
                        label="USD"
                        value={agent.price_usd?.toString() ?? ""}
                      />
                      <DetailItem
                        label="CNY"
                        value={agent.price_cny?.toString() ?? ""}
                      />
                      <PlansDetail values={agent.pricing_plans} />
                    </DetailGrid>
                  </DetailBlock>

                  <DetailBlock title={text.delivery}>
                    <DetailGrid>
                      <DetailItem
                        label="Delivery type"
                        value={deliveryLabels[agent.delivery_type][language]}
                      />
                      <RecordDetail
                        label="Delivery settings"
                        value={agent.delivery_settings}
                      />
                      <DetailItem
                        label="Setup EN"
                        value={agent.setup_instructions_en}
                      />
                      <DetailItem
                        label="Setup ZH"
                        value={agent.setup_instructions_zh}
                      />
                      <DetailItem
                        label={`${text.dataPermissions} EN`}
                        value={agent.data_permissions_en}
                      />
                      <DetailItem
                        label={`${text.dataPermissions} ZH`}
                        value={agent.data_permissions_zh}
                      />
                      <DetailItem label="Limitations EN" value={agent.limitations_en} />
                      <DetailItem label="Limitations ZH" value={agent.limitations_zh} />
                      <DetailItem
                        label="Custom upgrade EN"
                        value={agent.custom_upgrade_options_en}
                      />
                      <DetailItem
                        label="Custom upgrade ZH"
                        value={agent.custom_upgrade_options_zh}
                      />
                    </DetailGrid>
                  </DetailBlock>

                  <DetailBlock title={text.compliance}>
                    <DetailGrid>
                      <DetailItem
                        label="Originality / rights"
                        value={agent.agent_rights_confirmed ? "confirmed" : ""}
                      />
                      <DetailItem
                        label="Content safety"
                        value={agent.content_safety_confirmed ? "confirmed" : ""}
                      />
                      <DetailItem
                        label="Review policy"
                        value={agent.review_policy_confirmed ? "confirmed" : ""}
                      />
                      <DetailItem
                        label="Suspension policy"
                        value={agent.suspension_policy_confirmed ? "confirmed" : ""}
                      />
                      <DetailItem
                        label="Sensitive disclaimer"
                        value={
                          agent.sensitive_disclaimer_confirmed ? "confirmed" : ""
                        }
                      />
                      <DetailItem
                        label={text.reasonCode}
                        value={
                          agent.review_reason_code
                            ? reasonLabels[agent.review_reason_code][language]
                            : ""
                        }
                      />
                    </DetailGrid>
                  </DetailBlock>
                </div>
              </details>

              <QualityReviewPanel
                quality={quality}
                text={qualityText}
              />

              <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-950">
                  {text.publishWarnings}
                </h3>
                {publishWarnings.length ? (
                  <ul className="mt-2 grid gap-1 text-sm text-amber-900">
                    {publishWarnings.map((warning) => (
                      <li key={warning}>- {warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-amber-900">{text.noWarnings}</p>
                )}
              </section>

              <section className="mt-5 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Product content
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Admin can correct listing basics before approving or publishing.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <DraftInput
                    label="English title"
                    onChange={(value) =>
                      setContentDrafts((current) => ({
                        ...current,
                        [agent.id]: { ...contentDraft, titleEn: value },
                      }))
                    }
                    value={contentDraft.titleEn}
                  />
                  <DraftInput
                    label="Chinese title"
                    onChange={(value) =>
                      setContentDrafts((current) => ({
                        ...current,
                        [agent.id]: { ...contentDraft, titleZh: value },
                      }))
                    }
                    value={contentDraft.titleZh}
                  />
                  <DraftSelect
                    label="Pricing type"
                    onChange={(value) =>
                      setContentDrafts((current) => ({
                        ...current,
                        [agent.id]: {
                          ...contentDraft,
                          pricingType: value as PricingType,
                        },
                      }))
                    }
                    value={contentDraft.pricingType}
                  />
                  <DraftInput
                    label="USD price from"
                    onChange={(value) =>
                      setContentDrafts((current) => ({
                        ...current,
                        [agent.id]: { ...contentDraft, priceUsd: value },
                      }))
                    }
                    value={contentDraft.priceUsd}
                  />
                  <DraftInput
                    label="CNY price from"
                    onChange={(value) =>
                      setContentDrafts((current) => ({
                        ...current,
                        [agent.id]: { ...contentDraft, priceCny: value },
                      }))
                    }
                    value={contentDraft.priceCny}
                  />
                </div>
                <DraftTextarea
                  label="English one-line value"
                  onChange={(value) =>
                    setContentDrafts((current) => ({
                      ...current,
                      [agent.id]: {
                        ...contentDraft,
                        shortDescriptionEn: value,
                      },
                    }))
                  }
                  value={contentDraft.shortDescriptionEn}
                />
                <DraftTextarea
                  label="Chinese one-line value"
                  onChange={(value) =>
                    setContentDrafts((current) => ({
                      ...current,
                      [agent.id]: {
                        ...contentDraft,
                        shortDescriptionZh: value,
                      },
                    }))
                  }
                  value={contentDraft.shortDescriptionZh}
                />
                <button
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                  onClick={() =>
                    void updateAgent(agent, {
                      price_cny: parseOptionalNumber(contentDraft.priceCny),
                      price_usd: parseOptionalNumber(contentDraft.priceUsd),
                      pricing_type: contentDraft.pricingType,
                      short_description_en: contentDraft.shortDescriptionEn,
                      short_description_zh: contentDraft.shortDescriptionZh,
                      title_en: contentDraft.titleEn,
                      title_zh: contentDraft.titleZh,
                    })
                  }
                  type="button"
                >
                  {text.saveContent}
                </button>
              </section>

              <section className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                  <FilterSelect
                    label={text.reasonCode}
                    onChange={(value) =>
                      setReasonCodes((current) => ({
                        ...current,
                        [agent.id]: value as AgentReviewReasonCode | "",
                      }))
                    }
                    value={reasonCode}
                  >
                    <option value="">{text.missing}</option>
                    {AGENT_REVIEW_REASON_CODES.map((reason) => (
                      <option key={reason} value={reason}>
                        {reasonLabels[reason][language]}
                      </option>
                    ))}
                  </FilterSelect>
                  <label className="text-sm">
                    <span className="font-medium text-slate-700">
                      {text.reviewFeedback}
                    </span>
                    <textarea
                      className="polished-input mt-2 min-h-24 w-full px-3 py-2 text-sm text-slate-950"
                      onChange={(event) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [agent.id]: event.target.value,
                        }))
                      }
                      value={feedbackValue}
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span className="font-medium text-slate-700">
                    {text.internalNote}
                  </span>
                  <textarea
                    className="polished-input mt-2 min-h-20 w-full px-3 py-2 text-sm text-slate-950"
                    onChange={(event) =>
                      setInternalNotes((current) => ({
                        ...current,
                        [agent.id]: event.target.value,
                      }))
                    }
                    value={internalNoteValue}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    label={text.markInReview}
                    onClick={() => void updateAgent(agent, { status: "in_review" })}
                  />
                  <ActionButton
                    label={text.requestChanges}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || "missing_content",
                        status: "needs_changes",
                      })
                    }
                  />
                  <ActionButton
                    label={text.approve}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || null,
                        status: "approved",
                      })
                    }
                  />
                  <ActionButton
                    label={text.publish}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || null,
                        status: "published",
                      })
                    }
                  />
                  <ActionButton
                    label={text.reject}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || "other",
                        status: "rejected",
                      })
                    }
                  />
                  <ActionButton
                    label={text.suspend}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || "unsafe_content",
                        status: "suspended",
                      })
                    }
                  />
                  <ActionButton
                    label={text.archive}
                    onClick={() =>
                      void updateAgent(agent, {
                        feedback: feedbackValue,
                        review_reason_code: reasonCode || "other",
                        status: "archived",
                      })
                    }
                  />
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                    onClick={() =>
                      void updateAgent(agent, {
                        admin_note: internalNoteValue,
                      })
                    }
                    type="button"
                  >
                    {text.saveInternalNote}
                  </button>
                </div>
              </section>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function matchesFilters(agent: AdminAgentRecord, filters: FilterState) {
  if (filters.status !== "all" && agent.status !== filters.status) {
    return false;
  }

  if (filters.category !== "all" && agent.category_slug !== filters.category) {
    return false;
  }

  if (filters.seller === "platform" && agent.owner_type !== "platform") {
    return false;
  }

  if (
    filters.seller !== "all" &&
    filters.seller !== "platform" &&
    agent.seller_email !== filters.seller
  ) {
    return false;
  }

  if (
    filters.deliveryType !== "all" &&
    agent.delivery_type !== filters.deliveryType
  ) {
    return false;
  }

  if (filters.featured !== "all" && agent.is_featured !== (filters.featured === "yes")) {
    return false;
  }

  if (filters.verified !== "all" && agent.is_verified !== (filters.verified === "yes")) {
    return false;
  }

  return true;
}

function getPublishWarnings(agent: AdminAgentRecord) {
  return getAgentPublishWarnings(agent);
}

function hasRecordValues(value: Record<string, unknown> | undefined) {
  return Boolean(
    value &&
      Object.values(value).some((item) => {
        if (typeof item === "string") {
          return item.trim().length > 0;
        }

        if (Array.isArray(item)) {
          return item.length > 0;
        }

        return Boolean(item);
      }),
  );
}

function getAgentContentDraft(
  agent: AdminAgentRecord,
  draft?: AgentContentDraft,
): AgentContentDraft {
  if (draft) {
    return draft;
  }

  return {
    priceCny: agent.price_cny?.toString() ?? "",
    priceUsd: agent.price_usd?.toString() ?? "",
    pricingType: agent.pricing_type,
    shortDescriptionEn: agent.short_description_en,
    shortDescriptionZh: agent.short_description_zh,
    titleEn: agent.title_en,
    titleZh: agent.title_zh,
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
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
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function DraftSelect({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: PricingType;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {PRICING_TYPES.map((pricingType) => (
          <option key={pricingType} value={pricingType}>
            {pricingType}
          </option>
        ))}
      </select>
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
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function AdminState({ children }: { children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-700">{children}</dd>
    </div>
  );
}

function QualityReviewPanel({
  quality,
  text,
}: {
  quality: AgentQualityResult;
  text: (typeof adminQualityCopy)["en"] | (typeof adminQualityCopy)["zh"];
}) {
  return (
    <section className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-indigo-950">
          {text.qualityScore}
        </h3>
        <span
          className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700"
          data-testid="admin-quality-score"
        >
          {quality.percentage}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${quality.percentage}%` }}
        />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <QualityReviewList
          emptyText={text.noIssues}
          items={quality.missingFields}
          title={text.missingFields}
        />
        <QualityReviewList
          emptyText={text.noIssues}
          items={quality.warnings}
          title={text.qualityWarnings}
        />
        <QualityReviewList
          emptyText={text.noIssues}
          items={quality.possibleFalseClaims}
          title={text.possibleFalseClaims}
        />
      </div>
    </section>
  );
}

function QualityReviewList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {title}
      </h4>
      {items.length ? (
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function DetailBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-4 text-sm md:grid-cols-2">{children}</dl>;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-slate-700">
        {value?.trim() || "Not provided"}
      </dd>
    </div>
  );
}

function ListDetail({
  label,
  values,
}: {
  label: string;
  values?: string[];
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-slate-700">
        {values?.length ? (
          <ul className="grid gap-1">
            {values.map((value) => (
              <li className="break-words" key={value}>
                - {value}
              </li>
            ))}
          </ul>
        ) : (
          "Not provided"
        )}
      </dd>
    </div>
  );
}

function FaqDetail({
  label,
  values,
}: {
  label: string;
  values?: FaqItem[];
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-slate-700">
        {values?.length ? (
          <ul className="grid gap-2">
            {values.map((item) => (
              <li className="break-words" key={`${item.question}-${item.answer}`}>
                <strong>{item.question}</strong>
                <span className="block">{item.answer}</span>
              </li>
            ))}
          </ul>
        ) : (
          "Not provided"
        )}
      </dd>
    </div>
  );
}

function PlansDetail({ values }: { values?: Array<Record<string, unknown>> }) {
  return (
    <div className="md:col-span-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Pricing plans
      </dt>
      <dd className="mt-1 grid gap-2 text-slate-700">
        {values?.length
          ? values.map((plan, index) => (
              <pre
                className="overflow-auto rounded-xl bg-slate-100 p-3 text-xs"
                key={`${String(plan.plan_id ?? index)}`}
              >
                {JSON.stringify(plan, null, 2)}
              </pre>
            ))
          : "Not provided"}
      </dd>
    </div>
  );
}

function RecordDetail({
  label,
  value,
}: {
  label: string;
  value?: Record<string, unknown>;
}) {
  return (
    <div className="md:col-span-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-slate-700">
        {hasRecordValues(value) ? (
          <pre className="overflow-auto rounded-xl bg-slate-100 p-3 text-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        ) : (
          "Not provided"
        )}
      </dd>
    </div>
  );
}

function formatDate(value: string, language: "en" | "zh") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
