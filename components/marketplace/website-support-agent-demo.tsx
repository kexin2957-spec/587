"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import type { DemoAgent, DemoFaqItem } from "@/lib/marketplace/demo-data";
import { getLocalizedAgent } from "@/lib/marketplace/localization";

type ChatMessage = {
  id: string;
  role: "agent" | "visitor";
  text: string;
};

type LeadFormState = {
  company: string;
  email: string;
  inquiry: string;
  name: string;
};

const initialLeadForm: LeadFormState = {
  company: "",
  email: "",
  inquiry: "",
  name: "",
};

const copy = {
  en: {
    askPlaceholder: "Ask about services, pricing, booking, or setup...",
    chatTitle: "Live website support agent",
    company: "Company",
    email: "Email",
    inquiry: "Inquiry",
    intro:
      "This is a working delivery demo. It answers from approved business FAQ patterns and can collect a qualified visitor lead.",
    leadFailed: "The lead could not be submitted. Please try again.",
    leadSubmitted:
      "Lead captured. The team can now review the visitor inquiry in admin purchase requests.",
    leadTitle: "Lead capture",
    name: "Name",
    required: "Name, valid email, and inquiry are required.",
    sampleTitle: "Try a sample question",
    send: "Send",
    submitLead: "Submit lead",
    submitting: "Submitting...",
    welcome:
      "Hi, I can answer common questions about services, pricing ranges, consultations, and next steps. I can also collect your details for the team.",
  },
  zh: {
    askPlaceholder: "询问服务、价格、预约或配置问题...",
    chatTitle: "在线销售客服获客 Agent",
    company: "公司",
    email: "邮箱",
    inquiry: "咨询内容",
    intro:
      "这是一个可运行的交付版 Demo。它会基于已批准的业务 FAQ 规则回答，并可以收集合格访客线索。",
    leadFailed: "线索提交失败，请稍后再试。",
    leadSubmitted: "线索已收集。团队可以在后台购买请求中查看这条访客咨询。",
    leadTitle: "线索收集",
    name: "姓名",
    required: "请填写姓名、有效邮箱和咨询内容。",
    sampleTitle: "体验示例问题",
    send: "发送",
    submitLead: "提交线索",
    submitting: "提交中...",
    welcome:
      "你好，我可以回答关于服务、价格范围、预约咨询和下一步的问题，也可以收集你的信息交给团队跟进。",
  },
} as const;

export function WebsiteSupportAgentDemo({
  agent,
  samples,
}: {
  agent: DemoAgent;
  samples: DemoFaqItem[];
}) {
  const { language } = useTranslation();
  const localizedAgent = getLocalizedAgent(agent, language);
  const localizedCopy = copy[language];
  const [input, setInput] = useState("");
  const [leadForm, setLeadForm] = useState<LeadFormState>(initialLeadForm);
  const [leadError, setLeadError] = useState("");
  const [leadStatus, setLeadStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      text: localizedCopy.welcome,
    },
  ]);

  const sampleQuestions = useMemo(
    () => samples.slice(0, 6).map((sample) => sample.question),
    [samples],
  );

  function sendQuestion(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const answer = getAgentAnswer(trimmed, language);
    setMessages((current) => [
      ...current,
      {
        id: `visitor-${Date.now()}`,
        role: "visitor",
        text: trimmed,
      },
      {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: answer,
      },
    ]);
    setInput("");
    setLeadForm((current) => ({
      ...current,
      inquiry: current.inquiry || trimmed,
    }));
  }

  async function submitLead() {
    setLeadError("");

    if (
      !leadForm.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(leadForm.email) ||
      !leadForm.inquiry.trim()
    ) {
      setLeadError(localizedCopy.required);
      return;
    }

    setLeadStatus("submitting");

    try {
      const response = await fetch("/api/purchase-requests", {
        body: JSON.stringify({
          agent_id: agent.slug,
          agent_slug: agent.slug,
          company: leadForm.company,
          email: leadForm.email,
          language,
          message: `[Website chatbot visitor lead]\n${leadForm.inquiry}`,
          name: leadForm.name,
          preferred_contact_method: "email",
          request_type: "buy_agent",
          source_page: `/agents/${agent.slug}#live-demo`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Lead submit failed.");
      }

      setLeadStatus("success");
      setLeadForm(initialLeadForm);
    } catch {
      setLeadStatus("error");
    }
  }

  return (
    <section id="live-demo" className="premium-card overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {localizedAgent.title}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          {localizedCopy.chatTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {localizedCopy.intro}
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="grid min-h-[520px] grid-rows-[auto_1fr_auto] border-slate-200 lg:border-r">
          <div className="border-b border-slate-100 bg-white px-5 py-4">
            <p className="text-sm font-semibold text-slate-950">
              {localizedCopy.sampleTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sampleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendQuestion(question)}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:border-blue-200 hover:bg-blue-100"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto bg-slate-50/80 p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "visitor"
                    ? "ml-auto max-w-[82%] rounded-2xl rounded-br-sm bg-blue-700 p-3 text-sm leading-6 text-white shadow-sm"
                    : "max-w-[86%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-slate-200 bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendQuestion(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={localizedCopy.askPlaceholder}
              className="polished-input h-11 flex-1 px-3 text-sm text-slate-950"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              {localizedCopy.send}
            </button>
          </form>
        </div>

        <aside className="bg-white p-5">
          <h3 className="text-base font-semibold text-slate-950">
            {localizedCopy.leadTitle}
          </h3>
          <div className="mt-4 grid gap-3">
            <LeadInput
              label={localizedCopy.name}
              value={leadForm.name}
              onChange={(value) =>
                setLeadForm((current) => ({ ...current, name: value }))
              }
            />
            <LeadInput
              label={localizedCopy.email}
              type="email"
              value={leadForm.email}
              onChange={(value) =>
                setLeadForm((current) => ({ ...current, email: value }))
              }
            />
            <LeadInput
              label={localizedCopy.company}
              value={leadForm.company}
              onChange={(value) =>
                setLeadForm((current) => ({ ...current, company: value }))
              }
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-700">
                {localizedCopy.inquiry}
              </span>
              <textarea
                value={leadForm.inquiry}
                onChange={(event) =>
                  setLeadForm((current) => ({
                    ...current,
                    inquiry: event.target.value,
                  }))
                }
                className="polished-input min-h-28 px-3 py-2 text-slate-950"
              />
            </label>
          </div>

          {leadError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {leadError}
            </p>
          ) : null}

          {leadStatus === "success" ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {localizedCopy.leadSubmitted}
            </p>
          ) : null}

          {leadStatus === "error" ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {localizedCopy.leadFailed}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submitLead}
            disabled={leadStatus === "submitting"}
            className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {leadStatus === "submitting"
              ? localizedCopy.submitting
              : localizedCopy.submitLead}
          </button>
        </aside>
      </div>
    </section>
  );
}

function LeadInput({
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
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="polished-input h-11 px-3 text-slate-950"
      />
    </label>
  );
}

function getAgentAnswer(question: string, language: "en" | "zh") {
  const normalized = question.toLowerCase();

  if (language === "zh") {
    if (/服务|提供|做什么/.test(question)) {
      return "我们可以根据网站已确认内容说明服务范围、适合场景和下一步。如果你告诉我想解决的问题，我可以先帮你判断适合的服务类型，再收集信息交给团队。";
    }

    if (/费用|价格|多少钱|报价/.test(question)) {
      return "费用取决于服务范围、配置复杂度和是否需要集成。我可以说明公开价格范围，但不会编造固定报价。你可以留下预算、时间计划和需求，团队会给出正式评估。";
    }

    if (/预约|咨询|通话|见面/.test(question)) {
      return "可以。请留下姓名、邮箱、公司和简短需求说明，团队会确认可预约时间。如果已配置日历链接，我也可以引导你直接预约。";
    }

    if (/小型|小企业|小公司|本地/.test(question)) {
      return "支持。这个 Agent 特别适合小型企业、顾问、服务商家和本地业务先覆盖常见咨询，再把高意向线索转交人工跟进。";
    }

    if (/选择|合适|推荐|哪/.test(question)) {
      return "可以先帮你缩小范围。请告诉我你的业务类型、希望达成的结果、已有网站或文档、预算范围和时间计划，我会整理成清晰需求交给团队。";
    }

    if (/信息|资料|需要|提供/.test(question)) {
      return "最有帮助的信息包括姓名、邮箱、公司、网站地址、想解决的问题、相关页面或文档、预算范围和时间计划。你可以先提供当前方便分享的内容。";
    }

    if (/英文|中文|语言/.test(question)) {
      return "支持英文和中文。正式交付时可以分别设置两种语言的品牌语气、术语和人工转交流程。";
    }

    return "我可以先根据已确认的 FAQ 和服务说明回答。如果这个问题涉及具体报价、隐私数据或业务承诺，我会建议留下联系方式，让团队人工确认后回复。";
  }

  if (/service|offer|do you do|provide/.test(normalized)) {
    return "I can explain the approved services on this website, summarize what each option is best for, and guide you to the right next step. Share your goal and I can help qualify the inquiry for the team.";
  }

  if (/cost|price|pricing|quote|budget/.test(normalized)) {
    return "Pricing depends on scope, setup complexity, and integrations. I can share published ranges, but I will not invent a fixed quote. Leave your goal, budget range, and timeline so the team can review it properly.";
  }

  if (/book|consult|call|appointment|meeting/.test(normalized)) {
    return "Yes. Share your name, email, company, and a short note about what you need. The team can confirm availability, or this agent can point to a calendar link when booking integration is configured.";
  }

  if (/small business|startup|local|consultant/.test(normalized)) {
    return "Yes. This agent is designed for small businesses, consultants, agencies, SaaS websites, and local service teams that need first-line support and qualified lead capture.";
  }

  if (/choose|right service|recommend|which/.test(normalized)) {
    return "I can help narrow it down. Tell me your business type, desired outcome, existing website or documents, budget range, and timeline. I can then prepare a structured inquiry for the team.";
  }

  if (/information|info|need from me|provide/.test(normalized)) {
    return "The most useful details are your name, email, company, website URL, the problem you want to solve, relevant pages or documents, budget range, and timeline. Share only what you are comfortable providing.";
  }

  if (/english|chinese|language|bilingual/.test(normalized)) {
    return "English and Chinese are supported. During delivery, brand tone, terminology, and handoff rules can be configured separately for each language.";
  }

  return "I can answer from approved FAQ and service content. If the question needs a specific quote, private data, or a business commitment, I will collect contact details and route it to the team for human follow-up.";
}
