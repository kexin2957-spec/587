"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { demoAgents } from "@/lib/marketplace/demo-data";

type DeliveryPackage = {
  allowed_domains: string[];
  customer_dashboard_url: string | null;
  documentation_url: string | null;
  embed_code: string | null;
  hosted_agent_url: string | null;
  license_key: string | null;
};

type OrderSummary = {
  agent_slug: string;
  delivery_status: string;
  order_number: string;
  payment_status: string;
  plan_name: string;
  website_url: string | null;
};

type DeliveryResponse = {
  data?: {
    delivery_package: DeliveryPackage | null;
    order: OrderSummary;
  };
  error?: string;
};

const copy = {
  en: {
    allowedDomains: "Allowed domains",
    back: "Back to Marketplace",
    checkTitle: "Pre-launch checklist",
    dashboard: "Open customer dashboard",
    description:
      "Use this page to install the delivered website agent, confirm the license key, and test the widget before launch.",
    embedTitle: "Embed code",
    iframeTitle: "Iframe install",
    license: "License key",
    loading: "Loading delivery documentation...",
    notFound: "Order delivery package not found.",
    order: "Order",
    scriptTitle: "Script install",
    status: "Delivery status",
    title: "Installation Documentation",
    whatCustomerReceives: "What the customer receives",
    checklist: [
      "Confirm payment status before production launch.",
      "Confirm allowed domains match the customer website.",
      "Install the iframe or script code on the website.",
      "Test welcome message, FAQ answers, lead capture, and human handoff.",
      "Submit a test lead and confirm it appears in the customer/admin dashboard.",
    ],
    receives: [
      "Hosted agent URL",
      "License key",
      "Allowed domain list",
      "Iframe embed code",
      "Script embed code",
      "Customer configuration dashboard",
      "Lead collection dashboard",
    ],
  },
  zh: {
    allowedDomains: "允许安装域名",
    back: "返回商店",
    checkTitle: "上线前检查清单",
    dashboard: "打开客户后台",
    description:
      "使用这个页面安装已交付的网站 Agent，确认 license key，并在上线前测试 widget。",
    embedTitle: "嵌入代码",
    iframeTitle: "Iframe 安装",
    license: "License key",
    loading: "正在加载交付文档...",
    notFound: "没有找到该订单的交付包。",
    order: "订单",
    scriptTitle: "Script 安装",
    status: "交付状态",
    title: "安装文档",
    whatCustomerReceives: "客户会收到什么",
    checklist: [
      "正式上线前确认付款状态。",
      "确认 allowed domains 与客户网站域名一致。",
      "把 iframe 或 script 代码安装到网站。",
      "测试欢迎语、FAQ 回答、线索收集和人工转接。",
      "提交一条测试线索，并确认客户后台/管理后台能看到。",
    ],
    receives: [
      "托管 Agent 链接",
      "License key",
      "允许安装域名列表",
      "Iframe 嵌入代码",
      "Script 嵌入代码",
      "客户配置后台",
      "线索查看后台",
    ],
  },
};

export function DeliveryHub({
  accessToken,
  orderNumber,
}: {
  accessToken: string;
  orderNumber: string;
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [deliveryPackage, setDeliveryPackage] = useState<DeliveryPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDelivery() {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}?access_token=${encodeURIComponent(accessToken)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as DeliveryResponse;

        if (!response.ok || !result.data) {
          throw new Error(result.error || text.notFound);
        }

        if (active) {
          setOrder(result.data.order);
          setDeliveryPackage(result.data.delivery_package);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : text.notFound);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDelivery();

    return () => {
      active = false;
    };
  }, [accessToken, orderNumber, text.notFound]);

  if (isLoading) {
    return <StateMessage>{text.loading}</StateMessage>;
  }

  if (error || !order) {
    return <StateMessage>{error || text.notFound}</StateMessage>;
  }

  const agent = demoAgents.find((item) => item.slug === order.agent_slug);
  const agentTitle = agent
    ? language === "zh"
      ? agent.titleZh || agent.titleEn
      : agent.titleEn || agent.titleZh
    : order.agent_slug;
  const embedCode = deliveryPackage?.embed_code ?? "";
  const embedParts = embedCode.includes("<!-- Iframe fallback -->")
    ? embedCode.split("<!-- Iframe fallback -->")
    : embedCode.split("<!-- Script embed option -->").reverse();
  const scriptCode = embedParts[0]?.trim() ?? "";
  const iframeCode = embedParts[1]?.trim() ?? "";

  return (
    <main className="app-container py-10">
      <section className="premium-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {text.order}: {order.order_number}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {text.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {text.description}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            <Link
              className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              href={deliveryPackage?.customer_dashboard_url ?? `/customer/orders/${orderNumber}`}
            >
              {text.dashboard}
            </Link>
            <Link
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
              href="/marketplace"
            >
              {text.back}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <InfoCard label="Agent" value={agentTitle} />
        <InfoCard label="Plan" value={order.plan_name} />
        <InfoCard label="Payment" value={order.payment_status} />
        <InfoCard label={text.status} value={order.delivery_status} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {text.embedTitle}
            </h2>
            <div className="mt-4 grid gap-4">
              <CodeBlock title={text.iframeTitle} value={iframeCode} />
              <CodeBlock title={text.scriptTitle} value={scriptCode} />
            </div>
          </section>

          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {text.checkTitle}
            </h2>
            <ol className="mt-4 grid gap-3">
              {text.checklist.map((item, index) => (
                <li
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  key={item}
                >
                  <span className="mr-2 font-semibold text-slate-950">
                    {index + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="grid h-fit gap-6">
          <section className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {text.whatCustomerReceives}
            </h2>
            <ul className="mt-4 grid gap-2">
              {text.receives.map((item) => (
                <li
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">License</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <Field label={text.license}>
                {deliveryPackage?.license_key ?? "Pending"}
              </Field>
              <Field label={text.allowedDomains}>
                {deliveryPackage?.allowed_domains?.length
                  ? deliveryPackage.allowed_domains.join(", ")
                  : "Pending"}
              </Field>
              <Field label="Hosted URL">
                {deliveryPackage?.hosted_agent_url ?? "Pending"}
              </Field>
              <Field label="Website">{order.website_url ?? "Pending"}</Field>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <code className="mt-2 block whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-white">
        {value || "Pending"}
      </code>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
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

function StateMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-container py-10">
      <section className="premium-card p-6">
        <p className="text-sm leading-6 text-slate-600">{children}</p>
      </section>
    </main>
  );
}
