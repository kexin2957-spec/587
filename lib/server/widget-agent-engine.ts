import type { AppLanguage } from "@/lib/i18n/language";
import type { LeadIntent, LeadScore } from "@/lib/marketplace/constants";
import type { MockCustomerAgentConfigRecord } from "@/lib/server/marketplace-admin-store";

export type WidgetChatMessage = {
  role: "agent" | "visitor";
  text: string;
};

export function analyzeWidgetIntent(text: string, agentId: string): {
  intent: LeadIntent;
  needsHuman: boolean;
} {
  const lower = text.toLowerCase();

  if (agentId === "ecommerce-product-support-agent") {
    if (/track|tracking|order|refund|return|bulk|discount|human|person|真人|人工|订单|退货|退款|批量/.test(lower)) {
      return {
        intent: /track|order|订单/.test(lower)
          ? "order_tracking_request"
          : /return|refund|退货|退款/.test(lower)
            ? "return_refund_question"
            : "human_handoff",
        needsHuman: true,
      };
    }

    if (/recommend|best|choose|gift|推荐|适合|礼物/.test(lower)) {
      return { intent: "product_recommendation", needsHuman: false };
    }

    if (/shipping|delivery|ship|物流|运费|配送/.test(lower)) {
      return { intent: "shipping_question", needsHuman: false };
    }

    if (/buy|purchase|checkout|available|stock|购买|下单|库存/.test(lower)) {
      return { intent: "purchase_intent", needsHuman: false };
    }

    return { intent: "product_question", needsHuman: false };
  }

  if (/human|person|call|complain|contract|exact quote|custom|crm|calendar|真人|人工|投诉|合同|定制/.test(lower)) {
    return { intent: "human_handoff", needsHuman: true };
  }

  if (/price|cost|quote|budget|pricing|价格|报价|预算|多少钱/.test(lower)) {
    return { intent: "pricing_inquiry", needsHuman: false };
  }

  if (/book|schedule|consultation|appointment|预约|咨询/.test(lower)) {
    return { intent: "booking_request", needsHuman: false };
  }

  if (/service|offer|product|服务|产品/.test(lower)) {
    return { intent: "service_inquiry", needsHuman: false };
  }

  return { intent: "sales_lead", needsHuman: false };
}

export function buildWidgetReply({
  agentId,
  config,
  language,
  message,
}: {
  agentId: string;
  config: MockCustomerAgentConfigRecord;
  language: AppLanguage;
  message: string;
}) {
  const analysis = analyzeWidgetIntent(message, agentId);
  const localizedFaq = (config.faq_items ?? [])
    .filter((item) => item.is_active)
    .filter((item) => item.language === language);
  const faqSource = localizedFaq.length
    ? localizedFaq
    : config.faq.map((item) => ({ ...item, language: "en" as const }));
  const faqMatch = faqSource.find((item) =>
    message.toLowerCase().includes(item.question.toLowerCase().slice(0, 10)),
  );

  if (faqMatch) {
    return {
      analysis,
      reply:
        language === "zh"
          ? `${faqMatch.answer} 如果需要，我可以收集你的联系方式交给团队跟进。`
          : `${faqMatch.answer} If useful, I can collect your contact details for the team to follow up.`,
    };
  }

  if (agentId === "ecommerce-product-support-agent") {
    return {
      analysis,
      reply: buildEcommerceReply(config, analysis, language),
    };
  }

  if (analysis.needsHuman) {
    return {
      analysis,
      reply:
        language === "zh"
          ? "这个问题适合由团队直接处理。请留下姓名、邮箱、公司和具体需求，我会标记为需要人工跟进。"
          : "This should be reviewed by the team. Please share your name, email, company, and what you need, and I will mark it for human follow-up.",
    };
  }

  if (analysis.intent === "pricing_inquiry") {
    const pricingRanges = getLocalizedPricingRanges(config, language);

    return {
      analysis,
      reply:
        language === "zh"
          ? `我可以说明大致范围：${pricingRanges || "价格取决于具体范围"}。精确报价需要团队确认。`
          : `I can share general ranges: ${pricingRanges || "pricing depends on scope"}. Exact quotes should be confirmed by the team.`,
    };
  }

  if (analysis.intent === "booking_request") {
    return {
      analysis,
      reply:
        language === "zh"
          ? "可以。我可以先收集你的咨询主题、时间线和联系方式，然后交给团队确认下一步。"
          : "Yes. I can collect your topic, timeline, and contact details so the team can confirm the next step.",
    };
  }

  return {
    analysis,
    reply:
      language === "zh"
        ? `我可以基于已配置的业务内容回答问题并收集线索。当前支持范围：${getLocalizedServices(config, language)}`
        : `I can answer from configured business content and capture leads. Current support areas: ${getLocalizedServices(config, language)}`,
  };
}

export function scoreWidgetLead(
  form: { company?: string; email?: string; inquiry?: string },
  analysis: { intent: LeadIntent; needsHuman: boolean },
): LeadScore {
  if (!form.email?.trim()) {
    return "invalid";
  }

  const text = `${form.inquiry ?? ""} ${form.company ?? ""}`.toLowerCase();

  if (
    analysis.needsHuman ||
    /budget|timeline|quote|custom|bulk|checkout|order|预算|时间|报价|定制|批量|订单/.test(text)
  ) {
    return "hot";
  }

  return form.company?.trim() ? "warm" : "cold";
}

export function summarizeWidgetConversation(
  messages: WidgetChatMessage[],
  analysis: { intent: LeadIntent; needsHuman: boolean },
) {
  const visitorMessages = messages
    .filter((message) => message.role === "visitor")
    .map((message) => message.text)
    .join(" | ");

  return `Intent: ${analysis.intent}. Needs human: ${
    analysis.needsHuman ? "yes" : "no"
  }. Visitor messages: ${visitorMessages}`;
}

function buildEcommerceReply(
  config: MockCustomerAgentConfigRecord,
  analysis: { intent: LeadIntent; needsHuman: boolean },
  language: AppLanguage,
) {
  if (analysis.needsHuman) {
    return language === "zh"
      ? "这个请求需要店铺团队确认。请留下联系方式、订单号或商品信息，我会交给人工跟进。"
      : "This needs store-team confirmation. Please share your contact details, order number, or product details for human follow-up.";
  }

  if (analysis.intent === "product_recommendation") {
    return language === "zh"
      ? "我可以根据已配置的商品说明推荐。请告诉我使用场景、预算、偏好和数量。"
      : "I can recommend from configured product notes. Tell me the use case, budget, preferences, and quantity.";
  }

  if (analysis.intent === "shipping_question") {
    return language === "zh"
      ? "我可以解释已配置的物流政策和公开门槛；具体结果仍以店铺确认为准。"
      : "I can explain configured shipping policies and published thresholds; exact results should still be confirmed by the store.";
  }

  return language === "zh"
    ? `我可以回答商品问题、政策问题并收集购买意向。当前支持范围：${getLocalizedServices(config, language)}`
    : `I can answer product and policy questions and capture purchase intent. Current support areas: ${getLocalizedServices(config, language)}`;
}

function getLocalizedServices(
  config: MockCustomerAgentConfigRecord,
  language: AppLanguage,
) {
  if (language === "zh") {
    return (
      config.services_or_products_zh ||
      config.services_or_products ||
      config.services_or_products_en ||
      config.services_products
    );
  }

  return (
    config.services_or_products_en ||
    config.services_or_products ||
    config.services_products ||
    config.services_or_products_zh ||
    ""
  );
}

function getLocalizedPricingRanges(
  config: MockCustomerAgentConfigRecord,
  language: AppLanguage,
) {
  if (language === "zh") {
    return config.pricing_ranges_zh || config.pricing_ranges || config.pricing_ranges_en || "";
  }

  return config.pricing_ranges_en || config.pricing_ranges || config.pricing_ranges_zh || "";
}
