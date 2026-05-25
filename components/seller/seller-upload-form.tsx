"use client";

import { useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { demoCategories } from "@/lib/marketplace/demo-data";
import { DELIVERY_TYPES, PRICING_TYPES } from "@/lib/marketplace/constants";
import type {
  DeliveryType,
  PricingType,
  SupportedLanguage,
} from "@/lib/marketplace/constants";

const initialFormState = {
  category_slug: "",
  changelog_en: "",
  changelog_zh: "",
  data_permissions_en: "",
  data_permissions_zh: "",
  delivery_type: "" as DeliveryType | "",
  demo_enabled: false,
  demo_url: "",
  description_en: "",
  description_zh: "",
  faq_en: "",
  faq_zh: "",
  features_en: "",
  features_zh: "",
  price_cny: "",
  price_usd: "",
  pricing_type: "" as PricingType | "",
  rights_confirmed: false,
  screenshot_urls: "",
  seller_email: "",
  setup_instructions_en: "",
  setup_instructions_zh: "",
  short_description_en: "",
  short_description_zh: "",
  supported_languages: ["en", "zh"] as SupportedLanguage[],
  tags: "",
  title_en: "",
  title_zh: "",
  version: "1.0.0",
  video_url: "",
};

type FormState = typeof initialFormState;
type ErrorState = Partial<Record<keyof FormState | "language_version", string>>;

const pricingLabelKeys: Record<PricingType, string> = {
  custom_quote: "marketplace.customQuote",
  free: "marketplace.free",
  monthly: "seller.monthly",
  one_time: "seller.oneTime",
};

const deliveryLabelKeys: Record<DeliveryType, string> = {
  custom_business_agent: "marketplace.customBusinessAgent",
  hosted_agent: "marketplace.hostedAgent",
  prompt_template: "marketplace.promptTemplate",
  website_chatbot: "marketplace.websiteChatbot",
  workflow_template: "marketplace.workflowTemplate",
};

export function SellerUploadForm() {
  const { language, t } = useTranslation();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<ErrorState>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"draft" | "submitted">(
    "submitted",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSubmitted(false);
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const nextSubmitStatus =
      nativeEvent.submitter instanceof HTMLButtonElement &&
      nativeEvent.submitter.dataset.status === "draft"
        ? "draft"
        : "submitted";
    setSubmitStatus(nextSubmitStatus);

    const nextErrors = validateForm(formState, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/seller-agents", {
        body: JSON.stringify(toPayload(formState, nextSubmitStatus)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(result?.error || t("seller.uploadFailed"));
      }

      setFormState(initialFormState);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("seller.uploadFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(
    name: Exclude<keyof FormState, "demo_enabled" | "rights_confirmed" | "supported_languages">,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function toggleSupportedLanguage(nextLanguage: SupportedLanguage) {
    setFormState((current) => {
      const hasLanguage = current.supported_languages.includes(nextLanguage);
      return {
        ...current,
        supported_languages: hasLanguage
          ? current.supported_languages.filter((item) => item !== nextLanguage)
          : [...current.supported_languages, nextLanguage],
      };
    });
    setErrors((current) => ({ ...current, supported_languages: undefined }));
  }

  return (
    <form
      className="grid gap-6"
      data-testid="seller-upload-form"
      onSubmit={handleSubmit}
    >
      {isSubmitted ? (
        <div
          data-testid="seller-upload-success"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {t("seller.uploadSubmitted")}
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      ) : null}

      <FormSection
        description={t("seller.uploadSellerDescription")}
        title={t("seller.uploadSellerTitle")}
      >
        <TextField
          error={errors.seller_email}
          inputMode="email"
          label={t("forms.sellerEmail")}
          name="seller_email"
          onChange={updateField}
          required
          value={formState.seller_email}
        />
      </FormSection>

      <FormSection
        description={t("seller.uploadContentDescription")}
        title={t("seller.uploadContentTitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.title_en}
            label={t("forms.agentTitleEn")}
            name="title_en"
            onChange={updateField}
            value={formState.title_en}
          />
          <TextField
            error={errors.title_zh}
            label={t("forms.agentTitleZh")}
            name="title_zh"
            onChange={updateField}
            value={formState.title_zh}
          />
          <TextField
            error={errors.short_description_en}
            label={t("forms.shortDescriptionEn")}
            name="short_description_en"
            onChange={updateField}
            value={formState.short_description_en}
          />
          <TextField
            error={errors.short_description_zh}
            label={t("forms.shortDescriptionZh")}
            name="short_description_zh"
            onChange={updateField}
            value={formState.short_description_zh}
          />
        </div>
        <TextArea
          error={errors.description_en}
          label={t("forms.fullDescriptionEn")}
          name="description_en"
          onChange={updateField}
          value={formState.description_en}
        />
        <TextArea
          error={errors.description_zh}
          label={t("forms.fullDescriptionZh")}
          name="description_zh"
          onChange={updateField}
          value={formState.description_zh}
        />
        {errors.language_version ? (
          <p className="text-sm font-medium text-red-600">
            {errors.language_version}
          </p>
        ) : null}
      </FormSection>

      <FormSection
        description={t("seller.uploadBusinessDescription")}
        title={t("seller.uploadBusinessTitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-slate-700">
              {t("forms.category")} <span className="text-red-600">*</span>
            </span>
            <select
              aria-invalid={Boolean(errors.category_slug)}
              className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
              data-testid="seller-upload-category"
              onChange={(event) => updateField("category_slug", event.target.value)}
              value={formState.category_slug}
            >
              <option value="">{t("seller.selectCategory")}</option>
              {demoCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {language === "zh" ? category.nameZh : category.nameEn}
                </option>
              ))}
            </select>
            {errors.category_slug ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.category_slug}
              </p>
            ) : null}
          </label>

          <label className="text-sm">
            <span className="font-medium text-slate-700">
              {t("forms.deliveryType")} <span className="text-red-600">*</span>
            </span>
            <select
              aria-invalid={Boolean(errors.delivery_type)}
              className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
              data-testid="seller-upload-delivery"
              onChange={(event) =>
                updateField("delivery_type", event.target.value)
              }
              value={formState.delivery_type}
            >
              <option value="">{t("seller.selectDeliveryType")}</option>
              {DELIVERY_TYPES.map((deliveryType) => (
                <option key={deliveryType} value={deliveryType}>
                  {t(deliveryLabelKeys[deliveryType])}
                </option>
              ))}
            </select>
            {errors.delivery_type ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.delivery_type}
              </p>
            ) : null}
          </label>
        </div>

        <TextField
          error={errors.tags}
          label={`${t("forms.tags")} ${t("forms.optional")}`}
          name="tags"
          onChange={updateField}
          value={formState.tags}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-slate-700">
              {t("forms.pricingType")} <span className="text-red-600">*</span>
            </span>
            <select
              aria-invalid={Boolean(errors.pricing_type)}
              className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
              data-testid="seller-upload-pricing"
              onChange={(event) => updateField("pricing_type", event.target.value)}
              value={formState.pricing_type}
            >
              <option value="">{t("seller.selectPricingType")}</option>
              {PRICING_TYPES.map((pricingType) => (
                <option key={pricingType} value={pricingType}>
                  {t(pricingLabelKeys[pricingType])}
                </option>
              ))}
            </select>
            {errors.pricing_type ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.pricing_type}
              </p>
            ) : null}
          </label>
          <TextField
            error={errors.price_usd}
            inputMode="decimal"
            label={t("forms.priceUsd")}
            name="price_usd"
            onChange={updateField}
            value={formState.price_usd}
          />
          <TextField
            error={errors.price_cny}
            inputMode="decimal"
            label={t("forms.priceCny")}
            name="price_cny"
            onChange={updateField}
            value={formState.price_cny}
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            {t("forms.supportedLanguages")} <span className="text-red-600">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {(["en", "zh"] as SupportedLanguage[]).map((item) => (
              <label
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                key={item}
              >
                <input
                  checked={formState.supported_languages.includes(item)}
                  data-testid={`seller-upload-language-${item}`}
                  onChange={() => toggleSupportedLanguage(item)}
                  type="checkbox"
                />
                {item === "en" ? t("common.english") : t("common.chinese")}
              </label>
            ))}
          </div>
          {errors.supported_languages ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.supported_languages}
            </p>
          ) : null}
        </fieldset>
      </FormSection>

      <FormSection
        description={t("seller.uploadDemoDescription")}
        title={t("seller.uploadDemoTitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.demo_url}
            inputMode="url"
            label={`${t("forms.demoUrl")} ${t("forms.optional")}`}
            name="demo_url"
            onChange={updateField}
            value={formState.demo_url}
          />
          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <span className="flex items-start gap-3">
              <input
                checked={formState.demo_enabled}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
                data-testid="seller-upload-demo-enabled"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    demo_enabled: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="font-medium text-slate-800">
                {t("forms.demoEnabled")}
              </span>
            </span>
          </label>
        </div>
        <TextArea
          error={errors.screenshot_urls}
          label={`${t("forms.screenshots")} ${t("forms.optional")}`}
          name="screenshot_urls"
          onChange={updateField}
          value={formState.screenshot_urls}
        />
        <TextField
          error={errors.video_url}
          inputMode="url"
          label={`${t("forms.videoUrl")} ${t("forms.optional")}`}
          name="video_url"
          onChange={updateField}
          value={formState.video_url}
        />
      </FormSection>

      <FormSection
        description={t("seller.uploadDetailsDescription")}
        title={t("seller.uploadDetailsTitle")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            error={errors.features_en}
            label={t("forms.featuresEn")}
            name="features_en"
            onChange={updateField}
            value={formState.features_en}
          />
          <TextArea
            error={errors.features_zh}
            label={t("forms.featuresZh")}
            name="features_zh"
            onChange={updateField}
            value={formState.features_zh}
          />
          <TextArea
            error={errors.faq_en}
            label={t("forms.faqEn")}
            name="faq_en"
            onChange={updateField}
            value={formState.faq_en}
          />
          <TextArea
            error={errors.faq_zh}
            label={t("forms.faqZh")}
            name="faq_zh"
            onChange={updateField}
            value={formState.faq_zh}
          />
          <TextArea
            error={errors.setup_instructions_en}
            label={t("forms.setupInstructionsEn")}
            name="setup_instructions_en"
            onChange={updateField}
            value={formState.setup_instructions_en}
          />
          <TextArea
            error={errors.setup_instructions_zh}
            label={t("forms.setupInstructionsZh")}
            name="setup_instructions_zh"
            onChange={updateField}
            value={formState.setup_instructions_zh}
          />
          <TextArea
            error={errors.data_permissions_en}
            label={t("forms.dataPermissionsEn")}
            name="data_permissions_en"
            onChange={updateField}
            value={formState.data_permissions_en}
          />
          <TextArea
            error={errors.data_permissions_zh}
            label={t("forms.dataPermissionsZh")}
            name="data_permissions_zh"
            onChange={updateField}
            value={formState.data_permissions_zh}
          />
        </div>
      </FormSection>

      <FormSection
        description={t("seller.uploadVersionDescription")}
        title={t("seller.uploadVersionTitle")}
      >
        <TextField
          error={errors.version}
          label={t("forms.version")}
          name="version"
          onChange={updateField}
          required
          value={formState.version}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            error={errors.changelog_en}
            label={`${t("forms.changelogEn")} ${t("forms.optional")}`}
            name="changelog_en"
            onChange={updateField}
            value={formState.changelog_en}
          />
          <TextArea
            error={errors.changelog_zh}
            label={`${t("forms.changelogZh")} ${t("forms.optional")}`}
            name="changelog_zh"
            onChange={updateField}
            value={formState.changelog_zh}
          />
        </div>
      </FormSection>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
        <strong>{t("seller.reviewRequiredTitle")}</strong>
        <span className="mt-1 block">{t("seller.reviewRequiredDescription")}</span>
      </div>

      <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <span className="flex items-start gap-3">
          <input
            checked={formState.rights_confirmed}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
            data-testid="seller-upload-rights-confirmed"
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                rights_confirmed: event.target.checked,
              }));
              setErrors((current) => ({ ...current, rights_confirmed: undefined }));
            }}
            type="checkbox"
          />
          <span>
            <span className="block font-semibold text-slate-800">
              I confirm this agent is original or I have the rights to sell it.
            </span>
            <span className="mt-1 block text-slate-600">
              我确认该 Agent 为原创或我拥有售卖授权。
            </span>
            {errors.rights_confirmed ? (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {errors.rights_confirmed}
              </span>
            ) : null}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-fit"
          data-status="draft"
          disabled={isSubmitting}
          onClick={() => setSubmitStatus("draft")}
          type="submit"
        >
          {isSubmitting && submitStatus === "draft"
            ? t("seller.submitting")
            : language === "zh"
              ? "保存草稿"
              : "Save draft"}
        </button>
        <button
          className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-fit"
          data-status="submitted"
          disabled={isSubmitting}
          onClick={() => setSubmitStatus("submitted")}
          type="submit"
        >
          {isSubmitting && submitStatus === "submitted"
            ? t("seller.submitting")
            : t("seller.submitForReview")}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="premium-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
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
    name: Exclude<keyof FormState, "demo_enabled" | "rights_confirmed" | "supported_languages">;
  onChange: (
    name: Exclude<keyof FormState, "demo_enabled" | "rights_confirmed" | "supported_languages">,
    value: string,
  ) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        aria-invalid={Boolean(error)}
        className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
        data-testid={`seller-upload-${name}`}
        inputMode={inputMode}
        onChange={(event) => onChange(name, event.target.value)}
        type="text"
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function TextArea({
  error,
  label,
  name,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  name: Exclude<keyof FormState, "demo_enabled" | "rights_confirmed" | "supported_languages">;
  onChange: (
    name: Exclude<keyof FormState, "demo_enabled" | "rights_confirmed" | "supported_languages">,
    value: string,
  ) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        aria-invalid={Boolean(error)}
        className="polished-input mt-2 min-h-28 w-full px-3 py-2 text-sm text-slate-950"
        data-testid={`seller-upload-${name}`}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function toPayload(formState: FormState, status: "draft" | "submitted") {
  return {
    ...formState,
    faq_en: parseFaq(formState.faq_en),
    faq_zh: parseFaq(formState.faq_zh),
    features_en: parseLines(formState.features_en),
    features_zh: parseLines(formState.features_zh),
    price_cny: parsePrice(formState.price_cny),
    price_usd: parsePrice(formState.price_usd),
    screenshot_urls: parseLines(formState.screenshot_urls),
    status,
    tags: parseLines(formState.tags),
  };
}

function parseLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFaq(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [question, ...answerParts] = line.split("|");

      return {
        answer: answerParts.join("|").trim(),
        question: question.trim(),
      };
    })
    .filter((item) => item.question && item.answer);
}

function parsePrice(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function validateForm(
  formState: FormState,
  t: (key: string) => string,
): ErrorState {
  const nextErrors: ErrorState = {};

  if (!formState.seller_email.trim() || !/^\S+@\S+\.\S+$/.test(formState.seller_email)) {
    nextErrors.seller_email = t("seller.validationEmail");
  }

  const hasEnglishVersion = Boolean(
    formState.title_en.trim() &&
      formState.short_description_en.trim() &&
      formState.description_en.trim(),
  );
  const hasChineseVersion = Boolean(
    formState.title_zh.trim() &&
      formState.short_description_zh.trim() &&
      formState.description_zh.trim(),
  );

  if (!hasEnglishVersion && !hasChineseVersion) {
    nextErrors.language_version = t("seller.validationLanguageVersion");
  }

  if (!formState.category_slug) {
    nextErrors.category_slug = t("seller.validationRequired");
  }

  if (!formState.delivery_type) {
    nextErrors.delivery_type = t("seller.validationRequired");
  }

  if (!formState.pricing_type) {
    nextErrors.pricing_type = t("seller.validationRequired");
  }

  if (
    (formState.pricing_type === "one_time" ||
      formState.pricing_type === "monthly") &&
    parsePrice(formState.price_usd) === null &&
    parsePrice(formState.price_cny) === null
  ) {
    nextErrors.price_usd = t("seller.validationPriceRequired");
    nextErrors.price_cny = t("seller.validationPriceRequired");
  }

  if (formState.supported_languages.length === 0) {
    nextErrors.supported_languages = t("seller.validationSupportedLanguage");
  }

  if (!formState.version.trim()) {
    nextErrors.version = t("seller.validationRequired");
  }

  if (!formState.rights_confirmed) {
    nextErrors.rights_confirmed =
      "Confirm this agent is original or you have the rights to sell it.";
  }

  return nextErrors;
}
