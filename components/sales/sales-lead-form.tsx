"use client";

import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

type SalesLeadFormState = {
  budget_range: string;
  business_type: string;
  contact_email: string;
  contact_method: string;
  contact_name: string;
  contact_phone: string;
  customer_type: string;
  desired_agent_function: string;
  industry: string;
  interest_level: string;
  notes: string;
  salesperson_code: string;
  source_channel: string;
  timeline: string;
  website: string;
};

const initialFormState: SalesLeadFormState = {
  budget_range: "",
  business_type: "",
  contact_email: "",
  contact_method: "",
  contact_name: "",
  contact_phone: "",
  customer_type: "",
  desired_agent_function: "",
  industry: "",
  interest_level: "",
  notes: "",
  salesperson_code: "",
  source_channel: "",
  timeline: "",
  website: "",
};

const copy = {
  en: {
    budget: "Budget range",
    businessType: "Business type",
    contactEmail: "Contact email",
    contactMethod: "Preferred contact method / WeChat",
    contactName: "Contact name",
    contactPhone: "Contact phone",
    customerType: "Customer type",
    desiredFunction: "Desired agent function",
    error: "We could not submit the sales lead. Please try again.",
    formDescription:
      "For Douyin, Xiaohongshu, WeChat, and direct outreach teams. Source and salesperson fields help track follow-up.",
    formTitle: "Sales qualification form",
    industry: "Industry",
    interestLevel: "Interest level",
    notes: "Notes",
    optional: "optional",
    salesCode: "Salesperson name/code",
    source: "Source channel",
    submit: "Submit sales lead",
    submitting: "Submitting...",
    success:
      "Sales lead submitted. The team can follow up with the right demo, plan, and delivery path.",
    timeline: "Timeline",
    validationContact: "Add email, phone, or WeChat contact details.",
    validationEmail: "Enter a valid email address.",
    validationRequired: "This field is required.",
    website: "Website or social profile",
  },
  zh: {
    budget: "预算范围",
    businessType: "业务类型",
    contactEmail: "联系邮箱",
    contactMethod: "偏好联系方式 / 微信",
    contactName: "联系人",
    contactPhone: "联系电话",
    customerType: "客户类型",
    desiredFunction: "希望 Agent 实现的功能",
    error: "销售线索提交失败，请稍后再试。",
    formDescription:
      "适合抖音、小红书、微信和私域销售团队使用。来源和销售员字段便于后续跟进。",
    formTitle: "销售线索评估表",
    industry: "行业",
    interestLevel: "兴趣等级",
    notes: "备注",
    optional: "可选",
    salesCode: "销售员姓名/代码",
    source: "来源渠道",
    submit: "提交销售线索",
    submitting: "提交中...",
    success: "销售线索已提交。团队可以根据需求匹配 Demo、套餐和交付路径。",
    timeline: "上线时间",
    validationContact: "请填写邮箱、电话或微信联系方式。",
    validationEmail: "请输入有效邮箱。",
    validationRequired: "此项必填。",
    website: "网站或社媒主页",
  },
} as const;

type LocalizedSalesLeadCopy = {
  readonly [Key in keyof (typeof copy)["en"]]: string;
};

const selectOptions = {
  budget_range: {
    en: ["Under $500", "$500-$1,500", "$1,500-$5,000", "$5,000+", "Need advice"],
    zh: ["$500 以下", "$500-$1,500", "$1,500-$5,000", "$5,000 以上", "需要建议"],
  },
  customer_type: {
    en: ["Business owner", "Marketing team", "Agency", "E-commerce team", "Other"],
    zh: ["企业主", "市场团队", "服务商/代理", "电商团队", "其他"],
  },
  interest_level: {
    en: ["Hot", "Warm", "Researching", "Not sure yet"],
    zh: ["高意向", "中等意向", "正在了解", "暂不确定"],
  },
  source_channel: {
    en: ["Douyin", "Xiaohongshu", "WeChat", "Direct outreach", "Referral", "Website"],
    zh: ["抖音", "小红书", "微信", "私域/外呼", "转介绍", "官网"],
  },
  timeline: {
    en: ["This week", "1-2 weeks", "This month", "Later", "Need advice"],
    zh: ["本周", "1-2 周", "本月", "以后", "需要建议"],
  },
} as const;

type FieldName = keyof SalesLeadFormState;

const requiredFields: FieldName[] = [
  "industry",
  "business_type",
  "website",
  "desired_agent_function",
  "budget_range",
  "timeline",
  "contact_method",
];

export function SalesLeadForm() {
  const { language } = useTranslation();
  const localizedCopy = copy[language];
  const [formState, setFormState] = useState<SalesLeadFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(false);
    setFormError("");

    const nextErrors = validateForm(formState, localizedCopy);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/sales-leads", {
        body: JSON.stringify(formState),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? localizedCopy.error);
      }

      setFormState(initialFormState);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : localizedCopy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(name: FieldName, value: string) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <form
      className="premium-card p-5 sm:p-6"
      id="sales-lead-form"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          {language === "zh" ? "销售跟进" : "Sales follow-up"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {localizedCopy.formTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {localizedCopy.formDescription}
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {localizedCopy.success}
        </div>
      ) : null}

      {formError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField
          error={errors.industry}
          label={localizedCopy.industry}
          name="industry"
          onChange={updateField}
          required
          value={formState.industry}
        />
        <TextField
          error={errors.business_type}
          label={localizedCopy.businessType}
          name="business_type"
          onChange={updateField}
          required
          value={formState.business_type}
        />
        <TextField
          error={errors.website}
          label={localizedCopy.website}
          name="website"
          onChange={updateField}
          required
          value={formState.website}
        />
        <SelectField
          error={errors.budget_range}
          label={localizedCopy.budget}
          name="budget_range"
          onChange={updateField}
          options={selectOptions.budget_range[language]}
          required
          value={formState.budget_range}
        />
        <SelectField
          error={errors.timeline}
          label={localizedCopy.timeline}
          name="timeline"
          onChange={updateField}
          options={selectOptions.timeline[language]}
          required
          value={formState.timeline}
        />
        <TextField
          error={errors.contact_method}
          label={localizedCopy.contactMethod}
          name="contact_method"
          onChange={updateField}
          required
          value={formState.contact_method}
        />
        <TextField
          error={errors.contact_name}
          label={`${localizedCopy.contactName} (${localizedCopy.optional})`}
          name="contact_name"
          onChange={updateField}
          value={formState.contact_name}
        />
        <TextField
          error={errors.contact_email}
          inputMode="email"
          label={`${localizedCopy.contactEmail} (${localizedCopy.optional})`}
          name="contact_email"
          onChange={updateField}
          value={formState.contact_email}
        />
        <TextField
          error={errors.contact_phone}
          inputMode="tel"
          label={`${localizedCopy.contactPhone} (${localizedCopy.optional})`}
          name="contact_phone"
          onChange={updateField}
          value={formState.contact_phone}
        />
        <SelectField
          label={`${localizedCopy.source} (${localizedCopy.optional})`}
          name="source_channel"
          onChange={updateField}
          options={selectOptions.source_channel[language]}
          value={formState.source_channel}
        />
        <TextField
          label={`${localizedCopy.salesCode} (${localizedCopy.optional})`}
          name="salesperson_code"
          onChange={updateField}
          value={formState.salesperson_code}
        />
        <SelectField
          label={`${localizedCopy.customerType} (${localizedCopy.optional})`}
          name="customer_type"
          onChange={updateField}
          options={selectOptions.customer_type[language]}
          value={formState.customer_type}
        />
        <SelectField
          label={`${localizedCopy.interestLevel} (${localizedCopy.optional})`}
          name="interest_level"
          onChange={updateField}
          options={selectOptions.interest_level[language]}
          value={formState.interest_level}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <TextField
          error={errors.desired_agent_function}
          label={localizedCopy.desiredFunction}
          name="desired_agent_function"
          onChange={updateField}
          required
          rows={3}
          value={formState.desired_agent_function}
        />
        <TextField
          label={`${localizedCopy.notes} (${localizedCopy.optional})`}
          name="notes"
          onChange={updateField}
          rows={3}
          value={formState.notes}
        />
      </div>

      <button
        className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? localizedCopy.submitting : localizedCopy.submit}
      </button>
    </form>
  );
}

function TextField({
  error,
  inputMode,
  label,
  name,
  onChange,
  required = false,
  rows,
  value,
}: {
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  name: FieldName;
  onChange: (name: FieldName, value: string) => void;
  required?: boolean;
  rows?: number;
  value: string;
}) {
  const fieldClassName =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <label className={rows ? "md:col-span-2" : undefined}>
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {rows ? (
        <textarea
          className={fieldClassName}
          onChange={(event) => onChange(name, event.target.value)}
          rows={rows}
          value={value}
        />
      ) : (
        <input
          className={fieldClassName}
          inputMode={inputMode}
          onChange={(event) => onChange(name, event.target.value)}
          value={value}
        />
      )}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  error,
  label,
  name,
  onChange,
  options,
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name: FieldName;
  onChange: (name: FieldName, value: string) => void;
  options: readonly string[];
  required?: boolean;
  value: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function validateForm(
  formState: SalesLeadFormState,
  localizedCopy: LocalizedSalesLeadCopy,
) {
  const errors: Partial<Record<FieldName, string>> = {};

  for (const field of requiredFields) {
    if (!formState[field].trim()) {
      errors[field] = localizedCopy.validationRequired;
    }
  }

  const hasContact =
    Boolean(formState.contact_email.trim()) ||
    Boolean(formState.contact_phone.trim()) ||
    formState.contact_method.toLowerCase().includes("wechat") ||
    formState.contact_method.includes("微信");

  if (!hasContact) {
    errors.contact_method = localizedCopy.validationContact;
  }

  if (
    formState.contact_email.trim() &&
    !/^\S+@\S+\.\S+$/.test(formState.contact_email)
  ) {
    errors.contact_email = localizedCopy.validationEmail;
  }

  return errors;
}
