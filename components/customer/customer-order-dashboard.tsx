"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CustomerAgentConfigEditor,
  type CustomerAgentConfig,
} from "@/components/customer/customer-agent-config-editor";
import { CustomerAgentTestPanel } from "@/components/customer/customer-agent-test-panel";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  LEAD_STATUSES,
  type DeliveryStatus,
  type LeadStatus,
  type LicenseStatus,
  type OrderPlanId,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/marketplace/constants";
import { demoAgents } from "@/lib/marketplace/demo-data";

type DeliveryPackage = {
  allowed_domains: string[];
  customer_dashboard_url: string | null;
  delivery_notes: string | null;
  documentation_url: string | null;
  embed_code: string | null;
  hosted_agent_url: string | null;
  license_key: string | null;
};

type AgentLicense = {
  allowed_domains: string[];
  expires_at: string | null;
  license_key: string;
  status: LicenseStatus;
  usage_count_monthly: number;
  usage_limit_monthly: number | null;
};

type UsageSummary = {
  blocked_domain: number;
  chat_message: number;
  lead_created: number;
  license_error: number;
  widget_load: number;
};

type Lead = {
  admin_note?: string | null;
  conversation_summary: string;
  created_at: string;
  id: string;
  inquiry: string;
  intent: string;
  lead_score: string;
  status: LeadStatus;
  visitor_company?: string | null;
  visitor_email: string;
  visitor_name: string;
  visitor_phone?: string | null;
};

type ConversationMessage = {
  content: string;
  created_at: string;
  id: string;
  intent: string | null;
  lead_score: string | null;
  metadata: Record<string, unknown>;
  role: "assistant" | "user";
  session_id: string;
};

type Conversation = {
  id: string;
  last_intent: string | null;
  last_lead_score: string | null;
  last_message_at: string;
  messages: ConversationMessage[];
  should_handoff: boolean;
  source_url: string | null;
  visitor_id: string;
};

type OrderSummary = {
  agent_slug: string;
  amount_cny: number | null;
  amount_usd: number | null;
  company_name: string | null;
  created_at: string;
  currency: "USD" | "CNY";
  customer_email: string;
  customer_name: string;
  delivery_status: DeliveryStatus;
  id: string;
  order_number: string;
  order_status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  plan_id: OrderPlanId;
  plan_name: string;
  website_url: string | null;
};

type DashboardResponse = {
  data?: {
    agent_license: AgentLicense | null;
    conversations: Conversation[];
    customer_config: CustomerAgentConfig | null;
    delivery_package: DeliveryPackage | null;
    leads: Lead[];
    order: OrderSummary;
    usage_summary: UsageSummary;
  };
  error?: string;
};

const copy = {
  en: {
    accessDenied:
      "Access denied. Open the secure dashboard link from your order confirmation or contact support.",
    allowedDomains: "Allowed domains",
    backToAgent: "View product page",
    blockedWarning:
      "The widget only works on the allowed domains shown here. If you need another website, request support before copying the code.",
    configuration: "Configuration",
    conversations: "Conversations",
    copy: "Copy",
    copied: "Copied",
    dashboard: "Customer Dashboard",
    description:
      "Manage your purchased agent, embed code, business configuration, leads, conversations, usage, documentation, and license security.",
    docs: "Documentation",
    embed: "Embed code",
    iframe: "Iframe fallback",
    install: "Install instructions",
    leadNote: "Customer note",
    leads: "Leads",
    license: "License",
    licenseMasked: "Masked license key",
    loading: "Loading customer dashboard...",
    noConversations: "No conversations yet. Test the widget or use the Test Agent panel.",
    noLeads: "No leads have been collected yet.",
    overview: "Overview",
    script: "Script embed",
    security: "Security",
    support: "Support contact",
    usage: "Usage",
    saveLead: "Save lead",
    sections: {
      config:
        "Edit business info, services/products, FAQ, pricing ranges, contact info, welcome message, widget color, and handoff rules.",
      conversations:
        "Review saved runtime sessions, transcripts, detected intent, lead score, and handoff flags.",
      docs: "Use these links for installation, setup, license policy, and support.",
      embed:
        "Copy either the script embed for a floating widget or the iframe fallback for a fixed page section.",
      leads:
        "Review captured leads, update status, and add a simple customer-side note.",
      overview:
        "Order, payment, delivery, license, allowed domains, and support at a glance.",
      security:
        "Customers receive hosted access and a license, not raw source code or private prompts.",
      usage:
        "Monitor widget loads, chat messages, leads created, license errors, and blocked domains.",
    },
  },
  zh: {
    accessDenied: "访问被拒绝。请使用订单确认页中的安全后台链接，或联系支持。",
    allowedDomains: "授权域名",
    backToAgent: "查看商品页",
    blockedWarning:
      "组件只会在这里列出的授权域名上正常工作。如需添加其他网站，请先联系支持。",
    configuration: "配置",
    conversations: "对话",
    copy: "复制",
    copied: "已复制",
    dashboard: "客户后台",
    description:
      "管理你购买的 Agent、嵌入代码、业务配置、线索、对话、用量、文档和 license 安全信息。",
    docs: "文档",
    embed: "嵌入代码",
    iframe: "Iframe 备用代码",
    install: "安装说明",
    leadNote: "客户备注",
    leads: "线索",
    license: "License",
    licenseMasked: "隐藏后的 License Key",
    loading: "正在加载客户后台...",
    noConversations: "还没有对话。可以先测试 widget 或使用 Test Agent 面板。",
    noLeads: "暂时还没有收集到线索。",
    overview: "概览",
    script: "Script 嵌入代码",
    security: "安全",
    support: "支持联系方式",
    usage: "用量",
    saveLead: "保存线索",
    sections: {
      config:
        "编辑业务信息、服务/商品、FAQ、价格范围、联系方式、欢迎语、组件颜色和转人工规则。",
      conversations: "查看运行时会话、消息记录、识别意图、线索评分和转人工标记。",
      docs: "这里包含安装、配置、license 政策和支持入口。",
      embed: "复制 script 代码安装悬浮组件，或使用 iframe 备用方案嵌入页面区域。",
      leads: "查看收集到的线索，更新状态，并添加简单客户备注。",
      overview: "快速查看订单、付款、交付、license、授权域名和支持信息。",
      security: "客户获得的是托管使用权限和 license，不是源码、私有提示词或内部流程。",
      usage: "监控组件加载、聊天消息、线索创建、license 错误和被拦截域名。",
    },
  },
} as const;

export function CustomerOrderDashboard({
  accessToken,
  orderId,
}: {
  accessToken: string;
  orderId: string;
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const [config, setConfig] = useState<CustomerAgentConfig | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deliveryPackage, setDeliveryPackage] = useState<DeliveryPackage | null>(null);
  const [agentLicense, setAgentLicense] = useState<AgentLicense | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadNotes, setLeadNotes] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [copyState, setCopyState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}?access_token=${encodeURIComponent(accessToken)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as DashboardResponse;

        if (!response.ok || !result.data) {
          throw new Error(result.error || text.accessDenied);
        }

        if (!active) {
          return;
        }

        setOrder(result.data.order);
        setAgentLicense(result.data.agent_license);
        setDeliveryPackage(result.data.delivery_package);
        setConfig(result.data.customer_config);
        setLeads(result.data.leads ?? []);
        setConversations(result.data.conversations ?? []);
        setUsageSummary(result.data.usage_summary);
        setLeadNotes(
          Object.fromEntries(
            (result.data.leads ?? []).map((lead) => [lead.id, lead.admin_note ?? ""]),
          ),
        );
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : text.accessDenied);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [accessToken, orderId, text.accessDenied]);

  const agent = order
    ? demoAgents.find((item) => item.slug === order.agent_slug)
    : null;
  const agentTitle = agent
    ? language === "zh"
      ? agent.titleZh || agent.titleEn
      : agent.titleEn || agent.titleZh
    : order?.agent_slug ?? "";
  const origin = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.origin),
    [],
  );
  const docsHref = order ? getAgentDocsHref(order.agent_slug) : "/docs/install-website-agent";
  const licenseKey = agentLicense?.license_key || deliveryPackage?.license_key || "";
  const hostedAgentUrl =
    deliveryPackage?.hosted_agent_url ||
    (order && licenseKey
      ? `${origin}/embed/agents/${order.agent_slug}?license=${encodeURIComponent(licenseKey)}`
      : "");
  const scriptCode =
    order && licenseKey
      ? `<script src="${origin}/widget.js" data-agent-id="${order.agent_slug}" data-license-key="${licenseKey}" async></script>`
      : "";
  const iframeCode = hostedAgentUrl
    ? `<iframe src="${hostedAgentUrl}" width="100%" height="600" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy" title="AI Agent Chat Widget"></iframe>`
    : "";

  async function copyText(id: string, value: string) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopyState(id);
    window.setTimeout(() => setCopyState(""), 1600);
  }

  async function updateLead(lead: Lead, updates: Partial<Lead>) {
    const response = await fetch("/api/leads", {
      body: JSON.stringify({
        access_token: accessToken,
        admin_note: updates.admin_note ?? leadNotes[lead.id] ?? "",
        id: lead.id,
        order_number: order?.order_number,
        status: updates.status ?? lead.status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as { data?: Lead };

    if (response.ok && result.data) {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? result.data as Lead : item)),
      );
    }
  }

  if (isLoading) {
    return <StateMessage>{text.loading}</StateMessage>;
  }

  if (error || !order) {
    return <StateMessage>{error || text.accessDenied}</StateMessage>;
  }

  const allowedDomains =
    agentLicense?.allowed_domains?.length
      ? agentLicense.allowed_domains
      : deliveryPackage?.allowed_domains ?? [];
  const supportContact =
    config?.contact_email || order.customer_email || "Support contact pending";
  const productHref = `/agents/${order.agent_slug}`;

  return (
    <main className="app-container py-8 sm:py-10">
      <section className="premium-card overflow-hidden p-4 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {text.overview}: {order.order_number}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {text.dashboard}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {text.description}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            <Link
              className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              href={productHref}
            >
              {text.backToAgent}
            </Link>
            <Link
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-800 hover:bg-blue-100"
              href="/custom-service#custom-request-form"
            >
              {language === "zh" ? "请求支持" : "Request support"}
            </Link>
          </div>
        </div>
      </section>

      <DashboardSection description={text.sections.overview} title={text.overview}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Order number" value={order.order_number} />
          <Metric label="Agent" value={agentTitle} />
          <Metric label="Plan" value={order.plan_name} />
          <Metric label="Order status" value={order.order_status} />
          <Metric label="Payment status" value={order.payment_status} />
          <Metric label="Delivery status" value={order.delivery_status} />
          <Metric label="License status" value={agentLicense?.status ?? "pending"} />
          <Metric label={text.support} value={supportContact} />
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">{text.allowedDomains}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {allowedDomains.length ? allowedDomains.join(", ") : "Pending"}
          </p>
        </div>
      </DashboardSection>

      <DashboardSection description={text.sections.embed} title={text.embed}>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {text.blockedWarning}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <CodePanel
            copied={copyState === "script"}
            label={text.script}
            value={scriptCode}
            onCopy={() => void copyText("script", scriptCode)}
          />
          <CodePanel
            copied={copyState === "iframe"}
            label={text.iframe}
            value={iframeCode}
            onCopy={() => void copyText("iframe", iframeCode)}
          />
        </div>
        <ol className="mt-4 grid gap-2 text-sm leading-6 text-slate-700">
          {getInstallSteps(language).map((step, index) => (
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" key={step}>
              <span className="font-semibold text-slate-950">{index + 1}. </span>
              {step}
            </li>
          ))}
        </ol>
      </DashboardSection>

      <DashboardSection description={text.sections.config} title={text.configuration}>
        {config ? (
          <>
            <CustomerAgentConfigEditor
              accessToken={accessToken}
              config={config}
              onSaved={(updatedConfig) => setConfig(updatedConfig)}
            />
            <div className="mt-5">
              <CustomerAgentTestPanel config={config} />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Configuration is pending.</p>
        )}
      </DashboardSection>

      <DashboardSection description={text.sections.leads} title={text.leads}>
        {leads.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Inquiry</th>
                  <th className="px-4 py-3">Intent</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">{text.leadNote}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">{lead.visitor_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{lead.visitor_email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {lead.visitor_phone || "No phone"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {lead.visitor_company || "No company"}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(lead.created_at, language)}
                      </p>
                    </td>
                    <td className="max-w-sm px-4 py-4 align-top text-slate-600">
                      <p>{lead.inquiry}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {lead.conversation_summary}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-600">{lead.intent}</td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill value={lead.lead_score} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <select
                        className="polished-input px-3 py-2 text-sm text-slate-950"
                        onChange={(event) =>
                          void updateLead(lead, { status: event.target.value as LeadStatus })
                        }
                        value={lead.status}
                      >
                        {LEAD_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="min-w-[220px] px-4 py-4 align-top">
                      <textarea
                        className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
                        onChange={(event) =>
                          setLeadNotes((current) => ({
                            ...current,
                            [lead.id]: event.target.value,
                          }))
                        }
                        value={leadNotes[lead.id] ?? ""}
                      />
                      <button
                        className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        onClick={() =>
                          void updateLead(lead, {
                            admin_note: leadNotes[lead.id] ?? "",
                          })
                        }
                        type="button"
                      >
                        {text.saveLead}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>{text.noLeads}</EmptyState>
        )}
      </DashboardSection>

      <DashboardSection description={text.sections.conversations} title={text.conversations}>
        {conversations.length ? (
          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <details
                className="rounded-2xl border border-slate-200 bg-white p-4"
                key={conversation.id}
              >
                <summary className="cursor-pointer">
                  <div className="inline-grid gap-2 sm:grid-cols-4 sm:items-center">
                    <span className="font-semibold text-slate-950">
                      {conversation.visitor_id}
                    </span>
                    <span className="text-sm text-slate-600">
                      {conversation.last_intent ?? "no intent"}
                    </span>
                    <span className="text-sm text-slate-600">
                      {conversation.last_lead_score ?? "no score"}
                    </span>
                    <span className="text-sm text-slate-600">
                      {conversation.should_handoff ? "handoff" : "self-serve"}
                    </span>
                  </div>
                </summary>
                <div className="mt-4 grid gap-3">
                  <p className="text-xs text-slate-500">
                    {conversation.source_url || "No source URL"} /{" "}
                    {formatDate(conversation.last_message_at, language)}
                  </p>
                  {conversation.messages.map((message) => (
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "assistant"
                          ? "bg-blue-50 text-blue-950"
                          : "bg-slate-100 text-slate-800"
                      }`}
                      key={message.id}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        {message.role}
                      </p>
                      <p className="mt-1">{message.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState>{text.noConversations}</EmptyState>
        )}
      </DashboardSection>

      <DashboardSection description={text.sections.usage} title={text.usage}>
        <div className="grid gap-4 md:grid-cols-5">
          <Metric label="Widget loads" value={String(usageSummary?.widget_load ?? 0)} />
          <Metric label="Chat messages" value={String(usageSummary?.chat_message ?? 0)} />
          <Metric label="Leads created" value={String(usageSummary?.lead_created ?? 0)} />
          <Metric label="Blocked domains" value={String(usageSummary?.blocked_domain ?? 0)} />
          <Metric label="License errors" value={String(usageSummary?.license_error ?? 0)} />
        </div>
      </DashboardSection>

      <DashboardSection description={text.sections.docs} title={text.docs}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DocLink href={docsHref} label={text.install} />
          <DocLink href="/policies/license" label="License policy" />
          <DocLink href="/custom-service#custom-request-form" label="Support instructions" />
          <DocLink href={hostedAgentUrl || "#"} label="Hosted agent URL" />
        </div>
      </DashboardSection>

      <DashboardSection description={text.sections.security} title={text.security}>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label={text.licenseMasked} value={maskLicense(licenseKey)} />
          <Metric label="License status" value={agentLicense?.status ?? "pending"} />
          <Metric
            label={text.allowedDomains}
            value={allowedDomains.length ? allowedDomains.join(", ") : "Pending"}
          />
        </div>
      </DashboardSection>
    </main>
  );
}

function DashboardSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="premium-card mt-6 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CodePanel({
  copied,
  label,
  onCopy,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  const { language } = useTranslation();
  const text = copy[language];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
        <button
          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
          disabled={!value}
          onClick={onCopy}
          type="button"
        >
          {copied ? text.copied : text.copy}
        </button>
      </div>
      <code className="mt-3 block min-h-28 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-3 text-xs leading-6 text-white sm:p-4">
        {value || "Pending"}
      </code>
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
      href={href}
    >
      {label}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const className =
    value === "hot"
      ? "bg-red-50 text-red-700"
      : value === "warm"
        ? "bg-amber-50 text-amber-700"
        : value === "cold"
          ? "bg-slate-100 text-slate-600"
          : "bg-zinc-100 text-zinc-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      {children}
    </div>
  );
}

function StateMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-container py-10">
      <section className="premium-card p-6">
        <p className="text-sm leading-6 text-slate-600">{children}</p>
      </section>
    </main>
  );
}

function getAgentDocsHref(agentSlug: string) {
  if (agentSlug === "website-customer-support-agent") {
    return "/docs/install-website-agent";
  }

  if (agentSlug === "ecommerce-product-support-agent") {
    return "/docs/install-ecommerce-agent";
  }

  return "/docs/install-website-agent";
}

function getInstallSteps(language: "en" | "zh") {
  return language === "zh"
    ? [
        "确认授权域名与实际安装网站一致。",
        "复制 script 代码到网站的全局代码区，或复制 iframe 到页面嵌入模块。",
        "打开网站测试聊天气泡、欢迎语、FAQ、线索提交和转人工。",
        "回到客户后台查看线索、对话和用量。",
      ]
    : [
        "Confirm the allowed domains match the website where the agent will be installed.",
        "Copy the script code into your global website code area, or paste the iframe into an embed block.",
        "Open the website and test the chat bubble, welcome message, FAQ answers, lead form, and handoff behavior.",
        "Return to this dashboard to review leads, conversations, and usage.",
      ];
}

function maskLicense(value: string) {
  if (!value) {
    return "Pending";
  }

  return `${value.slice(0, 12)}...${value.slice(-6)}`;
}

function formatDate(value: string, language: "en" | "zh") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
