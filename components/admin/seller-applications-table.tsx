"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useTranslation } from "@/components/i18n/language-provider";

type SellerApplicationRecord = {
  admin_note?: string | null;
  created_at: string;
  email: string;
  expertise: string;
  id: string;
  name: string;
  notes: string | null;
  offers_custom_services: boolean;
  originality_confirmed: boolean;
  payout_preference: string | null;
  planned_agent_types: string;
  seller_terms_agreed: boolean;
  status: string;
  team_name: string | null;
  website: string | null;
};

type SellerApplicationsResponse = {
  data?: SellerApplicationRecord[];
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

export function SellerApplicationsTable() {
  const { language, t } = useTranslation();
  const [records, setRecords] = useState<SellerApplicationRecord[]>([]);
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function fetchRecords() {
    const response = await fetch("/api/seller-applications", {
      cache: "no-store",
    });
    const result = (await response.json()) as SellerApplicationsResponse;

    if (!response.ok) {
      throw new Error(result.error || "Unable to load seller applications.");
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
          : "Unable to load seller applications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateApplication(
    record: SellerApplicationRecord,
    status?: SellerApplicationRecord["status"],
  ) {
    setActionError("");

    const response = await fetch("/api/seller-applications", {
      body: JSON.stringify({
        admin_note: notes[record.id] ?? record.admin_note ?? "",
        id: record.id,
        status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: SellerApplicationRecord;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? result.data as SellerApplicationRecord : item)),
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
            : "Unable to load seller applications.",
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
    return <AdminState>{t("admin.loadingSellerApplications")}</AdminState>;
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
            {records.length} {t("admin.sellerApplications")}
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
        <AdminState>{t("admin.emptySellerApplications")}</AdminState>
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
              data-testid="admin-seller-application-card"
              key={record.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {record.email}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {record.name}
                    {record.team_name ? ` / ${record.team_name}` : ""}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {record.expertise}
                  </p>
                </div>
                <AdminStatusBadge status={record.status} />
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label={t("forms.plannedAgentTypes")}>
                  {record.planned_agent_types}
                </Field>
                <Field label={t("forms.offersCustomServices")}>
                  {record.offers_custom_services ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={t("forms.payoutPreference")}>
                  {record.payout_preference || t("common.notProvided")}
                </Field>
                <Field label={language === "zh" ? "条款确认" : "Terms confirmed"}>
                  {record.seller_terms_agreed ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={language === "zh" ? "原创版权确认" : "Rights confirmed"}>
                  {record.originality_confirmed ? t("common.yes") : t("common.no")}
                </Field>
                <Field label={t("admin.tableSubmitted")}>
                  {dateFormatter.format(new Date(record.created_at))}
                </Field>
              </dl>
              {record.notes ? (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {record.notes}
                </p>
              ) : null}
              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  {t("admin.viewDetails")}
                </summary>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  <p>
                    <strong>{t("forms.website")}:</strong>{" "}
                    {record.website || t("common.notProvided")}
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
                  <ActionButton
                    label={t("admin.markInReview")}
                    onClick={() => void updateApplication(record, "in_review")}
                  />
                  <ActionButton
                    label={t("admin.approve")}
                    onClick={() => void updateApplication(record, "approved")}
                  />
                  <ActionButton
                    label={t("admin.reject")}
                    onClick={() => void updateApplication(record, "rejected")}
                  />
                  <ActionButton
                    label={t("admin.suspend")}
                    onClick={() => void updateApplication(record, "suspended")}
                  />
                  <ActionButton
                    label={t("admin.saveInternalNote")}
                    onClick={() => void updateApplication(record)}
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
