"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

type LeadScore = "cold" | "hot" | "invalid" | "warm";

type ChatApiData = {
  assistant_message: string;
  intent: string;
  lead_score?: LeadScore;
  session_id: string;
  should_collect_lead: boolean;
  should_handoff: boolean;
  suggested_follow_up_questions?: string[];
};

type ChatMessage = {
  id: string;
  role: "assistant" | "visitor";
  text: string;
};

const starterQuestions = {
  en: [
    "Which product is best for a first-time buyer?",
    "How long does shipping usually take?",
    "Can I return it if the size is wrong?",
    "Can you check my order status?",
  ],
  zh: [
    "第一次购买应该选哪款产品？",
    "一般多久可以发货送达？",
    "尺码不合适可以退换吗？",
    "你能帮我查询订单状态吗？",
  ],
} as const;

const copy = {
  en: {
    badge: "Live server-side demo",
    caution:
      "This public demo does not access real orders or inventory. It explains policies, recommends products from approved content, and hands off exact order tracking to your team unless an integration is added.",
    cta: "View product page",
    input: "Ask about products, shipping, returns, or purchase help...",
    runtime:
      "The browser sends only the visitor message to the backend runtime. Sensitive runtime instructions, product rules, handoff rules, and credentials stay server-side.",
    send: "Send",
    sending: "Sending...",
    subtitle:
      "Test how the e-commerce agent answers shopper questions, detects purchase intent, and stays honest about unsupported real-time integrations.",
    title: "Try the E-commerce Product Support Agent",
  },
  zh: {
    badge: "后端实时 Demo",
    caution:
      "这个公开 Demo 不会访问真实订单或库存。它可以说明政策、基于已批准内容推荐产品，并在未接入集成时把精确订单查询转交给人工团队。",
    cta: "查看商品页",
    input: "咨询产品、物流、退换货或购买建议...",
    runtime:
      "浏览器只把访客问题发送到后端运行时。敏感运行指令、产品规则、转人工规则和凭证都保留在服务端。",
    send: "发送",
    sending: "发送中...",
    subtitle:
      "测试电商 Agent 如何回答购物问题、识别购买意向，并对未支持的实时集成保持清晰说明。",
    title: "体验 E-commerce Product Support Agent",
  },
} as const;

const scoreLabels: Record<LeadScore, { en: string; zh: string }> = {
  cold: { en: "Cold", zh: "冷线索" },
  hot: { en: "Hot", zh: "热线索" },
  invalid: { en: "Invalid", zh: "无效" },
  warm: { en: "Warm", zh: "暖线索" },
};

function newMessageId() {
  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function EcommerceProductDemo() {
  const { language } = useTranslation();
  const localizedCopy = copy[language];
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ChatApiData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        language === "zh"
          ? "你好，我可以帮你比较产品、说明配送和退换货政策，也可以在需要人工确认时帮你转交团队。"
          : "Hi, I can help compare products, explain shipping and returns, and hand off to the team when a real order needs confirmation.",
    },
  ]);

  const quickQuestions = useMemo(() => starterQuestions[language], [language]);

  async function sendMessage(message?: string) {
    const text = (message ?? input).trim();

    if (!text || isSending) {
      return;
    }

    setInput("");
    setIsSending(true);
    setMessages((current) => [
      ...current,
      { id: newMessageId(), role: "visitor", text },
    ]);

    try {
      const response = await fetch("/api/agent/chat", {
        body: JSON.stringify({
          agent_id: "ecommerce-product-support-agent",
          language,
          page_url:
            typeof window === "undefined" ? undefined : window.location.href,
          session_id: sessionId ?? undefined,
          visitor_message: text,
          visitor_metadata: { source: "public_ecommerce_demo" },
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: ChatApiData;
        error?: string;
        ok?: boolean;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Runtime request failed");
      }

      const data = payload.data;

      setRuntime(data);
      setSessionId(data.session_id);
      setMessages((current) => [
        ...current,
        {
          id: newMessageId(),
          role: "assistant",
          text: data.assistant_message,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: newMessageId(),
          role: "assistant",
          text:
            language === "zh"
              ? "Demo 运行时暂时没有响应，请稍后再试。"
              : "The demo runtime is not responding right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#101828_0%,#0f3b3e_52%,#1f2937_100%)]">
        <div className="app-container grid min-h-[640px] items-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-24">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              {localizedCopy.badge}
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {localizedCopy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              {localizedCopy.subtitle}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              {localizedCopy.runtime}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100"
                href="#demo-agent"
              >
                {language === "zh" ? "开始体验" : "Try demo"}
              </a>
              <Link
                className="rounded-lg border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
                href="/agents/ecommerce-product-support-agent"
              >
                {localizedCopy.cta}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-5 shadow-2xl shadow-black/30">
            <div className="rounded-xl bg-white p-4 text-slate-950">
              <p className="text-sm font-semibold text-slate-500">
                {language === "zh" ? "电商客服看板" : "Shopper support panel"}
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  {
                    label: language === "zh" ? "购买意向" : "Purchase intent",
                    value: runtime?.intent ?? "product_question",
                  },
                  {
                    label: language === "zh" ? "线索评分" : "Lead score",
                    value: runtime?.lead_score
                      ? scoreLabels[runtime.lead_score][language]
                      : language === "zh"
                        ? "待判断"
                        : "Pending",
                  },
                  {
                    label: language === "zh" ? "转人工" : "Human handoff",
                    value: runtime?.should_handoff
                      ? language === "zh"
                        ? "需要"
                        : "Needed"
                      : language === "zh"
                        ? "不需要"
                        : "Not needed",
                  },
                ].map((item) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={item.label}
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-container grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className="rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-xl"
          id="demo-agent"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {language === "zh" ? "E-commerce Product Support Agent" : "E-commerce Product Support Agent"}
              </p>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "公开演示模式" : "Public demo mode"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {language === "zh" ? "在线" : "Live"}
            </span>
          </div>

          <div className="mt-4 h-[430px] space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
            {messages.map((message) => (
              <div
                className={`flex ${
                  message.role === "visitor" ? "justify-end" : "justify-start"
                }`}
                key={message.id}
              >
                <p
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "visitor"
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                disabled={isSending}
                key={question}
                onClick={() => void sendMessage(question)}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <input
              className="min-h-12 flex-1 rounded-lg border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              onChange={(event) => setInput(event.target.value)}
              placeholder={localizedCopy.input}
              value={input}
            />
            <button
              className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSending}
              type="submit"
            >
              {isSending ? localizedCopy.sending : localizedCopy.send}
            </button>
          </form>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/8 p-6">
          <h2 className="text-xl font-semibold">
            {language === "zh" ? "安全边界" : "Safety boundary"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {localizedCopy.caution}
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-200">
            <p>
              {language === "zh"
                ? "可处理：产品咨询、购买建议、物流说明、退换货政策、人工转接。"
                : "Can handle: product questions, purchase guidance, shipping notes, return policies, and human handoff."}
            </p>
            <p>
              {language === "zh"
                ? "不声明：实时库存、真实订单追踪、保证销售结果，除非已经接入对应系统。"
                : "Will not claim: real-time inventory, live order tracking, or guaranteed sales results unless the matching integration exists."}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
