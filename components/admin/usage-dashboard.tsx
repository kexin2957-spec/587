"use client";

import { useEffect, useMemo, useState } from "react";
import { USAGE_EVENT_TYPES, type UsageEventType } from "@/lib/marketplace/constants";

type UsageSummary = Record<UsageEventType, number>;

type UsageLogRecord = {
  agent_id: string;
  agent_slug: string;
  agent_title: string;
  created_at: string;
  customer_email: string | null;
  customer_name: string | null;
  domain: string | null;
  event_type: UsageEventType;
  id: string;
  license_id: string | null;
  license_key: string | null;
  metadata: Record<string, unknown>;
  order_number: string | null;
};

type UsageResponse = {
  data?: UsageLogRecord[];
  error?: string;
  mode?: "mock" | "supabase";
  summary?: UsageSummary;
};

const emptySummary: UsageSummary = {
  blocked_domain: 0,
  chat_message: 0,
  lead_created: 0,
  license_error: 0,
  widget_load: 0,
};

export function UsageDashboard() {
  const [records, setRecords] = useState<UsageLogRecord[]>([]);
  const [summary, setSummary] = useState<UsageSummary>(emptySummary);
  const [eventFilter, setEventFilter] = useState<UsageEventType | "all">("all");
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadUsage() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/usage", { cache: "no-store" });
      const result = (await response.json()) as UsageResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load usage logs.");
      }

      setRecords(result.data ?? []);
      setSummary(result.summary ?? emptySummary);
      setMode(result.mode ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load usage logs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialUsage() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/usage", { cache: "no-store" });
        const result = (await response.json()) as UsageResponse;

        if (!response.ok) {
          throw new Error(result.error || "Unable to load usage logs.");
        }

        if (!isActive) {
          return;
        }

        setRecords(result.data ?? []);
        setSummary(result.summary ?? emptySummary);
        setMode(result.mode ?? null);
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load usage logs.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialUsage();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleRecords = useMemo(
    () =>
      eventFilter === "all"
        ? records
        : records.filter((record) => record.event_type === eventFilter),
    [eventFilter, records],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  if (isLoading) {
    return <State>Loading usage logs...</State>;
  }

  if (error) {
    return <State>{error}</State>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {USAGE_EVENT_TYPES.map((eventType) => (
          <button
            className={`premium-card p-4 text-left ${
              eventFilter === eventType ? "ring-2 ring-blue-500" : ""
            }`}
            key={eventType}
            onClick={() =>
              setEventFilter((current) => (current === eventType ? "all" : eventType))
            }
            type="button"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {eventType.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {summary[eventType] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {visibleRecords.length} usage events
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              Data source: {mode}
            </p>
          ) : null}
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
          onClick={() => void loadUsage()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {visibleRecords.length === 0 ? (
        <State>Usage events appear after widgets load, chats happen, leads are created, or license checks fail.</State>
      ) : (
        <div className="grid gap-4">
          {visibleRecords.map((record) => (
            <article className="premium-card p-5" key={record.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {record.event_type.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {record.agent_title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {record.domain || "No domain"} / {record.customer_email || "No customer"}
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {dateFormatter.format(new Date(record.created_at))}
                </p>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label="License">{maskLicense(record.license_key)}</Field>
                <Field label="Order">{record.order_number || "Not linked"}</Field>
                <Field label="Customer">{record.customer_name || "Not provided"}</Field>
                <Field label="Agent id">{record.agent_id}</Field>
              </dl>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  Metadata
                </summary>
                <pre className="mt-3 max-h-60 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
                  {JSON.stringify(record.metadata ?? {}, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function maskLicense(value: string | null) {
  if (!value) {
    return "Not linked";
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
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
