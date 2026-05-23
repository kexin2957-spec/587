"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

const initialFormState = {
  agent_goal: "",
  budget_range: "",
  company_name: "",
  contact_email: "",
  contact_name: "",
  contact_phone: "",
  existing_website: "",
  has_documents: false,
  industry: "",
  notes: "",
  required_integrations: "",
  timeline: "",
};

type FormState = typeof initialFormState;
type TextFieldName = Exclude<keyof FormState, "has_documents">;

const requiredTextFields: TextFieldName[] = [
  "industry",
  "company_name",
  "agent_goal",
  "existing_website",
  "required_integrations",
  "budget_range",
  "timeline",
  "contact_name",
  "contact_email",
];

const fieldLabelKeys: Record<TextFieldName, string> = {
  agent_goal: "forms.agentGoal",
  budget_range: "forms.budgetRange",
  company_name: "forms.companyName",
  contact_email: "forms.contactEmail",
  contact_name: "forms.contactName",
  contact_phone: "forms.contactPhone",
  existing_website: "forms.existingWebsite",
  industry: "forms.industry",
  notes: "forms.notes",
  required_integrations: "forms.requiredIntegrations",
  timeline: "forms.timeline",
};

const textAreaFields = new Set<TextFieldName>([
  "agent_goal",
  "notes",
  "required_integrations",
]);

export function CustomRequestForm() {
  const { language, t } = useTranslation();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(false);
    setFormError("");

    const nextErrors = validateForm(formState, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/custom-requests", {
        body: JSON.stringify({
          ...formState,
          language,
          source_page: "/custom-service",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || t("customService.requestFailed"));
      }

      setFormState(initialFormState);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t("customService.requestFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(name: TextFieldName, value: string) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <form
      id="custom-request-form"
      onSubmit={handleSubmit}
      className="premium-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {t("customService.formTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("customService.formDescription")}
          </p>
        </div>
        <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          {t("customService.reviewPromise")}
        </span>
      </div>

      {isSubmitted ? (
        <div
          data-testid="custom-request-success"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <p className="text-sm font-medium text-emerald-800">
            {t("customService.successMessage")}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
              href="/marketplace"
            >
              {t("agentDetail.backToMarketplace")}
            </Link>
            <Link
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-center text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
              href="/custom-service"
            >
              {t("agentDetail.requestCustomService")}
            </Link>
          </div>
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
          label={t(fieldLabelKeys.industry)}
          name="industry"
          onChange={updateField}
          required
          value={formState.industry}
        />
        <TextField
          error={errors.company_name}
          label={t(fieldLabelKeys.company_name)}
          name="company_name"
          onChange={updateField}
          required
          value={formState.company_name}
        />
        <TextField
          error={errors.existing_website}
          label={t(fieldLabelKeys.existing_website)}
          name="existing_website"
          onChange={updateField}
          required
          value={formState.existing_website}
        />
        <TextField
          error={errors.budget_range}
          label={t(fieldLabelKeys.budget_range)}
          name="budget_range"
          onChange={updateField}
          required
          value={formState.budget_range}
        />
        <TextField
          error={errors.timeline}
          label={t(fieldLabelKeys.timeline)}
          name="timeline"
          onChange={updateField}
          required
          value={formState.timeline}
        />
        <TextField
          error={errors.contact_name}
          label={t(fieldLabelKeys.contact_name)}
          name="contact_name"
          onChange={updateField}
          required
          value={formState.contact_name}
        />
        <TextField
          error={errors.contact_email}
          inputMode="email"
          label={t(fieldLabelKeys.contact_email)}
          name="contact_email"
          onChange={updateField}
          required
          value={formState.contact_email}
        />
        <TextField
          error={errors.contact_phone}
          inputMode="tel"
          label={`${t(fieldLabelKeys.contact_phone)} ${t("forms.optional")}`}
          name="contact_phone"
          onChange={updateField}
          value={formState.contact_phone}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <TextField
          error={errors.agent_goal}
          label={t(fieldLabelKeys.agent_goal)}
          name="agent_goal"
          onChange={updateField}
          required
          value={formState.agent_goal}
        />
        <TextField
          error={errors.required_integrations}
          label={t(fieldLabelKeys.required_integrations)}
          name="required_integrations"
          onChange={updateField}
          required
          value={formState.required_integrations}
        />
        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <span className="flex items-start gap-3">
            <input
              checked={formState.has_documents}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
              data-testid="custom-request-has-documents"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  has_documents: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              <span className="font-medium text-slate-800">
                {t("forms.hasDocuments")}
              </span>
              <span className="mt-1 block text-slate-600">
                {t("customService.documentsHelp")}
              </span>
            </span>
          </span>
        </label>
        <TextField
          error={errors.notes}
          label={`${t(fieldLabelKeys.notes)} ${t("forms.optional")}`}
          name="notes"
          onChange={updateField}
          value={formState.notes}
        />
      </div>

      <button
        className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t("customService.submitting") : t("customService.submit")}
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
  const isTextArea = textAreaFields.has(name);
  const inputClassName =
    "polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950";

  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {isTextArea ? (
        <textarea
          aria-invalid={Boolean(error)}
          className={`${inputClassName} min-h-28`}
          data-testid={`custom-request-${name}`}
          onChange={(event) => onChange(name, event.target.value)}
          value={value}
        />
      ) : (
        <input
          aria-invalid={Boolean(error)}
          className={inputClassName}
          data-testid={`custom-request-${name}`}
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

function validateForm(
  formState: FormState,
  t: (key: string) => string,
): Partial<Record<keyof FormState, string>> {
  const nextErrors: Partial<Record<keyof FormState, string>> = {};

  for (const field of requiredTextFields) {
    if (!formState[field].trim()) {
      nextErrors[field] = t("customService.validationRequired");
    }
  }

  if (
    formState.contact_email.trim() &&
    !/^\S+@\S+\.\S+$/.test(formState.contact_email)
  ) {
    nextErrors.contact_email = t("customService.validationEmail");
  }

  return nextErrors;
}
