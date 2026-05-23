"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";

type CustomRequestRecord = {
  admin_note?: string | null;
  agent_goal: string;
  budget_range: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string | null;
  created_at: string;
  existing_website: string;
  has_documents: boolean;
  id: string;
  industry: string;
  language?: string | null;
  notes: string | null;
  required_integrations: string;
  source_page?: string | null;
  status: string;
  timeline: string;
};

type CustomRequestsResponse = {
  data?: CustomRequestRecord[];
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

export function CustomRequestsTable() {
  const { language, t } = useTranslation();
  const [records, setRecords] = useState<CustomRequestRecord[]>([]);
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function fetchRecords() {
    const response = await fetch("/api/custom-requests", {
      cache: "no-store",
    });
    const result = (await response.json()) as CustomRequestsResponse;

    if (!response.ok) {
      throw new Error(result.error || "Unable to load custom requests.");
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
        loadError instanceof Error
          ? loadError.message
          : "Unable to load custom requests.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateRequest(record: CustomRequestRecord, status?: string) {
    setActionError("");

    const response = await fetch("/api/custom-requests", {
      body: JSON.stringify({
        admin_note: notes[record.id] ?? record.admin_note ?? "",
        id: record.id,
        status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: CustomRequestRecord;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? result.data as CustomRequestRecord : item)),
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
          loadError instanceof Error
            ? loadError.message
            : "Unable to load custom requests.",
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

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  if (isLoading) {
    return (
      <div className="premium-card p-5">
        <p className="text-sm text-slate-600">
          {t("admin.loadingCustomRequests")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          onClick={() => void loadRecords()}
          type="button"
        >
          {t("admin.refresh")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {records.length} {t("admin.customRequests")}
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

      {records.length === 0 ? (
        <div className="premium-card p-5">
          <p className="text-sm text-slate-600">
            {t("admin.emptyCustomRequests")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {actionError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {actionError}
            </div>
          ) : null}
          {records.map((record) => (
            <article
              className="premium-card p-5"
              data-testid="admin-custom-request-card"
              key={record.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {record.industry}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {record.company_name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {record.agent_goal}
                  </p>
                </div>
                <AdminStatusBadge status={record.status} />
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label={t("admin.tableContact")}>
                  {record.contact_name} / {record.contact_email}
                </Field>
                <Field label={t("admin.tableBudget")}>
                  {record.budget_range}
                </Field>
                <Field label={t("admin.tableTimeline")}>
                  {record.timeline}
                </Field>
                <Field label={t("admin.tableSubmitted")}>
                  {dateFormatter.format(new Date(record.created_at))}
                </Field>
                <Field label={t("forms.existingWebsite")}>
                  {record.existing_website}
                </Field>
                <Field label={t("forms.hasDocuments")}>
                  {record.has_documents ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={t("forms.requiredIntegrations")}>
                  {record.required_integrations}
                </Field>
                <Field label={t("forms.contactPhone")}>
                  {record.contact_phone || t("common.notProvided")}
                </Field>
              </dl>

              {record.notes ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {t("forms.notes")}:
                  </span>{" "}
                  {record.notes}
                </div>
              ) : null}
              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {t("admin.viewDetails")}
                </summary>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  <p>
                    <strong>{t("forms.agentGoal")}:</strong> {record.agent_goal}
                  </p>
                  <p>
                    <strong>{t("admin.sourcePage")}:</strong>{" "}
                    {record.source_page || t("common.notProvided")}
                  </p>
                  <p>
                    <strong>{t("forms.language")}:</strong>{" "}
                    {record.language || t("common.notProvided")}
                  </p>
                  <p>
                    <strong>{t("admin.internalNote")}:</strong>{" "}
                    {record.admin_note || t("common.notProvided")}
                  </p>
                </div>
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
                  placeholder={t("admin.internalNotePlaceholder")}
                  value={notes[record.id] ?? record.admin_note ?? ""}
                />
                <div className="flex flex-wrap items-start gap-2">
                  {[
                    "new",
                    "contacted",
                    "quoted",
                    "in_progress",
                    "completed",
                    "rejected",
                  ].map((status) => (
                    <ActionButton
                      key={status}
                      label={status}
                      onClick={() => void updateRequest(record, status)}
                    />
                  ))}
                  <ActionButton
                    label={t("admin.saveInternalNote")}
                    onClick={() => void updateRequest(record)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
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
