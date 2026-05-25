"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  LEAD_SCORES,
  LEAD_STATUSES,
  type LeadScore,
  type LeadStatus,
} from "@/lib/marketplace/constants";
import { demoAgents } from "@/lib/marketplace/demo-data";

type LeadRecord = {
  admin_note?: string | null;
  agent_slug: string;
  conversation_summary: string;
  created_at: string;
  id: string;
  inquiry: string;
  intent: string;
  lead_score: LeadScore;
  status: LeadStatus;
  transcript: unknown;
  visitor_company: string | null;
  visitor_email: string;
  visitor_name: string;
  visitor_phone: string | null;
};

export function LeadsTable() {
  const { language, t } = useTranslation();
  const [records, setRecords] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [agentFilter, setAgentFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState<LeadScore | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const getLeadsUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (agentFilter !== "all") {
      params.set("agent_slug", agentFilter);
    }

    if (scoreFilter !== "all") {
      params.set("lead_score", scoreFilter);
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    const query = params.toString();

    return query ? `/api/leads?${query}` : "/api/leads";
  }, [agentFilter, scoreFilter, statusFilter]);

  async function loadLeads() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(getLeadsUrl(), { cache: "no-store" });
      const result = (await response.json()) as { data?: LeadRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Unable to load leads.");
      }

      setRecords(result.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load leads.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateLead(
    record: LeadRecord,
    updates: Partial<{
      lead_score: LeadScore;
      status: LeadStatus;
    }> = {},
  ) {
    const response = await fetch("/api/leads", {
      body: JSON.stringify({
        admin_note: notes[record.id] ?? record.admin_note ?? "",
        id: record.id,
        ...updates,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as { data?: LeadRecord; error?: string };

    if (!response.ok || !result.data) {
      setError(result.error || "Unable to update lead.");
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? result.data as LeadRecord : item)),
    );
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialLeads() {
      try {
        const response = await fetch(getLeadsUrl(), { cache: "no-store" });
        const result = (await response.json()) as {
          data?: LeadRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error || "Unable to load leads.");
        }

        if (isActive) {
          setRecords(result.data ?? []);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load leads.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialLeads();

    return () => {
      isActive = false;
    };
  }, [getLeadsUrl]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  const agentOptions = useMemo(
    () =>
      demoAgents.map((agent) => ({
        label: language === "zh" ? agent.titleZh || agent.titleEn : agent.titleEn,
        value: agent.slug,
      })),
    [language],
  );

  if (isLoading) {
    return <AdminState>Loading leads...</AdminState>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="premium-card grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {records.length} leads
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Filter by agent, score, or status to focus daily follow-up.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <FilterSelect
            label="Agent"
            value={agentFilter}
            onChange={setAgentFilter}
            options={[
              { label: "All agents", value: "all" },
              ...agentOptions,
            ]}
          />
          <FilterSelect
            label="Score"
            value={scoreFilter}
            onChange={(value) => setScoreFilter(value as LeadScore | "all")}
            options={[
              { label: "All scores", value: "all" },
              ...LEAD_SCORES.map((score) => ({ label: score, value: score })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as LeadStatus | "all")}
            options={[
              { label: "All statuses", value: "all" },
              ...LEAD_STATUSES.map((status) => ({ label: status, value: status })),
            ]}
          />
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
            onClick={() => void loadLeads()}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <AdminState>Widget leads will appear here after visitors submit contact details.</AdminState>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const agent = demoAgents.find((item) => item.slug === record.agent_slug);
            const agentTitle = agent
              ? language === "zh"
                ? agent.titleZh || agent.titleEn
                : agent.titleEn || agent.titleZh
              : record.agent_slug;

            return (
              <article className="premium-card p-5" key={record.id}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {record.intent} · {record.lead_score}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {record.visitor_name} / {record.visitor_email}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {agentTitle}
                    </p>
                  </div>
                  <AdminStatusBadge status={record.status} />
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <Field label={t("forms.company")}>
                    {record.visitor_company || t("common.notProvided")}
                  </Field>
                  <Field label={t("forms.contactPhone")}>
                    {record.visitor_phone || t("common.notProvided")}
                  </Field>
                  <Field label="Inquiry">{record.inquiry}</Field>
                  <Field label={t("admin.tableSubmitted")}>
                    {dateFormatter.format(new Date(record.created_at))}
                  </Field>
                </dl>

                <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                    View transcript and summary
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {record.conversation_summary}
                  </p>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
                    {JSON.stringify(record.transcript, null, 2)}
                  </pre>
                </details>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <textarea
                    className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [record.id]: event.target.value,
                      }))
                    }
                    placeholder="Add internal note"
                    value={notes[record.id] ?? record.admin_note ?? ""}
                  />
                  <div className="flex flex-wrap gap-2">
                    {LEAD_STATUSES.map((status) => (
                      <button
                        className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                        key={status}
                        onClick={() => void updateLead(record, { status })}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
                    {LEAD_SCORES.map((score) => (
                      <button
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
                        key={score}
                        onClick={() => void updateLead(record, { lead_score: score })}
                        type="button"
                      >
                        {score}
                      </button>
                    ))}
                    <button
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                      onClick={() => void updateLead(record)}
                      type="button"
                    >
                      Save note
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
