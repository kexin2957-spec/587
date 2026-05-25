"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  CustomerAgentConfigEditor,
  type CustomerAgentConfig,
} from "@/components/customer/customer-agent-config-editor";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type DeliveryStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/marketplace/constants";
import { demoAgents } from "@/lib/marketplace/demo-data";

type DeliveryPackageRecord = {
  allowed_domains: string[];
  customer_dashboard_url: string | null;
  delivery_notes: string | null;
  documentation_url: string | null;
  embed_code: string | null;
  hosted_agent_url: string | null;
  license_key: string | null;
};

type OrderNoteRecord = {
  created_at: string;
  id: string;
  note: string;
  order_id: string;
};

type PaymentRecord = {
  amount: number;
  created_at: string;
  currency: "USD" | "CNY";
  id: string;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  payment_url: string | null;
  provider: string;
  provider_payment_id: string | null;
  status: string;
};

type OrderRecord = {
  agent_id: string;
  agent_slug: string;
  amount_cny: number | null;
  amount_usd: number | null;
  billing_interval: "one_time" | "monthly" | "yearly";
  cancel_at: string | null;
  company_name: string | null;
  created_at: string;
  currency: "USD" | "CNY";
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_config: CustomerAgentConfig | null;
  delivery_package: DeliveryPackageRecord | null;
  delivery_status: DeliveryStatus;
  id: string;
  message: string | null;
  notes: OrderNoteRecord[];
  next_billing_date: string | null;
  order_number: string;
  order_status: OrderStatus;
  payment_link_url: string | null;
  payment_method: string;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_status: PaymentStatus;
  payments?: PaymentRecord[];
  plan_id: string;
  plan_name: string;
  subscription_status: string;
  updated_at: string;
  website_url: string | null;
};

type OrdersResponse = {
  data?: OrderRecord[];
  error?: string;
  mode?: "mock" | "supabase";
  ok?: boolean;
};

type DeliveryDraft = {
  allowedDomains: string;
  deliveryNotes: string;
};

type PaymentDraft = {
  note: string;
  proofUrl: string;
  reference: string;
};

const copy = {
  en: {
    addNote: "Add internal note",
    amount: "Amount",
    customer: "Customer",
    delivery: "Delivery",
    deliveryPackage: "Delivery package",
    empty: "Orders will appear here after customers place orders.",
    loading: "Loading orders...",
    notePlaceholder: "Add payment, delivery, or follow-up notes.",
    notes: "Internal notes",
    order: "Order",
    payment: "Payment",
    refresh: "Refresh",
    saveNote: "Save note",
    updateDelivery: "Update delivery",
    updateOrder: "Update order",
    updatePayment: "Update payment",
    viewDetails: "View details",
  },
  zh: {
    addNote: "添加内部备注",
    amount: "金额",
    customer: "客户",
    delivery: "交付",
    deliveryPackage: "交付包",
    empty: "客户创建订单后，订单会显示在这里。",
    loading: "正在加载订单...",
    notePlaceholder: "添加付款、交付或跟进备注。",
    notes: "内部备注",
    order: "订单",
    payment: "付款",
    refresh: "刷新",
    saveNote: "保存备注",
    updateDelivery: "更新交付",
    updateOrder: "更新订单",
    updatePayment: "更新付款",
    viewDetails: "查看详情",
  },
};

export function OrdersTable({ orderId }: { orderId?: string } = {}) {
  const { language, t } = useTranslation();
  const text = copy[language];
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});

  async function fetchOrders() {
    const response = await fetch("/api/orders", { cache: "no-store" });
    const result = (await response.json()) as OrdersResponse;

    if (!response.ok) {
      throw new Error(result.error || "Unable to load orders.");
    }

    return result;
  }

  async function loadOrders() {
    setIsLoading(true);
    setError("");

    try {
      const result = await fetchOrders();
      setRecords(result.data ?? []);
      setMode(result.mode ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateOrder(
    record: OrderRecord,
    updates: Partial<{
      delivery_package: {
        allowed_domains?: string;
        delivery_notes?: string;
        license_key?: string;
      };
      delivery_status: DeliveryStatus;
      note: string;
      order_status: OrderStatus;
      payment_note: string;
      payment_proof_url: string | null;
      payment_reference: string;
      payment_status: PaymentStatus;
    }>,
  ) {
    setActionError("");

    const response = await fetch("/api/orders", {
      body: JSON.stringify({ id: record.id, ...updates }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: OrderRecord;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    setRecords((current) =>
      current.map((item) => (item.id === record.id ? result.data as OrderRecord : item)),
    );
    setNotes((current) => ({ ...current, [record.id]: "" }));
  }

  async function generateLicense(record: OrderRecord) {
    setActionError("");
    const deliveryDraft = getDeliveryDraft(record, deliveryDrafts[record.id]);
    const response = await fetch("/api/admin/licenses", {
      body: JSON.stringify({
        allowed_domains: deliveryDraft.allowedDomains || record.website_url || "",
        order_id: record.id,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setActionError(result.error || t("admin.actionFailed"));
      return;
    }

    await loadOrders();
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialOrders() {
      try {
        const result = await fetchOrders();

        if (!isActive) {
          return;
        }

        setRecords(result.data ?? []);
        setMode(result.mode ?? null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  const visibleRecords = useMemo(
    () =>
      orderId
        ? records.filter(
            (record) => record.id === orderId || record.order_number === orderId,
          )
        : records,
    [orderId, records],
  );

  if (isLoading) {
    return <AdminState>{text.loading}</AdminState>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {visibleRecords.length} {t("admin.orders")}
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {t("admin.dataSource")}: {mode}
            </p>
          ) : null}
        </div>
        <button
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 sm:w-auto"
          onClick={() => void loadOrders()}
          type="button"
        >
          {text.refresh}
        </button>
      </div>

      {visibleRecords.length === 0 ? (
        <AdminState>
          {orderId ? "No matching order was found." : text.empty}
        </AdminState>
      ) : (
        <div className="grid gap-4">
          {actionError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {actionError}
            </div>
          ) : null}
          {visibleRecords.map((record) => {
            const agent = demoAgents.find((item) => item.slug === record.agent_slug);
            const agentTitle = agent
              ? language === "zh"
                ? agent.titleZh || agent.titleEn
                : agent.titleEn || agent.titleZh
              : record.agent_slug;
            const deliveryDraft = getDeliveryDraft(record, deliveryDrafts[record.id]);
            const deliveryLabels = {
              ...getDeliveryLabels(language),
              ...getDeliveryActionLabels(language),
            };
            const paymentDraft = getPaymentDraft(record, paymentDrafts[record.id]);

            return (
              <article
                className="premium-card p-5"
                data-testid="admin-order-card"
                key={record.id}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {record.order_number}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {agentTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {record.plan_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={`/admin/orders/${record.id}`}
                    >
                      Open detail
                    </Link>
                    <AdminStatusBadge status={record.payment_status} />
                    <AdminStatusBadge status={record.order_status} />
                    <AdminStatusBadge status={record.delivery_status} />
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <Field label={text.customer}>
                    {record.customer_name} / {record.customer_email}
                  </Field>
                  <Field label={t("forms.company")}>
                    {record.company_name || t("common.notProvided")}
                  </Field>
                  <Field label={text.amount}>
                    {formatOrderAmount(record, language)}
                  </Field>
                  <Field label={t("admin.tableSubmitted")}>
                    {dateFormatter.format(new Date(record.created_at))}
                  </Field>
                </dl>

                <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                    {text.viewDetails}
                  </summary>
                  <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <Field label={t("forms.contactPhone")}>
                      {record.customer_phone || t("common.notProvided")}
                    </Field>
                    <Field label={t("forms.websiteUrl")}>
                      {record.website_url || t("common.notProvided")}
                    </Field>
                    <Field label={text.payment}>
                      {record.payment_method} / {record.payment_status}
                    </Field>
                    <Field label="Payment link">
                      {record.payment_link_url ? (
                        <a
                          className="font-semibold text-blue-700 hover:text-blue-600"
                          href={record.payment_link_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open payment link
                        </a>
                      ) : (
                        "Manual payment fallback"
                      )}
                    </Field>
                    <Field label="Billing">
                      {record.billing_interval} / {record.subscription_status}
                    </Field>
                    <Field label="Next billing">
                      {record.next_billing_date
                        ? dateFormatter.format(new Date(record.next_billing_date))
                        : "Not scheduled"}
                    </Field>
                    <Field label={text.order}>{record.order_status}</Field>
                    <Field label={text.delivery}>{record.delivery_status}</Field>
                    <Field label={t("forms.message")}>
                      {record.message || t("common.notProvided")}
                    </Field>
                  </dl>

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Manual payment operation
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Use this for manual, WeChat, Alipay, bank transfer, PayPal fallback, or Stripe fallback payments.
                    </p>
                    <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                      <Field label="Reference">
                        {record.payment_reference || "Not recorded"}
                      </Field>
                      <Field label="Proof">
                        {record.payment_proof_url || "Proof not recorded"}
                      </Field>
                      <Field label="Latest payment">
                        {record.payments?.[0]
                          ? `${record.payments[0].provider} / ${record.payments[0].status}`
                          : "No payment record"}
                      </Field>
                    </dl>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <Input
                        label="Payment reference"
                        value={paymentDraft.reference}
                        onChange={(value) =>
                          setPaymentDrafts((current) => ({
                            ...current,
                            [record.id]: { ...paymentDraft, reference: value },
                          }))
                        }
                      />
                      <Input
                        label="Payment proof URL"
                        value={paymentDraft.proofUrl}
                        onChange={(value) =>
                          setPaymentDrafts((current) => ({
                            ...current,
                            [record.id]: { ...paymentDraft, proofUrl: value },
                          }))
                        }
                      />
                      <Input
                        label="Payment note"
                        value={paymentDraft.note}
                        onChange={(value) =>
                          setPaymentDrafts((current) => ({
                            ...current,
                            [record.id]: { ...paymentDraft, note: value },
                          }))
                        }
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                        onClick={() =>
                          void updateOrder(record, {
                            order_status: "paid",
                            payment_note: paymentDraft.note,
                            payment_proof_url: paymentDraft.proofUrl,
                            payment_reference: paymentDraft.reference,
                            payment_status: "manually_approved",
                          })
                        }
                        type="button"
                      >
                        Mark manually paid
                      </button>
                      <button
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                        onClick={() =>
                          void updateOrder(record, {
                            payment_note: paymentDraft.note,
                            payment_proof_url: paymentDraft.proofUrl,
                            payment_reference: paymentDraft.reference,
                          })
                        }
                        type="button"
                      >
                        Save payment reference
                      </button>
                    </div>
                  </div>

                  {record.delivery_package ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-950">
                            {text.deliveryPackage}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {deliveryLabels.instructions}
                          </p>
                        </div>
                        <a
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                          href={record.delivery_package.customer_dashboard_url ?? "#"}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {deliveryLabels.openDashboard}
                        </a>
                      </div>
                      <dl className="mt-4 grid gap-4 text-sm">
                        <Field label="License key">
                          {record.delivery_package.license_key || t("common.notProvided")}
                        </Field>
                        <Field label={deliveryLabels.allowedDomains}>
                          {record.delivery_package.allowed_domains?.length
                            ? record.delivery_package.allowed_domains.join(", ")
                            : deliveryLabels.domainPending}
                        </Field>
                        <Field label="Customer dashboard URL">
                          {record.delivery_package.customer_dashboard_url ||
                            t("common.notProvided")}
                        </Field>
                        <Field label="Hosted Agent URL">
                          {record.delivery_package.hosted_agent_url ||
                            t("common.notProvided")}
                        </Field>
                        <Field label="Documentation URL">
                          {record.delivery_package.documentation_url ||
                            t("common.notProvided")}
                        </Field>
                        <Field label="Embed code">
                          <code className="block rounded-xl bg-slate-950 p-3 text-xs text-white">
                            {record.delivery_package.embed_code ||
                              t("common.notProvided")}
                          </code>
                        </Field>
                        <Field label="Delivery notes">
                          {record.delivery_package.delivery_notes ||
                            t("common.notProvided")}
                        </Field>
                      </dl>
                      <div className="mt-5 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                        <Field label="License key">
                          {record.delivery_package.license_key || t("common.notProvided")}
                        </Field>
                        <button
                          className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                          onClick={() => void generateLicense(record)}
                          type="button"
                        >
                          {language === "zh" ? "生成 License" : "Generate license"}
                        </button>
                        <Textarea
                          help={deliveryLabels.domainHelp}
                          label={deliveryLabels.allowedDomains}
                          value={deliveryDraft.allowedDomains}
                          onChange={(value) =>
                            setDeliveryDrafts((current) => ({
                              ...current,
                              [record.id]: { ...deliveryDraft, allowedDomains: value },
                            }))
                          }
                        />
                        <Textarea
                          label="Delivery notes"
                          value={deliveryDraft.deliveryNotes}
                          onChange={(value) =>
                            setDeliveryDrafts((current) => ({
                              ...current,
                              [record.id]: { ...deliveryDraft, deliveryNotes: value },
                            }))
                          }
                        />
                        <button
                          className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                          onClick={() =>
                            void updateOrder(record, {
                              delivery_package: {
                                allowed_domains: deliveryDraft.allowedDomains,
                                delivery_notes: deliveryDraft.deliveryNotes,
                              },
                            })
                          }
                          type="button"
                        >
                          {deliveryLabels.saveDeliveryPackage}
                        </button>
                        <button
                          className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                          data-testid="admin-mark-delivered"
                          onClick={() =>
                            void updateOrder(record, {
                              delivery_package: {
                                allowed_domains: deliveryDraft.allowedDomains,
                                delivery_notes: deliveryDraft.deliveryNotes,
                              },
                              delivery_status: "delivered",
                              note: deliveryLabels.deliveredNote,
                              order_status: "delivered",
                            })
                          }
                          type="button"
                        >
                          {deliveryLabels.markDelivered}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {language === "zh" ? "客户 Agent 配置" : "Customer agent configuration"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {language === "zh"
                        ? "管理员可以代客户编辑业务资料、FAQ、知识文档、转人工规则、禁止承诺和组件品牌设置。"
                        : "Admins can edit the customer business profile, FAQ, knowledge documents, handoff rules, disallowed claims, and widget brand settings."}
                    </p>
                    {record.customer_config ? (
                      <div className="mt-4">
                        <CustomerAgentConfigEditor
                          config={record.customer_config}
                          variant="admin"
                          onSaved={(updatedConfig) =>
                            setRecords((current) =>
                              current.map((item) =>
                                item.id === record.id
                                  ? { ...item, customer_config: updatedConfig }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        {language === "zh"
                          ? "该订单还没有客户配置。"
                          : "No customer configuration has been created for this order yet."}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {text.notes}
                    </h3>
                    {record.notes.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {record.notes.map((note) => (
                          <div
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                            key={note.id}
                          >
                            <p>{note.note}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {dateFormatter.format(new Date(note.created_at))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        {t("common.notProvided")}
                      </p>
                    )}
                  </div>
                </details>

                <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
                  <textarea
                    className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [record.id]: event.target.value,
                      }))
                    }
                    placeholder={text.notePlaceholder}
                    value={notes[record.id] ?? ""}
                  />
                  <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
                    <StatusSelect
                      label={text.updatePayment}
                      value={record.payment_status}
                      options={PAYMENT_STATUSES}
                      onChange={(paymentStatus) =>
                        void updateOrder(record, {
                          payment_status: paymentStatus as PaymentStatus,
                        })
                      }
                    />
                    <StatusSelect
                      label={text.updateOrder}
                      value={record.order_status}
                      options={ORDER_STATUSES}
                      onChange={(orderStatus) =>
                        void updateOrder(record, {
                          order_status: orderStatus as OrderStatus,
                        })
                      }
                    />
                    <StatusSelect
                      label={text.updateDelivery}
                      value={record.delivery_status}
                      options={DELIVERY_STATUSES}
                      onChange={(deliveryStatus) =>
                        void updateOrder(record, {
                          delivery_status: deliveryStatus as DeliveryStatus,
                        })
                      }
                    />
                    <button
                      className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 sm:col-span-3"
                      onClick={() =>
                        void updateOrder(record, {
                          note: notes[record.id] ?? "",
                        })
                      }
                      type="button"
                    >
                      {text.saveNote}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatOrderAmount(record: OrderRecord, language: "en" | "zh") {
  if (record.currency === "CNY" || language === "zh") {
    return record.amount_cny ? `¥${record.amount_cny}` : "定制报价";
  }

  return record.amount_usd ? `$${record.amount_usd}` : "Custom quote";
}

function getDeliveryDraft(record: OrderRecord, draft?: DeliveryDraft): DeliveryDraft {
  if (draft) {
    return draft;
  }

  return {
    allowedDomains: record.delivery_package?.allowed_domains?.join("\n") ?? "",
    deliveryNotes: record.delivery_package?.delivery_notes ?? "",
  };
}

function getPaymentDraft(record: OrderRecord, draft?: PaymentDraft): PaymentDraft {
  if (draft) {
    return draft;
  }

  const latestPayment = record.payments?.[0];

  return {
    note:
      typeof latestPayment?.metadata?.admin_note === "string"
        ? latestPayment.metadata.admin_note
        : "",
    proofUrl: record.payment_proof_url ?? "",
    reference: record.payment_reference ?? "",
  };
}

function getDeliveryLabels(language: "en" | "zh") {
  return language === "zh"
    ? {
        allowedDomains: "允许安装域名",
        domainHelp: "每行或用逗号填写一个域名，例如 company-domain.com。",
        domainPending: "待确认域名",
        instructions:
          "确认 license key 和允许安装的域名后，再把交付状态改为 delivered。付款确认后把客户后台链接和安装文档发给客户。",
        openDashboard: "打开客户后台",
        saveDeliveryPackage: "保存交付包",
      }
    : {
        allowedDomains: "Allowed domains",
        domainHelp: "Enter one domain per line or comma, for example company-domain.com.",
        domainPending: "Pending domain confirmation",
        instructions:
          "Review the license key and allowed domains before marking delivery as delivered. After payment is confirmed, share the customer dashboard link and installation documentation.",
        openDashboard: "Open customer dashboard",
        saveDeliveryPackage: "Save delivery package",
      };
}

function getDeliveryActionLabels(language: "en" | "zh") {
  return language === "zh"
    ? {
        deliveredNote:
          "已检查托管 Agent 链接、客户后台链接、嵌入代码、安装文档和交付备注，并标记为已交付。",
        markDelivered: "标记为已交付",
      }
    : {
        deliveredNote:
          "Marked delivered after reviewing hosted agent URL, customer dashboard URL, embed code, documentation, and delivery notes.",
        markDelivered: "Mark as delivered",
      };
}

function Textarea({
  help,
  label,
  onChange,
  value,
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        className="polished-input min-h-20 px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {help ? <span className="text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function Input({
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
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function StatusSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AdminState({ children }: { children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm text-slate-600">{children}</p>
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
