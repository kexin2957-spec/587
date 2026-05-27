"use client";

import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

const initialFormState = {
  email: "",
  expertise: "",
  name: "",
  notes: "",
  offers_custom_services: false,
  originality_confirmed: false,
  payout_preference: "",
  planned_agent_types: "",
  seller_terms_agreed: false,
  team_name: "",
  website: "",
};

type FormState = typeof initialFormState;
type CheckboxFieldName =
  | "offers_custom_services"
  | "originality_confirmed"
  | "seller_terms_agreed";
type TextFieldName = Exclude<keyof FormState, CheckboxFieldName>;

const requiredFields: TextFieldName[] = ["name", "email", "expertise", "planned_agent_types"];

const textareaFields = new Set<TextFieldName>([
  "expertise",
  "notes",
  "planned_agent_types",
]);

const formCopy = {
  en: {
    applicationFailed:
      "We could not submit your seller application. Please try again.",
    applicationSubmitted:
      "Your seller application has been submitted. We will review it soon.",
    copyrightHelp:
      "You confirm the agents you plan to sell are original, licensed, or otherwise cleared for marketplace sale.",
    copyrightLabel: "Originality and copyright confirmation",
    customServicesHelp:
      "Check this if you can deliver custom versions, setup, or business-specific implementation.",
    email: "Email",
    expertise: "Expertise",
    formDescription:
      "Seller applications are reviewed before agents can be published publicly.",
    formTitle: "Seller application form",
    name: "Name",
    notes: "Notes",
    offersCustomServices: "Offer custom services",
    optional: "(optional)",
    payoutPreference: "Payout preference",
    plannedAgentTypes: "Planned agent types",
    submitApplication: "Submit application",
    submitting: "Submitting...",
    teamName: "Team name",
    termsHelp:
      "You agree to platform review, commission rules, safety standards, and seller conduct requirements.",
    termsLabel: "I agree to the seller terms",
    validationEmail: "Please enter a valid email address.",
    validationRequired: "This field is required.",
    website: "Website / portfolio",
  },
  zh: {
    applicationFailed: "创作者申请提交失败，请稍后再试。",
    applicationSubmitted: "你的创作者申请已经提交，我们会尽快审核。",
    copyrightHelp:
      "你确认计划销售的 Agent 为原创、已获得授权，或具备在平台销售所需的合法权利。",
    copyrightLabel: "原创与版权确认",
    customServicesHelp:
      "如果你可以提供定制版本、部署配置或企业实施服务，请勾选此项。",
    email: "邮箱",
    expertise: "专业领域",
    formDescription: "创作者申请需要先审核，通过后才可以公开发布 Agent。",
    formTitle: "创作者申请表",
    name: "姓名",
    notes: "备注",
    offersCustomServices: "提供定制服务",
    optional: "（选填）",
    payoutPreference: "收款偏好",
    plannedAgentTypes: "计划上传的 Agent 类型",
    submitApplication: "提交申请",
    submitting: "提交中...",
    teamName: "团队名称",
    termsHelp: "你同意平台审核、佣金规则、安全标准和创作者行为要求。",
    termsLabel: "我同意创作者条款",
    validationEmail: "请输入有效邮箱地址。",
    validationRequired: "请填写此字段。",
    website: "网站 / 作品集",
  },
};

export function SellerApplicationForm() {
  const { language, t: dictionaryT } = useTranslation();
  const t = (key: string) =>
    formCopy[language][key as keyof (typeof formCopy)["en"]] ?? dictionaryT(key);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSubmitted(false);

    const nextErrors = validateForm(formState, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/seller-applications", {
        body: JSON.stringify(formState),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || t("applicationFailed"));
      }

      setFormState(initialFormState);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t("applicationFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(name: TextFieldName, value: string) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateCheckbox(name: CheckboxFieldName, value: boolean) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <form
      id="seller-application-form"
      className="premium-card p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold text-slate-950">
        {t("formTitle")}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t("formDescription")}
      </p>

      {isSubmitted ? (
        <div
          data-testid="seller-application-success"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {t("applicationSubmitted")}
        </div>
      ) : null}

      {formError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField
          error={errors.name}
          label={t("name")}
          name="name"
          onChange={updateField}
          required
          value={formState.name}
        />
        <TextField
          error={errors.team_name}
          label={`${t("teamName")} ${t("optional")}`}
          name="team_name"
          onChange={updateField}
          value={formState.team_name}
        />
        <TextField
          error={errors.email}
          inputMode="email"
          label={t("email")}
          name="email"
          onChange={updateField}
          required
          value={formState.email}
        />
        <TextField
          error={errors.website}
          inputMode="url"
          label={`${t("website")} ${t("optional")}`}
          name="website"
          onChange={updateField}
          value={formState.website}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <TextField
          error={errors.expertise}
          label={t("expertise")}
          name="expertise"
          onChange={updateField}
          required
          value={formState.expertise}
        />
        <TextField
          error={errors.planned_agent_types}
          label={t("plannedAgentTypes")}
          name="planned_agent_types"
          onChange={updateField}
          required
          value={formState.planned_agent_types}
        />
        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <span className="flex items-start gap-3">
            <input
              checked={formState.offers_custom_services}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
              data-testid="seller-application-offers-custom"
              onChange={(event) =>
                updateCheckbox("offers_custom_services", event.target.checked)
              }
              type="checkbox"
            />
            <span>
              <span className="font-medium text-slate-800">
                {t("offersCustomServices")}
              </span>
              <span className="mt-1 block text-slate-600">
                {t("customServicesHelp")}
              </span>
            </span>
          </span>
        </label>
        <TextField
          error={errors.payout_preference}
          label={`${t("payoutPreference")} ${t("optional")}`}
          name="payout_preference"
          onChange={updateField}
          value={formState.payout_preference}
        />
        <TextField
          error={errors.notes}
          label={`${t("notes")} ${t("optional")}`}
          name="notes"
          onChange={updateField}
          value={formState.notes}
        />
        <ConsentCheckbox
          checked={formState.seller_terms_agreed}
          description={t("termsHelp")}
          error={errors.seller_terms_agreed}
          label={t("termsLabel")}
          name="seller_terms_agreed"
          onChange={updateCheckbox}
          required
        />
        <ConsentCheckbox
          checked={formState.originality_confirmed}
          description={t("copyrightHelp")}
          error={errors.originality_confirmed}
          label={t("copyrightLabel")}
          name="originality_confirmed"
          onChange={updateCheckbox}
          required
        />
      </div>

      <button
        className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t("submitting") : t("submitApplication")}
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
  value,
}: {
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  name: TextFieldName;
  onChange: (name: TextFieldName, value: string) => void;
  required?: boolean;
  value: string;
}) {
  const isTextarea = textareaFields.has(name);
  const inputClassName =
    "polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950";

  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {isTextarea ? (
        <textarea
          aria-invalid={Boolean(error)}
          className={`${inputClassName} min-h-28`}
          data-testid={`seller-application-${name}`}
          onChange={(event) => onChange(name, event.target.value)}
          value={value}
        />
      ) : (
        <input
          aria-invalid={Boolean(error)}
          className={inputClassName}
          data-testid={`seller-application-${name}`}
          inputMode={inputMode}
          onChange={(event) => onChange(name, event.target.value)}
          type="text"
          value={value}
        />
      )}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function ConsentCheckbox({
  checked,
  description,
  error,
  label,
  name,
  onChange,
  required = false,
}: {
  checked: boolean;
  description: string;
  error?: string;
  label: string;
  name: CheckboxFieldName;
  onChange: (name: CheckboxFieldName, value: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <span className="flex items-start gap-3">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
          data-testid={`seller-application-${name}`}
          onChange={(event) => onChange(name, event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="font-medium text-slate-800">
            {label}
            {required ? <span className="text-red-600"> *</span> : null}
          </span>
          <span className="mt-1 block text-slate-600">{description}</span>
          {error ? (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {error}
            </span>
          ) : null}
        </span>
      </span>
    </label>
  );
}

function validateForm(
  formState: FormState,
  t: (key: string) => string,
): Partial<Record<keyof FormState, string>> {
  const nextErrors: Partial<Record<keyof FormState, string>> = {};

  for (const field of requiredFields) {
    if (!formState[field].trim()) {
      nextErrors[field] = t("validationRequired");
    }
  }

  if (formState.email.trim() && !/^\S+@\S+\.\S+$/.test(formState.email)) {
    nextErrors.email = t("validationEmail");
  }

  if (!formState.seller_terms_agreed) {
    nextErrors.seller_terms_agreed = t("validationRequired");
  }

  if (!formState.originality_confirmed) {
    nextErrors.originality_confirmed = t("validationRequired");
  }

  return nextErrors;
}
