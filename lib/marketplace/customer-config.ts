import {
  CUSTOMER_CONFIG_STATUSES,
  KNOWLEDGE_DOCUMENT_TYPES,
  type CustomerConfigStatus,
  type KnowledgeDocumentType,
  type WidgetPosition,
} from "@/lib/marketplace/constants";
import type {
  MockCustomerAgentConfigRecord,
  MockCustomerFaqItemRecord,
  MockKnowledgeDocumentRecord,
} from "@/lib/server/marketplace-admin-store";

export type CustomerAgentConfigInput = {
  agentId?: string | null;
  agentSlug: string;
  businessName?: string | null;
  contactEmail?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  timestamp?: string;
  websiteUrl?: string | null;
};

const defaultFaq = [
  {
    question: "What services do you offer?",
    answer:
      "We can explain our main services, answer common questions, and collect your contact details for the team.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Pricing depends on your needs. We can share general ranges and collect your details for an exact follow-up.",
  },
  {
    question: "Can I talk to a human?",
    answer:
      "Yes. Share your name, email, and inquiry, and our team will follow up.",
  },
];

const defaultFaqZh = [
  {
    question: "你们提供哪些服务？",
    answer:
      "我们可以介绍主要服务、回答常见问题，并在访客有需求时收集联系方式交给团队跟进。",
  },
  {
    question: "费用是多少？",
    answer:
      "价格会根据服务范围、内容和是否需要集成而变化。Agent 可以先说明大致范围，并收集信息供团队给出准确报价。",
  },
  {
    question: "可以和真人沟通吗？",
    answer:
      "可以。请留下姓名、邮箱和具体需求，团队会继续跟进。",
  },
];

const ecommerceFaq = [
  {
    question: "Which product is best for me?",
    answer:
      "Yes. Tell us what you need, your budget, sizing or style preferences, and who the product is for. We can recommend from approved product notes.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We can explain the approved return/refund policy and collect details for support follow-up when a case needs staff review.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Real-time order lookup requires store integration. Without it, share your order number and contact email so we can route the request to the store team.",
  },
  {
    question: "Can I get a discount for bulk orders?",
    answer:
      "For bulk orders or custom quotes, share the product, quantity, timeline, and contact details. We will mark it for human follow-up.",
  },
];

const ecommerceFaqZh = [
  {
    question: "哪款商品适合我？",
    answer:
      "可以。请告诉我们你的使用场景、预算、尺码或风格偏好，以及购买对象，Agent 会基于已配置的商品说明给出建议。",
  },
  {
    question: "退换货政策是什么？",
    answer:
      "Agent 可以解释已配置的退换货和退款政策；涉及具体订单或需要审核的情况，会收集信息并转交店铺团队。",
  },
  {
    question: "可以查询订单吗？",
    answer:
      "实时订单查询需要店铺系统集成。未启用集成时，请留下订单号和联系邮箱，团队可以人工跟进。",
  },
  {
    question: "批量购买可以优惠吗？",
    answer:
      "批量订单或定制报价需要人工确认。请留下商品、数量、时间要求和联系方式，我们会标记为人工跟进。",
  },
];

export function createDefaultCustomerConfig({
  agentId = null,
  agentSlug,
  businessName,
  contactEmail,
  orderId = null,
  orderNumber = null,
  timestamp = new Date().toISOString(),
  websiteUrl = null,
}: CustomerAgentConfigInput): MockCustomerAgentConfigRecord {
  const isEcommerce = agentSlug === "ecommerce-product-support-agent";
  const fallbackBusinessName = isEcommerce
    ? "Demo Online Store"
    : "Demo Business";
  const finalBusinessName = businessName?.trim() || fallbackBusinessName;
  const businessDescription = isEcommerce
    ? `${finalBusinessName} sells curated products online and helps shoppers choose the right item, understand shipping, and request support.`
    : `${finalBusinessName} helps website visitors understand services, pricing ranges, booking options, and next steps.`;
  const businessDescriptionZh = isEcommerce
    ? `${finalBusinessName} 是一家线上商店，帮助顾客了解商品、选择合适产品、咨询物流退换货，并在需要时转接人工支持。`
    : `${finalBusinessName} 帮助网站访客了解服务、价格范围、预约方式和下一步沟通流程。`;
  const servicesOrProducts = isEcommerce
    ? "Product recommendations, product FAQ, shipping questions, return/refund policy help, order-support handoff, size/specification guidance, gift recommendations, purchase-intent capture."
    : "Website support, service explanation, pricing range guidance, consultation booking, lead capture.";
  const servicesOrProductsZh = isEcommerce
    ? "商品推荐、商品常见问题、物流咨询、退换货政策说明、订单问题人工转接、尺码/规格建议、礼品推荐、购买意向收集。"
    : "网站客服、服务介绍、价格范围说明、咨询预约、销售线索收集。";
  const finalContactEmail = contactEmail?.trim() || "support@company-domain.com";
  const pricingRangesEn = isEcommerce
    ? "Product prices vary by item. Agent Only starts at $79 / ¥599, Agent + Setup starts at $399 / ¥2999, and Custom Version starts at $1499 / ¥9999. Shipping and returns follow the configured store policy."
    : "Agent/service pricing varies by scope. Collect requirements before quoting exact pricing.";
  const pricingRangesZh = isEcommerce
    ? "商品价格按具体商品而定。Agent Only 起价 $79 / ¥599，Agent + Setup 起价 $399 / ¥2999，Custom Version 起价 $1499 / ¥9999。物流和退换货以已配置的店铺政策为准。"
    : "Agent 或服务价格会根据业务范围、内容和集成需求变化。正式报价前应先收集需求。";
  const welcomeMessageEn = isEcommerce
    ? "Hi, I can help with product questions, shipping, returns, or finding the right item."
    : "Hi, I can answer common questions, explain services, and help you contact the team.";
  const welcomeMessageZh = isEcommerce
    ? "你好，我可以帮你解答商品、物流、退换货问题，也可以帮你找到合适的商品。"
    : "你好，我可以回答常见问题、介绍服务，并帮你把需求转交给团队。";

  return {
    agent_id: agentId,
    agent_slug: agentSlug,
    avatar_url: null,
    brand_tone: isEcommerce
      ? "Helpful, concise, shopper-friendly, and careful about policy or order-specific promises."
      : "Professional, warm, concise, and consultative.",
    business_description: businessDescription,
    business_description_en: businessDescription,
    business_description_zh: businessDescriptionZh,
    business_hours: "Mon-Fri, 9:00-18:00",
    business_name: finalBusinessName,
    company_introduction: businessDescription,
    contact_email: finalContactEmail,
    contact_information: finalContactEmail,
    contact_phone: null,
    created_at: timestamp,
    custom_instructions:
      "Be helpful, concise, and honest. Do not invent exact prices, legal terms, medical advice, or private system information.",
    customer_email: finalContactEmail,
    disallowed_claims:
      "Do not promise guaranteed outcomes, exact quotes, contract terms, refunds, or private account details unless configured by the business.",
    faq: isEcommerce ? ecommerceFaq : defaultFaq,
    handoff_rules:
      isEcommerce
        ? "Collect contact info and mark human handoff for order tracking, exact discounts, policy disputes, complaints, bulk orders, custom quotes, or uncertainty."
        : "Collect contact info and mark human handoff for complaints, exact quote requests, custom work, contracts, sensitive questions, or uncertainty.",
    id: crypto.randomUUID(),
    license_id: null,
    offline_message:
      "Our team is not online right now. Leave your contact details and inquiry, and we will follow up soon.",
    order_id: orderId,
    order_number: orderNumber,
    pricing_ranges: pricingRangesEn,
    pricing_ranges_en: pricingRangesEn,
    pricing_ranges_zh: pricingRangesZh,
    primary_color: isEcommerce ? "#059669" : "#2563eb",
    services_or_products: servicesOrProducts,
    services_or_products_en: servicesOrProducts,
    services_or_products_zh: servicesOrProductsZh,
    services_products: servicesOrProducts,
    status: "draft" as CustomerConfigStatus,
    updated_at: timestamp,
    welcome_message: welcomeMessageEn,
    welcome_message_en: welcomeMessageEn,
    welcome_message_zh: welcomeMessageZh,
    website_url: websiteUrl?.trim() || null,
    widget_position: "bottom_right" as WidgetPosition,
  };
}

export function normalizeConfigUpdate(
  payload: Record<string, unknown>,
): Partial<MockCustomerAgentConfigRecord> {
  const update: Partial<MockCustomerAgentConfigRecord> = {};
  const textFields = [
    "avatar_url",
    "brand_tone",
    "business_description",
    "business_description_en",
    "business_description_zh",
    "business_name",
    "business_hours",
    "company_introduction",
    "contact_email",
    "contact_information",
    "contact_phone",
    "customer_email",
    "disallowed_claims",
    "handoff_rules",
    "offline_message",
    "pricing_ranges",
    "pricing_ranges_en",
    "pricing_ranges_zh",
    "primary_color",
    "services_or_products",
    "services_or_products_en",
    "services_or_products_zh",
    "services_products",
    "website_url",
    "welcome_message",
    "welcome_message_en",
    "welcome_message_zh",
    "custom_instructions",
  ] as const;

  for (const field of textFields) {
    if (typeof payload[field] === "string") {
      update[field] = payload[field].trim();
    }
  }

  if (typeof payload.business_description === "string") {
    update.company_introduction = payload.business_description.trim();
  } else if (typeof payload.company_introduction === "string") {
    update.business_description = payload.company_introduction.trim();
  } else {
    const localizedBusinessDescription =
      getTrimmedString(payload.business_description_en) ||
      getTrimmedString(payload.business_description_zh);

    if (localizedBusinessDescription) {
      update.business_description = localizedBusinessDescription;
      update.company_introduction = localizedBusinessDescription;
    }
  }

  if (typeof payload.services_or_products === "string") {
    update.services_products = payload.services_or_products.trim();
  } else if (typeof payload.services_products === "string") {
    update.services_or_products = payload.services_products.trim();
  } else {
    const localizedServices =
      getTrimmedString(payload.services_or_products_en) ||
      getTrimmedString(payload.services_or_products_zh);

    if (localizedServices) {
      update.services_or_products = localizedServices;
      update.services_products = localizedServices;
    }
  }

  if (typeof payload.pricing_ranges !== "string") {
    const localizedPricing =
      getTrimmedString(payload.pricing_ranges_en) ||
      getTrimmedString(payload.pricing_ranges_zh);

    if (localizedPricing) {
      update.pricing_ranges = localizedPricing;
    }
  }

  if (typeof payload.welcome_message !== "string") {
    const localizedWelcome =
      getTrimmedString(payload.welcome_message_en) ||
      getTrimmedString(payload.welcome_message_zh);

    if (localizedWelcome) {
      update.welcome_message = localizedWelcome;
    }
  }

  if (CUSTOMER_CONFIG_STATUSES.includes(payload.status as CustomerConfigStatus)) {
    update.status = payload.status as CustomerConfigStatus;
  }

  if (
    payload.widget_position === "bottom_right" ||
    payload.widget_position === "bottom_left"
  ) {
    update.widget_position = payload.widget_position;
  }

  if (Array.isArray(payload.faq)) {
    update.faq = normalizeFaqArray(payload.faq);
  } else if (Array.isArray(payload.faq_items)) {
    update.faq = normalizeFaqArray(payload.faq_items);
  }

  update.updated_at = new Date().toISOString();

  return update;
}

export function normalizeFaqItems(
  payload: unknown,
  configId: string,
): MockCustomerFaqItemRecord[] {
  const now = new Date().toISOString();
  const source = Array.isArray(payload) ? payload : [];

  return source
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      const question = getTrimmedString(record.question);
      const answer = getTrimmedString(record.answer);

      if (!question || !answer) {
        return null;
      }

      return {
        answer,
        config_id: configId,
        created_at: getTrimmedString(record.created_at) || now,
        id: getUuidOrCreate(record.id),
        is_active: typeof record.is_active === "boolean" ? record.is_active : true,
        language: record.language === "zh" ? "zh" : "en",
        question,
        updated_at: now,
      };
    })
    .filter((item): item is MockCustomerFaqItemRecord => Boolean(item));
}

export function normalizeKnowledgeDocuments(
  payload: unknown,
  configId: string,
): MockKnowledgeDocumentRecord[] {
  const now = new Date().toISOString();
  const source = Array.isArray(payload) ? payload : [];

  return source
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = getTrimmedString(record.title);
      const content = getTrimmedString(record.content);

      if (!title || !content) {
        return null;
      }

      const requestedType = getTrimmedString(record.document_type) as KnowledgeDocumentType;

      return {
        config_id: configId,
        content,
        created_at: getTrimmedString(record.created_at) || now,
        document_type: KNOWLEDGE_DOCUMENT_TYPES.includes(requestedType)
          ? requestedType
          : "other",
        id: getUuidOrCreate(record.id),
        is_active: typeof record.is_active === "boolean" ? record.is_active : true,
        title,
        updated_at: now,
      };
    })
    .filter((item): item is MockKnowledgeDocumentRecord => Boolean(item));
}

export function createDefaultFaqItems({
  agentSlug,
  configId,
  faq,
  timestamp = new Date().toISOString(),
}: {
  agentSlug?: string | null;
  configId: string;
  faq: Array<{ answer: string; question: string }>;
  timestamp?: string;
}) {
  const bilingualDefaults = getDefaultFaqItems(agentSlug);

  if (bilingualDefaults.length > 0) {
    return bilingualDefaults.map((item) => ({
      answer: item.answer,
      config_id: configId,
      created_at: timestamp,
      id: crypto.randomUUID(),
      is_active: true,
      language: item.language,
      question: item.question,
      updated_at: timestamp,
    }));
  }

  return faq.map((item) => ({
    answer: item.answer,
    config_id: configId,
    created_at: timestamp,
    id: crypto.randomUUID(),
    is_active: true,
    language: "en" as const,
    question: item.question,
    updated_at: timestamp,
  }));
}

export function createDefaultKnowledgeDocuments({
  config,
  timestamp = new Date().toISOString(),
}: {
  config: MockCustomerAgentConfigRecord;
  timestamp?: string;
}) {
  const englishBusiness =
    config.business_description_en ||
    config.business_description ||
    config.company_introduction;
  const chineseBusiness = config.business_description_zh;
  const englishServices =
    config.services_or_products_en ||
    config.services_or_products ||
    config.services_products;
  const chineseServices = config.services_or_products_zh;

  return [
    {
      config_id: config.id,
      content: [englishBusiness, chineseBusiness].filter(Boolean).join("\n\n"),
      created_at: timestamp,
      document_type: "company_info" as const,
      id: crypto.randomUUID(),
      is_active: true,
      title: "Business overview / 业务介绍",
      updated_at: timestamp,
    },
    {
      config_id: config.id,
      content: [englishServices, chineseServices].filter(Boolean).join("\n\n"),
      created_at: timestamp,
      document_type: config.agent_slug === "ecommerce-product-support-agent" ? "products" as const : "services" as const,
      id: crypto.randomUUID(),
      is_active: true,
      title: config.agent_slug === "ecommerce-product-support-agent" ? "Products and policies / 商品与政策" : "Services / 服务",
      updated_at: timestamp,
    },
  ];
}

function normalizeFaqArray(payload: unknown[]) {
  return payload
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      if (record.is_active === false) {
        return null;
      }

      const question = getTrimmedString(record.question);
      const answer = getTrimmedString(record.answer);

      return question && answer ? { answer, question } : null;
    })
    .filter((item): item is { answer: string; question: string } => Boolean(item));
}

function getDefaultFaqItems(agentSlug?: string | null) {
  if (agentSlug === "ecommerce-product-support-agent") {
    return [
      ...ecommerceFaq.map((item) => ({ ...item, language: "en" as const })),
      ...ecommerceFaqZh.map((item) => ({ ...item, language: "zh" as const })),
    ];
  }

  if (agentSlug === "website-customer-support-agent") {
    return [
      ...defaultFaq.map((item) => ({ ...item, language: "en" as const })),
      ...defaultFaqZh.map((item) => ({ ...item, language: "zh" as const })),
    ];
  }

  return [];
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getUuidOrCreate(value: unknown) {
  const id = getTrimmedString(value);

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : crypto.randomUUID();
}
