"use client";

import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import type { CustomerAgentConfig } from "@/components/customer/customer-agent-config-editor";

type TestResult = {
  assistant_message: string;
  intent: string;
  lead_score?: string;
  session_id: string;
  should_collect_lead: boolean;
  should_handoff: boolean;
};

const copy = {
  en: {
    ask: "Ask the agent",
    description:
      "Use this before launch to verify that the current business info, FAQ, policies, and disallowed claims are being used by the server-side runtime.",
    empty: "Ask a common customer question or a disallowed claim test.",
    error: "The runtime test failed. Please save the configuration and try again.",
    lead: "Lead score",
    handoff: "Handoff",
    intent: "Intent",
    question: "Test question",
    send: "Test agent",
    title: "Test Agent panel",
  },
  zh: {
    ask: "询问 Agent",
    description: "上线前用这里测试当前业务信息、FAQ、政策和禁止承诺是否已经进入后端运行时。",
    empty: "输入一个常见客户问题，或测试禁止承诺类问题。",
    error: "运行时测试失败。请先保存配置后再试。",
    lead: "线索评分",
    handoff: "转人工",
    intent: "意图",
    question: "测试问题",
    send: "测试 Agent",
    title: "Test Agent 面板",
  },
} as const;

export function CustomerAgentTestPanel({
  config,
}: {
  config: CustomerAgentConfig;
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  async function runTest() {
    const trimmed = question.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/agent/chat", {
        body: JSON.stringify({
          agent_id: config.agent_slug,
          language,
          order_id: config.order_id || config.order_number || undefined,
          page_url: config.website_url || undefined,
          session_id: sessionId || undefined,
          visitor_message: trimmed,
          visitor_metadata: {
            source: "customer_config_test_panel",
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: TestResult;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || text.error);
      }

      setResult(payload.data);
      setSessionId(payload.data.session_id);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : text.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{text.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text.description}</p>
        </div>
      </div>
      <label className="mt-4 grid gap-1.5">
        <span className="text-sm font-semibold text-slate-800">{text.question}</span>
        <textarea
          className="polished-input min-h-24 px-3 py-2 text-sm text-slate-950"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={text.empty}
          value={question}
        />
      </label>
      <button
        className="mt-3 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isLoading}
        onClick={() => void runTest()}
        type="button"
      >
        {isLoading ? text.ask : text.send}
      </button>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
          <p className="text-sm leading-6 text-slate-700">{result.assistant_message}</p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <DebugPill label={text.intent} value={result.intent} />
            <DebugPill label={text.lead} value={result.lead_score ?? "n/a"} />
            <DebugPill
              label={text.handoff}
              value={result.should_handoff ? "yes" : "no"}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DebugPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
