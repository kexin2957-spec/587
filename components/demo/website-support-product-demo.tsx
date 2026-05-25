"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

type RuntimeIntent =
  | "booking_request"
  | "custom_project_request"
  | "human_handoff"
  | "other"
  | "pricing_inquiry"
  | "service_inquiry"
  | "support_question";

type LeadScore = "cold" | "hot" | "invalid" | "warm";
type LeadStatus = "contacted" | "new" | "qualified";

type ChatMessage = {
  id: string;
  role: "agent" | "visitor";
  text: string;
};

type LeadForm = {
  company: string;
  email: string;
  name: string;
  need: string;
  phone: string;
};

type DashboardLead = {
  company: string;
  createdAt: string;
  email: string;
  id: string;
  intent: RuntimeIntent;
  name: string;
  needsHuman: boolean;
  score: LeadScore;
  status: LeadStatus;
  summary: string;
};

type ChatApiData = {
  assistant_message: string;
  intent: RuntimeIntent;
  lead_score?: LeadScore;
  session_id: string;
  should_collect_lead: boolean;
  should_handoff: boolean;
  suggested_follow_up_questions?: string[];
};

const initialLeadForm: LeadForm = {
  company: "",
  email: "",
  name: "",
  need: "",
  phone: "",
};

const copy = {
  en: {
    agentName: "BrightPath Website Assistant",
    analytics: "Runtime results",
    badge: "Live server-side demo",
    book: "Book consultation",
    cold: "Cold",
    company: "Company",
    contact: "Contact",
    demoIntro:
      "This demo uses the same backend runtime as the hosted agent. The frontend sends visitor messages to the server and only receives safe responses, intent, handoff, and lead status.",
    docs: "Delivery documentation",
    email: "Email",
    error:
      "The demo runtime is not responding right now. Please try again in a moment.",
    faqTitle: "Common questions this agent can handle",
    formError: "Please enter your name, email, and inquiry summary.",
    formSuccess:
      "Lead submitted. The admin lead dashboard can now review it with the server-side classification.",
    handoff: "Human handoff",
    hot: "Hot",
    inputPlaceholder: "Ask about services, pricing, setup, or custom integrations...",
    leadCapture: "Lead capture",
    leadScore: "Lead score",
    leads: "Collected leads",
    name: "Name",
    need: "Inquiry summary",
    openListing: "View product page",
    phone: "Phone",
    pricing: "Pricing guidance",
    question1: "What services do you offer?",
    question2: "How much does setup cost?",
    question3: "Can I book a consultation?",
    question4: "I need CRM integration and a custom workflow.",
    runtimeNote:
      "Sensitive runtime instructions, lead scoring rules, private workflow logic, and credentials stay on the server.",
    send: "Send",
    services: "Customer intake, website sales support, FAQ answers, lead capture, and setup handoff.",
    setup: "Installable hosted widget with embed code, customer dashboard, and delivery guide.",
    status: "Status",
    submitLead: "Submit lead",
    submitting: "Submitting...",
    subtitle:
      "A website sales and lead capture agent installed on a service business site.",
    title: "Try the Website Sales & Lead Capture Agent",
    totalLeads: "Total leads",
    warm: "Warm",
    whatItDoes: "What this customer receives",
  },
  zh: {
    agentName: "BrightPath 网站客服助手",
    analytics: "运行时结果",
    badge: "后端实时 Demo",
    book: "预约咨询",
    cold: "冷线索",
    company: "公司",
    contact: "联系方式",
    demoIntro:
      "这个 Demo 使用与托管 Agent 相同的后端运行时。前端只把访客问题发送到服务器，并接收安全回复、意图、转人工和线索状态。",
    docs: "交付文档",
    email: "邮箱",
    error: "Demo 运行时暂时没有响应，请稍后再试。",
    faqTitle: "这个 Agent 可以处理的常见问题",
    formError: "请填写姓名、邮箱和咨询摘要。",
    formSuccess: "线索已提交。管理员线索后台可以查看后端分类结果。",
    handoff: "转人工",
    hot: "热线索",
    inputPlaceholder: "咨询服务、价格、安装或定制集成...",
    leadCapture: "线索收集",
    leadScore: "线索评分",
    leads: "已收集线索",
    name: "姓名",
    need: "咨询摘要",
    openListing: "查看商品页",
    phone: "电话",
    pricing: "价格引导",
    question1: "你们提供哪些服务？",
    question2: "安装费用是多少？",
    question3: "可以预约咨询吗？",
    question4: "我需要 CRM 集成和定制工作流。",
    runtimeNote: "敏感运行指令、线索评分规则、私有工作流逻辑和凭证都保留在服务器端。",
    send: "发送",
    services: "客户咨询接待、网站销售支持、FAQ 回答、线索收集和安装交接。",
    setup: "可安装的托管组件，包含嵌入代码、客户后台和交付指南。",
    status: "状态",
    submitLead: "提交线索",
    submitting: "提交中...",
    subtitle: "安装在服务型企业网站上的销售获客 Agent。",
    title: "体验 Website Sales & Lead Capture Agent",
    totalLeads: "总线索",
    warm: "暖线索",
    whatItDoes: "客户会收到什么",
  },
} as const;

const intentLabels: Record<RuntimeIntent, { en: string; zh: string }> = {
  booking_request: { en: "Booking request", zh: "预约请求" },
  custom_project_request: { en: "Custom project", zh: "定制项目" },
  human_handoff: { en: "Human handoff", zh: "转人工" },
  other: { en: "Other", zh: "其他" },
  pricing_inquiry: { en: "Pricing inquiry", zh: "价格咨询" },
  service_inquiry: { en: "Service inquiry", zh: "服务咨询" },
  support_question: { en: "Support question", zh: "支持问题" },
};

const scoreLabels: Record<LeadScore, { en: string; zh: string }> = {
  cold: { en: "Cold", zh: "冷线索" },
  hot: { en: "Hot", zh: "热线索" },
  invalid: { en: "Invalid", zh: "无效" },
  warm: { en: "Warm", zh: "暖线索" },
};

export function WebsiteSupportProductDemo() {
  const { language } = useTranslation();
  const localizedCopy = copy[language];
  const [leads, setLeads] = useState<DashboardLead[]>(() =>
    getSeedLeads(language),
  );

  const analytics = useMemo(
    () => ({
      handoffCount: leads.filter((lead) => lead.needsHuman).length,
      hotLeads: leads.filter((lead) => lead.score === "hot").length,
      totalLeads: leads.length,
    }),
    [leads],
  );

  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#12343b_48%,#172554_100%)]">
        <div className="app-container grid min-h-[620px] content-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_430px] lg:py-24">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              {localizedCopy.badge}
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {localizedCopy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              {localizedCopy.subtitle}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              {localizedCopy.demoIntro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo-agent"
                className="rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100"
              >
                {localizedCopy.contact}
              </a>
              <Link
                href="/agents/website-customer-support-agent"
                className="rounded-lg border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              >
                {localizedCopy.openListing}
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <h2 className="text-lg font-semibold">{localizedCopy.whatItDoes}</h2>
            <div className="mt-5 grid gap-3">
              <PreviewPanel title={localizedCopy.leadCapture} body={localizedCopy.services} />
              <PreviewPanel title={localizedCopy.setup} body={localizedCopy.runtimeNote} />
              <PreviewPanel title={localizedCopy.docs} body={localizedCopy.setup} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 text-slate-950">
        <div className="app-container grid gap-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                {localizedCopy.analytics}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {localizedCopy.runtimeNote}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label={localizedCopy.totalLeads} value={analytics.totalLeads} />
              <MetricCard label={localizedCopy.hot} value={analytics.hotLeads} />
              <MetricCard label={localizedCopy.handoff} value={analytics.handoffCount} />
            </div>
          </div>

          <LeadDashboard leads={leads} />
        </div>
      </section>

      <section className="bg-slate-50 py-14 text-slate-950">
        <div className="app-container grid gap-8 lg:grid-cols-2">
          <DemoInfoPanel />
          <QuickQuestions />
        </div>
      </section>

      <WebsiteSupportWidget
        onLeadCaptured={(lead) => setLeads((current) => [lead, ...current])}
      />
    </div>
  );
}

function WebsiteSupportWidget({
  onLeadCaptured,
}: {
  onLeadCaptured: (lead: DashboardLead) => void;
}) {
  const { language } = useTranslation();
  const localizedCopy = copy[language];
  const localIdRef = useRef(0);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState<LeadForm>(initialLeadForm);
  const [leadStatus, setLeadStatus] = useState<
    "error" | "idle" | "submitting" | "success"
  >("idle");
  const [lastIntent, setLastIntent] = useState<RuntimeIntent>("other");
  const [lastScore, setLastScore] = useState<LeadScore>("cold");
  const [needsHuman, setNeedsHuman] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [shouldCollectLead, setShouldCollectLead] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      text:
        language === "zh"
          ? "你好，我可以介绍服务、价格范围、安装流程，也可以把高意向咨询转交给团队。"
          : "Hi, I can explain services, pricing ranges, setup, and route qualified inquiries to the team.",
    },
  ]);

  function getLocalId(prefix: string) {
    localIdRef.current += 1;
    return `${prefix}-${localIdRef.current}`;
  }

  async function sendMessage(nextMessage?: string) {
    const trimmed = (nextMessage ?? input).trim();
    if (!trimmed || isSending) return;

    const visitorMessage: ChatMessage = {
      id: getLocalId("visitor"),
      role: "visitor",
      text: trimmed,
    };

    setMessages((current) => [...current, visitorMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_id: "website-customer-support-agent",
          language,
          page_url:
            typeof window === "undefined" ? undefined : window.location.href,
          session_id: sessionId || undefined,
          visitor_message: trimmed,
          visitor_metadata: { source: "public_demo" },
        }),
      });
      const payload = (await response.json()) as {
        data?: ChatApiData;
        error?: string;
        ok?: boolean;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Runtime request failed");
      }

      setSessionId(payload.data.session_id);
      setLastIntent(payload.data.intent ?? "other");
      setLastScore(payload.data.lead_score ?? "cold");
      setNeedsHuman(payload.data.should_handoff);
      setShouldCollectLead(payload.data.should_collect_lead);
      setSuggestedQuestions(payload.data.suggested_follow_up_questions ?? []);

      setLeadForm((current) => ({
        ...current,
        need: current.need || trimmed,
      }));
      setMessages((current) => [
        ...current,
        {
          id: getLocalId("agent"),
          role: "agent",
          text: payload.data?.assistant_message ?? localizedCopy.error,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: getLocalId("agent-error"),
          role: "agent",
          text: localizedCopy.error,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead() {
    setLeadError("");

    if (!leadForm.name.trim() || !leadForm.email.includes("@") || !leadForm.need.trim()) {
      setLeadError(localizedCopy.formError);
      setLeadStatus("error");
      return;
    }

    setLeadStatus("submitting");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_id: "website-customer-support-agent",
          agent_slug: "website-customer-support-agent",
          company: leadForm.company,
          customer_email: leadForm.email,
          customer_name: leadForm.name,
          inquiry: leadForm.need,
          metadata: {
            demo_session_id: sessionId,
            source: "server_runtime_demo",
          },
          phone: leadForm.phone,
          source_page: "/demo/website-customer-support-agent",
        }),
      });

      if (!response.ok) {
        throw new Error("Lead request failed");
      }

      onLeadCaptured({
        company: leadForm.company || "-",
        createdAt: new Date().toLocaleString(language === "zh" ? "zh-CN" : "en-US"),
        email: leadForm.email,
        id: getLocalId("demo-lead"),
        intent: lastIntent,
        name: leadForm.name,
        needsHuman,
        score: lastScore,
        status: lastScore === "hot" ? "qualified" : "new",
        summary: leadForm.need,
      });
      setLeadForm(initialLeadForm);
      setLeadStatus("success");
    } catch {
      setLeadError(localizedCopy.error);
      setLeadStatus("error");
    }
  }

  const quickQuestions = [
    localizedCopy.question1,
    localizedCopy.question2,
    localizedCopy.question3,
    localizedCopy.question4,
  ];

  return (
    <section
      id="demo-agent"
      className="fixed bottom-5 right-5 z-40 w-[min(390px,calc(100vw-32px))] rounded-lg border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-950/25"
    >
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <p className="text-sm font-semibold">{localizedCopy.agentName}</p>
        <p className="mt-1 text-xs text-slate-300">{localizedCopy.badge}</p>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "agent"
                ? "mr-8 rounded-lg bg-slate-100 px-3 py-2 text-sm leading-6 text-slate-700"
                : "ml-8 rounded-lg bg-blue-600 px-3 py-2 text-sm leading-6 text-white"
            }
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickQuestions.slice(0, 2).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => void sendMessage(question)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void sendMessage();
            }}
            placeholder={localizedCopy.inputPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isSending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {localizedCopy.send}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <IntentBadge intent={lastIntent} />
          <ScoreBadge score={lastScore} />
          {needsHuman ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {localizedCopy.handoff}
            </span>
          ) : null}
        </div>

        {suggestedQuestions.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {suggestedQuestions.slice(0, 2).map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendMessage(question)}
                className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-left text-xs leading-5 text-blue-800 hover:bg-blue-100"
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}

        {shouldCollectLead ? (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <WidgetInput
                label={localizedCopy.name}
                value={leadForm.name}
                onChange={(value) => setLeadForm((current) => ({ ...current, name: value }))}
              />
              <WidgetInput
                label={localizedCopy.email}
                type="email"
                value={leadForm.email}
                onChange={(value) => setLeadForm((current) => ({ ...current, email: value }))}
              />
              <WidgetInput
                label={localizedCopy.company}
                value={leadForm.company}
                onChange={(value) => setLeadForm((current) => ({ ...current, company: value }))}
              />
              <WidgetInput
                label={localizedCopy.phone}
                value={leadForm.phone}
                onChange={(value) => setLeadForm((current) => ({ ...current, phone: value }))}
              />
            </div>
            <label className="mt-2 grid gap-1 text-xs font-medium text-slate-600">
              {localizedCopy.need}
              <textarea
                value={leadForm.need}
                onChange={(event) =>
                  setLeadForm((current) => ({ ...current, need: event.target.value }))
                }
                className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            {leadError ? (
              <p className="mt-2 text-xs font-medium text-red-600">{leadError}</p>
            ) : null}
            {leadStatus === "success" ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {localizedCopy.formSuccess}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void submitLead()}
              disabled={leadStatus === "submitting"}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {leadStatus === "submitting"
                ? localizedCopy.submitting
                : localizedCopy.submitLead}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DemoInfoPanel() {
  const { language } = useTranslation();
  const localizedCopy = copy[language];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">
        {localizedCopy.whatItDoes}
      </h2>
      <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-600">
        <InfoRow label={localizedCopy.leadCapture} value={localizedCopy.services} />
        <InfoRow label={localizedCopy.pricing} value={localizedCopy.setup} />
        <InfoRow label={localizedCopy.docs} value={localizedCopy.runtimeNote} />
      </div>
    </section>
  );
}

function QuickQuestions() {
  const { language } = useTranslation();
  const localizedCopy = copy[language];
  const questions = [
    localizedCopy.question1,
    localizedCopy.question2,
    localizedCopy.question3,
    localizedCopy.question4,
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">
        {localizedCopy.faqTitle}
      </h2>
      <div className="mt-5 grid gap-3">
        {questions.map((question) => (
          <div
            key={question}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            {question}
          </div>
        ))}
      </div>
    </section>
  );
}

function LeadDashboard({ leads }: { leads: DashboardLead[] }) {
  const { language } = useTranslation();
  const localizedCopy = copy[language];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-950">
          {localizedCopy.leads}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{localizedCopy.contact}</th>
              <th className="px-4 py-3">{localizedCopy.need}</th>
              <th className="px-4 py-3">{localizedCopy.leadScore}</th>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">{localizedCopy.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-slate-950">{lead.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.company}</p>
                </td>
                <td className="max-w-md px-4 py-4 align-top text-slate-600">
                  {lead.summary}
                </td>
                <td className="px-4 py-4 align-top">
                  <ScoreBadge score={lead.score} />
                </td>
                <td className="px-4 py-4 align-top">
                  <IntentBadge intent={lead.intent} />
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  {lead.needsHuman ? localizedCopy.handoff : lead.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviewPanel({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white p-4 text-slate-950">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: LeadScore }) {
  const { language } = useTranslation();
  const className =
    score === "hot"
      ? "bg-red-50 text-red-700"
      : score === "warm"
        ? "bg-amber-50 text-amber-700"
        : score === "cold"
          ? "bg-slate-100 text-slate-600"
          : "bg-zinc-100 text-zinc-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {scoreLabels[score][language]}
    </span>
  );
}

function IntentBadge({ intent }: { intent: RuntimeIntent }) {
  const { language } = useTranslation();

  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {intentLabels[intent]?.[language] ?? intentLabels.other[language]}
    </span>
  );
}

function WidgetInput({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "email" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function getSeedLeads(language: "en" | "zh"): DashboardLead[] {
  if (language === "zh") {
    return [
      {
        company: "蓝海设计",
        createdAt: new Date().toLocaleString("zh-CN"),
        email: "ops@blueharbor.ai",
        id: "seed-hot-zh",
        intent: "custom_project_request",
        name: "陈女士",
        needsHuman: true,
        score: "hot",
        status: "qualified",
        summary: "希望把网站咨询同步到 CRM，并支持预约跟进。",
      },
      {
        company: "本地维修商家",
        createdAt: new Date().toLocaleString("zh-CN"),
        email: "owner@local-service.ai",
        id: "seed-warm-zh",
        intent: "pricing_inquiry",
        name: "王先生",
        needsHuman: false,
        score: "warm",
        status: "contacted",
        summary: "询问网站客服 Agent 的基础安装费用。",
      },
    ];
  }

  return [
    {
      company: "Blue Harbor Design",
      createdAt: new Date().toLocaleString("en-US"),
      email: "ops@blueharbor.ai",
      id: "seed-hot-en",
      intent: "custom_project_request",
      name: "Mia Chen",
      needsHuman: true,
      score: "hot",
      status: "qualified",
      summary: "Wants website inquiries synced to CRM with booking support.",
    },
    {
      company: "Local Repair Co",
      createdAt: new Date().toLocaleString("en-US"),
      email: "owner@local-service.ai",
      id: "seed-warm-en",
      intent: "pricing_inquiry",
      name: "Daniel Lee",
      needsHuman: false,
      score: "warm",
      status: "contacted",
      summary: "Asked about basic setup pricing for a website support agent.",
    },
  ];
}
