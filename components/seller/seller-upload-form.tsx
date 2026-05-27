"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  evaluateAgentQuality,
  type AgentQualityResult,
} from "@/lib/marketplace/agent-quality";
import { demoCategories } from "@/lib/marketplace/demo-data";
import {
  DELIVERY_TYPES,
  PRICING_TYPES,
  type DeliveryType,
  type PricingType,
  type SupportedLanguage,
} from "@/lib/marketplace/constants";

type PricingPlanState = {
  cta_label_en: string;
  cta_label_zh: string;
  delivery_time_en: string;
  delivery_time_zh: string;
  included_items_en: string;
  included_items_zh: string;
  limitations_en: string;
  limitations_zh: string;
  plan_id: "agent_only" | "agent_setup" | "custom_version";
  price_cny: string;
  price_usd: string;
  title_en: string;
  title_zh: string;
};

type DeliverySettingsState = {
  configuration_fields: string;
  consultation_required: boolean;
  custom_workflow_description: string;
  customer_dashboard_support: boolean;
  embed_documentation: string;
  example_inputs_outputs: string;
  hosted_behavior: string;
  import_instructions: string;
  lead_capture_support: boolean;
  license_domain_binding_required: boolean;
  prompt_content: string;
  quote_required: boolean;
  required_external_tools: string;
  setup_guide: string;
  usage_guide: string;
  widget_support: boolean;
  workflow_platform_type: string;
};

const defaultPricingPlans: PricingPlanState[] = [
  {
    cta_label_en: "Buy agent",
    cta_label_zh: "购买 Agent",
    delivery_time_en: "Instant delivery after approval",
    delivery_time_zh: "审核通过后即时交付",
    included_items_en: "Agent files or access\nUsage guide",
    included_items_zh: "Agent 文件或访问权限\n使用指南",
    limitations_en: "",
    limitations_zh: "",
    plan_id: "agent_only",
    price_cny: "",
    price_usd: "",
    title_en: "Agent Only",
    title_zh: "仅 Agent",
  },
  {
    cta_label_en: "Request setup",
    cta_label_zh: "申请配置服务",
    delivery_time_en: "2-5 business days",
    delivery_time_zh: "2-5 个工作日",
    included_items_en: "Agent files or access\nBasic setup support",
    included_items_zh: "Agent 文件或访问权限\n基础配置支持",
    limitations_en: "",
    limitations_zh: "",
    plan_id: "agent_setup",
    price_cny: "",
    price_usd: "",
    title_en: "Agent + Setup",
    title_zh: "Agent + 配置",
  },
  {
    cta_label_en: "Request quote",
    cta_label_zh: "获取报价",
    delivery_time_en: "Quoted after consultation",
    delivery_time_zh: "咨询后报价",
    included_items_en: "Custom workflow planning\nImplementation quote",
    included_items_zh: "定制流程规划\n实施报价",
    limitations_en: "",
    limitations_zh: "",
    plan_id: "custom_version",
    price_cny: "",
    price_usd: "",
    title_en: "Custom Version",
    title_zh: "定制版本",
  },
];

const initialDeliverySettings: DeliverySettingsState = {
  configuration_fields: "",
  consultation_required: true,
  custom_workflow_description: "",
  customer_dashboard_support: false,
  embed_documentation: "",
  example_inputs_outputs: "",
  hosted_behavior: "",
  import_instructions: "",
  lead_capture_support: false,
  license_domain_binding_required: true,
  prompt_content: "",
  quote_required: true,
  required_external_tools: "",
  setup_guide: "",
  usage_guide: "",
  widget_support: true,
  workflow_platform_type: "",
};

const initialFormState = {
  agent_rights_confirmed: false,
  category_slug: "",
  content_safety_confirmed: false,
  cover_image_url: "",
  custom_upgrade_options_en: "",
  custom_upgrade_options_zh: "",
  data_permissions_en: "",
  data_permissions_zh: "",
  delivery_settings: initialDeliverySettings,
  delivery_type: "" as DeliveryType | "",
  demo_answers: "",
  demo_enabled: true,
  demo_questions: "",
  demo_url: "",
  faq_en: "",
  faq_zh: "",
  features_en: "",
  features_zh: "",
  full_description_en: "",
  full_description_zh: "",
  limitations_en: "",
  limitations_zh: "",
  price_cny: "",
  price_usd: "",
  pricing_plans: defaultPricingPlans,
  pricing_type: "" as PricingType | "",
  review_policy_confirmed: false,
  sample_conversation: "",
  screenshot_urls: "",
  seller_email: "",
  sensitive_disclaimer_confirmed: false,
  setup_instructions_en: "",
  setup_instructions_zh: "",
  short_description_en: "",
  short_description_zh: "",
  supported_languages: ["en", "zh"] as SupportedLanguage[],
  suspension_policy_confirmed: false,
  tags: "",
  title_en: "",
  title_zh: "",
  use_cases_en: "",
  use_cases_zh: "",
  video_url: "",
  what_customer_receives_en: "",
  what_customer_receives_zh: "",
  who_it_is_for_en: "",
  who_it_is_for_zh: "",
};

type FormState = typeof initialFormState;
type TextFieldName = {
  [Key in keyof FormState]: FormState[Key] extends string ? Key : never;
}[keyof FormState];
type ErrorState = Record<string, string>;
type SellerAgentRecord = Partial<{
  agent_rights_confirmed: boolean;
  category_slug: string;
  content_safety_confirmed: boolean;
  cover_image_url: string | null;
  custom_upgrade_options_en: string;
  custom_upgrade_options_zh: string;
  data_permissions_en: string;
  data_permissions_zh: string;
  delivery_settings: Record<string, unknown>;
  delivery_type: DeliveryType;
  demo_answers: string[];
  demo_enabled: boolean;
  demo_questions: string[];
  demo_url: string | null;
  description_en: string;
  description_zh: string;
  faq_en: Array<{ answer: string; question: string }>;
  faq_zh: Array<{ answer: string; question: string }>;
  features_en: string[];
  features_zh: string[];
  id: string;
  limitations_en: string;
  limitations_zh: string;
  price_cny: number | null;
  price_usd: number | null;
  pricing_plans: Array<Record<string, unknown>>;
  pricing_type: PricingType;
  review_feedback: string | null;
  review_policy_confirmed: boolean;
  review_reason_code: string | null;
  sample_conversation: string;
  screenshot_urls: string[];
  seller_email: string;
  sensitive_disclaimer_confirmed: boolean;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: string;
  supported_languages: SupportedLanguage[];
  suspension_policy_confirmed: boolean;
  tags: string[];
  title_en: string;
  title_zh: string;
  use_cases_en: string[];
  use_cases_zh: string[];
  video_url: string | null;
  what_customer_receives_en: string;
  what_customer_receives_zh: string;
  who_it_is_for_en: string;
  who_it_is_for_zh: string;
}>;

const uploadCopy = {
  en: {
    addReviewNotice:
      "Sellers can save incomplete drafts. Submitting for review requires the minimum product, demo, pricing, delivery, and compliance details.",
    agentType: "Agent type",
    agentTypeDescription:
      "Choose how customers will receive or use this agent. This affects the delivery settings later in the wizard.",
    basicInfo: "Basic product info",
    basicInfoDescription:
      "Create the public listing basics in English and Chinese. Use concrete, customer-facing wording.",
    blockedSubmit: "Please complete the highlighted fields before submitting.",
    compliance: "Compliance & submission",
    complianceDescription:
      "Confirm ownership, safety, review, and any required category disclaimers before sending this listing to admin review.",
    contentDetails: "Product detail content",
    contentDetailsDescription:
      "Explain who this agent helps, what it does, what customers receive, and where its limits are.",
    coverPreview: "Cover preview",
    demoContent: "Demo content",
    demoContentDescription:
      "Add enough sample content for buyers and admins to understand the agent before purchase.",
    deliverySettings: "Delivery settings",
    deliverySettingsDescription:
      "Complete the fields that match this delivery type. Sellers cannot publish directly.",
    draftSaved: "Draft saved.",
    draftUpdated: "Draft updated.",
    editLoaded: "Agent loaded for editing.",
    editLocked:
      "Approved or published agents cannot be edited directly. Archive it or contact admin for an update submission.",
    loadingDraft: "Loading agent...",
    next: "Next",
    previous: "Back",
    pricing: "Pricing",
    pricingDescription:
      "Set the pricing model and the standard buying options customers will see.",
    saveDraft: "Save draft",
    saving: "Saving...",
    selectAgentType: "Select an agent type",
    selectCategory: "Select category",
    selectPricing: "Select pricing",
    submitForReview: "Submit for review",
    submitted: "Submitted for admin review.",
    submitting: "Submitting...",
  },
  zh: {
    addReviewNotice:
      "卖家可以先保存不完整草稿。提交审核时必须补齐产品、演示、定价、交付和合规信息。",
    agentType: "Agent 类型",
    agentTypeDescription:
      "选择客户将如何接收或使用这个 Agent。这个选择会影响后面的交付设置。",
    basicInfo: "基础商品信息",
    basicInfoDescription:
      "用中英文填写公开商品页的基础信息，尽量使用客户能直接理解的表达。",
    blockedSubmit: "请先补齐高亮字段，再提交审核。",
    compliance: "合规与提交",
    complianceDescription:
      "提交审核前，请确认原创/授权、安全、平台审核，以及敏感类目的免责声明。",
    contentDetails: "商品详情内容",
    contentDetailsDescription:
      "说明这个 Agent 适合谁、能做什么、客户会收到什么，以及它的限制。",
    coverPreview: "封面预览",
    demoContent: "演示内容",
    demoContentDescription:
      "提供足够的样例内容，让买家和管理员在购买前理解这个 Agent。",
    deliverySettings: "交付设置",
    deliverySettingsDescription:
      "按照当前交付类型补齐对应信息。卖家不能直接公开发布。",
    draftSaved: "草稿已保存。",
    draftUpdated: "草稿已更新。",
    editLoaded: "已加载 Agent，可继续编辑。",
    editLocked:
      "已通过或已发布的 Agent 不能直接编辑。请归档，或联系管理员发起更新审核。",
    loadingDraft: "正在加载 Agent...",
    next: "下一步",
    previous: "上一步",
    pricing: "定价",
    pricingDescription: "设置定价模式，以及客户会看到的标准购买方案。",
    saveDraft: "保存草稿",
    saving: "保存中...",
    selectAgentType: "选择 Agent 类型",
    selectCategory: "选择分类",
    selectPricing: "选择定价",
    submitForReview: "提交审核",
    submitted: "已提交给管理员审核。",
    submitting: "提交中...",
  },
} as const;

const qualityCopy = {
  en: {
    aiAssistant: "AI packaging assistant",
    aiPlaceholder:
      "AI generation is not connected in this local build. Connect an API route with OPENAI_API_KEY later to enable generation.",
    applyCover: "Apply cover",
    completeness: "Completeness",
    coverTemplates: "Generated cover styles",
    generateChineseVersion: "Generate Chinese version",
    generateCoverPrompt: "Generate cover prompt",
    generateEnglishVersion: "Generate English version",
    generateFaq: "Generate FAQ",
    improveProductDescription: "Improve product description",
    missingFields: "Missing fields",
    noQualityIssues: "No missing quality fields.",
    submissionGate: "Submit gate",
    suggestPricing: "Suggest pricing",
    styleClean: "Clean product",
    styleService: "Service workflow",
    styleTechnical: "Technical build",
    warnings: "Warnings",
  },
  zh: {
    aiAssistant: "AI 包装助手",
    aiPlaceholder:
      "当前本地版本尚未接入 AI 生成。后续接入带 OPENAI_API_KEY 的 API 路由后即可启用。",
    applyCover: "应用封面",
    completeness: "完整度",
    coverTemplates: "生成封面样式",
    generateChineseVersion: "生成中文版本",
    generateCoverPrompt: "生成封面提示词",
    generateEnglishVersion: "生成英文版本",
    generateFaq: "生成 FAQ",
    improveProductDescription: "优化商品描述",
    missingFields: "缺失字段",
    noQualityIssues: "暂无缺失的质量字段。",
    submissionGate: "提交门槛",
    suggestPricing: "建议定价",
    styleClean: "清爽产品",
    styleService: "服务流程",
    styleTechnical: "技术构建",
    warnings: "提醒",
  },
} as const;

type QualityText = Record<keyof (typeof qualityCopy)["en"], string>;
type CoverStyle = "clean" | "service" | "technical";

const coverStyles: CoverStyle[] = ["clean", "technical", "service"];

const deliveryTypeInfo: Record<
  DeliveryType,
  { descriptionEn: string; descriptionZh: string; titleEn: string; titleZh: string }
> = {
  custom_business_agent: {
    descriptionEn:
      "A scoped service where the seller consults, quotes, and builds a custom agent for the customer.",
    descriptionZh: "需要先咨询和报价，再为客户定制业务 Agent 的服务型商品。",
    titleEn: "Custom Business Agent",
    titleZh: "定制业务 Agent",
  },
  hosted_agent: {
    descriptionEn:
      "A hosted experience controlled by the seller, often with configuration or customer dashboard support.",
    descriptionZh: "由卖家托管运行，通常支持配置项或客户后台。",
    titleEn: "Hosted Agent",
    titleZh: "托管 Agent",
  },
  prompt_template: {
    descriptionEn:
      "A reusable prompt package with instructions and examples that customers can copy into their tools.",
    descriptionZh: "可复用的提示词模板，附带使用指南和示例，客户可复制到自己的工具中使用。",
    titleEn: "Prompt Template",
    titleZh: "提示词模板",
  },
  website_chatbot: {
    descriptionEn:
      "A website widget or embed package for customer service, lead capture, or guided intake.",
    descriptionZh: "可嵌入网站的小组件，用于客服、线索收集或咨询引导。",
    titleEn: "Website Chatbot",
    titleZh: "网站聊天机器人",
  },
  workflow_template: {
    descriptionEn:
      "An importable automation workflow for platforms such as Dify, Coze, n8n, Make, or similar tools.",
    descriptionZh: "可导入 Dify、Coze、n8n、Make 等平台的自动化流程模板。",
    titleEn: "Workflow Template",
    titleZh: "工作流模板",
  },
};

const pricingTypeLabels: Record<PricingType, { en: string; zh: string }> = {
  custom_quote: { en: "Custom quote", zh: "定制报价" },
  free: { en: "Free", zh: "免费" },
  monthly: { en: "Monthly", zh: "按月订阅" },
  one_time: { en: "One-time", zh: "一次性付费" },
};

const sensitiveDisclaimer =
  "This agent provides information or intake support only and does not replace professional advice.";

function createCoverTemplateUrl({
  category,
  style,
  title,
}: {
  category: string;
  style: CoverStyle;
  title: string;
}) {
  const palette = {
    clean: {
      accent: "#0ea5e9",
      background: "#f8fafc",
      foreground: "#0f172a",
      soft: "#dbeafe",
    },
    service: {
      accent: "#14b8a6",
      background: "#f0fdfa",
      foreground: "#134e4a",
      soft: "#ccfbf1",
    },
    technical: {
      accent: "#6366f1",
      background: "#eef2ff",
      foreground: "#1e1b4b",
      soft: "#c7d2fe",
    },
  }[style];
  const safeTitle = escapeSvgText(title || "AI Agent");
  const safeCategory = escapeSvgText(category || "Marketplace agent");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="${palette.background}"/>
  <rect x="70" y="70" width="1060" height="580" rx="34" fill="white" stroke="${palette.soft}" stroke-width="3"/>
  <circle cx="985" cy="155" r="78" fill="${palette.soft}"/>
  <circle cx="1050" cy="235" r="34" fill="${palette.accent}" opacity="0.22"/>
  <path d="M95 520 C245 430 350 560 510 460 C665 362 770 430 900 335 C1010 255 1082 270 1130 298 L1130 650 L95 650 Z" fill="${palette.soft}" opacity="0.65"/>
  <g transform="translate(105 128)">
    <rect width="136" height="136" rx="32" fill="${palette.foreground}"/>
    <path d="M42 91 L63 68 L82 82 L105 45" fill="none" stroke="${palette.accent}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="42" cy="91" r="9" fill="white"/>
    <circle cx="63" cy="68" r="9" fill="white"/>
    <circle cx="82" cy="82" r="9" fill="white"/>
    <circle cx="105" cy="45" r="9" fill="white"/>
  </g>
  <text x="105" y="350" fill="${palette.foreground}" font-family="Inter, Arial, sans-serif" font-size="66" font-weight="800">${safeTitle}</text>
  <text x="110" y="414" fill="${palette.accent}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700">${safeCategory}</text>
  <text x="110" y="582" fill="${palette.foreground}" opacity="0.68" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600">Ready for review</text>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function SellerUploadForm({
  agentId,
  defaultSellerEmail = "",
}: {
  agentId?: string;
  defaultSellerEmail?: string;
}) {
  const { language } = useTranslation();
  const text = uploadCopy[language];
  const qualityText = qualityCopy[language] as QualityText;
  const [activeStep, setActiveStep] = useState(0);
  const [formState, setFormState] = useState<FormState>(() => ({
    ...initialFormState,
    delivery_settings: { ...initialDeliverySettings },
    pricing_plans: defaultPricingPlans.map((plan) => ({ ...plan })),
    seller_email: defaultSellerEmail,
  }));
  const [errors, setErrors] = useState<ErrorState>({});
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [loadedAgentKey, setLoadedAgentKey] = useState("");
  const [savedAgentId, setSavedAgentId] = useState(agentId ?? "");
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [isEditingLocked, setIsEditingLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"draft" | "submitted">(
    "submitted",
  );

  const steps = useMemo(
    () => [
      { description: text.agentTypeDescription, title: text.agentType },
      { description: text.basicInfoDescription, title: text.basicInfo },
      { description: text.contentDetailsDescription, title: text.contentDetails },
      { description: text.demoContentDescription, title: text.demoContent },
      { description: text.pricingDescription, title: text.pricing },
      { description: text.deliverySettingsDescription, title: text.deliverySettings },
      { description: text.complianceDescription, title: text.compliance },
    ],
    [text],
  );
  const quality = useMemo(
    () => evaluateAgentQuality(formStateToQualityInput(formState)),
    [formState],
  );
  const coverTemplateOptions = useMemo(() => {
    const category = demoCategories.find(
      (item) => item.slug === formState.category_slug,
    );
    const categoryLabel =
      language === "zh"
        ? category?.nameZh || category?.nameEn
        : category?.nameEn || category?.nameZh;
    const title = formState.title_en || formState.title_zh || "AI Agent";
    const labels: Record<CoverStyle, string> = {
      clean: qualityText.styleClean,
      service: qualityText.styleService,
      technical: qualityText.styleTechnical,
    };

    return coverStyles.map((style) => ({
      label: labels[style],
      style,
      url: createCoverTemplateUrl({
        category: categoryLabel || "Marketplace agent",
        style,
        title,
      }),
    }));
  }, [
    formState.category_slug,
    formState.title_en,
    formState.title_zh,
    language,
    qualityText.styleClean,
    qualityText.styleService,
    qualityText.styleTechnical,
  ]);

  useEffect(() => {
    const email = formState.seller_email.trim().toLowerCase();
    const nextLoadedKey = `${agentId ?? ""}:${email}`;

    if (!agentId || !email || loadedAgentKey === nextLoadedKey) {
      return;
    }

    let isMounted = true;

    async function loadAgentForEdit() {
      setIsLoadingAgent(true);
      setFormError("");
      setFormMessage("");

      try {
        const response = await fetch(
          `/api/seller-agents?seller_email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as {
          data?: SellerAgentRecord[];
          error?: string;
        };

        if (!response.ok || !Array.isArray(result.data)) {
          throw new Error(result.error || "Unable to load seller agents.");
        }

        const agent = result.data.find(
          (item) => item.id === agentId || item.slug === agentId,
        );

        if (!agent) {
          throw new Error("Seller agent not found for this email.");
        }

        if (!isMounted) {
          return;
        }

        setFormState(agentToFormState(agent, email));
        setSavedAgentId(agent.id || agentId || "");
        setIsEditingLocked(
          agent.status === "approved" || agent.status === "published",
        );
        setLoadedAgentKey(nextLoadedKey);
        setFormMessage(text.editLoaded);
      } catch (error) {
        if (isMounted) {
          setFormError(
            error instanceof Error ? error.message : "Unable to load agent.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAgent(false);
        }
      }
    }

    void loadAgentForEdit();

    return () => {
      isMounted = false;
    };
  }, [agentId, formState.seller_email, loadedAgentKey, text.editLoaded]);

  function updateField<Key extends keyof FormState>(
    name: Key,
    value: FormState[Key],
  ) {
    setFormState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateDeliverySetting<Key extends keyof DeliverySettingsState>(
    name: Key,
    value: DeliverySettingsState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      delivery_settings: {
        ...current.delivery_settings,
        [name]: value,
      },
    }));
    setErrors((current) => ({ ...current, [`delivery_settings.${name}`]: "" }));
  }

  function updatePricingPlan<Key extends keyof PricingPlanState>(
    index: number,
    name: Key,
    value: PricingPlanState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      pricing_plans: current.pricing_plans.map((plan, planIndex) =>
        planIndex === index ? { ...plan, [name]: value } : plan,
      ),
    }));
    setErrors((current) => ({ ...current, pricing_plans: "" }));
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
    setErrors((current) => ({ ...current, supported_languages: "" }));
  }

  function applyCoverTemplate(coverUrl: string) {
    updateField("cover_image_url", coverUrl);
    setFormMessage("");
    setFormError("");
  }

  function showAiPlaceholder(action: string) {
    setFormError("");
    setFormMessage(`${action}: ${qualityText.aiPlaceholder}`);
  }

  async function submitAgent(status: "draft" | "submitted") {
    setFormError("");
    setFormMessage("");
    setSubmitStatus(status);

    if (isEditingLocked) {
      setFormError(text.editLocked);
      return;
    }

    const nextErrors = validateForm(formState, status);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError(
        status === "submitted"
          ? [text.blockedSubmit, ...quality.submissionGateFailures].join(" ")
          : "",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = toPayload(formState, status);
      const isUpdate = Boolean(savedAgentId);

      if (isUpdate) {
        payload.id = savedAgentId;
      }

      const response = await fetch("/api/seller-agents", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: isUpdate ? "PATCH" : "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        data?: SellerAgentRecord;
        error?: string;
        id?: string;
        slug?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Upload failed.");
      }

      const nextAgentId = result?.data?.id || result?.id || savedAgentId;

      if (nextAgentId) {
        setSavedAgentId(nextAgentId);
      }

      setFormMessage(
        status === "draft"
          ? isUpdate
            ? text.draftUpdated
            : text.draftSaved
          : text.submitted,
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" data-testid="seller-upload-form">
      <div className="premium-card p-4">
        <div className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <button
              aria-current={activeStep === index ? "step" : undefined}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                activeStep === index
                  ? "border-blue-600 bg-blue-50 text-blue-950"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              key={step.title}
              onClick={() => setActiveStep(index)}
              type="button"
            >
              <span className="font-semibold">
                {index + 1}. {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {formMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {formMessage}
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      ) : null}

      {isLoadingAgent ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          {text.loadingDraft}
        </div>
      ) : null}

      <QualityPanel
        onAiAction={showAiPlaceholder}
        quality={quality}
        text={qualityText}
      />

      <section className="premium-card p-5 sm:p-6">
        <p className="text-sm font-semibold text-blue-700">
          {activeStep + 1} / {steps.length}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {steps[activeStep].title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {steps[activeStep].description}
        </p>
        <div className="mt-6 grid gap-5">{renderStep()}</div>
      </section>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        {text.addReviewNotice}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            type="button"
          >
            {text.previous}
          </button>
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeStep === steps.length - 1}
            onClick={() =>
              setActiveStep((step) => Math.min(steps.length - 1, step + 1))
            }
            type="button"
          >
            {text.next}
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={isSubmitting || isLoadingAgent || isEditingLocked}
            onClick={() => void submitAgent("draft")}
            type="button"
          >
            {isSubmitting && submitStatus === "draft" ? text.saving : text.saveDraft}
          </button>
          <button
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            data-testid="seller-upload-submit"
            disabled={isSubmitting || isLoadingAgent || isEditingLocked}
            onClick={() => void submitAgent("submitted")}
            type="button"
          >
            {isSubmitting && submitStatus === "submitted"
              ? text.submitting
              : text.submitForReview}
          </button>
        </div>
      </div>
    </form>
  );

  function renderStep() {
    if (activeStep === 0) {
      return (
        <div className="grid gap-4">
          <TextField
            error={errors.seller_email}
            inputMode="email"
            label={language === "zh" ? "卖家邮箱" : "Seller email"}
            name="seller_email"
            onChange={updateField}
            required
            value={formState.seller_email}
          />
          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-700">
              {text.selectAgentType}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {DELIVERY_TYPES.map((deliveryType) => {
                const info = deliveryTypeInfo[deliveryType];
                const selected = formState.delivery_type === deliveryType;

                return (
                  <button
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-950"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    data-testid={`seller-upload-type-${deliveryType}`}
                    key={deliveryType}
                    onClick={() => updateField("delivery_type", deliveryType)}
                    type="button"
                  >
                    <span className="block text-base font-semibold">
                      {language === "zh" ? info.titleZh : info.titleEn}
                    </span>
                    <span className="mt-2 block text-sm leading-6">
                      {language === "zh"
                        ? info.descriptionZh
                        : info.descriptionEn}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.delivery_type ? <ErrorText message={errors.delivery_type} /> : null}
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              error={errors.title_en}
              label="Title (English)"
              name="title_en"
              onChange={updateField}
              required
              value={formState.title_en}
            />
            <TextField
              error={errors.title_zh}
              label="标题（中文）"
              name="title_zh"
              onChange={updateField}
              required
              value={formState.title_zh}
            />
            <TextArea
              error={errors.short_description_en}
              label="Short description (English)"
              name="short_description_en"
              onChange={updateField}
              required
              value={formState.short_description_en}
            />
            <TextArea
              error={errors.short_description_zh}
              label="简短描述（中文）"
              name="short_description_zh"
              onChange={updateField}
              required
              value={formState.short_description_zh}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium text-slate-700">
                {language === "zh" ? "分类" : "Category"} *
              </span>
              <select
                aria-invalid={Boolean(errors.category_slug)}
                className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
                data-testid="seller-upload-category"
                onChange={(event) =>
                  updateField("category_slug", event.target.value)
                }
                value={formState.category_slug}
              >
                <option value="">{text.selectCategory}</option>
                {demoCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {language === "zh" ? category.nameZh : category.nameEn}
                  </option>
                ))}
              </select>
              {errors.category_slug ? (
                <ErrorText message={errors.category_slug} />
              ) : null}
            </label>

            <TextField
              error={errors.tags}
              label={language === "zh" ? "标签（逗号或换行分隔）" : "Tags (comma or line separated)"}
              name="tags"
              onChange={updateField}
              value={formState.tags}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              {language === "zh" ? "支持语言" : "Supported languages"} *
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
                  {item === "en" ? "English" : "中文"}
                </label>
              ))}
            </div>
            {errors.supported_languages ? (
              <ErrorText message={errors.supported_languages} />
            ) : null}
          </fieldset>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <TextField
              error={errors.cover_image_url}
              inputMode="url"
              label={language === "zh" ? "封面图 URL 或生成模板" : "Cover image URL or generated template"}
              name="cover_image_url"
              onChange={updateField}
              value={formState.cover_image_url}
            />
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {formState.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={text.coverPreview}
                  className="h-full min-h-32 w-full object-cover"
                  src={formState.cover_image_url}
                />
              ) : (
                <div className="flex min-h-32 items-center justify-center bg-slate-900 px-4 text-center text-sm font-semibold text-white">
                  {formState.title_en || formState.title_zh || text.coverPreview}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              {qualityText.coverTemplates}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {coverTemplateOptions.map((option) => (
                <button
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
                  key={option.style}
                  onClick={() => applyCoverTemplate(option.url)}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={option.label}
                    className="h-24 w-full object-cover"
                    src={option.url}
                  />
                  <span className="block px-3 py-2">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <TextArea
            error={errors.screenshot_urls}
            label={language === "zh" ? "截图 URL（可选，每行一个）" : "Screenshot URLs (optional, one per line)"}
            name="screenshot_urls"
            onChange={updateField}
            value={formState.screenshot_urls}
          />
          <TextField
            error={errors.video_url}
            inputMode="url"
            label={language === "zh" ? "演示视频 URL（可选）" : "Demo video URL (optional)"}
            name="video_url"
            onChange={updateField}
            value={formState.video_url}
          />
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            error={errors.full_description_en}
            label="Full description (English)"
            name="full_description_en"
            onChange={updateField}
            required
            value={formState.full_description_en}
          />
          <TextArea
            error={errors.full_description_zh}
            label="完整描述（中文）"
            name="full_description_zh"
            onChange={updateField}
            required
            value={formState.full_description_zh}
          />
          <TextArea
            error={errors.who_it_is_for_en}
            label="Who it is for (English)"
            name="who_it_is_for_en"
            onChange={updateField}
            value={formState.who_it_is_for_en}
          />
          <TextArea
            error={errors.who_it_is_for_zh}
            label="适合谁（中文）"
            name="who_it_is_for_zh"
            onChange={updateField}
            value={formState.who_it_is_for_zh}
          />
          <TextArea
            error={errors.features_en}
            label="Features (English, one per line)"
            name="features_en"
            onChange={updateField}
            value={formState.features_en}
          />
          <TextArea
            error={errors.features_zh}
            label="功能（中文，每行一个）"
            name="features_zh"
            onChange={updateField}
            value={formState.features_zh}
          />
          <TextArea
            error={errors.use_cases_en}
            label="Use cases (English, one per line)"
            name="use_cases_en"
            onChange={updateField}
            value={formState.use_cases_en}
          />
          <TextArea
            error={errors.use_cases_zh}
            label="使用场景（中文，每行一个）"
            name="use_cases_zh"
            onChange={updateField}
            value={formState.use_cases_zh}
          />
          <TextArea
            error={errors.what_customer_receives_en}
            label="What customer receives (English)"
            name="what_customer_receives_en"
            onChange={updateField}
            value={formState.what_customer_receives_en}
          />
          <TextArea
            error={errors.what_customer_receives_zh}
            label="客户会收到什么（中文）"
            name="what_customer_receives_zh"
            onChange={updateField}
            value={formState.what_customer_receives_zh}
          />
          <TextArea
            error={errors.setup_instructions_en}
            label="Setup instructions (English)"
            name="setup_instructions_en"
            onChange={updateField}
            value={formState.setup_instructions_en}
          />
          <TextArea
            error={errors.setup_instructions_zh}
            label="配置说明（中文）"
            name="setup_instructions_zh"
            onChange={updateField}
            value={formState.setup_instructions_zh}
          />
          <TextArea
            error={errors.data_permissions_en}
            label="Data permissions (English)"
            name="data_permissions_en"
            onChange={updateField}
            value={formState.data_permissions_en}
          />
          <TextArea
            error={errors.data_permissions_zh}
            label="数据权限（中文）"
            name="data_permissions_zh"
            onChange={updateField}
            value={formState.data_permissions_zh}
          />
          <TextArea
            error={errors.limitations_en}
            label="Limitations (English)"
            name="limitations_en"
            onChange={updateField}
            value={formState.limitations_en}
          />
          <TextArea
            error={errors.limitations_zh}
            label="限制（中文）"
            name="limitations_zh"
            onChange={updateField}
            value={formState.limitations_zh}
          />
          <TextArea
            error={errors.custom_upgrade_options_en}
            label="Custom upgrade options (English)"
            name="custom_upgrade_options_en"
            onChange={updateField}
            value={formState.custom_upgrade_options_en}
          />
          <TextArea
            error={errors.custom_upgrade_options_zh}
            label="定制升级选项（中文）"
            name="custom_upgrade_options_zh"
            onChange={updateField}
            value={formState.custom_upgrade_options_zh}
          />
          <TextArea
            error={errors.faq_en}
            label="FAQ (English, question | answer)"
            name="faq_en"
            onChange={updateField}
            value={formState.faq_en}
          />
          <TextArea
            error={errors.faq_zh}
            label="FAQ（中文，问题 | 回答）"
            name="faq_zh"
            onChange={updateField}
            value={formState.faq_zh}
          />
        </div>
      );
    }

    if (activeStep === 3) {
      return (
        <div className="grid gap-4">
          <label className="inline-flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <input
              checked={formState.demo_enabled}
              className="mt-1"
              onChange={(event) =>
                updateField("demo_enabled", event.target.checked)
              }
              type="checkbox"
            />
            <span className="font-medium text-slate-800">
              {language === "zh" ? "启用演示内容" : "Enable demo content"}
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea
              error={errors.demo_questions}
              label={language === "zh" ? "演示问题（至少 5 个，每行一个）" : "Demo questions (at least 5, one per line)"}
              name="demo_questions"
              onChange={updateField}
              required
              value={formState.demo_questions}
            />
            <TextArea
              error={errors.demo_answers}
              label={language === "zh" ? "演示回答（至少 5 个，每行一个）" : "Demo answers (at least 5, one per line)"}
              name="demo_answers"
              onChange={updateField}
              required
              value={formState.demo_answers}
            />
          </div>
          <TextArea
            error={errors.sample_conversation}
            label={language === "zh" ? "样例对话（至少 1 段）" : "Sample conversation (at least 1)"}
            name="sample_conversation"
            onChange={updateField}
            required
            value={formState.sample_conversation}
          />
          <TextField
            error={errors.demo_url}
            inputMode="url"
            label={language === "zh" ? "在线演示 URL（可选）" : "Live demo URL (optional)"}
            name="demo_url"
            onChange={updateField}
            value={formState.demo_url}
          />
        </div>
      );
    }

    if (activeStep === 4) {
      return (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="font-medium text-slate-700">
                {language === "zh" ? "定价类型" : "Pricing type"} *
              </span>
              <select
                aria-invalid={Boolean(errors.pricing_type)}
                className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
                data-testid="seller-upload-pricing"
                onChange={(event) =>
                  updateField("pricing_type", event.target.value as PricingType)
                }
                value={formState.pricing_type}
              >
                <option value="">{text.selectPricing}</option>
                {PRICING_TYPES.map((pricingType) => (
                  <option key={pricingType} value={pricingType}>
                    {pricingTypeLabels[pricingType][language]}
                  </option>
                ))}
              </select>
              {errors.pricing_type ? <ErrorText message={errors.pricing_type} /> : null}
            </label>
            <TextField
              error={errors.price_usd}
              inputMode="decimal"
              label="Base price USD"
              name="price_usd"
              onChange={updateField}
              value={formState.price_usd}
            />
            <TextField
              error={errors.price_cny}
              inputMode="decimal"
              label="Base price CNY"
              name="price_cny"
              onChange={updateField}
              value={formState.price_cny}
            />
          </div>
          {errors.pricing_plans ? <ErrorText message={errors.pricing_plans} /> : null}
          <div className="grid gap-4">
            {formState.pricing_plans.map((plan, index) => (
              <section
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={plan.plan_id}
              >
                <h3 className="text-base font-semibold text-slate-950">
                  {plan.title_en} / {plan.title_zh}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <PlanField
                    label="Plan title EN"
                    name="title_en"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.title_en}
                  />
                  <PlanField
                    label="方案标题中文"
                    name="title_zh"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.title_zh}
                  />
                  <PlanField
                    label="Price USD"
                    name="price_usd"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.price_usd}
                  />
                  <PlanField
                    label="Price CNY"
                    name="price_cny"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.price_cny}
                  />
                  <PlanArea
                    label="Included items EN"
                    name="included_items_en"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.included_items_en}
                  />
                  <PlanArea
                    label="包含内容中文"
                    name="included_items_zh"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.included_items_zh}
                  />
                  <PlanField
                    label="Delivery time EN"
                    name="delivery_time_en"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.delivery_time_en}
                  />
                  <PlanField
                    label="交付时间中文"
                    name="delivery_time_zh"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.delivery_time_zh}
                  />
                  <PlanField
                    label="CTA label EN"
                    name="cta_label_en"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.cta_label_en}
                  />
                  <PlanField
                    label="按钮文案中文"
                    name="cta_label_zh"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.cta_label_zh}
                  />
                  <PlanArea
                    label="Limitations EN"
                    name="limitations_en"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.limitations_en}
                  />
                  <PlanArea
                    label="限制中文"
                    name="limitations_zh"
                    onChange={(name, value) => updatePricingPlan(index, name, value)}
                    value={plan.limitations_zh}
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      );
    }

    if (activeStep === 5) {
      return renderDeliverySettings();
    }

    return (
      <div className="grid gap-4">
        <ComplianceCheckbox
          checked={formState.agent_rights_confirmed}
          error={errors.agent_rights_confirmed}
          label={
            language === "zh"
              ? "我确认此 Agent 为原创，或我拥有销售它的合法权利。"
              : "I confirm this agent is original or I have the rights to sell it."
          }
          onChange={(checked) => updateField("agent_rights_confirmed", checked)}
        />
        <ComplianceCheckbox
          checked={formState.content_safety_confirmed}
          error={errors.content_safety_confirmed}
          label={
            language === "zh"
              ? "我确认此 Agent 不包含非法、不安全或侵权内容。"
              : "I confirm this agent does not contain illegal, unsafe, or infringing content."
          }
          onChange={(checked) => updateField("content_safety_confirmed", checked)}
        />
        <ComplianceCheckbox
          checked={formState.review_policy_confirmed}
          error={errors.review_policy_confirmed}
          label={
            language === "zh"
              ? "我同意公开上架前需要经过平台审核。"
              : "I agree to platform review before public listing."
          }
          onChange={(checked) => updateField("review_policy_confirmed", checked)}
        />
        <ComplianceCheckbox
          checked={formState.suspension_policy_confirmed}
          error={errors.suspension_policy_confirmed}
          label={
            language === "zh"
              ? "我理解平台可能拒绝或下架违反政策的 Agent。"
              : "I understand the platform may reject or suspend agents that violate policy."
          }
          onChange={(checked) =>
            updateField("suspension_policy_confirmed", checked)
          }
        />
        {isSensitiveCategory(formState.category_slug) ? (
          <ComplianceCheckbox
            checked={formState.sensitive_disclaimer_confirmed}
            error={errors.sensitive_disclaimer_confirmed}
            label={
              language === "zh"
                ? `敏感类目免责声明：${sensitiveDisclaimer}`
                : `Sensitive category disclaimer: ${sensitiveDisclaimer}`
            }
            onChange={(checked) =>
              updateField("sensitive_disclaimer_confirmed", checked)
            }
          />
        ) : null}
      </div>
    );
  }

  function renderDeliverySettings() {
    if (!formState.delivery_type) {
      return (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {language === "zh"
            ? "请先在第一步选择 Agent 类型。"
            : "Select an agent type in step 1 first."}
        </p>
      );
    }

    if (formState.delivery_type === "prompt_template") {
      return (
        <div className="grid gap-4">
          <DeliveryTextArea
            error={errors["delivery_settings.prompt_content"]}
            label={language === "zh" ? "提示词内容" : "Prompt content"}
            name="prompt_content"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.prompt_content}
          />
          <DeliveryTextArea
            error={errors["delivery_settings.usage_guide"]}
            label={language === "zh" ? "使用指南" : "Usage guide"}
            name="usage_guide"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.usage_guide}
          />
          <DeliveryTextArea
            error={errors["delivery_settings.example_inputs_outputs"]}
            label={language === "zh" ? "示例输入/输出" : "Example inputs/outputs"}
            name="example_inputs_outputs"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.example_inputs_outputs}
          />
        </div>
      );
    }

    if (formState.delivery_type === "workflow_template") {
      return (
        <div className="grid gap-4">
          <label className="text-sm">
            <span className="font-medium text-slate-700">
              {language === "zh" ? "工作流平台" : "Workflow platform"} *
            </span>
            <select
              className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
              onChange={(event) =>
                updateDeliverySetting("workflow_platform_type", event.target.value)
              }
              value={formState.delivery_settings.workflow_platform_type}
            >
              <option value="">Select</option>
              {["Dify", "Coze", "n8n", "Make", "other"].map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            {errors["delivery_settings.workflow_platform_type"] ? (
              <ErrorText message={errors["delivery_settings.workflow_platform_type"]} />
            ) : null}
          </label>
          <DeliveryTextArea
            error={errors["delivery_settings.import_instructions"]}
            label={language === "zh" ? "导入说明" : "Import instructions"}
            name="import_instructions"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.import_instructions}
          />
          <DeliveryTextArea
            error={errors["delivery_settings.required_external_tools"]}
            label={language === "zh" ? "所需外部工具" : "Required external tools"}
            name="required_external_tools"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.required_external_tools}
          />
          <DeliveryTextArea
            error={errors["delivery_settings.setup_guide"]}
            label={language === "zh" ? "配置指南" : "Setup guide"}
            name="setup_guide"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.setup_guide}
          />
        </div>
      );
    }

    if (formState.delivery_type === "hosted_agent") {
      return (
        <div className="grid gap-4">
          <DeliveryTextArea
            error={errors["delivery_settings.hosted_behavior"]}
            label={language === "zh" ? "托管运行方式" : "Hosted behavior"}
            name="hosted_behavior"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.hosted_behavior}
          />
          <DeliveryTextArea
            error={errors["delivery_settings.configuration_fields"]}
            label={language === "zh" ? "客户可配置字段" : "Configuration fields"}
            name="configuration_fields"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.configuration_fields}
          />
          <BooleanSetting
            checked={formState.delivery_settings.customer_dashboard_support}
            label={
              language === "zh"
                ? "支持客户后台"
                : "Customer dashboard support"
            }
            onChange={(checked) =>
              updateDeliverySetting("customer_dashboard_support", checked)
            }
          />
        </div>
      );
    }

    if (formState.delivery_type === "website_chatbot") {
      return (
        <div className="grid gap-4">
          <BooleanSetting
            checked={formState.delivery_settings.widget_support}
            label={language === "zh" ? "支持网站小组件" : "Widget support"}
            onChange={(checked) => updateDeliverySetting("widget_support", checked)}
          />
          <BooleanSetting
            checked={formState.delivery_settings.license_domain_binding_required}
            label={
              language === "zh"
                ? "需要许可证/域名绑定"
                : "License/domain binding required"
            }
            onChange={(checked) =>
              updateDeliverySetting("license_domain_binding_required", checked)
            }
          />
          <BooleanSetting
            checked={formState.delivery_settings.lead_capture_support}
            label={language === "zh" ? "支持线索收集" : "Lead capture support"}
            onChange={(checked) =>
              updateDeliverySetting("lead_capture_support", checked)
            }
          />
          <DeliveryTextArea
            error={errors["delivery_settings.embed_documentation"]}
            label={language === "zh" ? "嵌入文档" : "Embed documentation"}
            name="embed_documentation"
            onChange={updateDeliverySetting}
            value={formState.delivery_settings.embed_documentation}
          />
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <BooleanSetting
          checked={formState.delivery_settings.consultation_required}
          label={language === "zh" ? "需要先咨询" : "Consultation required"}
          onChange={(checked) =>
            updateDeliverySetting("consultation_required", checked)
          }
        />
        <BooleanSetting
          checked={formState.delivery_settings.quote_required}
          label={language === "zh" ? "需要报价" : "Quote required"}
          onChange={(checked) => updateDeliverySetting("quote_required", checked)}
        />
        <DeliveryTextArea
          error={errors["delivery_settings.custom_workflow_description"]}
          label={
            language === "zh"
              ? "定制流程说明"
              : "Custom workflow description"
          }
          name="custom_workflow_description"
          onChange={updateDeliverySetting}
          value={formState.delivery_settings.custom_workflow_description}
        />
      </div>
    );
  }
}

function QualityPanel({
  onAiAction,
  quality,
  text,
}: {
  onAiAction: (action: string) => void;
  quality: AgentQualityResult;
  text: QualityText;
}) {
  const aiActions = [
    text.generateEnglishVersion,
    text.generateChineseVersion,
    text.improveProductDescription,
    text.generateFaq,
    text.suggestPricing,
    text.generateCoverPrompt,
  ];

  return (
    <section className="premium-card p-5" data-testid="seller-quality-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-slate-950">
              {text.completeness}
            </h2>
            <span
              className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"
              data-testid="seller-quality-score"
            >
              {quality.percentage}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${quality.percentage}%` }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800">
            {text.aiAssistant}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {aiActions.map((action) => (
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                key={action}
                onClick={() => onAiAction(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <QualityList
          emptyText={text.noQualityIssues}
          items={quality.missingFields}
          title={text.missingFields}
        />
        <QualityList
          emptyText={text.noQualityIssues}
          items={quality.submissionGateFailures}
          title={text.submissionGate}
        />
        <QualityList
          emptyText={text.noQualityIssues}
          items={[...quality.warnings, ...quality.possibleFalseClaims]}
          title={text.warnings}
        />
      </div>
    </section>
  );
}

function QualityList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {items.length ? (
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
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
  onChange: <Key extends keyof FormState>(name: Key, value: FormState[Key]) => void;
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
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function TextArea({
  error,
  label,
  name,
  onChange,
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name: TextFieldName;
  onChange: <Key extends keyof FormState>(name: Key, value: FormState[Key]) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        aria-invalid={Boolean(error)}
        className="polished-input mt-2 min-h-28 w-full px-3 py-2 text-sm text-slate-950"
        data-testid={`seller-upload-${name}`}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      />
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function DeliveryTextArea<Key extends keyof DeliverySettingsState>({
  error,
  label,
  name,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  name: Key;
  onChange: (name: Key, value: DeliverySettingsState[Key]) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label} *</span>
      <textarea
        aria-invalid={Boolean(error)}
        className="polished-input mt-2 min-h-28 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) =>
          onChange(name, event.target.value as DeliverySettingsState[Key])
        }
        value={value}
      />
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function PlanField<Key extends keyof PricingPlanState>({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: Key;
  onChange: (name: Key, value: PricingPlanState[Key]) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="polished-input mt-2 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(name, event.target.value as PricingPlanState[Key])}
        type="text"
        value={value}
      />
    </label>
  );
}

function PlanArea<Key extends keyof PricingPlanState>({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: Key;
  onChange: (name: Key, value: PricingPlanState[Key]) => void;
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <textarea
        className="polished-input mt-2 min-h-24 w-full px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(name, event.target.value as PricingPlanState[Key])}
        value={value}
      />
    </label>
  );
}

function ComplianceCheckbox({
  checked,
  error,
  label,
  onChange,
}: {
  checked: boolean;
  error?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <span className="flex items-start gap-3">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="font-medium leading-6 text-slate-800">{label}</span>
      </span>
      {error ? <ErrorText message={error} /> : null}
    </label>
  );
}

function BooleanSetting({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function toPayload(formState: FormState, status: "draft" | "submitted") {
  return {
    agent_rights_confirmed: formState.agent_rights_confirmed,
    category_slug: formState.category_slug,
    content_safety_confirmed: formState.content_safety_confirmed,
    cover_image_url: formState.cover_image_url,
    custom_upgrade_options_en: formState.custom_upgrade_options_en,
    custom_upgrade_options_zh: formState.custom_upgrade_options_zh,
    data_permissions_en: formState.data_permissions_en,
    data_permissions_zh: formState.data_permissions_zh,
    delivery_settings: formState.delivery_settings,
    delivery_type: formState.delivery_type || undefined,
    demo_answers: parseLines(formState.demo_answers),
    demo_enabled: formState.demo_enabled,
    demo_questions: parseLines(formState.demo_questions),
    demo_url: formState.demo_url,
    description_en: formState.full_description_en,
    description_zh: formState.full_description_zh,
    faq_en: parseFaq(formState.faq_en),
    faq_zh: parseFaq(formState.faq_zh),
    features_en: parseLines(formState.features_en),
    features_zh: parseLines(formState.features_zh),
    full_description_en: formState.full_description_en,
    full_description_zh: formState.full_description_zh,
    limitations_en: formState.limitations_en,
    limitations_zh: formState.limitations_zh,
    price_cny: parsePrice(formState.price_cny),
    price_usd: parsePrice(formState.price_usd),
    pricing_plans: formState.pricing_plans.map((plan) => ({
      cta_label_en: plan.cta_label_en,
      cta_label_zh: plan.cta_label_zh,
      delivery_time_en: plan.delivery_time_en,
      delivery_time_zh: plan.delivery_time_zh,
      included_items_en: parseLines(plan.included_items_en),
      included_items_zh: parseLines(plan.included_items_zh),
      limitations_en: plan.limitations_en,
      limitations_zh: plan.limitations_zh,
      plan_id: plan.plan_id,
      price_cny: parsePrice(plan.price_cny),
      price_usd: parsePrice(plan.price_usd),
      title_en: plan.title_en,
      title_zh: plan.title_zh,
    })),
    pricing_type: formState.pricing_type || undefined,
    review_policy_confirmed: formState.review_policy_confirmed,
    rights_confirmed: formState.agent_rights_confirmed,
    sample_conversation: formState.sample_conversation,
    screenshot_urls: parseLines(formState.screenshot_urls),
    seller_email: formState.seller_email,
    sensitive_disclaimer_confirmed: formState.sensitive_disclaimer_confirmed,
    setup_instructions_en: formState.setup_instructions_en,
    setup_instructions_zh: formState.setup_instructions_zh,
    short_description_en: formState.short_description_en,
    short_description_zh: formState.short_description_zh,
    status,
    supported_languages: formState.supported_languages,
    suspension_policy_confirmed: formState.suspension_policy_confirmed,
    tags: parseLines(formState.tags),
    title_en: formState.title_en,
    title_zh: formState.title_zh,
    use_cases_en: parseLines(formState.use_cases_en),
    use_cases_zh: parseLines(formState.use_cases_zh),
    video_url: formState.video_url,
    what_customer_receives_en: formState.what_customer_receives_en,
    what_customer_receives_zh: formState.what_customer_receives_zh,
    who_it_is_for_en: formState.who_it_is_for_en,
    who_it_is_for_zh: formState.who_it_is_for_zh,
  };
}

function formStateToQualityInput(formState: FormState) {
  return {
    agent_rights_confirmed: formState.agent_rights_confirmed,
    category_slug: formState.category_slug,
    cover_image_url: formState.cover_image_url,
    data_permissions_en: formState.data_permissions_en,
    data_permissions_zh: formState.data_permissions_zh,
    delivery_settings: formState.delivery_settings,
    delivery_type: formState.delivery_type,
    demo_answers: parseLines(formState.demo_answers),
    demo_questions: parseLines(formState.demo_questions),
    description_en: formState.full_description_en,
    description_zh: formState.full_description_zh,
    faq_en: parseFaq(formState.faq_en),
    faq_zh: parseFaq(formState.faq_zh),
    features_en: parseLines(formState.features_en),
    features_zh: parseLines(formState.features_zh),
    full_description_en: formState.full_description_en,
    full_description_zh: formState.full_description_zh,
    limitations_en: formState.limitations_en,
    limitations_zh: formState.limitations_zh,
    price_cny: parsePrice(formState.price_cny),
    price_usd: parsePrice(formState.price_usd),
    pricing_plans: formState.pricing_plans.map((plan) => ({
      price_cny: parsePrice(plan.price_cny),
      price_usd: parsePrice(plan.price_usd),
      title_en: plan.title_en,
      title_zh: plan.title_zh,
    })),
    pricing_type: formState.pricing_type,
    sample_conversation: formState.sample_conversation,
    setup_instructions_en: formState.setup_instructions_en,
    setup_instructions_zh: formState.setup_instructions_zh,
    short_description_en: formState.short_description_en,
    short_description_zh: formState.short_description_zh,
    tags: parseLines(formState.tags),
    title_en: formState.title_en,
    title_zh: formState.title_zh,
  };
}

function agentToFormState(agent: SellerAgentRecord, sellerEmail: string): FormState {
  return {
    ...initialFormState,
    agent_rights_confirmed: Boolean(agent.agent_rights_confirmed),
    category_slug: agent.category_slug ?? "",
    content_safety_confirmed: Boolean(agent.content_safety_confirmed),
    cover_image_url: agent.cover_image_url ?? "",
    custom_upgrade_options_en: agent.custom_upgrade_options_en ?? "",
    custom_upgrade_options_zh: agent.custom_upgrade_options_zh ?? "",
    data_permissions_en: agent.data_permissions_en ?? "",
    data_permissions_zh: agent.data_permissions_zh ?? "",
    delivery_settings: {
      ...initialDeliverySettings,
      ...normalizeDeliverySettingsForForm(agent.delivery_settings),
    },
    delivery_type: agent.delivery_type ?? "",
    demo_answers: linesToText(agent.demo_answers),
    demo_enabled: agent.demo_enabled ?? true,
    demo_questions: linesToText(agent.demo_questions),
    demo_url: agent.demo_url ?? "",
    faq_en: faqToText(agent.faq_en),
    faq_zh: faqToText(agent.faq_zh),
    features_en: linesToText(agent.features_en),
    features_zh: linesToText(agent.features_zh),
    full_description_en: agent.description_en ?? "",
    full_description_zh: agent.description_zh ?? "",
    limitations_en: agent.limitations_en ?? "",
    limitations_zh: agent.limitations_zh ?? "",
    price_cny: priceToText(agent.price_cny),
    price_usd: priceToText(agent.price_usd),
    pricing_plans: pricingPlansToState(agent.pricing_plans),
    pricing_type: agent.pricing_type ?? "",
    review_policy_confirmed: Boolean(agent.review_policy_confirmed),
    sample_conversation: agent.sample_conversation ?? "",
    screenshot_urls: linesToText(agent.screenshot_urls),
    seller_email: agent.seller_email ?? sellerEmail,
    sensitive_disclaimer_confirmed: Boolean(
      agent.sensitive_disclaimer_confirmed,
    ),
    setup_instructions_en: agent.setup_instructions_en ?? "",
    setup_instructions_zh: agent.setup_instructions_zh ?? "",
    short_description_en: agent.short_description_en ?? "",
    short_description_zh: agent.short_description_zh ?? "",
    supported_languages: supportedLanguagesToState(agent.supported_languages),
    suspension_policy_confirmed: Boolean(agent.suspension_policy_confirmed),
    tags: linesToText(agent.tags),
    title_en: agent.title_en ?? "",
    title_zh: agent.title_zh ?? "",
    use_cases_en: linesToText(agent.use_cases_en),
    use_cases_zh: linesToText(agent.use_cases_zh),
    video_url: agent.video_url ?? "",
    what_customer_receives_en: agent.what_customer_receives_en ?? "",
    what_customer_receives_zh: agent.what_customer_receives_zh ?? "",
    who_it_is_for_en: agent.who_it_is_for_en ?? "",
    who_it_is_for_zh: agent.who_it_is_for_zh ?? "",
  };
}

function normalizeDeliverySettingsForForm(
  settings: Record<string, unknown> | undefined,
): DeliverySettingsState {
  const nextSettings = { ...initialDeliverySettings };

  if (!settings) {
    return nextSettings;
  }

  (Object.keys(nextSettings) as Array<keyof DeliverySettingsState>).forEach((key) => {
    const value = settings[key];

    if (typeof nextSettings[key] === "boolean") {
      nextSettings[key] = Boolean(value) as never;
      return;
    }

    if (typeof value === "string") {
      nextSettings[key] = value as never;
    }
  });

  return nextSettings;
}

function pricingPlansToState(
  plans: Array<Record<string, unknown>> | undefined,
): PricingPlanState[] {
  if (!Array.isArray(plans) || plans.length === 0) {
    return defaultPricingPlans.map((plan) => ({ ...plan }));
  }

  return plans.map((plan, index) => {
    const fallback = defaultPricingPlans[index] ?? defaultPricingPlans[0];

    return {
      cta_label_en: stringFromRecord(plan, "cta_label_en") || fallback.cta_label_en,
      cta_label_zh: stringFromRecord(plan, "cta_label_zh") || fallback.cta_label_zh,
      delivery_time_en:
        stringFromRecord(plan, "delivery_time_en") || fallback.delivery_time_en,
      delivery_time_zh:
        stringFromRecord(plan, "delivery_time_zh") || fallback.delivery_time_zh,
      included_items_en: stringListFromRecord(plan, "included_items_en"),
      included_items_zh: stringListFromRecord(plan, "included_items_zh"),
      limitations_en: stringFromRecord(plan, "limitations_en"),
      limitations_zh: stringFromRecord(plan, "limitations_zh"),
      plan_id: normalizePlanId(stringFromRecord(plan, "plan_id"), index),
      price_cny: priceToText(numberFromRecord(plan, "price_cny")),
      price_usd: priceToText(numberFromRecord(plan, "price_usd")),
      title_en: stringFromRecord(plan, "title_en") || fallback.title_en,
      title_zh: stringFromRecord(plan, "title_zh") || fallback.title_zh,
    };
  });
}

function normalizePlanId(
  value: string,
  index: number,
): PricingPlanState["plan_id"] {
  if (
    value === "agent_only" ||
    value === "agent_setup" ||
    value === "custom_version"
  ) {
    return value;
  }

  return defaultPricingPlans[index]?.plan_id ?? "agent_only";
}

function supportedLanguagesToState(
  languages: SupportedLanguage[] | undefined,
): SupportedLanguage[] {
  return Array.isArray(languages) && languages.length > 0 ? languages : ["en", "zh"];
}

function faqToText(value: Array<{ answer: string; question: string }> | undefined) {
  return Array.isArray(value)
    ? value.map((item) => `${item.question} | ${item.answer}`).join("\n")
    : "";
}

function linesToText(value: string[] | undefined) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function stringFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function stringListFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).join("\n")
    : stringFromRecord(record, key);
}

function numberFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function priceToText(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function validateForm(formState: FormState, status: "draft" | "submitted") {
  const nextErrors: ErrorState = {};

  if (!formState.seller_email.trim() || !/^\S+@\S+\.\S+$/.test(formState.seller_email)) {
    nextErrors.seller_email = "A valid seller email is required.";
  }

  if (status === "draft") {
    return nextErrors;
  }

  requireText(nextErrors, formState, "delivery_type", "Agent type is required.");
  requireText(nextErrors, formState, "title_en", "English title is required.");
  requireText(nextErrors, formState, "title_zh", "Chinese title is required.");
  requireText(
    nextErrors,
    formState,
    "short_description_en",
    "English short description is required.",
  );
  requireText(
    nextErrors,
    formState,
    "short_description_zh",
    "Chinese short description is required.",
  );
  requireText(nextErrors, formState, "category_slug", "Category is required.");
  requireText(
    nextErrors,
    formState,
    "cover_image_url",
    "Cover image is required before review.",
  );
  requireText(
    nextErrors,
    formState,
    "full_description_en",
    "English full description is required.",
  );
  requireText(
    nextErrors,
    formState,
    "full_description_zh",
    "Chinese full description is required.",
  );

  if (formState.supported_languages.length === 0) {
    nextErrors.supported_languages = "At least one supported language is required.";
  }

  requireText(nextErrors, formState, "pricing_type", "Pricing type is required.");

  if (
    (formState.pricing_type === "one_time" ||
      formState.pricing_type === "monthly") &&
    parsePrice(formState.price_usd) === null &&
    parsePrice(formState.price_cny) === null
  ) {
    nextErrors.price_usd = "Price is required for paid agents.";
    nextErrors.price_cny = "Price is required for paid agents.";
  }

  if (parseLines(formState.demo_questions).length < 5) {
    nextErrors.demo_questions = "At least 5 demo questions are required.";
  }

  if (parseLines(formState.demo_answers).length < 5) {
    nextErrors.demo_answers = "At least 5 demo answers are required.";
  }

  requireText(
    nextErrors,
    formState,
    "sample_conversation",
    "A sample conversation is required.",
  );

  if (
    formState.pricing_plans.filter((plan) => plan.title_en.trim() || plan.title_zh.trim())
      .length === 0
  ) {
    nextErrors.pricing_plans = "At least one pricing plan is required.";
  }

  if (!formState.data_permissions_en.trim() && !formState.data_permissions_zh.trim()) {
    nextErrors.data_permissions_en = "Data permissions are required.";
    nextErrors.data_permissions_zh = "Data permissions are required.";
  }

  if (!formState.limitations_en.trim() && !formState.limitations_zh.trim()) {
    nextErrors.limitations_en = "Limitations are required.";
    nextErrors.limitations_zh = "Limitations are required.";
  }

  validateDeliverySettings(nextErrors, formState);

  if (!formState.agent_rights_confirmed) {
    nextErrors.agent_rights_confirmed =
      "Confirm this agent is original or you have the rights to sell it.";
  }

  if (!formState.content_safety_confirmed) {
    nextErrors.content_safety_confirmed =
      "Confirm this agent does not contain illegal, unsafe, or infringing content.";
  }

  if (!formState.review_policy_confirmed) {
    nextErrors.review_policy_confirmed =
      "Agree to platform review before public listing.";
  }

  if (!formState.suspension_policy_confirmed) {
    nextErrors.suspension_policy_confirmed =
      "Acknowledge that violating agents may be rejected or suspended.";
  }

  if (
    isSensitiveCategory(formState.category_slug) &&
    !formState.sensitive_disclaimer_confirmed
  ) {
    nextErrors.sensitive_disclaimer_confirmed =
      "Sensitive categories require the professional-advice disclaimer.";
  }

  return nextErrors;
}

function validateDeliverySettings(nextErrors: ErrorState, formState: FormState) {
  if (formState.delivery_type === "prompt_template") {
    requireDelivery(nextErrors, formState, "prompt_content");
    requireDelivery(nextErrors, formState, "usage_guide");
    requireDelivery(nextErrors, formState, "example_inputs_outputs");
  }

  if (formState.delivery_type === "workflow_template") {
    requireDelivery(nextErrors, formState, "workflow_platform_type");
    requireDelivery(nextErrors, formState, "import_instructions");
    requireDelivery(nextErrors, formState, "required_external_tools");
    requireDelivery(nextErrors, formState, "setup_guide");
  }

  if (formState.delivery_type === "hosted_agent") {
    requireDelivery(nextErrors, formState, "hosted_behavior");
    requireDelivery(nextErrors, formState, "configuration_fields");
  }

  if (formState.delivery_type === "website_chatbot") {
    requireDelivery(nextErrors, formState, "embed_documentation");
  }

  if (formState.delivery_type === "custom_business_agent") {
    requireDelivery(nextErrors, formState, "custom_workflow_description");
  }
}

function requireDelivery(
  nextErrors: ErrorState,
  formState: FormState,
  key: keyof DeliverySettingsState,
) {
  const value = formState.delivery_settings[key];

  if (typeof value === "string" && !value.trim()) {
    nextErrors[`delivery_settings.${key}`] = "This delivery field is required.";
  }
}

function requireText(
  nextErrors: ErrorState,
  formState: FormState,
  key: TextFieldName,
  message: string,
) {
  if (!formState[key].trim()) {
    nextErrors[key] = message;
  }
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

function isSensitiveCategory(categorySlug: string) {
  const normalized = categorySlug.toLowerCase();

  return (
    normalized === "legal" ||
    normalized.includes("medical") ||
    normalized.includes("healthcare") ||
    normalized.includes("financial") ||
    normalized.includes("finance")
  );
}
