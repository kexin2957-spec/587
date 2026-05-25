"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  CUSTOMER_CONFIG_STATUSES,
  KNOWLEDGE_DOCUMENT_TYPES,
  type CustomerConfigStatus,
  type KnowledgeDocumentType,
} from "@/lib/marketplace/constants";

export type CustomerFaqItem = {
  answer: string;
  config_id?: string;
  id: string;
  is_active: boolean;
  language: "en" | "zh";
  question: string;
};

export type KnowledgeDocument = {
  config_id?: string;
  content: string;
  document_type: KnowledgeDocumentType;
  id: string;
  is_active: boolean;
  title: string;
};

export type CustomerAgentConfig = {
  agent_slug: string;
  avatar_url: string | null;
  brand_tone: string | null;
  business_description: string;
  business_description_en: string;
  business_description_zh: string;
  business_hours: string | null;
  business_name: string;
  company_introduction?: string;
  contact_email: string;
  contact_information?: string | null;
  contact_phone: string | null;
  customer_email?: string | null;
  disallowed_claims: string | null;
  faq?: Array<{ answer: string; question: string }>;
  faq_items?: CustomerFaqItem[];
  handoff_rules: string | null;
  id: string;
  knowledge_documents?: KnowledgeDocument[];
  offline_message?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  pricing_ranges: string | null;
  pricing_ranges_en: string;
  pricing_ranges_zh: string;
  primary_color: string;
  services_or_products: string;
  services_or_products_en: string;
  services_or_products_zh: string;
  services_products?: string;
  status: CustomerConfigStatus;
  welcome_message: string;
  welcome_message_en: string;
  welcome_message_zh: string;
  website_url: string | null;
  widget_position: "bottom_left" | "bottom_right";
};

type SaveState = "error" | "idle" | "saved" | "saving";

const copy = {
  en: {
    active: "Active",
    addDocument: "Add document",
    addFaq: "Add FAQ",
    answer: "Answer",
    avatar: "Avatar/logo URL",
    brand: "Brand and widget",
    brandTone: "Brand tone",
    business: "Business information",
    businessDescription: "Company introduction",
    businessHours: "Business hours",
    businessName: "Business name",
    chineseContent: "Chinese customer-facing content",
    contactEmail: "Contact email",
    contactPhone: "Contact phone",
    delete: "Delete",
    disallowedClaims: "Disallowed claims",
    docs: "Knowledge documents",
    docsHelp:
      "Use documents for product notes, service policies, shipping/return details, and internal handoff notes approved for the runtime.",
    draft: "Draft",
    englishContent: "English customer-facing content",
    faq: "FAQ editor",
    handoffRules: "Handoff rules",
    inactive: "Inactive",
    language: "Language",
    pause: "Paused",
    pricingRanges: "Pricing ranges",
    primaryColor: "Widget color",
    question: "Question",
    save: "Save configuration",
    saved: "Configuration saved",
    saving: "Saving...",
    services: "Services / products",
    status: "Config status",
    title: "Customer agent configuration",
    welcome: "Welcome message",
    websiteUrl: "Website URL",
    widgetPosition: "Widget position",
  },
  zh: {
    active: "启用",
    addDocument: "添加文档",
    addFaq: "添加 FAQ",
    answer: "回答",
    avatar: "头像/Logo URL",
    brand: "品牌与组件",
    brandTone: "品牌语气",
    business: "业务信息",
    businessDescription: "公司介绍",
    businessHours: "营业时间",
    businessName: "业务名称",
    chineseContent: "中文客户展示内容",
    contactEmail: "联系邮箱",
    contactPhone: "联系电话",
    delete: "删除",
    disallowedClaims: "禁止承诺",
    docs: "知识文档",
    docsHelp: "可添加产品说明、服务政策、物流退换货、已批准的人工转接说明等内容。",
    draft: "草稿",
    englishContent: "英文客户展示内容",
    faq: "FAQ 编辑器",
    handoffRules: "人工转接规则",
    inactive: "停用",
    language: "语言",
    pause: "暂停",
    pricingRanges: "价格范围",
    primaryColor: "组件颜色",
    question: "问题",
    save: "保存配置",
    saved: "配置已保存",
    saving: "保存中...",
    services: "服务 / 商品",
    status: "配置状态",
    title: "客户 Agent 配置",
    welcome: "欢迎语",
    websiteUrl: "网站 URL",
    widgetPosition: "组件位置",
  },
} as const;

export function CustomerAgentConfigEditor({
  accessToken,
  config,
  onSaved,
  variant = "customer",
}: {
  accessToken?: string;
  config: CustomerAgentConfig;
  onSaved: (config: CustomerAgentConfig) => void;
  variant?: "admin" | "customer";
}) {
  const { language } = useTranslation();
  const text = copy[language];
  const localIdRef = useRef(0);
  const [draft, setDraft] = useState<CustomerAgentConfig>(() =>
    normalizeConfigForEditor(config),
  );
  const [status, setStatus] = useState<SaveState>("idle");

  const isCompact = variant === "admin";
  const activeFaqCount = useMemo(
    () => (draft.faq_items ?? []).filter((item) => item.is_active).length,
    [draft.faq_items],
  );

  function getLocalId(prefix: string) {
    localIdRef.current += 1;
    return `${prefix}-${localIdRef.current}`;
  }

  function updateField<K extends keyof CustomerAgentConfig>(
    field: K,
    value: CustomerAgentConfig[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function addFaq() {
    setDraft((current) => ({
      ...current,
      faq_items: [
        ...(current.faq_items ?? []),
        {
          answer: "",
          id: getLocalId("faq"),
          is_active: true,
          language,
          question: "",
        },
      ],
    }));
  }

  function updateFaq(id: string, updates: Partial<CustomerFaqItem>) {
    setDraft((current) => ({
      ...current,
      faq_items: (current.faq_items ?? []).map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  }

  function deleteFaq(id: string) {
    setDraft((current) => ({
      ...current,
      faq_items: (current.faq_items ?? []).filter((item) => item.id !== id),
    }));
  }

  function addDocument() {
    setDraft((current) => ({
      ...current,
      knowledge_documents: [
        ...(current.knowledge_documents ?? []),
        {
          content: "",
          document_type:
            current.agent_slug === "ecommerce-product-support-agent"
              ? "products"
              : "services",
          id: getLocalId("doc"),
          is_active: true,
          title: "",
        },
      ],
    }));
  }

  function updateDocument(id: string, updates: Partial<KnowledgeDocument>) {
    setDraft((current) => ({
      ...current,
      knowledge_documents: (current.knowledge_documents ?? []).map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  }

  function deleteDocument(id: string) {
    setDraft((current) => ({
      ...current,
      knowledge_documents: (current.knowledge_documents ?? []).filter(
        (item) => item.id !== id,
      ),
    }));
  }

  async function saveConfig() {
    setStatus("saving");
    const payload = prepareConfigForSave(draft);

    const response = await fetch("/api/customer-configs", {
      body: JSON.stringify({
        ...payload,
        access_token: accessToken,
        faq_items: payload.faq_items ?? [],
        knowledge_documents: payload.knowledge_documents ?? [],
      }),
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { "x-customer-access-token": accessToken } : {}),
      },
      method: "PATCH",
    });
    const result = (await response.json()) as {
      data?: CustomerAgentConfig;
      error?: string;
    };

    if (!response.ok || !result.data) {
      setStatus("error");
      return;
    }

    const normalized = normalizeConfigForEditor(result.data);
    setDraft(normalized);
    onSaved(normalized);
    setStatus("saved");
  }

  return (
    <section className={isCompact ? "rounded-2xl border border-slate-200 bg-white p-4" : ""}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{text.title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {activeFaqCount} FAQ / {draft.knowledge_documents?.length ?? 0} docs
          </p>
        </div>
        <button
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={status === "saving"}
          onClick={() => void saveConfig()}
          type="button"
        >
          {status === "saving" ? text.saving : status === "saved" ? text.saved : text.save}
        </button>
      </div>

      {status === "error" ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Save failed. Please try again.
        </p>
      ) : null}

      <div className="mt-5 grid gap-5">
        <Panel title={text.business}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={text.businessName}
              value={draft.business_name}
              onChange={(value) => updateField("business_name", value)}
            />
            <Input
              label={text.websiteUrl}
              value={draft.website_url ?? ""}
              onChange={(value) => updateField("website_url", value)}
            />
            <Input
              label={text.contactEmail}
              value={draft.contact_email}
              onChange={(value) => updateField("contact_email", value)}
            />
            <Input
              label={text.contactPhone}
              value={draft.contact_phone ?? ""}
              onChange={(value) => updateField("contact_phone", value)}
            />
            <Input
              label={text.businessHours}
              value={draft.business_hours ?? ""}
              onChange={(value) => updateField("business_hours", value)}
            />
            <Select
              label={text.status}
              value={draft.status}
              options={CUSTOMER_CONFIG_STATUSES}
              onChange={(value) => updateField("status", value as CustomerConfigStatus)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <LanguageContentPanel title={text.englishContent}>
              <Textarea
                label={text.businessDescription}
                value={draft.business_description_en}
                onChange={(value) => updateField("business_description_en", value)}
              />
              <Textarea
                label={text.services}
                value={draft.services_or_products_en}
                onChange={(value) => updateField("services_or_products_en", value)}
              />
              <Textarea
                label={text.pricingRanges}
                value={draft.pricing_ranges_en}
                onChange={(value) => updateField("pricing_ranges_en", value)}
              />
              <Input
                label={text.welcome}
                value={draft.welcome_message_en}
                onChange={(value) => updateField("welcome_message_en", value)}
              />
            </LanguageContentPanel>
            <LanguageContentPanel title={text.chineseContent}>
              <Textarea
                label={text.businessDescription}
                value={draft.business_description_zh}
                onChange={(value) => updateField("business_description_zh", value)}
              />
              <Textarea
                label={text.services}
                value={draft.services_or_products_zh}
                onChange={(value) => updateField("services_or_products_zh", value)}
              />
              <Textarea
                label={text.pricingRanges}
                value={draft.pricing_ranges_zh}
                onChange={(value) => updateField("pricing_ranges_zh", value)}
              />
              <Input
                label={text.welcome}
                value={draft.welcome_message_zh}
                onChange={(value) => updateField("welcome_message_zh", value)}
              />
            </LanguageContentPanel>
          </div>
        </Panel>

        <Panel title={text.faq}>
          <div className="grid gap-3">
            {(draft.faq_items ?? []).map((item) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={item.id}
              >
                <div className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto] md:items-end">
                  <Input
                    label={text.question}
                    value={item.question}
                    onChange={(value) => updateFaq(item.id, { question: value })}
                  />
                  <Select
                    label={text.language}
                    value={item.language}
                    options={["en", "zh"] as const}
                    onChange={(value) => updateFaq(item.id, { language: value as "en" | "zh" })}
                  />
                  <button
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                    onClick={() => updateFaq(item.id, { is_active: !item.is_active })}
                    type="button"
                  >
                    {item.is_active ? text.active : text.inactive}
                  </button>
                  <button
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteFaq(item.id)}
                    type="button"
                  >
                    {text.delete}
                  </button>
                </div>
                <Textarea
                  label={text.answer}
                  value={item.answer}
                  onChange={(value) => updateFaq(item.id, { answer: value })}
                />
              </div>
            ))}
          </div>
          <button
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            onClick={addFaq}
            type="button"
          >
            {text.addFaq}
          </button>
        </Panel>

        <Panel title={text.docs} help={text.docsHelp}>
          <div className="grid gap-3">
            {(draft.knowledge_documents ?? []).map((item) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={item.id}
              >
                <div className="grid gap-3 md:grid-cols-[1fr_160px_auto_auto] md:items-end">
                  <Input
                    label="Title"
                    value={item.title}
                    onChange={(value) => updateDocument(item.id, { title: value })}
                  />
                  <Select
                    label="Type"
                    value={item.document_type}
                    options={KNOWLEDGE_DOCUMENT_TYPES}
                    onChange={(value) =>
                      updateDocument(item.id, {
                        document_type: value as KnowledgeDocumentType,
                      })
                    }
                  />
                  <button
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                    onClick={() =>
                      updateDocument(item.id, { is_active: !item.is_active })
                    }
                    type="button"
                  >
                    {item.is_active ? text.active : text.inactive}
                  </button>
                  <button
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteDocument(item.id)}
                    type="button"
                  >
                    {text.delete}
                  </button>
                </div>
                <Textarea
                  label="Content"
                  value={item.content}
                  onChange={(value) => updateDocument(item.id, { content: value })}
                />
              </div>
            ))}
          </div>
          <button
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            onClick={addDocument}
            type="button"
          >
            {text.addDocument}
          </button>
        </Panel>

        <Panel title={text.brand}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={text.primaryColor}
              type="color"
              value={draft.primary_color || "#2563eb"}
              onChange={(value) => updateField("primary_color", value)}
            />
            <Select
              label={text.widgetPosition}
              value={draft.widget_position}
              options={["bottom_right", "bottom_left"] as const}
              onChange={(value) =>
                updateField("widget_position", value as "bottom_left" | "bottom_right")
              }
            />
            <Input
              label={text.avatar}
              value={draft.avatar_url ?? ""}
              onChange={(value) => updateField("avatar_url", value)}
            />
          </div>
          <Textarea
            label={text.brandTone}
            value={draft.brand_tone ?? ""}
            onChange={(value) => updateField("brand_tone", value)}
          />
          <Textarea
            label={text.handoffRules}
            value={draft.handoff_rules ?? ""}
            onChange={(value) => updateField("handoff_rules", value)}
          />
          <Textarea
            label={text.disallowedClaims}
            value={draft.disallowed_claims ?? ""}
            onChange={(value) => updateField("disallowed_claims", value)}
          />
        </Panel>
      </div>
    </section>
  );
}

function normalizeConfigForEditor(config: CustomerAgentConfig): CustomerAgentConfig {
  const faqItems =
    config.faq_items?.length
      ? config.faq_items
      : (config.faq ?? []).map((item, index) => ({
          answer: item.answer,
          id: `faq-seed-${index}`,
          is_active: true,
          language: "en" as const,
          question: item.question,
        }));
  const businessDescription =
    config.business_description || config.company_introduction || "";
  const servicesOrProducts =
    config.services_or_products || config.services_products || "";
  const welcomeMessage = config.welcome_message || "";

  return {
    ...config,
    brand_tone: config.brand_tone ?? "",
    business_description: businessDescription,
    business_description_en:
      config.business_description_en || businessDescription,
    business_description_zh: config.business_description_zh || "",
    contact_phone: config.contact_phone ?? "",
    faq_items: faqItems,
    knowledge_documents: config.knowledge_documents ?? [],
    pricing_ranges: config.pricing_ranges ?? "",
    pricing_ranges_en: config.pricing_ranges_en || config.pricing_ranges || "",
    pricing_ranges_zh: config.pricing_ranges_zh || "",
    services_or_products: servicesOrProducts,
    services_or_products_en:
      config.services_or_products_en || servicesOrProducts,
    services_or_products_zh: config.services_or_products_zh || "",
    status: config.status ?? "draft",
    welcome_message: welcomeMessage,
    welcome_message_en: config.welcome_message_en || welcomeMessage,
    welcome_message_zh: config.welcome_message_zh || "",
    website_url: config.website_url ?? "",
  };
}

function prepareConfigForSave(config: CustomerAgentConfig): CustomerAgentConfig {
  const businessDescription =
    config.business_description_en.trim() ||
    config.business_description_zh.trim() ||
    config.business_description;
  const servicesOrProducts =
    config.services_or_products_en.trim() ||
    config.services_or_products_zh.trim() ||
    config.services_or_products;
  const pricingRanges =
    config.pricing_ranges_en.trim() ||
    config.pricing_ranges_zh.trim() ||
    config.pricing_ranges ||
    "";
  const welcomeMessage =
    config.welcome_message_en.trim() ||
    config.welcome_message_zh.trim() ||
    config.welcome_message;

  return {
    ...config,
    business_description: businessDescription,
    company_introduction: businessDescription,
    pricing_ranges: pricingRanges,
    services_or_products: servicesOrProducts,
    services_products: servicesOrProducts,
    welcome_message: welcomeMessage,
  };
}

function Panel({
  children,
  help,
  title,
}: {
  children: React.ReactNode;
  help?: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {help ? <p className="mt-1 text-sm leading-6 text-slate-600">{help}</p> : null}
      </div>
      {children}
    </section>
  );
}

function LanguageContentPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {children}
    </div>
  );
}

function Input({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "color" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        className={type === "color" ? "h-11 rounded-xl border border-slate-200 bg-white p-1" : "polished-input px-3 py-2 text-sm text-slate-950"}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <select
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value as T)}
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

function Textarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <textarea
        className="polished-input min-h-28 px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
