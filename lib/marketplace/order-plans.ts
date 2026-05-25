import type { AppLanguage } from "@/lib/i18n/language";
import type { OrderPlanId } from "@/lib/marketplace/constants";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type AgentOrderPlan = {
  amountCny: number | null;
  amountUsd: number | null;
  bestForEn: string;
  bestForZh: string;
  ctaEn: string;
  ctaZh: string;
  descriptionEn: string;
  descriptionZh: string;
  deliveryTimeEn: string;
  deliveryTimeZh: string;
  id: OrderPlanId;
  includedItemsEn: string[];
  includedItemsZh: string[];
  limitationsEn: string[];
  limitationsZh: string[];
  nameEn: string;
  nameZh: string;
};

const planOverrides: Record<string, AgentOrderPlan[]> = {
  "website-customer-support-agent": [
    {
      amountCny: 399,
      amountUsd: 49,
      bestForEn:
        "Teams that want a ready-made website sales and support agent to test on their site.",
      bestForZh: "适合希望先把现成网站销售客服 Agent 安装到网站测试的团队。",
      ctaEn: "Buy Agent Only",
      ctaZh: "购买 Agent 本体",
      descriptionEn:
        "Ready-made website chat agent package with embed code, configuration guide, lead capture flow, and documentation.",
      descriptionZh:
        "现成网站聊天 Agent 套件，包含嵌入代码、配置指南、线索收集流程和使用文档。",
      deliveryTimeEn: "1 business day after payment/contact confirmation.",
      deliveryTimeZh: "付款和联系方式确认后 1 个工作日内交付。",
      id: "agent_only",
      includedItemsEn: [
        "Hosted website sales and lead capture agent URL",
        "Website embed code for iframe or script installation",
        "Basic customer configuration access for company info, FAQ, and rules",
        "Lead collection dashboard access",
        "Installation guide and launch checklist",
      ],
      includedItemsZh: [
        "托管的网站销售客服获客 Agent 链接",
        "用于 iframe 或 script 安装的网站嵌入代码",
        "基础客户配置入口，可维护公司信息、FAQ 和规则",
        "线索收集后台入口",
        "安装指南和上线检查清单",
      ],
      limitationsEn: [
        "No custom CRM, calendar, or API integration included",
        "Customer installs the widget unless setup service is added",
        "Uses configured content and rules only",
      ],
      limitationsZh: [
        "不包含 CRM、日历或 API 定制集成",
        "默认由客户自行安装 widget，如需协助可购买配置服务",
        "仅基于已配置内容和规则回答",
      ],
      nameEn: "Agent Only",
      nameZh: "Agent 本体",
    },
    {
      amountCny: 1999,
      amountUsd: 299,
      bestForEn:
        "Businesses that want help adapting the agent to their site and launch flow.",
      bestForZh: "适合希望我们协助配置到网站并完成上线检查的企业。",
      ctaEn: "Order Agent + Setup",
      ctaZh: "购买并配置安装",
      descriptionEn:
        "Agent package plus basic setup support, website embed guidance, and launch checklist.",
      descriptionZh:
        "包含 Agent 套件、基础配置支持、网站嵌入指导和上线检查清单。",
      deliveryTimeEn: "2-3 business days after content and access are confirmed.",
      deliveryTimeZh: "内容和必要访问确认后 2-3 个工作日交付。",
      id: "agent_setup",
      includedItemsEn: [
        "Everything in Agent Only",
        "Basic FAQ, service, pricing-range, and handoff rule configuration",
        "Website embed guidance and launch testing",
        "Tone adjustment for English and Chinese conversations",
        "One round of launch-ready content cleanup",
      ],
      includedItemsZh: [
        "包含 Agent 本体方案的全部内容",
        "基础 FAQ、服务、价格范围和人工转接规则配置",
        "网站嵌入指导和上线测试",
        "英文和中文对话语气调整",
        "一轮上线前内容整理",
      ],
      limitationsEn: [
        "Does not include deep system integration or custom workflow logic",
        "Requires customer to provide approved website content and FAQ",
        "Complex routing rules belong in Custom Version",
      ],
      limitationsZh: [
        "不包含深度系统集成或定制工作流逻辑",
        "需要客户提供已确认的网站内容和 FAQ",
        "复杂流转规则属于定制版本范围",
      ],
      nameEn: "Agent + Setup",
      nameZh: "Agent + 配置安装",
    },
    {
      amountCny: 6999,
      amountUsd: 999,
      bestForEn:
        "Teams that need deeper workflow logic, CRM/calendar/API routing, or private documents.",
      bestForZh: "适合需要更深工作流、CRM/日历/API 流转或私有文档配置的团队。",
      ctaEn: "Request Custom Version",
      ctaZh: "申请定制版本",
      descriptionEn:
        "Custom version scoped around your business documents, handoff rules, integrations, and brand tone.",
      descriptionZh:
        "根据业务文档、人工转接规则、集成需求和品牌语气定制的专属版本。",
      deliveryTimeEn: "Quoted after scope review; usually starts from 5-10 business days.",
      deliveryTimeZh: "需求评估后报价；通常从 5-10 个工作日起。",
      id: "custom_version",
      includedItemsEn: [
        "Custom qualification questions and handoff workflows",
        "Company documents, sales scripts, or internal FAQ adaptation",
        "CRM, calendar, email, API, or notification integration planning",
        "Custom admin fields and lead routing rules",
        "Launch QA based on the agreed scope",
      ],
      includedItemsZh: [
        "定制线索筛选问题和人工转接流程",
        "公司文档、销售话术或内部 FAQ 适配",
        "CRM、日历、邮件、API 或通知集成方案设计",
        "定制后台字段和线索流转规则",
        "按确认范围执行上线测试",
      ],
      limitationsEn: [
        "Final price and timeline depend on scope and integration access",
        "No guaranteed lead volume, sales result, or legal/medical/financial outcome",
        "Unsupported regulated advice must be routed to a qualified human",
      ],
      limitationsZh: [
        "最终价格和周期取决于需求范围和系统访问条件",
        "不保证线索数量、销售结果或法律/医疗/金融结果",
        "不支持的受监管建议必须转交具备资质的人工处理",
      ],
      nameEn: "Custom Version",
      nameZh: "定制版本",
    },
  ],
  "ecommerce-product-support-agent": [
    {
      amountCny: 599,
      amountUsd: 79,
      bestForEn:
        "Stores that want a ready-made product support and purchase-intent widget.",
      bestForZh: "适合需要现成商品客服和购买意向收集 widget 的电商网站。",
      ctaEn: "Buy Agent Only",
      ctaZh: "购买 Agent 本体",
      descriptionEn:
        "Agent template, hosted demo, basic embed code, purchase-intent capture flow, and delivery documentation.",
      descriptionZh:
        "包含 Agent 模板、托管 Demo、基础嵌入代码、购买意向收集流程和交付文档。",
      deliveryTimeEn: "1 business day after payment/contact confirmation.",
      deliveryTimeZh: "付款和联系方式确认后 1 个工作日内交付。",
      id: "agent_only",
      includedItemsEn: [
        "Hosted e-commerce product support agent URL",
        "Website embed code for iframe or script installation",
        "Basic product FAQ and policy configuration access",
        "Lead and purchase-intent dashboard access",
        "Installation guide and shopper test checklist",
      ],
      includedItemsZh: [
        "托管的电商产品客服 Agent 链接",
        "用于 iframe 或 script 安装的网站嵌入代码",
        "基础商品 FAQ 和政策配置入口",
        "线索与购买意向后台入口",
        "安装指南和买家问题测试清单",
      ],
      limitationsEn: [
        "No real-time Shopify, order, inventory, or payment lookup included",
        "Customer installs the widget unless setup service is added",
        "Answers only from configured product FAQ and policies",
      ],
      limitationsZh: [
        "不包含 Shopify、订单、库存或支付信息的实时查询",
        "默认由客户自行安装 widget，如需协助可购买配置服务",
        "仅基于已配置商品 FAQ 和政策回答",
      ],
      nameEn: "Agent Only",
      nameZh: "Agent 本体",
    },
    {
      amountCny: 2999,
      amountUsd: 399,
      bestForEn:
        "Stores that want help configuring product FAQ, policies, tone, and embed testing.",
      bestForZh: "适合希望我们协助配置商品 FAQ、政策、语气并完成嵌入测试的店铺。",
      ctaEn: "Order Agent + Setup",
      ctaZh: "购买并配置安装",
      descriptionEn:
        "Product FAQ setup, shipping/return policy setup, brand tone adjustment, website embed support, and launch testing.",
      descriptionZh:
        "包含商品 FAQ 配置、物流/退换货政策配置、品牌语气调整、网站嵌入支持和上线测试。",
      deliveryTimeEn: "2-4 business days after product FAQ and policy content are confirmed.",
      deliveryTimeZh: "商品 FAQ 和政策内容确认后 2-4 个工作日交付。",
      id: "agent_setup",
      includedItemsEn: [
        "Everything in Agent Only",
        "Product FAQ, category, shipping, return, refund, and warranty setup",
        "Brand tone adjustment for English and Chinese shoppers",
        "Website embed guidance and checkout-adjacent behavior testing",
        "One round of launch-ready content cleanup",
      ],
      includedItemsZh: [
        "包含 Agent 本体方案的全部内容",
        "商品 FAQ、分类、物流、退货、退款和保修配置",
        "英文和中文买家对话语气调整",
        "网站嵌入指导和购买前相关行为测试",
        "一轮上线前内容整理",
      ],
      limitationsEn: [
        "Does not include live order, inventory, discount, or refund approval integration",
        "Requires customer to provide approved product and policy content",
        "Advanced recommendation logic belongs in Custom Version",
      ],
      limitationsZh: [
        "不包含实时订单、库存、折扣或退款审批集成",
        "需要客户提供已确认的商品和政策内容",
        "高级推荐逻辑属于定制版本范围",
      ],
      nameEn: "Agent + Setup",
      nameZh: "Agent + 配置安装",
    },
    {
      amountCny: 9999,
      amountUsd: 1499,
      bestForEn:
        "Stores that need Shopify/order/inventory integration, CRM/email routing, or custom recommendation logic.",
      bestForZh: "适合需要 Shopify/订单/库存集成、CRM/邮件流转或定制推荐逻辑的店铺。",
      ctaEn: "Request Custom Version",
      ctaZh: "申请定制版本",
      descriptionEn:
        "Custom version with Shopify/order/inventory integration, CRM or email integration, and custom product recommendation logic.",
      descriptionZh:
        "包含 Shopify/订单/库存集成、CRM 或邮件集成，以及自定义商品推荐逻辑的定制版本。",
      deliveryTimeEn: "Quoted after scope review; usually starts from 7-15 business days.",
      deliveryTimeZh: "需求评估后报价；通常从 7-15 个工作日起。",
      id: "custom_version",
      includedItemsEn: [
        "Custom product recommendation and purchase-intent logic",
        "Shopify, WooCommerce, order, inventory, CRM, email, or API integration planning",
        "Custom escalation rules for bulk orders, complaints, and order questions",
        "Store-specific FAQ and policy workflow design",
        "Launch QA based on the agreed integration scope",
      ],
      includedItemsZh: [
        "定制商品推荐和购买意向判断逻辑",
        "Shopify、WooCommerce、订单、库存、CRM、邮件或 API 集成方案设计",
        "批量采购、投诉和订单问题的定制转人工规则",
        "店铺专属 FAQ 与政策工作流设计",
        "按确认集成范围执行上线测试",
      ],
      limitationsEn: [
        "Final price and timeline depend on store platform, API access, and data quality",
        "No guaranteed conversion lift, sales volume, refund approval, or inventory availability",
        "Unsupported legal, medical, financial, or regulated claims must be escalated",
      ],
      limitationsZh: [
        "最终价格和周期取决于店铺平台、API 访问和数据质量",
        "不保证转化率提升、销售额、退款审批或库存可用性",
        "不支持的法律、医疗、金融或受监管承诺必须转交人工",
      ],
      nameEn: "Custom Version",
      nameZh: "定制版本",
    },
  ],
};

export function getAgentOrderPlans(agent: DemoAgent): AgentOrderPlan[] {
  const override = planOverrides[agent.slug];

  if (override) {
    return override;
  }

  return [
    {
      amountCny: agent.priceCny,
      amountUsd: agent.priceUsd,
      bestForEn: "Teams that want a ready-made agent package first.",
      bestForZh: "适合希望先购买现成 Agent 套件的团队。",
      ctaEn: "Buy Agent Only",
      ctaZh: "购买 Agent 本体",
      descriptionEn:
        "Ready-made agent package with setup instructions and usage documentation.",
      descriptionZh: "现成 Agent 套件，包含配置说明和使用文档。",
      deliveryTimeEn: "1 business day after payment/contact confirmation.",
      deliveryTimeZh: "付款和联系方式确认后 1 个工作日内交付。",
      id: "agent_only",
      includedItemsEn: ["Agent package", "Setup instructions", "Usage documentation"],
      includedItemsZh: ["Agent 套件", "配置说明", "使用文档"],
      limitationsEn: ["No custom workflow or integration included"],
      limitationsZh: ["不包含定制工作流或系统集成"],
      nameEn: "Agent Only",
      nameZh: "Agent 本体",
    },
    {
      amountCny: 1999,
      amountUsd: 299,
      bestForEn: "Teams that want basic setup help.",
      bestForZh: "适合需要基础配置协助的团队。",
      ctaEn: "Order Agent + Setup",
      ctaZh: "购买并配置安装",
      descriptionEn: "Agent package plus basic setup support.",
      descriptionZh: "Agent 套件加基础配置支持。",
      deliveryTimeEn: "2-3 business days after content is confirmed.",
      deliveryTimeZh: "内容确认后 2-3 个工作日交付。",
      id: "agent_setup",
      includedItemsEn: ["Agent package", "Basic setup support", "Launch checklist"],
      includedItemsZh: ["Agent 套件", "基础配置支持", "上线检查清单"],
      limitationsEn: ["No deep integration or custom workflow logic included"],
      limitationsZh: ["不包含深度集成或定制工作流逻辑"],
      nameEn: "Agent + Setup",
      nameZh: "Agent + 配置安装",
    },
    {
      amountCny: 6999,
      amountUsd: 999,
      bestForEn: "Teams that need custom workflow or integration scope.",
      bestForZh: "适合需要定制工作流或系统集成范围的团队。",
      ctaEn: "Request Custom Version",
      ctaZh: "申请定制版本",
      descriptionEn: "Custom version quoted from this starting price.",
      descriptionZh: "基于该起步价沟通定制版本。",
      deliveryTimeEn: "Quoted after scope review.",
      deliveryTimeZh: "需求评估后报价。",
      id: "custom_version",
      includedItemsEn: ["Custom scope review", "Workflow design", "Integration planning"],
      includedItemsZh: ["定制范围评估", "工作流设计", "集成方案设计"],
      limitationsEn: ["Final price and timeline depend on scope"],
      limitationsZh: ["最终价格和周期取决于需求范围"],
      nameEn: "Custom Version",
      nameZh: "定制版本",
    },
  ];
}

export function localizeOrderPlan(plan: AgentOrderPlan, language: AppLanguage) {
  return {
    bestFor:
      language === "zh" ? plan.bestForZh || plan.bestForEn : plan.bestForEn || plan.bestForZh,
    cta: language === "zh" ? plan.ctaZh || plan.ctaEn : plan.ctaEn || plan.ctaZh,
    description:
      language === "zh"
        ? plan.descriptionZh || plan.descriptionEn
        : plan.descriptionEn || plan.descriptionZh,
    deliveryTime:
      language === "zh"
        ? plan.deliveryTimeZh || plan.deliveryTimeEn
        : plan.deliveryTimeEn || plan.deliveryTimeZh,
    includedItems:
      language === "zh"
        ? plan.includedItemsZh.length
          ? plan.includedItemsZh
          : plan.includedItemsEn
        : plan.includedItemsEn.length
          ? plan.includedItemsEn
          : plan.includedItemsZh,
    limitations:
      language === "zh"
        ? plan.limitationsZh.length
          ? plan.limitationsZh
          : plan.limitationsEn
        : plan.limitationsEn.length
          ? plan.limitationsEn
          : plan.limitationsZh,
    name:
      language === "zh" ? plan.nameZh || plan.nameEn : plan.nameEn || plan.nameZh,
  };
}

export function formatPlanAmount(plan: AgentOrderPlan, language: AppLanguage) {
  if (language === "zh") {
    if (plan.id === "custom_version") {
      return plan.amountCny ? `¥${plan.amountCny} 起` : "定制报价";
    }

    return plan.amountCny ? `¥${plan.amountCny}` : "定制报价";
  }

  if (plan.id === "custom_version") {
    return plan.amountUsd ? `From $${plan.amountUsd}` : "Custom quote";
  }

  return plan.amountUsd ? `$${plan.amountUsd}` : "Custom quote";
}
