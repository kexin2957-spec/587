import type { AppLanguage } from "@/lib/i18n/language";
import type { DeliveryType, SupportedLanguage } from "@/lib/marketplace/constants";
import type { DemoAgent, DemoCategory } from "@/lib/marketplace/demo-data";

function preferLanguage(
  language: AppLanguage,
  english: string | null | undefined,
  chinese: string | null | undefined,
) {
  if (language === "zh") {
    return chinese || english || "";
  }

  return english || chinese || "";
}

function preferLanguageList(
  language: AppLanguage,
  english: string[] | null | undefined,
  chinese: string[] | null | undefined,
) {
  if (language === "zh") {
    return chinese?.length ? chinese : english ?? [];
  }

  return english?.length ? english : chinese ?? [];
}

function preferLanguageFaq(
  language: AppLanguage,
  english: DemoAgent["faqEn"] | null | undefined,
  chinese: DemoAgent["faqZh"] | null | undefined,
) {
  if (language === "zh") {
    return chinese?.length ? chinese : english ?? [];
  }

  return english?.length ? english : chinese ?? [];
}

export function getLocalizedAgent(agent: DemoAgent, language: AppLanguage) {
  return {
    ...agent,
    title: preferLanguage(language, agent.titleEn, agent.titleZh),
    alternateTitle: preferLanguage(language, agent.titleZh, agent.titleEn),
    shortDescription: preferLanguage(
      language,
      agent.shortDescriptionEn,
      agent.shortDescriptionZh,
    ),
    description: preferLanguage(
      language,
      agent.descriptionEn,
      agent.descriptionZh,
    ),
    features: preferLanguageList(language, agent.featuresEn, agent.featuresZh),
    faq: preferLanguageFaq(language, agent.faqEn, agent.faqZh),
    targetCustomers: preferLanguageList(
      language,
      agent.targetCustomersEn,
      agent.targetCustomersZh,
    ),
    useCases: preferLanguageList(language, agent.useCasesEn, agent.useCasesZh),
    demoSamples: preferLanguageFaq(
      language,
      agent.demoSamplesEn,
      agent.demoSamplesZh,
    ),
    pricingOptions: preferLanguageList(
      language,
      agent.pricingOptionsEn,
      agent.pricingOptionsZh,
    ),
    customUpgradeOptions: preferLanguageList(
      language,
      agent.customUpgradeOptionsEn,
      agent.customUpgradeOptionsZh,
    ),
    coverImageStyle: preferLanguage(
      language,
      agent.coverImageStyleEn,
      agent.coverImageStyleZh,
    ),
    setupInstructions: preferLanguage(
      language,
      agent.setupInstructionsEn,
      agent.setupInstructionsZh,
    ),
    dataPermissions: preferLanguage(
      language,
      agent.dataPermissionsEn,
      agent.dataPermissionsZh,
    ),
  };
}

export function getLocalizedCategory(
  category: DemoCategory,
  language: AppLanguage,
) {
  return {
    ...category,
    name: preferLanguage(language, category.nameEn, category.nameZh),
    description: preferLanguage(
      language,
      category.descriptionEn,
      category.descriptionZh,
    ),
  };
}

export function formatPrice(agent: DemoAgent, language: AppLanguage) {
  if (agent.pricingType === "custom_quote") {
    return language === "zh" ? "定制报价" : "Custom quote";
  }

  if (agent.pricingType === "free") {
    return language === "zh" ? "免费" : "Free";
  }

  const usd = agent.priceUsd ? `$${agent.priceUsd.toLocaleString("en-US")}` : null;
  const cny = agent.priceCny ? `¥${agent.priceCny.toLocaleString("zh-CN")}` : null;

  if (language === "zh") {
    return [cny, usd].filter(Boolean).join(" / ");
  }

  return [usd, cny].filter(Boolean).join(" / ");
}

export function getLocalizedDeliveryType(
  deliveryType: DeliveryType,
  language: AppLanguage,
) {
  const labels: Record<DeliveryType, { en: string; zh: string }> = {
    prompt_template: { en: "Prompt Template", zh: "Prompt 模板" },
    workflow_template: { en: "Workflow Template", zh: "工作流模板" },
    hosted_agent: { en: "Hosted Agent", zh: "平台托管 Agent" },
    website_chatbot: { en: "Website Chatbot", zh: "网站聊天机器人" },
    custom_business_agent: { en: "Custom Business Agent", zh: "定制商业 Agent" },
  };

  return labels[deliveryType][language];
}

export function getDeliveryTypeExplanation(
  deliveryType: DeliveryType,
  language: AppLanguage,
) {
  const explanations: Record<DeliveryType, { en: string; zh: string }> = {
    prompt_template: {
      en: "You receive a prompt template, usage guide, and examples.",
      zh: "你将获得 Prompt 模板、使用说明和示例。",
    },
    workflow_template: {
      en: "You receive a workflow template for tools such as Dify, n8n, Coze, Make, or similar platforms.",
      zh: "你将获得适用于 Dify、n8n、Coze、Make 等工具的工作流模板。",
    },
    hosted_agent: {
      en: "This agent is hosted by the platform and can be used without self-deployment.",
      zh: "该 Agent 由平台托管，无需你自行部署即可使用。",
    },
    website_chatbot: {
      en: "This agent can be embedded into your website as a chatbot.",
      zh: "该 Agent 可作为网站聊天机器人嵌入你的网站。",
    },
    custom_business_agent: {
      en: "This agent is customized for your business workflow and may require consultation.",
      zh: "该 Agent 会根据你的业务流程定制，通常需要先沟通需求。",
    },
  };

  return explanations[deliveryType][language];
}

export function formatSupportedLanguages(
  supportedLanguages: SupportedLanguage[],
  language: AppLanguage,
) {
  const hasEnglish = supportedLanguages.includes("en");
  const hasChinese = supportedLanguages.includes("zh");

  if (hasEnglish && hasChinese) {
    return language === "zh" ? "English + 中文" : "English + Chinese";
  }

  if (hasChinese) {
    return "中文";
  }

  return "English";
}
