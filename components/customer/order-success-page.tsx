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
  amount_cny: number | null;
  amount_usd: number | null;
  company_name: string | null;
  created_at: string;
  currency: "USD" | "CNY";
  customer_email: string;
  customer_name: string;
  delivery_status: string;
  order_number: string;
  order_status: string;
  payment_link_url: string | null;
  payment_method: string;
  payment_reference: string | null;
  payment_status: string;
  plan_name: string;
  website_url: string | null;
};

type PaymentSummary = {
  amount: number;
  currency: "USD" | "CNY";
  payment_url: string | null;
  provider: string;
  status: string;
};

type OrderResponse = {
  data?: {
    delivery_package: DeliveryPackage | null;
    order: OrderSummary;
    payments?: PaymentSummary[];
  };
  error?: string;
};

const copy = {
  en: {
    amount: "Amount",
    created: "Order submitted successfully.",
    dashboard: "Open customer dashboard",
    docs: "Installation docs",
    loading: "Loading order confirmation...",
    notFound: "Order not found. Please check the link or contact support.",
    order: "Order",
    payment: "Payment",
    plan: "Plan",
    product: "Product",
    status: "Status",
    subtitle:
      "Your order has been created. We will contact you with payment and setup details, then activate the delivery package.",
    title: "Order Created",
    whatNext: "What happens next",
    whatReceive: "What you receive",
    next: [
      "We review the selected plan and business website.",
      "We contact you to confirm payment and setup details.",
      "After payment confirmation, we configure the agent and allowed domains.",
      "You receive the dashboard link, license key, embed code, and installation docs.",
      "You can test the widget, collect leads, and request setup/custom help if needed.",
    ],
    receive: [
      "Hosted website chat agent",
      "License key and allowed domains",
      "Iframe/script embed code",
      "Customer dashboard and configuration form",
      "Lead collection dashboard",
      "Installation and testing documentation",
    ],
  },
  zh: {
    amount: "金额",
    created: "需求提交成功。",
    dashboard: "打开客户后台",
    docs: "安装文档",
    loading: "正在加载订单确认页...",
    notFound: "没有找到订单。请检查链接或联系平台支持。",
    order: "订单",
    payment: "付款",
    plan: "方案",
    product: "产品",
    status: "状态",
    subtitle:
      "订单已创建。我们会联系你完成付款和配置确认，然后激活交付包。",
    title: "订单已创建",
    whatNext: "接下来会发生什么",
    whatReceive: "你会收到什么",
    next: [
      "我们会查看你选择的方案和业务网站。",
      "我们会联系你确认付款方式和配置细节。",
      "付款确认后，我们会配置 Agent 和允许安装域名。",
      "你会收到客户后台链接、license key、嵌入代码和安装文档。",
      "你可以测试 widget、查看线索，也可以请求安装服务或定制帮助。",
    ],
    receive: [
      "托管的网站聊天 Agent",
      "License key 和允许安装域名",
      "iframe/script 嵌入代码",
      "客户后台和配置表单",
      "线索收集后台",
      "安装和测试文档",
    ],
  },
};

export function OrderSuccessPage({
  accessToken,
  orderNumber,
}: {
  accessToken: string;
  orderNumber: string;
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const launchCopy = getPublicOrderCopy(language);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [deliveryPackage, setDeliveryPackage] = useState<DeliveryPackage | null>(null);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}?access_token=${encodeURIComponent(accessToken)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as OrderResponse;

        if (!response.ok || !result.data) {
          throw new Error(result.error || text.notFound);
        }

        if (active) {
          setOrder(result.data.order);
          setDeliveryPackage(result.data.delivery_package);
          setPayments(result.data.payments ?? []);
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

    void loadOrder();

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
  const dashboardHref =
    deliveryPackage?.customer_dashboard_url ?? `/customer/orders/${order.order_number}`;
  const docsHref =
    getAgentDocsHref(order.agent_slug) ||
    deliveryPackage?.documentation_url ||
    `/delivery/${order.order_number}`;
  const latestPayment = payments[0] ?? null;

  return (
    <main className="app-container py-10">
      <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {text.created}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {launchCopy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {launchCopy.subtitle}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            href={dashboardHref}
          >
            {text.dashboard}
          </Link>
          <Link
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
            href={docsHref}
          >
            {text.docs}
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <InfoCard label={text.order} value={order.order_number} />
        <InfoCard label={text.product} value={agentTitle} />
        <InfoCard label={text.plan} value={order.plan_name} />
        <InfoCard label={text.amount} value={formatOrderAmount(order, language)} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {text.whatNext}
            </h2>
            <ol className="mt-4 grid gap-3">
              {launchCopy.next.map((item, index) => (
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

          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {launchCopy.statusTitle}
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <Field label={text.payment}>
                {order.payment_method} / {order.payment_status}
              </Field>
              <Field label={text.status}>{order.order_status}</Field>
              <Field label={launchCopy.delivery}>{order.delivery_status}</Field>
            </dl>
          </section>

          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {launchCopy.paymentTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {getPaymentMessage(order.payment_method, language)}
            </p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <Field label={text.payment}>
                {latestPayment
                  ? `${latestPayment.provider} / ${latestPayment.status}`
                  : `${order.payment_method} / ${order.payment_status}`}
              </Field>
              <Field label={launchCopy.paymentLinkLabel}>
                {order.payment_link_url || latestPayment?.payment_url ? (
                  <a
                    className="font-semibold text-blue-700 hover:text-blue-600"
                    href={order.payment_link_url ?? latestPayment?.payment_url ?? "#"}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {launchCopy.openPayment}
                  </a>
                ) : (
                  launchCopy.manualPayment
                )}
              </Field>
              <Field label={launchCopy.paymentReferenceLabel}>
                {order.payment_reference || launchCopy.pending}
              </Field>
            </dl>
          </section>
        </div>

        <aside className="grid h-fit gap-6">
          <section className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {text.whatReceive}
            </h2>
            <ul className="mt-4 grid gap-2">
              {launchCopy.receive.map((item) => (
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
            <h2 className="text-lg font-semibold text-slate-950">
              {launchCopy.afterPaymentTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {launchCopy.afterPaymentDescription}
            </p>
            <dl className="mt-4 grid gap-4 text-sm">
              <Field label={launchCopy.contactLabel}>
                {order.customer_email}
              </Field>
              <Field label={launchCopy.websiteLabel}>
                {order.website_url ?? launchCopy.pending}
              </Field>
              <Field label={launchCopy.docsLabel}>
                <Link
                  className="font-semibold text-blue-700 hover:text-blue-600"
                  href={docsHref}
                >
                  {text.docs}
                </Link>
              </Field>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

function getPublicOrderCopy(language: "en" | "zh") {
  return language === "zh"
    ? {
        afterPaymentDescription:
          "付款和联系信息确认后，我们会准备对应 Agent、交付安装说明，并通过你填写的联系方式发送下一步信息。",
        afterPaymentTitle: "付款后会发生什么",
        contactLabel: "联系邮箱",
        delivery: "交付",
        docsLabel: "文档链接",
        manualPayment: "人工确认付款",
        openPayment: "打开付款链接",
        pending: "待确认",
        paymentLinkLabel: "付款链接",
        paymentReferenceLabel: "付款参考号",
        paymentTitle: "付款方式",
        statusTitle: "订单和交付状态",
        subtitle:
          "你的订单已经提交。我们会联系你确认付款方式、业务网站、配置资料和交付时间。",
        title: "订单已收到",
        websiteLabel: "业务网站",
        next: [
          "保存订单号，方便后续沟通。",
          "我们会核对所选 Agent、购买方案和业务网站。",
          "我们会联系你确认付款方式和需要的配置资料。",
          "付款确认后，我们会准备 Agent、嵌入方式和安装说明。",
          "如需定制集成或安装协助，可以在沟通中升级到对应服务。",
        ],
        receive: [
          "订单号和购买方案记录",
          "已选 Agent 的交付确认",
          "付款和联系方式确认说明",
          "付款后的安装和配置下一步",
          "文档、客户入口或支持方式的交付链接",
        ],
      }
    : {
        afterPaymentDescription:
          "After payment and contact details are confirmed, we prepare the selected agent, installation notes, and next-step delivery message for the contact you provided.",
        afterPaymentTitle: "What happens after payment",
        contactLabel: "Contact email",
        delivery: "Delivery",
        docsLabel: "Documentation link",
        manualPayment: "Manual payment confirmation",
        openPayment: "Open payment link",
        pending: "Pending",
        paymentLinkLabel: "Payment link",
        paymentReferenceLabel: "Payment reference",
        paymentTitle: "Payment method",
        statusTitle: "Order and delivery status",
        subtitle:
          "Your order has been submitted. We will contact you to confirm payment, business website details, setup information, and delivery timing.",
        title: "Order received",
        websiteLabel: "Business website",
        next: [
          "Save the order number for follow-up.",
          "We review the selected agent, plan, and business website.",
          "We contact you to confirm payment method and setup details.",
          "After payment confirmation, we prepare the agent, embed option, and installation notes.",
          "If you need installation help or deeper integrations, you can upgrade during the handoff.",
        ],
        receive: [
          "Order number and selected plan record",
          "Selected agent delivery confirmation",
          "Payment and contact confirmation message",
          "Post-payment installation and configuration next steps",
          "Delivery links for docs, customer access, or support when ready",
        ],
      };
}

function getAgentDocsHref(agentSlug: string) {
  if (agentSlug === "website-customer-support-agent") {
    return "/docs/install-website-agent";
  }

  if (agentSlug === "ecommerce-product-support-agent") {
    return "/docs/install-ecommerce-agent";
  }

  return "";
}

function getPaymentMessage(paymentMethod: string, language: "en" | "zh") {
  if (language === "zh") {
    if (paymentMethod === "stripe") {
      return "如果 Stripe 已配置，订单会显示付款链接；如果未配置，我们会改用人工付款确认。";
    }

    if (paymentMethod === "wechat" || paymentMethod === "alipay") {
      return "我们会联系你发送对应的人工付款说明，并在确认后更新订单状态。";
    }

    return "当前使用人工付款确认。付款确认后，我们会准备 Agent 交付内容。";
  }

  if (paymentMethod === "stripe") {
    return "If Stripe is configured, this order will include a payment link. If not, we will use manual payment confirmation.";
  }

  if (paymentMethod === "wechat" || paymentMethod === "alipay") {
    return "We will contact you with manual payment instructions and update the order after confirmation.";
  }

  return "This order uses manual payment confirmation. After payment is confirmed, we prepare the agent delivery package.";
}

function formatOrderAmount(order: OrderSummary, language: "en" | "zh") {
  if (order.currency === "CNY" || language === "zh") {
    return order.amount_cny ? `¥${order.amount_cny}` : "Custom quote";
  }

  return order.amount_usd ? `$${order.amount_usd}` : "Custom quote";
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
