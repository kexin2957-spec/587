"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import type { PaymentMethod } from "@/lib/marketplace/constants";
import type { DemoAgent } from "@/lib/marketplace/demo-data";
import {
  formatPlanAmount,
  localizeOrderPlan,
  type AgentOrderPlan,
} from "@/lib/marketplace/order-plans";

type OrderFormState = {
  companyName: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  message: string;
  paymentMethod: PaymentMethod;
  websiteUrl: string;
};

type OrderResult = {
  delivery_package?: {
    customer_dashboard_url?: string | null;
  } | null;
  order_number?: string;
  payment_link_url?: string | null;
  payment_method?: string;
};

const initialForm: OrderFormState = {
  companyName: "",
  customerEmail: "",
  customerName: "",
  customerPhone: "",
  message: "",
  paymentMethod: "manual",
  websiteUrl: "",
};

const copy = {
  en: {
    backToMarketplace: "Back to Marketplace",
    close: "Close",
    company: "Company",
    confirmation:
      "Your order has been created. We will contact you with payment and setup details.",
    currency: "Currency",
    customerEmail: "Email",
    customerName: "Name",
    customerPhone: "Phone",
    emailInvalid: "Please enter a valid email address.",
    error: "We could not create the order. Please try again.",
    manualMessage:
      "Manual payment is ready for launch. We will confirm the payment method and delivery details after your order is created.",
    message: "Message",
    orderNow: "Create order",
    orderNumber: "Order number",
    paymentMethod: "Payment method",
    required: "This field is required.",
    submitting: "Creating order...",
    successTitle: "Order created",
    title: "Order this agent",
    viewSuccessPage: "View order success page",
    websiteUrl: "Website URL",
  },
  zh: {
    backToMarketplace: "返回商店",
    close: "关闭",
    company: "公司",
    confirmation: "订单已创建。我们会联系你完成付款和配置交付。",
    currency: "币种",
    customerEmail: "邮箱",
    customerName: "姓名",
    customerPhone: "电话",
    emailInvalid: "请输入有效邮箱。",
    error: "订单创建失败，请稍后再试。",
    manualMessage:
      "当前使用人工确认付款。订单创建后，我们会联系你确认付款方式和交付细节。",
    message: "留言",
    orderNow: "创建订单",
    orderNumber: "订单号",
    paymentMethod: "付款方式",
    required: "请填写此字段。",
    submitting: "正在创建订单...",
    successTitle: "订单已创建",
    title: "订购这个 Agent",
    websiteUrl: "网站地址",
  },
};

const basePaymentOptions: Array<{ labelEn: string; labelZh: string; value: PaymentMethod }> = [
  { labelEn: "Manual payment", labelZh: "手动付款", value: "manual" },
  {
    labelEn: "WeChat manual payment",
    labelZh: "微信手动付款",
    value: "wechat",
  },
  {
    labelEn: "Alipay manual payment",
    labelZh: "支付宝手动付款",
    value: "alipay",
  },
  {
    labelEn: "Bank transfer",
    labelZh: "银行转账",
    value: "bank_transfer",
  },
  { labelEn: "Other", labelZh: "其他", value: "other" },
];

function getPaymentOptions(hasStripeCheckout: boolean) {
  return hasStripeCheckout
    ? [
        {
          labelEn: "Stripe checkout",
          labelZh: "Stripe 在线付款",
          value: "stripe" as PaymentMethod,
        },
        ...basePaymentOptions,
      ]
    : basePaymentOptions;
}

export function AgentOrderDialog({
  agent,
  onClose,
  plan,
}: {
  agent: DemoAgent;
  onClose: () => void;
  plan: AgentOrderPlan;
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const localizedPlan = localizeOrderPlan(plan, language);
  const [form, setForm] = useState<OrderFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormState, string>>>(
    {},
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [currency, setCurrency] = useState<"USD" | "CNY">(
    language === "zh" ? "CNY" : "USD",
  );
  const hasStripeCheckout = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const agentTitle =
    language === "zh" ? agent.titleZh || agent.titleEn : agent.titleEn || agent.titleZh;

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateOrderForm(form, text);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/orders", {
        body: JSON.stringify({
          agent_slug: agent.slug,
          company_name: form.companyName,
          currency,
          customer_email: form.customerEmail,
          customer_name: form.customerName,
          customer_phone: form.customerPhone,
          message: form.message,
          payment_method: form.paymentMethod,
          plan_id: plan.id,
          source_page: `/agents/${agent.slug}`,
          website_url: form.websiteUrl,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        data?: OrderResult;
        error?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Order failed.");
      }

      setOrderResult(result.data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function updateField<K extends keyof OrderFormState>(
    name: K,
    value: OrderFormState[K],
  ) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{text.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{agentTitle}</p>
          </div>
          <button
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            {text.close}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{localizedPlan.name}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {localizedPlan.description}
              </p>
            </div>
            <p className="text-lg font-semibold text-blue-900">
              {formatPlanAmount(plan, language)}
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-950">{text.successTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              {text.confirmation}
            </p>
            {orderResult?.order_number ? (
              <p className="mt-3 text-sm font-semibold text-emerald-950">
                {text.orderNumber}: {orderResult.order_number}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {orderResult?.payment_link_url ? (
                <Link
                  className="rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                  href={orderResult.payment_link_url}
                  onClick={onClose}
                  target="_blank"
                >
                  {language === "zh" ? "打开付款链接" : "Open payment link"}
                </Link>
              ) : null}
              {orderResult?.order_number ? (
                <Link
                  className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  href={getSuccessHref(orderResult)}
                  onClick={onClose}
                >
                  {language === "zh" ? "查看订单成功页" : "View order success page"}
                </Link>
              ) : null}
              <Link
                className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                href="/marketplace"
                onClick={onClose}
              >
                {text.backToMarketplace}
              </Link>
              <button
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                onClick={onClose}
                type="button"
              >
                {text.close}
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={submitOrder}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                error={errors.customerName}
                label={text.customerName}
                required
                value={form.customerName}
                onChange={(value) => updateField("customerName", value)}
              />
              <TextField
                error={errors.customerEmail}
                inputMode="email"
                label={text.customerEmail}
                required
                type="email"
                value={form.customerEmail}
                onChange={(value) => updateField("customerEmail", value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={text.company}
                value={form.companyName}
                onChange={(value) => updateField("companyName", value)}
              />
              <TextField
                label={text.customerPhone}
                value={form.customerPhone}
                onChange={(value) => updateField("customerPhone", value)}
              />
            </div>
            <TextField
              inputMode="url"
              label={text.websiteUrl}
              type="url"
              value={form.websiteUrl}
              onChange={(value) => updateField("websiteUrl", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-800">
                  {text.currency}
                </span>
                <select
                  className="polished-input px-3 py-2 text-sm text-slate-950"
                  onChange={(event) => setCurrency(event.target.value as "USD" | "CNY")}
                  value={currency}
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-800">
                  {text.paymentMethod}
                </span>
                <select
                  className="polished-input px-3 py-2 text-sm text-slate-950"
                  onChange={(event) =>
                    updateField("paymentMethod", event.target.value as PaymentMethod)
                  }
                  value={form.paymentMethod}
                >
                  {getPaymentOptions(hasStripeCheckout).map((option) => (
                    <option key={option.value} value={option.value}>
                      {language === "zh" ? option.labelZh : option.labelEn}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              {text.manualMessage}
            </p>
            <TextAreaField
              label={text.message}
              value={form.message}
              onChange={(value) => updateField("message", value)}
            />

            {status === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {text.error}
              </div>
            ) : null}

            <button
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? text.submitting : text.orderNow}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getSuccessHref(orderResult: OrderResult) {
  const dashboardUrl = orderResult.delivery_package?.customer_dashboard_url ?? "";

  try {
    const dashboard = new URL(dashboardUrl);
    const accessToken = dashboard.searchParams.get("access_token");

    return accessToken
      ? `/orders/${orderResult.order_number}/success?access_token=${encodeURIComponent(accessToken)}`
      : `/orders/${orderResult.order_number}/success`;
  } catch {
    return `/orders/${orderResult.order_number}/success`;
  }
}

function validateOrderForm(
  form: OrderFormState,
  text: typeof copy.en | typeof copy.zh,
) {
  const errors: Partial<Record<keyof OrderFormState, string>> = {};

  if (!form.customerName.trim()) {
    errors.customerName = text.required;
  }

  if (!form.customerEmail.trim()) {
    errors.customerEmail = text.required;
  } else if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) {
    errors.customerEmail = text.emailInvalid;
  }

  return errors;
}

function TextField({
  error,
  inputMode,
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <input
        className="polished-input px-3 py-2 text-sm text-slate-950"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <textarea
        className="polished-input min-h-28 px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
