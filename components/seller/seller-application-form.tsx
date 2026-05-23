"use client";

import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";

const initialFormState = {
  email: "",
  expertise: "",
  name: "",
  notes: "",
  offers_custom_services: false,
  payout_preference: "",
  planned_agent_types: "",
  team_name: "",
  website: "",
};

type FormState = typeof initialFormState;
type TextFieldName = Exclude<keyof FormState, "offers_custom_services">;

const requiredFields: TextFieldName[] = ["name", "email", "expertise", "planned_agent_types"];

const fieldLabelKeys: Record<TextFieldName, string> = {
  email: "forms.email",
  expertise: "forms.expertise",
  name: "forms.name",
  notes: "forms.notes",
  payout_preference: "forms.payoutPreference",
  planned_agent_types: "forms.plannedAgentTypes",
  team_name: "forms.teamName",
  website: "forms.website",
};

const textareaFields = new Set<TextFieldName>([
  "expertise",
  "notes",
  "planned_agent_types",
]);

export function SellerApplicationForm() {
  const { t } = useTranslation();
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
        throw new Error(result?.error || t("seller.applicationFailed"));
      }

      setFormState(initialFormState);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t("seller.applicationFailed"),
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
      id="seller-application-form"
      className="premium-card p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold text-slate-950">
        {t("seller.formTitle")}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t("seller.formDescription")}
      </p>

      {isSubmitted ? (
        <div
          data-testid="seller-application-success"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {t("seller.applicationSubmitted")}
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
          label={t(fieldLabelKeys.name)}
          name="name"
          onChange={updateField}
          required
          value={formState.name}
        />
        <TextField
          error={errors.team_name}
          label={`${t(fieldLabelKeys.team_name)} ${t("forms.optional")}`}
          name="team_name"
          onChange={updateField}
          value={formState.team_name}
        />
        <TextField
          error={errors.email}
          inputMode="email"
          label={t(fieldLabelKeys.email)}
          name="email"
          onChange={updateField}
          required
          value={formState.email}
        />
        <TextField
          error={errors.website}
          inputMode="url"
          label={`${t(fieldLabelKeys.website)} ${t("forms.optional")}`}
          name="website"
          onChange={updateField}
          value={formState.website}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <TextField
          error={errors.expertise}
          label={t(fieldLabelKeys.expertise)}
          name="expertise"
          onChange={updateField}
          required
          value={formState.expertise}
        />
        <TextField
          error={errors.planned_agent_types}
          label={t(fieldLabelKeys.planned_agent_types)}
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
                setFormState((current) => ({
                  ...current,
                  offers_custom_services: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>
              <span className="font-medium text-slate-800">
                {t("forms.offersCustomServices")}
              </span>
              <span className="mt-1 block text-slate-600">
                {t("seller.customServicesHelp")}
              </span>
            </span>
          </span>
        </label>
        <TextField
          error={errors.payout_preference}
          label={`${t(fieldLabelKeys.payout_preference)} ${t("forms.optional")}`}
          name="payout_preference"
          onChange={updateField}
          value={formState.payout_preference}
        />
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
        {isSubmitting ? t("seller.submitting") : t("seller.submitApplication")}
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

function validateForm(
  formState: FormState,
  t: (key: string) => string,
): Partial<Record<keyof FormState, string>> {
  const nextErrors: Partial<Record<keyof FormState, string>> = {};

  for (const field of requiredFields) {
    if (!formState[field].trim()) {
      nextErrors[field] = t("seller.validationRequired");
    }
  }

  if (formState.email.trim() && !/^\S+@\S+\.\S+$/.test(formState.email)) {
    nextErrors.email = t("seller.validationEmail");
  }

  return nextErrors;
}
