import type { AppLanguage } from "@/lib/i18n/language";
import type { DemoAgent, DemoCategory } from "@/lib/marketplace/demo-data";
import { getLocalizedAgent, getLocalizedCategory } from "@/lib/marketplace/localization";

type LocalizedList = {
  en: string[];
  zh: string[];
};

type LocalizedDemo = {
  questions: {
    en: string[];
    zh: string[];
  };
  output: {
    en: string;
    zh: string;
  };
};

const categoryUseCases: Record<string, LocalizedList> = {
  "customer-support": {
    en: ["Website support", "FAQ automation", "Lead qualification"],
    zh: ["网站客服", "FAQ 自动化", "线索初筛"],
  },
  ecommerce: {
    en: ["Product support", "Return policy help", "Shopping guidance"],
    zh: ["商品咨询", "退换货政策说明", "购物导购"],
  },
  "real-estate": {
    en: ["Buyer qualification", "Viewing requests", "Area and budget intake"],
    zh: ["购房客户筛选", "看房需求收集", "区域和预算初筛"],
  },
  education: {
    en: ["Course inquiries", "Enrollment follow-up", "Coaching preparation"],
    zh: ["课程咨询", "招生跟进", "辅导准备"],
  },
  legal: {
    en: ["Client intake", "Matter classification", "Attorney handoff"],
    zh: ["客户初筛", "案件类型分类", "律师交接"],
  },
  "healthcare-medical-beauty": {
    en: ["Consultation intake", "Appointment routing", "Service education"],
    zh: ["咨询初筛", "预约分配", "服务说明"],
  },
  "restaurant-local-business": {
    en: ["Booking requests", "Local lead capture", "Service FAQs"],
    zh: ["预约请求", "本地线索收集", "服务 FAQ"],
  },
  "content-creation": {
    en: ["Summaries", "Content notes", "Reusable writing workflows"],
    zh: ["内容总结", "内容笔记", "可复用写作流程"],
  },
  "internal-knowledge-base": {
    en: ["Employee Q&A", "SOP lookup", "Onboarding support"],
    zh: ["员工问答", "SOP 查询", "入职支持"],
  },
  "ai-news-monitoring": {
    en: ["Industry monitoring", "Executive briefings", "Competitive signals"],
    zh: ["行业监控", "管理层简报", "竞品信号"],
  },
};

const defaultUseCases: LocalizedList = {
  en: ["Customer workflow automation", "Internal productivity", "Lead capture"],
  zh: ["客户流程自动化", "内部效率提升", "线索收集"],
};

export function getAgentDetailContent({
  agent,
  category,
  language,
}: {
  agent: DemoAgent;
  category?: DemoCategory | null;
  language: AppLanguage;
}) {
  const localizedAgent = getLocalizedAgent(agent, language);
  const localizedCategory = category
    ? getLocalizedCategory(category, language)
    : null;
  const fallbackUseCases = categoryUseCases[agent.categorySlug] ?? defaultUseCases;
  const targetCustomers =
    localizedAgent.targetCustomers.length > 0
      ? localizedAgent.targetCustomers
      : getDefaultTargetCustomers(
          language,
          localizedCategory?.name ?? "AI Agent",
        );
  const useCases =
    localizedAgent.useCases.length > 0
      ? localizedAgent.useCases
      : language === "zh"
        ? fallbackUseCases.zh
        : fallbackUseCases.en;
  const demoSamples = localizedAgent.demoSamples;

  return {
    whoFor: targetCustomers,
    targetCustomers,
    useCases,
    demo:
      demoSamples.length > 0
        ? getDemoCopyFromSamples(demoSamples, language)
        : getDemoCopy(localizedAgent.title, language),
    demoSamples,
    pricingOptions: localizedAgent.pricingOptions,
    customUpgradeOptions: localizedAgent.customUpgradeOptions,
    coverImageStyle: localizedAgent.coverImageStyle,
    version: "1.0.0",
    changelog:
      language === "zh"
        ? "初始商店版本，包含双语内容、Demo 预览和线索请求流程。"
        : "Initial marketplace version with bilingual content, demo preview, and request flow.",
  };
}

function getDefaultTargetCustomers(
  language: AppLanguage,
  localizedCategoryName: string,
) {
  if (language === "zh") {
    return [
      `需要${localizedCategoryName}能力的企业团队。`,
      "希望先用现成方案验证流程，再决定是否定制的业务负责人。",
      "希望减少重复咨询、整理信息或提升响应效率的运营团队。",
    ];
  }

  return [
    `Business teams that need ${localizedCategoryName} capability quickly.`,
    "Operators who want to validate a ready-made workflow before commissioning a custom build.",
    "Teams that need to reduce repetitive questions, collect context, or improve response speed.",
  ];
}

function getDemoCopyFromSamples(
  samples: Array<{ question: string; answer: string }>,
  language: AppLanguage,
): LocalizedDemo {
  const questions = samples.map((sample) => sample.question);
  const output = samples[0]?.answer ?? "";

  return language === "zh"
    ? {
        questions: { en: [], zh: questions },
        output: { en: "", zh: output },
      }
    : {
        questions: { en: questions, zh: [] },
        output: { en: output, zh: "" },
      };
}

function getDemoCopy(agentTitle: string, language: AppLanguage): LocalizedDemo {
  if (language === "zh") {
    return {
      questions: {
        en: [],
        zh: [
          `这个 ${agentTitle} 可以解决什么问题？`,
          "我需要准备哪些资料？",
          "如果我想定制版本，下一步是什么？",
        ],
      },
      output: {
        en: "",
        zh: `这是一个 Demo 预览回复。${agentTitle} 会先理解你的业务场景，说明可处理的问题，并提示需要准备的资料。正式版本会接入真实知识库、业务规则或工作流。`,
      },
    };
  }

  return {
    questions: {
      en: [
        `What can ${agentTitle} help with?`,
        "What materials do I need for setup?",
        "What is the next step if I need a custom version?",
      ],
      zh: [],
    },
    output: {
      en: `This is a demo preview response. ${agentTitle} would first understand your workflow, explain what it can handle, and list the materials needed for setup. A production version can connect to real knowledge, rules, or workflows.`,
      zh: "",
    },
  };
}
