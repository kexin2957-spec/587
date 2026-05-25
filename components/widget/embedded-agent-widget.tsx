"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import type { AppLanguage } from "@/lib/i18n/language";

type Config = {
  agent_slug: string;
  avatar_url?: string | null;
  business_description_en?: string | null;
  business_description_zh?: string | null;
  business_hours?: string | null;
  business_name: string;
  company_introduction: string;
  contact_email: string;
  contact_information?: string | null;
  faq: Array<{ answer: string; question: string }>;
  id?: string;
  offline_message: string;
  primary_color: string;
  pricing_ranges?: string | null;
  pricing_ranges_en?: string | null;
  pricing_ranges_zh?: string | null;
  services_or_products_en?: string | null;
  services_or_products_zh?: string | null;
  services_products: string;
  welcome_message: string;
  welcome_message_en?: string | null;
  welcome_message_zh?: string | null;
  widget_position: "bottom_left" | "bottom_right";
};

type ChatMessage = {
  role: "agent" | "visitor";
  text: string;
};

type LeadForm = {
  company: string;
  email: string;
  inquiry: string;
  name: string;
  phone: string;
};

const fallbackConfig: Config = {
  agent_slug: "website-customer-support-agent",
  avatar_url: null,
  business_hours: "Mon-Fri, 9:00-18:00",
  business_name: "AI Agent",
  company_introduction:
    "This hosted AI agent answers approved business questions and collects follow-up details.",
  contact_email: "",
  contact_information: "Support contact pending",
  faq: [],
  offline_message:
    "Leave your contact details and our team will follow up soon.",
  primary_color: "#2563eb",
  services_products:
    "Website support, product questions, pricing guidance, booking requests, and lead capture.",
  welcome_message:
    "Hi, I can answer questions and help route your request to the team.",
  widget_position: "bottom_right",
};

function getDemoWidgetConfig(agentId: string, language: AppLanguage): Config {
  const isEcommerce = agentId === "ecommerce-product-support-agent";
  const businessName = isEcommerce
    ? language === "zh"
      ? "Demo 电商店铺"
      : "Demo Online Store"
    : language === "zh"
      ? "Demo 服务公司"
      : "Demo Service Company";
  const ecommerceWelcome =
    language === "zh"
      ? "你好，我可以帮你了解商品、物流、退换货政策，也可以收集购买意向。"
      : "Hi, I can help with product questions, shipping, returns, and purchase intent.";
  const websiteWelcome =
    language === "zh"
      ? "你好，我可以回答网站访客的常见问题，介绍服务，并收集线索。"
      : "Hi, I can answer visitor questions, explain services, and capture leads.";

  return {
    ...fallbackConfig,
    agent_slug: agentId,
    business_description_en: isEcommerce
      ? "A demo commerce assistant for product questions, shipping, returns, and purchase-intent capture."
      : "A demo website sales assistant for service questions, qualification, and lead capture.",
    business_description_zh: isEcommerce
      ? "用于商品咨询、物流退换货说明和购买意向收集的演示电商 Agent。"
      : "用于服务咨询、客户初筛和线索收集的演示网站销售 Agent。",
    business_name: businessName,
    company_introduction: isEcommerce
      ? "Demo store content for product support and purchase-intent capture."
      : "Demo business content for website sales support and lead capture.",
    contact_email: "demo@ai-agent-marketplace.local",
    contact_information: "demo@ai-agent-marketplace.local",
    faq: isEcommerce
      ? [
          {
            question: "Which product is best for me?",
            answer:
              "Tell me your use case, budget, and preferences. I can suggest a direction from the configured product notes.",
          },
          {
            question: "What is your return policy?",
            answer:
              "I can explain the configured policy and collect details for the store team when a case needs review.",
          },
        ]
      : [
          {
            question: "What services do you offer?",
            answer:
              "I can explain the main services, answer common questions, and collect contact details for follow-up.",
          },
          {
            question: "How much does it cost?",
            answer:
              "Pricing depends on scope. I can collect requirements before the team prepares an exact quote.",
          },
        ],
    id: `demo-${agentId}`,
    primary_color: isEcommerce ? "#059669" : "#2563eb",
    services_or_products_en: isEcommerce
      ? "Product recommendations, shipping FAQ, return policy help, order-support handoff, and purchase-intent capture."
      : "Website support, service explanation, pricing guidance, consultation booking, and lead capture.",
    services_or_products_zh: isEcommerce
      ? "商品推荐、物流咨询、退换货政策说明、订单问题转人工和购买意向收集。"
      : "网站客服、服务介绍、价格范围说明、咨询预约和销售线索收集。",
    services_products: isEcommerce
      ? "Product recommendations, shipping FAQ, return policy help, order-support handoff, and purchase-intent capture."
      : "Website support, service explanation, pricing guidance, consultation booking, and lead capture.",
    welcome_message: isEcommerce ? ecommerceWelcome : websiteWelcome,
    welcome_message_en: isEcommerce
      ? "Hi, I can help with product questions, shipping, returns, and purchase intent."
      : "Hi, I can answer visitor questions, explain services, and capture leads.",
    welcome_message_zh: isEcommerce
      ? "你好，我可以帮你了解商品、物流、退换货政策，也可以收集购买意向。"
      : "你好，我可以回答网站访客的常见问题，介绍服务，并收集线索。",
  };
}

function getStarterQuestions(agentId: string, language: AppLanguage) {
  if (agentId === "ecommerce-product-support-agent") {
    return language === "zh"
      ? ["哪款商品适合我？", "支持包邮吗？", "退货政策是什么？", "可以查询订单吗？"]
      : [
          "Which product is best for me?",
          "Do you offer free shipping?",
          "What is your return policy?",
          "Can I track my order?",
        ];
  }

  return language === "zh"
    ? ["你们提供哪些服务？", "费用是多少？", "可以预约咨询吗？", "可以做定制集成吗？"]
    : [
        "What services do you offer?",
        "How much does it cost?",
        "Can I book a consultation?",
        "Can you build a custom integration?",
      ];
}

function getAgentSubtitle(agentId: string, language: AppLanguage) {
  if (agentId === "ecommerce-product-support-agent") {
    return language === "zh"
      ? "电商产品客服 Agent"
      : "E-commerce Product Support Agent";
  }

  return language === "zh"
    ? "网站销售客服获客 Agent"
    : "Website Sales & Lead Capture Agent";
}

function getLeadSuccessMessage(agentId: string, language: AppLanguage) {
  if (agentId === "ecommerce-product-support-agent") {
    return language === "zh"
      ? "谢谢。你的商品咨询已记录，店铺团队会继续跟进。"
      : "Thanks. I captured your product inquiry and the store team can follow up.";
  }

  return language === "zh"
    ? "谢谢。你的信息已记录，团队会继续跟进。"
    : "Thanks. I captured your details and the team can follow up.";
}

function getLicenseErrorMessage(language: AppLanguage) {
  return language === "zh"
    ? "该 AI Agent 未授权在当前网站使用。"
    : "This AI agent is not licensed for this website.";
}

function getWidgetCopy(language: AppLanguage) {
  return language === "zh"
    ? {
        askPlaceholder: "输入你的问题...",
        close: "关闭",
        company: "公司 / 网站",
        email: "邮箱",
        error: "请填写姓名、邮箱和咨询内容。",
        followUpTitle: "留下信息方便团队跟进",
        inquiry: "你需要什么帮助？",
        name: "姓名",
        send: "发送",
        sendToTeam: "发送给团队",
        submitted: "已提交",
        submitting: "提交中...",
        toggle: "打开或关闭聊天",
      }
    : {
        askPlaceholder: "Ask a question...",
        close: "Close",
        company: "Company / website",
        email: "Email",
        error: "Please add your name, email, and inquiry.",
        followUpTitle: "Share your details for follow-up",
        inquiry: "What do you need?",
        name: "Name",
        send: "Send",
        sendToTeam: "Send to team",
        submitted: "Submitted",
        submitting: "Submitting...",
        toggle: "Toggle chat",
      };
}

export function EmbeddedAgentWidget({
  agentId,
  demoMode = false,
  licenseKey,
  orderNumber,
  parentDomain,
  widgetAuthToken,
}: {
  agentId: string;
  demoMode?: boolean;
  licenseKey: string | null;
  orderNumber: string | null;
  parentDomain: string | null;
  widgetAuthToken: string | null;
}) {
  const { language } = useTranslation();
  const text = getWidgetCopy(language);
  const demoConfig = useMemo(
    () => getDemoWidgetConfig(agentId, language),
    [agentId, language],
  );
  const starterQuestions = useMemo(
    () => getStarterQuestions(agentId, language),
    [agentId, language],
  );
  const [config, setConfig] = useState<Config>(() => ({
    ...(demoMode ? demoConfig : fallbackConfig),
    agent_slug: agentId,
  }));
  const [resolvedOrderNumber, setResolvedOrderNumber] = useState(orderNumber);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      text: demoMode ? demoConfig.welcome_message : fallbackConfig.welcome_message,
    },
  ]);
  const [leadForm, setLeadForm] = useState<LeadForm>({
    company: "",
    email: "",
    inquiry: "",
    name: "",
    phone: "",
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStatus, setLeadStatus] = useState<
    "error" | "idle" | "submitting" | "success"
  >("idle");
  const theme = useMemo(
    () => ({
      backgroundColor: config.primary_color || "#2563eb",
      borderColor: config.primary_color || "#2563eb",
    }),
    [config.primary_color],
  );

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!licenseKey) {
        if (demoMode) {
          setLicenseError("");
          setConfig(demoConfig);
          setResolvedOrderNumber(orderNumber ?? "demo");
          setMessages([{ role: "agent", text: demoConfig.welcome_message }]);
          return;
        }

        setLicenseError(getLicenseErrorMessage(language));
        return;
      }

      try {
        const response = await fetch("/api/widget/session", {
          body: JSON.stringify({
            agent_id: agentId,
            license_key: licenseKey,
            language,
            order_number: orderNumber,
            parent_domain: parentDomain,
            widget_auth_token: widgetAuthToken,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const result = (await response.json()) as {
          data?: { config?: Config; order_number?: string | null };
          message_en?: string;
          message_zh?: string;
        };

        if (!active) {
          return;
        }

        if (!response.ok || !result.data?.config) {
          setLicenseError(
            language === "zh"
              ? result.message_zh || getLicenseErrorMessage(language)
              : result.message_en || getLicenseErrorMessage(language),
          );
          return;
        }

        setLicenseError("");
        setConfig(result.data.config);
        setResolvedOrderNumber(result.data.order_number ?? orderNumber);
        setMessages([{ role: "agent", text: result.data.config.welcome_message }]);
      } catch {
        setLicenseError(getLicenseErrorMessage(language));
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [
    agentId,
    demoConfig,
    demoMode,
    language,
    licenseKey,
    orderNumber,
    parentDomain,
    widgetAuthToken,
  ]);

  async function sendVisitorMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    const nextVisitorMessages: ChatMessage[] = [
      ...messages,
      { role: "visitor", text: trimmed },
    ];

    setMessages(nextVisitorMessages);
    setInput("");

    try {
      const response = await fetch("/api/agent/chat", {
        body: JSON.stringify({
          agent_id: agentId,
          language,
          license_key: licenseKey,
          order_id: resolvedOrderNumber,
          page_url: parentDomain,
          session_id: sessionId,
          visitor_message: trimmed,
          visitor_metadata: {},
          widget_auth_token: widgetAuthToken,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        data?: {
          assistant_message: string;
          session_id: string;
          should_collect_lead: boolean;
          should_handoff: boolean;
        };
        message_en?: string;
        message_zh?: string;
      };

      if (!response.ok || !result.data?.assistant_message) {
        setLicenseError(
          language === "zh"
            ? result.message_zh || getLicenseErrorMessage(language)
            : result.message_en || getLicenseErrorMessage(language),
        );
        return;
      }

      setSessionId(result.data.session_id);
      const nextMessages: ChatMessage[] = [
        ...nextVisitorMessages,
        { role: "agent", text: result.data.assistant_message },
      ];

      setMessages(nextMessages);

      if (
        result.data.should_collect_lead ||
        result.data.should_handoff ||
        nextMessages.filter((item) => item.role === "visitor").length >= 2
      ) {
        setShowLeadForm(true);
        setLeadForm((current) => ({
          ...current,
          inquiry: current.inquiry || trimmed,
        }));
      }
    } catch {
      setMessages([
        ...nextVisitorMessages,
        {
          role: "agent",
          text:
            language === "zh"
              ? "当前暂时无法连接 AI Agent。请留下联系方式，团队会跟进。"
              : "The AI agent is temporarily unavailable. Please leave your contact details and the team can follow up.",
        },
      ]);
      setShowLeadForm(true);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leadForm.name.trim() || !leadForm.email.trim() || !leadForm.inquiry.trim()) {
      setLeadStatus("error");
      return;
    }

    setLeadStatus("submitting");

    try {
      const response = await fetch("/api/leads", {
        body: JSON.stringify({
          agent_slug: agentId,
          conversation_summary: `Widget session ${sessionId ?? "unknown"}: ${leadForm.inquiry}`,
          customer_config_id: config.id,
          inquiry: leadForm.inquiry,
          license_key: licenseKey,
          order_number: resolvedOrderNumber,
          parent_domain: parentDomain,
          transcript: messages,
          visitor_company: leadForm.company,
          visitor_email: leadForm.email,
          visitor_name: leadForm.name,
          visitor_phone: leadForm.phone,
          widget_auth_token: widgetAuthToken,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Lead failed.");
      }

      setLeadStatus("success");
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: getLeadSuccessMessage(agentId, language),
        },
      ]);
    } catch {
      setLeadStatus("error");
    }
  }

  return (
    <div className="min-h-[100svh] bg-transparent p-2 font-sans text-slate-950 sm:p-3">
      {licenseError ? (
        <div className="grid min-h-screen place-items-center bg-white p-5">
          <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-800">
              This AI agent is not licensed for this website.
            </p>
            <p className="mt-2 text-sm font-semibold text-red-800">
              {getLicenseErrorMessage("zh")}
            </p>
          </div>
        </div>
      ) : null}

      {!licenseError ? (
        <>
          <button
            aria-label={text.toggle}
            className={`fixed bottom-3 grid h-14 w-14 place-items-center rounded-full text-lg font-semibold text-white shadow-2xl sm:bottom-4 ${
              config.widget_position === "bottom_left" ? "left-3 sm:left-4" : "right-3 sm:right-4"
            }`}
            onClick={() => setIsOpen((current) => !current)}
            style={theme}
            type="button"
          >
            AI
          </button>

          {isOpen ? (
            <section
              className={`fixed bottom-20 flex max-h-[calc(100svh-6rem)] w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:bottom-24 sm:w-[min(390px,calc(100vw-24px))] ${
                config.widget_position === "bottom_left" ? "left-2 sm:left-3" : "right-2 sm:right-3"
              }`}
            >
              <header className="flex items-center gap-3 border-b border-slate-100 p-3 sm:p-4">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                  style={theme}
                >
                  {config.avatar_url ? " " : "AI"}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold text-slate-950">
                    {config.business_name}
                  </h1>
                  <p className="truncate text-xs text-slate-500">
                    {getAgentSubtitle(agentId, language)}
                  </p>
                </div>
                <button
                  className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  {text.close}
                </button>
              </header>

              <div className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
                <div className="grid gap-3">
                  {messages.map((message, index) => (
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                        message.role === "agent"
                          ? "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                          : "ml-auto rounded-br-sm text-white"
                      }`}
                      key={`${message.role}-${index}`}
                      style={message.role === "visitor" ? theme : undefined}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {starterQuestions.map((question) => (
                    <button
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-blue-200"
                      key={question}
                      onClick={() => void sendVisitorMessage(question)}
                      type="button"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                {showLeadForm ? (
                  <form
                    className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                    onSubmit={submitLead}
                  >
                    <h2 className="text-sm font-semibold text-slate-950">
                      {text.followUpTitle}
                    </h2>
                    <div className="mt-3 grid gap-2">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        onChange={(event) =>
                          setLeadForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder={text.name}
                        value={leadForm.name}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        onChange={(event) =>
                          setLeadForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder={text.email}
                        type="email"
                        value={leadForm.email}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        onChange={(event) =>
                          setLeadForm((current) => ({
                            ...current,
                            company: event.target.value,
                          }))
                        }
                        placeholder={text.company}
                        value={leadForm.company}
                      />
                      <textarea
                        className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        onChange={(event) =>
                          setLeadForm((current) => ({
                            ...current,
                            inquiry: event.target.value,
                          }))
                        }
                        placeholder={text.inquiry}
                        value={leadForm.inquiry}
                      />
                      <button
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        disabled={leadStatus === "submitting" || leadStatus === "success"}
                        style={theme}
                        type="submit"
                      >
                        {leadStatus === "submitting"
                          ? text.submitting
                          : leadStatus === "success"
                            ? text.submitted
                            : text.sendToTeam}
                      </button>
                      {leadStatus === "error" ? (
                        <p className="text-xs font-medium text-red-600">
                          {text.error}
                        </p>
                      ) : null}
                    </div>
                  </form>
                ) : null}
              </div>

              <form
                className="flex gap-2 border-t border-slate-100 bg-white p-2 sm:p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendVisitorMessage(input);
                }}
              >
                <input
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={text.askPlaceholder}
                  value={input}
                />
                <button
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={theme}
                  type="submit"
                >
                  {text.send}
                </button>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
