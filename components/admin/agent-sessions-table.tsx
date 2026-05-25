"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

type AgentMessage = {
  content: string;
  created_at: string;
  id: string;
  intent: string | null;
  lead_score: string | null;
  metadata: Record<string, unknown>;
  role: "assistant" | "user";
  session_id: string;
};

type AgentSession = {
  agent_id: string;
  id: string;
  language: string;
  last_intent: string | null;
  last_lead_score: string | null;
  last_message_at: string;
  license_id: string | null;
  messages: AgentMessage[];
  order_id: string | null;
  should_handoff: boolean;
  source_url: string | null;
  started_at: string;
  visitor_id: string;
};

export function AgentSessionsTable() {
  const { language } = useTranslation();
  const [records, setRecords] = useState<AgentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  async function loadSessions() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/agent-sessions", {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        data?: AgentSession[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to load agent sessions.");
      }

      setRecords(result.data ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load agent sessions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialSessions() {
      try {
        const response = await fetch("/api/admin/agent-sessions", {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          data?: AgentSession[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error || "Unable to load agent sessions.");
        }

        if (isActive) {
          setRecords(result.data ?? []);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load agent sessions.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSessions();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <State>Loading agent sessions...</State>;
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
      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {records.length} runtime sessions
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Inspect server-side chat sessions, messages, detected intent, score, handoff, and source URL.
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
          onClick={() => void loadSessions()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {records.length === 0 ? (
        <State>Runtime sessions will appear after visitors chat with an agent.</State>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <article className="premium-card p-5" key={record.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {record.last_intent || "no intent"} / {record.last_lead_score || "no score"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    {record.agent_id}
                  </h2>
                  <p className="mt-2 break-all text-sm leading-6 text-slate-600">
                    {record.source_url || "No source URL"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.should_handoff
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {record.should_handoff ? "handoff" : "self-serve"}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Session">{record.id}</Field>
                <Field label="Visitor">{record.visitor_id}</Field>
                <Field label="Order">{record.order_id || "Not linked"}</Field>
                <Field label="Last message">
                  {formatter.format(new Date(record.last_message_at))}
                </Field>
              </dl>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  View messages ({record.messages.length})
                </summary>
                <div className="mt-4 grid gap-3">
                  {record.messages.map((message) => (
                    <div
                      className="rounded-xl bg-white p-3 text-sm shadow-sm"
                      key={message.id}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>{message.role}</span>
                        <span>{message.intent || "no intent"}</span>
                        <span>{message.lead_score || "no score"}</span>
                        <span>{formatter.format(new Date(message.created_at))}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-slate-700">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
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

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-medium text-slate-800">
        {children}
      </dd>
    </div>
  );
}
