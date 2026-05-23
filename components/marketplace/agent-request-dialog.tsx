"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import type { PurchaseRequestType } from "@/lib/marketplace/constants";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

type RequestFormState = {
  budgetRange: string;
  company: string;
  email: string;
  message: string;
  name: string;
  preferredContactMethod: string;
  requiredIntegrations: string;
  setupNeeds: string;
  timeline: string;
  websiteUrl: string;
  whatShouldBeCustomized: string;
};

const initialFormState: RequestFormState = {
  budgetRange: "",
  company: "",
  email: "",
  message: "",
  name: "",
  preferredContactMethod: "",
  requiredIntegrations: "",
  setupNeeds: "",
  timeline: "",
  websiteUrl: "",
  whatShouldBeCustomized: "",
};

export function AgentRequestDialog({
  agent,
  requestType,
  onClose,
}: {
  agent: DemoAgent;
  requestType: PurchaseRequestType;
  onClose: () => void;
}) {
  const { language, t } = useTranslation();
  const [form, setForm] = useState<RequestFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormState, string>>>(
    {},
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const agentTitle = language === "zh" ? agent.titleZh || agent.titleEn : agent.titleEn || agent.titleZh;

  const titleKey =
    requestType === "custom_version"
      ? "agentDetail.customVersionTitle"
      : requestType === "setup_service"
        ? "agentDetail.setupServiceTitle"
        : "agentDetail.buyAgentTitle";

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form, requestType, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/purchase-requests", {
        body: JSON.stringify({
          agent_id: agent.slug,
          agent_slug: agent.slug,
          budget_range: form.budgetRange,
          company: form.company,
          email: form.email,
          language,
          message: form.message,
          name: form.name,
          preferred_contact_method: form.preferredContactMethod,
          request_type: requestType,
          required_integrations: form.requiredIntegrations,
          setup_needs: form.setupNeeds,
          source_page: `/agents/${agent.slug}`,
          timeline: form.timeline,
          website_url: form.websiteUrl,
          what_should_be_customized: form.whatShouldBeCustomized,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Request failed.");
      }

      setStatus("success");
      setForm(initialFormState);
    } catch {
      setStatus("error");
    }
  }

  function updateField(name: keyof RequestFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
    >
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{t(titleKey)}</h2>
            <p className="mt-1 text-sm text-slate-600">{agentTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {t("agentDetail.close")}
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              {t("agentDetail.requestSubmitted")}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                href="/marketplace"
                onClick={onClose}
              >
                {t("agentDetail.backToMarketplace")}
              </Link>
              <Link
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-center text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                href="/custom-service"
                onClick={onClose}
              >
                {t("agentDetail.requestCustomService")}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submitForm} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t("forms.name")}
                required
                value={form.name}
                error={errors.name}
                onChange={(value) => updateField("name", value)}
              />
              <TextField
                label={t("forms.email")}
                required
                type="email"
                inputMode="email"
                value={form.email}
                error={errors.email}
                onChange={(value) => updateField("email", value)}
              />
            </div>

            <TextField
              label={companyLabel(requestType, t)}
              required={requestType !== "buy_agent"}
              value={form.company}
              error={errors.company}
              onChange={(value) => updateField("company", value)}
            />

            {requestType === "buy_agent" ? (
              <>
                <TextField
                  label={`${t("forms.preferredContactMethod")} ${t("forms.optional")}`}
                  value={form.preferredContactMethod}
                  error={errors.preferredContactMethod}
                  onChange={(value) => updateField("preferredContactMethod", value)}
                />
                <TextAreaField
                  label={`${t("forms.message")} ${t("forms.optional")}`}
                  value={form.message}
                  error={errors.message}
                  onChange={(value) => updateField("message", value)}
                />
              </>
            ) : null}

            {requestType === "setup_service" ? (
              <>
                <TextField
                  label={`${t("forms.websiteUrl")} ${t("forms.optional")}`}
                  type="url"
                  inputMode="url"
                  value={form.websiteUrl}
                  error={errors.websiteUrl}
                  onChange={(value) => updateField("websiteUrl", value)}
                />
                <TextAreaField
                  label={t("forms.setupNeeds")}
                  required
                  value={form.setupNeeds}
                  error={errors.setupNeeds}
                  onChange={(value) => updateField("setupNeeds", value)}
                />
                <TextField
                  label={t("forms.timeline")}
                  required
                  value={form.timeline}
                  error={errors.timeline}
                  onChange={(value) => updateField("timeline", value)}
                />
              </>
            ) : null}

            {requestType === "custom_version" ? (
              <>
                <TextAreaField
                  label={t("forms.whatShouldBeCustomized")}
                  required
                  value={form.whatShouldBeCustomized}
                  error={errors.whatShouldBeCustomized}
                  onChange={(value) => updateField("whatShouldBeCustomized", value)}
                />
                <TextAreaField
                  label={t("forms.requiredIntegrations")}
                  required
                  value={form.requiredIntegrations}
                  error={errors.requiredIntegrations}
                  onChange={(value) => updateField("requiredIntegrations", value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label={t("forms.budgetRange")}
                    required
                    value={form.budgetRange}
                    error={errors.budgetRange}
                    onChange={(value) => updateField("budgetRange", value)}
                  />
                  <TextField
                    label={t("forms.timeline")}
                    required
                    value={form.timeline}
                    error={errors.timeline}
                    onChange={(value) => updateField("timeline", value)}
                  />
                </div>
              </>
            ) : null}

            {status === "error" ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {t("agentDetail.requestFailed")}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting"
                ? t("agentDetail.submitting")
                : t("agentDetail.submitRequest")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  inputMode,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
  required?: boolean;
  type?: "email" | "text" | "url";
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        aria-invalid={Boolean(error)}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="polished-input h-11 px-3 text-slate-950"
      />
      {error ? (
        <span className="text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  error,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        aria-invalid={Boolean(error)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="polished-input min-h-28 px-3 py-2 text-slate-950"
      />
      {error ? (
        <span className="text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function companyLabel(
  requestType: PurchaseRequestType,
  t: (key: string) => string,
) {
  if (requestType === "buy_agent") {
    return `${t("forms.company")} ${t("forms.optional")}`;
  }

  return t("forms.company");
}

function validateForm(
  form: RequestFormState,
  requestType: PurchaseRequestType,
  t: (key: string) => string,
) {
  const errors: Partial<Record<keyof RequestFormState, string>> = {};

  if (!form.name.trim()) {
    errors.name = t("agentDetail.formValidationRequired");
  }

  if (!form.email.trim()) {
    errors.email = t("agentDetail.formValidationRequired");
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = t("agentDetail.formValidationEmail");
  }

  if (requestType === "buy_agent") {
    return errors;
  }

  if (!form.company.trim()) {
    errors.company = t("agentDetail.formValidationRequired");
  }

  if (requestType === "setup_service") {
    if (!form.setupNeeds.trim()) {
      errors.setupNeeds = t("agentDetail.formValidationRequired");
    }

    if (!form.timeline.trim()) {
      errors.timeline = t("agentDetail.formValidationRequired");
    }

    return errors;
  }

  if (!form.whatShouldBeCustomized.trim()) {
    errors.whatShouldBeCustomized = t("agentDetail.formValidationRequired");
  }

  if (!form.requiredIntegrations.trim()) {
    errors.requiredIntegrations = t("agentDetail.formValidationRequired");
  }

  if (!form.budgetRange.trim()) {
    errors.budgetRange = t("agentDetail.formValidationRequired");
  }

  if (!form.timeline.trim()) {
    errors.timeline = t("agentDetail.formValidationRequired");
  }

  return errors;
}
