"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  LICENSE_STATUSES,
  type LicenseStatus,
} from "@/lib/marketplace/constants";

type LicenseRecord = {
  agent_slug: string;
  agent_title: string;
  allowed_domains: string[];
  customer_email: string;
  customer_name: string;
  expires_at: string | null;
  id: string;
  license_key: string;
  order_number: string;
  plan_name: string;
  status: LicenseStatus;
  usage_count_monthly: number;
  usage_limit_monthly: number | null;
  usage_summary: {
    blocked_domain: number;
    chat_message: number;
    lead_created: number;
    license_error: number;
    widget_load: number;
  };
};

type LicensesResponse = {
  data?: LicenseRecord[];
  error?: string;
  mode?: "mock" | "supabase";
};

export function LicensesTable() {
  const { language, t } = useTranslation();
  const [records, setRecords] = useState<LicenseRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  async function loadLicenses() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/licenses", { cache: "no-store" });
      const result = (await response.json()) as LicensesResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load licenses.");
      }

      setRecords(result.data ?? []);
      setMode(result.mode ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load licenses.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateLicense(
    record: LicenseRecord,
    updates: Partial<{ allowed_domains: string; status: LicenseStatus }>,
  ) {
    const response = await fetch("/api/admin/licenses", {
      body: JSON.stringify({ id: record.id, ...updates }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error || "Unable to update license.");
      return;
    }

    await loadLicenses();
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialLicenses() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/licenses", { cache: "no-store" });
        const result = (await response.json()) as LicensesResponse;

        if (!response.ok) {
          throw new Error(result.error || "Unable to load licenses.");
        }

        if (!isActive) {
          return;
        }

        setRecords(result.data ?? []);
        setMode(result.mode ?? null);
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load licenses.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialLicenses();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <State>{language === "zh" ? "正在加载 license..." : "Loading licenses..."}</State>;
  }

  if (error) {
    return <State>{error}</State>;
  }

  return (
    <div className="grid gap-4">
      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {records.length} {language === "zh" ? "Agent Licenses" : "Agent licenses"}
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {t("admin.dataSource")}: {mode}
            </p>
          ) : null}
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
          onClick={() => void loadLicenses()}
          type="button"
        >
          {language === "zh" ? "刷新" : "Refresh"}
        </button>
      </div>

      {records.length === 0 ? (
        <State>
          {language === "zh"
            ? "付款确认后，可从订单后台生成 license。"
            : "Generate licenses from paid orders in the order admin page."}
        </State>
      ) : null}

      {records.map((record) => {
        const domainDraft =
          drafts[record.id] ?? record.allowed_domains.join("\n");

        return (
          <article className="premium-card p-5" key={record.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {record.order_number}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {record.agent_title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {record.customer_name} / {record.customer_email}
                </p>
              </div>
              <AdminStatusBadge status={record.status} />
            </div>

            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
              <Field label="License">{record.license_key}</Field>
              <Field label="Plan">{record.plan_name}</Field>
              <Field label="Usage limit">
                {record.usage_limit_monthly ?? "Unlimited"}
              </Field>
              <Field label="Expires">
                {record.expires_at
                  ? dateFormatter.format(new Date(record.expires_at))
                  : "No expiry"}
              </Field>
              <Field label="Widget loads">{record.usage_summary.widget_load}</Field>
              <Field label="Chats">{record.usage_summary.chat_message}</Field>
              <Field label="Leads">{record.usage_summary.lead_created}</Field>
              <Field label="Blocked / errors">
                {record.usage_summary.blocked_domain} /{" "}
                {record.usage_summary.license_error}
              </Field>
            </dl>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {language === "zh" ? "允许域名" : "Allowed domains"}
                </span>
                <textarea
                  className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [record.id]: event.target.value,
                    }))
                  }
                  value={domainDraft}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  className="polished-input px-3 py-2 text-sm text-slate-950"
                  onChange={(event) =>
                    void updateLicense(record, {
                      status: event.target.value as LicenseStatus,
                    })
                  }
                  value={record.status}
                >
                  {LICENSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  onClick={() =>
                    void updateLicense(record, { allowed_domains: domainDraft })
                  }
                  type="button"
                >
                  {language === "zh" ? "保存域名" : "Save domains"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-700">{children}</dd>
    </div>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}
