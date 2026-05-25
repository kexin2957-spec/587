"use client";

import { useEffect, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  PRICING_TYPES,
  type AgentStatus,
  type DeliveryType,
  type PricingType,
} from "@/lib/marketplace/constants";

type AdminAgentRecord = {
  admin_note?: string | null;
  category_slug: string;
  created_at: string;
  delivery_type: DeliveryType;
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  owner_type: "platform" | "seller";
  price_cny: number | null;
  price_usd: number | null;
  pricing_type: PricingType;
  review_feedback?: string | null;
  seller_email: string | null;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  title_en: string;
  title_zh: string;
  updated_at: string;
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

const deliveryLabels: Record<DeliveryType, string> = {
  custom_business_agent: "marketplace.customBusinessAgent",
  hosted_agent: "marketplace.hostedAgent",
  prompt_template: "marketplace.promptTemplate",
  website_chatbot: "marketplace.websiteChatbot",
  workflow_template: "marketplace.workflowTemplate",
};

export function AdminAgentsTable() {
  const { language, t } = useTranslation();
  const [records, setRecords] = useState<AdminAgentRecord[]>([]);
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, AgentContentDraft>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

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

  async function updateAgent(
    agent: AdminAgentRecord,
    updates: {
      admin_note?: string;
      feedback?: string;
      is_featured?: boolean;
      is_verified?: boolean;
      price_cny?: number | null;
      price_usd?: number | null;
      pricing_type?: PricingType;
      short_description_en?: string;
      short_description_zh?: string;
      status?: AgentStatus;
      title_en?: string;
      title_zh?: string;
    },
  ) {
    setActionError("");

    const response = await fetch("/api/admin/agents", {
      body: JSON.stringify({ id: agent.id, slug: agent.slug, ...updates }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: AdminAgentRecord;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    setRecords((current) =>
      current.map((item) =>
        item.id === agent.id || item.slug === agent.slug ? result.data as AdminAgentRecord : item,
      ),
    );
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
      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {records.length} {t("admin.totalAgents")}
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {t("admin.dataSource")}: {mode}
            </p>
          ) : null}
        </div>
        <button
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 sm:w-auto"
          onClick={() => void loadRecords()}
          type="button"
        >
          {t("admin.refresh")}
        </button>
      </div>

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4">
        {records.map((agent) => {
          const title =
            language === "zh" ? agent.title_zh || agent.title_en : agent.title_en || agent.title_zh;
          const noteValue = notes[agent.id] ?? agent.review_feedback ?? "";
          const contentDraft = getAgentContentDraft(agent, drafts[agent.id]);

          return (
            <article
              className="premium-card p-5"
              data-testid="admin-agent-row"
              key={`${agent.owner_type}-${agent.id}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {agent.owner_type}
                    </p>
                    <AdminStatusBadge status={agent.status} />
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
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
                      ? t("admin.markUnfeatured")
                      : t("admin.markFeatured")}
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
                      ? t("admin.markUnverified")
                      : t("admin.markVerified")}
                  </button>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label={t("admin.tableOwner")}>
                  {agent.owner_type === "platform"
                    ? t("admin.platform")
                    : agent.seller_email || t("admin.seller")}
                </Field>
                <Field label={t("forms.category")}>{agent.category_slug}</Field>
                <Field label={t("forms.pricingType")}>{agent.pricing_type}</Field>
                <Field label={t("forms.deliveryType")}>
                  {t(deliveryLabels[agent.delivery_type])}
                </Field>
                <Field label={t("admin.featured")}>
                  {agent.is_featured ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={t("admin.verified")}>
                  {agent.is_verified ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={t("admin.tableSubmitted")}>
                  {formatDate(agent.created_at, language)}
                </Field>
                <Field label={t("admin.tableStatus")}>{agent.status}</Field>
              </dl>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {t("admin.viewDetails")}
                </summary>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
                  <p>
                    <strong>{t("forms.priceUsd")}:</strong>{" "}
                    {agent.price_usd ?? t("common.notProvided")}
                  </p>
                  <p>
                    <strong>{t("forms.priceCny")}:</strong>{" "}
                    {agent.price_cny ?? t("common.notProvided")}
                  </p>
                  {agent.admin_note ? (
                    <p>
                      <strong>{t("admin.internalNote")}:</strong>{" "}
                      {agent.admin_note}
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      Product content and pricing
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Edit public marketplace copy and price-from fields. Private runtime prompts and workflows are not exposed here.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <DraftInput
                      label="English title"
                      value={contentDraft.titleEn}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: { ...contentDraft, titleEn: value },
                        }))
                      }
                    />
                    <DraftInput
                      label="Chinese title"
                      value={contentDraft.titleZh}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: { ...contentDraft, titleZh: value },
                        }))
                      }
                    />
                    <DraftInput
                      label="USD price from"
                      value={contentDraft.priceUsd}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: { ...contentDraft, priceUsd: value },
                        }))
                      }
                    />
                    <DraftInput
                      label="CNY price from"
                      value={contentDraft.priceCny}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: { ...contentDraft, priceCny: value },
                        }))
                      }
                    />
                    <DraftSelect
                      label="Pricing type"
                      value={contentDraft.pricingType}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: {
                            ...contentDraft,
                            pricingType: value as PricingType,
                          },
                        }))
                      }
                    />
                  </div>
                  <DraftTextarea
                    label="English one-line value"
                    value={contentDraft.shortDescriptionEn}
                    onChange={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [agent.id]: {
                          ...contentDraft,
                          shortDescriptionEn: value,
                        },
                      }))
                    }
                  />
                  <DraftTextarea
                    label="Chinese one-line value"
                    value={contentDraft.shortDescriptionZh}
                    onChange={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [agent.id]: {
                          ...contentDraft,
                          shortDescriptionZh: value,
                        },
                      }))
                    }
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
                    Save product content
                  </button>
                </div>
              </details>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                <textarea
                  className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [agent.id]: event.target.value,
                    }))
                  }
                  placeholder={t("admin.reviewFeedbackPlaceholder")}
                  value={noteValue}
                />
                <div className="flex flex-wrap items-start gap-2">
                  {agent.status === "submitted" ? (
                    <ActionButton
                      label={t("admin.markInReview")}
                      onClick={() => void updateAgent(agent, { status: "in_review" })}
                    />
                  ) : null}
                  {agent.status === "in_review" || agent.status === "suspended" ? (
                    <ActionButton
                      label={t("admin.approve")}
                      onClick={() =>
                        void updateAgent(agent, {
                          feedback: noteValue,
                          status: "approved",
                        })
                      }
                    />
                  ) : null}
                  {agent.status === "in_review" ? (
                    <>
                      <ActionButton
                        label={t("admin.requestChanges")}
                        onClick={() =>
                          void updateAgent(agent, {
                            feedback: noteValue,
                            status: "needs_changes",
                          })
                        }
                      />
                      <ActionButton
                        label={t("admin.reject")}
                        onClick={() =>
                          void updateAgent(agent, {
                            feedback: noteValue,
                            status: "rejected",
                          })
                        }
                      />
                    </>
                  ) : null}
                  {agent.status === "approved" ? (
                    <ActionButton
                      label={t("admin.suspend")}
                      onClick={() =>
                        void updateAgent(agent, {
                          feedback: noteValue,
                          status: "suspended",
                        })
                      }
                    />
                  ) : null}
                  <ActionButton
                    label={t("admin.saveInternalNote")}
                    onClick={() =>
                      void updateAgent(agent, {
                        admin_note: noteValue,
                      })
                    }
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
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
