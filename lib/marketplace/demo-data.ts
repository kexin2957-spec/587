import type {
  DeliveryType,
  OwnerType,
  PricingType,
  SupportedLanguage,
} from "@/lib/marketplace/constants";

export type DemoFaqItem = {
  question: string;
  answer: string;
};

export type DemoCategory = {
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
};

export type DemoAgent = {
  slug: string;
  titleEn: string;
  titleZh: string;
  shortDescriptionEn: string;
  shortDescriptionZh: string;
  descriptionEn: string;
  descriptionZh: string;
  featuresEn: string[];
  featuresZh: string[];
  faqEn: DemoFaqItem[];
  faqZh: DemoFaqItem[];
  setupInstructionsEn: string;
  setupInstructionsZh: string;
  dataPermissionsEn: string;
  dataPermissionsZh: string;
  categorySlug: string;
  deliveryType: DeliveryType;
  pricingType: PricingType;
  priceUsd: number | null;
  priceCny: number | null;
  demoUrl: string;
  demoEnabled: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt?: string;
  creatorName?: string;
  installCount?: number;
  ownerType?: OwnerType;
  purchaseCount?: number;
  rating?: number;
  reviewCount?: number;
  supportedLanguages?: SupportedLanguage[];
  tags?: string[];
  targetCustomersEn?: string[];
  targetCustomersZh?: string[];
  useCasesEn?: string[];
  useCasesZh?: string[];
  demoSamplesEn?: DemoFaqItem[];
  demoSamplesZh?: DemoFaqItem[];
  pricingOptionsEn?: string[];
  pricingOptionsZh?: string[];
  customUpgradeOptionsEn?: string[];
  customUpgradeOptionsZh?: string[];
  coverImageStyleEn?: string;
  coverImageStyleZh?: string;
};

export const launchAgentSlugs = [
  "website-customer-support-agent",
  "ecommerce-product-support-agent",
] as const;

export const demoCategories: DemoCategory[] = [
  {
    slug: "customer-support",
    nameEn: "Customer Support",
    nameZh: "客服",
    descriptionEn: "Agents for customer service and support workflows.",
    descriptionZh: "用于客户服务和支持流程的 Agent。",
  },
  {
    slug: "sales-lead-generation",
    nameEn: "Sales & Lead Generation",
    nameZh: "销售获客",
    descriptionEn: "Agents that qualify leads and support sales teams.",
    descriptionZh: "用于线索筛选和销售支持的 Agent。",
  },
  {
    slug: "ecommerce",
    nameEn: "E-commerce",
    nameZh: "电商",
    descriptionEn: "Agents for online stores, orders, and product support.",
    descriptionZh: "用于网店、订单和商品咨询的 Agent。",
  },
  {
    slug: "education",
    nameEn: "Education",
    nameZh: "教育培训",
    descriptionEn: "Agents for schools, courses, and coaching services.",
    descriptionZh: "用于学校、课程和培训服务的 Agent。",
  },
  {
    slug: "real-estate",
    nameEn: "Real Estate",
    nameZh: "房地产",
    descriptionEn: "Agents for property inquiries and real estate lead capture.",
    descriptionZh: "用于房产咨询和房地产获客的 Agent。",
  },
  {
    slug: "legal",
    nameEn: "Legal",
    nameZh: "法律咨询",
    descriptionEn: "Agents for legal intake and law firm operations.",
    descriptionZh: "用于法律初筛和律所运营的 Agent。",
  },
  {
    slug: "healthcare-medical-beauty",
    nameEn: "Healthcare & Medical Beauty",
    nameZh: "医疗医美",
    descriptionEn: "Agents for clinic, wellness, and medical beauty intake.",
    descriptionZh: "用于诊所、健康服务和医美咨询的 Agent。",
  },
  {
    slug: "restaurant-local-business",
    nameEn: "Restaurant & Local Business",
    nameZh: "餐饮本地商家",
    descriptionEn: "Agents for restaurants and local service businesses.",
    descriptionZh: "用于餐厅和本地服务商家的 Agent。",
  },
  {
    slug: "content-creation",
    nameEn: "Content Creation",
    nameZh: "内容创作",
    descriptionEn: "Agents for writing, summarization, and media workflows.",
    descriptionZh: "用于写作、总结和媒体工作流的 Agent。",
  },
  {
    slug: "research-analysis",
    nameEn: "Research & Analysis",
    nameZh: "研究分析",
    descriptionEn: "Agents for research, monitoring, and business analysis.",
    descriptionZh: "用于研究、监控和商业分析的 Agent。",
  },
  {
    slug: "internal-knowledge-base",
    nameEn: "Internal Knowledge Base",
    nameZh: "企业知识库",
    descriptionEn: "Agents that answer from approved internal company knowledge.",
    descriptionZh: "基于企业内部知识回答问题的 Agent。",
  },
  {
    slug: "developer-tools",
    nameEn: "Developer Tools",
    nameZh: "开发工具",
    descriptionEn: "Agents and workflows for software teams.",
    descriptionZh: "面向软件团队的 Agent 和工作流。",
  },
  {
    slug: "ai-news-monitoring",
    nameEn: "AI News Monitoring",
    nameZh: "AI 资讯监控",
    descriptionEn: "Agents that track AI news and produce briefings.",
    descriptionZh: "用于 AI 资讯监控和简报生成的 Agent。",
  },
  {
    slug: "automation-workflows",
    nameEn: "Automation Workflows",
    nameZh: "自动化工作流",
    descriptionEn: "Agents that automate recurring business workflows.",
    descriptionZh: "用于自动化业务流程的 Agent。",
  },
];

export const demoAgents: DemoAgent[] = [
  {
    slug: "website-customer-support-agent",
    titleEn: "Website Sales & Lead Capture Agent",
    titleZh: "网站销售客服获客 Agent",
    shortDescriptionEn:
      "Turn website visitors into qualified leads with an AI sales and support chatbot that answers FAQs, explains services, qualifies intent, and captures contact details.",
    shortDescriptionZh:
      "让网站访客变成高意向客户的 AI 销售客服 Agent，可回答 FAQ、说明服务、识别意图并收集联系方式。",
    descriptionEn:
      "Website Sales & Lead Capture Agent is a launch-ready AI sales and support chatbot for business websites, SaaS sites, agencies, consultants, local service businesses, B2B companies, AI service providers, and small to mid-sized teams. It helps visitors understand your services, answers approved FAQ, explains pricing ranges carefully, asks follow-up qualification questions, detects visitor intent, scores leads, collects contact details, and routes high-value inquiries for human follow-up. Customers receive a hosted agent, iframe/script embed code, a lightweight customer configuration dashboard, delivery documentation, and an admin lead backend.",
    descriptionZh:
      "网站销售客服获客 Agent 是一款可直接用于销售演示和客户交付的企业网站 AI 销售客服聊天机器人，适合商业网站、SaaS 网站、服务机构、顾问、本地服务商家、B2B 公司、AI 服务商以及中小企业团队。它可以帮助访客理解服务内容，回答已确认 FAQ，谨慎说明价格范围，追问关键需求，识别访客意图，给线索打分，收集联系方式，并把高价值咨询转交人工跟进。客户会收到托管 Agent、iframe/script 嵌入代码、轻量客户配置后台、交付文档和后台线索管理能力。",
    featuresEn: [
      "Answers common website FAQs using approved business content.",
      "Explains services, packages, availability, and pricing ranges in a careful, non-promissory way.",
      "Collects visitor name, email, company, website, and inquiry details when the visitor is ready.",
      "Qualifies leads by intent, urgency, budget range, and service fit.",
      "Guides visitors to book a call, submit a form, or wait for team follow-up.",
      "Supports English and Chinese conversations from the same website widget.",
      "Can be embedded into most business websites as a customer support chatbot.",
      "Can be customized with your brand tone, company FAQ, service documents, and handoff rules.",
    ],
    featuresZh: [
      "基于已确认的业务内容回答网站常见问题。",
      "谨慎说明服务、套餐、可用性和价格范围，不做未经确认的承诺。",
      "在访客有意向时收集姓名、邮箱、公司、网站和咨询内容。",
      "根据意向、紧急程度、预算范围和服务匹配度进行线索初筛。",
      "引导访客预约通话、提交表单，或等待团队跟进。",
      "支持英文和中文对话，可在同一个网站组件中使用。",
      "可作为客服聊天机器人嵌入大多数企业网站。",
      "可根据品牌语气、公司 FAQ、服务文档和人工转交流程进行定制。",
    ],
    faqEn: [
      {
        question: "What am I buying?",
        answer:
          "You are buying a ready-made website chatbot agent package with support flows, lead capture questions, bilingual copy, setup guidance, and demo behavior that can be adapted to your business content.",
      },
      {
        question: "Can it answer questions from my own website?",
        answer:
          "Yes. During setup, you can provide approved website pages, FAQs, pricing notes, service descriptions, and policies. The agent should only answer from content you approve.",
      },
      {
        question: "Can visitors book a consultation?",
        answer:
          "Yes. The base version can guide visitors to a booking link or contact form. Calendar booking integration can be added as a custom upgrade.",
      },
      {
        question: "Does it replace human support?",
        answer:
          "No. It is designed for first-line website support and lead capture. Complex, sensitive, or high-value requests should be handed off to your team.",
      },
      {
        question: "Can it support both English and Chinese?",
        answer:
          "Yes. The agent includes English and Chinese conversation patterns and can be customized for your preferred tone in each language.",
      },
      {
        question: "Can it connect to my CRM?",
        answer:
          "CRM integration is available as a custom upgrade. The standard package can collect lead details without direct access to private business systems.",
      },
    ],
    faqZh: [
      {
        question: "我购买的是什么？",
        answer:
          "你购买的是一套现成的网站客服聊天机器人 Agent，包含客服对话流程、线索收集问题、双语文案、配置说明和 Demo 行为，可根据你的业务内容进行调整。",
      },
      {
        question: "它可以基于我们自己的网站内容回答吗？",
        answer:
          "可以。配置时可以提供已确认的网站页面、FAQ、价格说明、服务介绍和政策文档。Agent 应只基于你批准的内容回答。",
      },
      {
        question: "访客可以预约咨询吗？",
        answer:
          "可以。基础版本可以引导访客前往预约链接或联系表单。如需日历预约集成，可作为定制升级添加。",
      },
      {
        question: "它会完全替代人工客服吗？",
        answer:
          "不会。它适合处理一线常见问题和线索收集。复杂、敏感或高价值需求应转交给你的团队处理。",
      },
      {
        question: "支持英文和中文吗？",
        answer:
          "支持。该 Agent 包含英文和中文对话结构，也可以按你的品牌语气分别定制两种语言。",
      },
      {
        question: "可以连接 CRM 吗？",
        answer:
          "CRM 集成可作为定制升级。标准版本可以收集线索信息，但不会直接访问企业私有系统。",
      },
    ],
    setupInstructionsEn:
      "Start with the Agent Only package by adding your business name, website URL, service pages, FAQ, pricing notes, booking/contact links, and escalation email. For Setup Service, the platform configures the website embed, tests sample visitor questions, adjusts tone, and verifies lead capture fields. For a Custom Version, we can add company documents, CRM routing, email alerts, calendar booking, multilingual rules, and human handoff workflows.",
    setupInstructionsZh:
      "Agent Only 版本需要先准备企业名称、网站地址、服务页面、FAQ、价格说明、预约/联系链接和转交邮箱。选择 Setup Service 时，平台会协助配置网站嵌入、测试访客常见问题、调整语气并验证线索收集字段。Custom Version 可进一步加入公司文档、CRM 流转、邮件提醒、日历预约、多语言规则和人工转交流程。",
    dataPermissionsEn:
      "The agent may collect visitor contact information and inquiry details, including name, email, company, website URL, budget range, timeline, and service interest. It uses only approved website content, FAQ documents, and configuration notes unless you add a custom integration. It does not access private business systems, CRM records, payment data, internal documents, or customer databases by default.",
    dataPermissionsZh:
      "该 Agent 可能会收集访客联系方式和咨询信息，包括姓名、邮箱、公司、网站地址、预算范围、时间计划和服务兴趣。默认只使用已批准的网站内容、FAQ 文档和配置说明；除非额外添加定制集成，否则不会访问企业私有系统、CRM 记录、支付数据、内部文档或客户数据库。",
    categorySlug: "customer-support",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 49,
    priceCny: 399,
    demoUrl: "/demo/website-customer-support-agent",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
    createdAt: "2026-05-24",
    ownerType: "platform",
    purchaseCount: 68,
    installCount: 180,
    rating: 4.9,
    reviewCount: 32,
    supportedLanguages: ["en", "zh"],
    tags: [
      "customer support",
      "sales lead generation",
      "website chatbot",
      "lead capture",
      "intent detection",
      "lead scoring",
      "small business",
      "bilingual",
      "website embed",
      "service business",
    ],
    targetCustomersEn: [
      "Small business websites that need quick first-line visitor support.",
      "SaaS websites that want to answer product, pricing, and trial questions before sales follow-up.",
      "Agency websites that need to explain services and qualify project inquiries.",
      "Service businesses and consultants that want to collect structured consultation requests.",
      "Local businesses that need a simple bilingual support and booking assistant.",
    ],
    targetCustomersZh: [
      "需要快速覆盖一线访客咨询的小型企业网站。",
      "希望在销售跟进前回答产品、价格和试用问题的 SaaS 网站。",
      "需要说明服务并筛选项目需求的服务机构网站。",
      "希望结构化收集咨询需求的服务型企业和顾问。",
      "需要简单双语客服和预约助手的本地商家。",
    ],
    useCasesEn: [
      "Answer common visitor questions about services, pricing ranges, timelines, and next steps.",
      "Collect qualified leads with name, email, company, inquiry, budget range, and urgency.",
      "Guide visitors to book a consultation or submit a contact form when they show buying intent.",
      "Help visitors choose the right service category based on their goals and constraints.",
      "Reduce repetitive support messages while keeping complex requests ready for human follow-up.",
      "Offer English and Chinese visitor support on the same website.",
    ],
    useCasesZh: [
      "回答访客关于服务、价格范围、交付周期和下一步的常见问题。",
      "收集姓名、邮箱、公司、咨询内容、预算范围和紧急程度等有效线索。",
      "当访客有购买意向时，引导预约咨询或提交联系表单。",
      "根据访客目标和限制条件，帮助选择合适的服务类型。",
      "减少重复咨询，同时把复杂需求整理好转交人工跟进。",
      "在同一个网站中提供英文和中文访客支持。",
    ],
    demoSamplesEn: [
      {
        question: "What services do you offer?",
        answer:
          "We can help explain the services listed on this website, summarize what each option is best for, and point you to the right next step. If you share what you are trying to achieve, I can suggest which service category may fit and collect your details for the team to review.",
      },
      {
        question: "How much does it cost?",
        answer:
          "Pricing depends on the service scope, timeline, and any integrations needed. I can share published pricing ranges when they are available, but I will not invent a fixed quote. If you tell me your goal, budget range, and timeline, I can send the inquiry to the team for a proper estimate.",
      },
      {
        question: "Can I book a consultation?",
        answer:
          "Yes. I can guide you to the booking link or collect your name, email, company, and a short note about what you need. The team can then confirm availability and follow up with the right next step.",
      },
      {
        question: "Do you support small businesses?",
        answer:
          "Yes, this service is suitable for small businesses that need a practical starting point. To help the team respond usefully, please share your business type, website, main customer question, and whether you need setup help or a custom version.",
      },
      {
        question: "Can you help me choose the right service?",
        answer:
          "I can help narrow it down. Tell me what outcome you want, who your customers are, what you already have in place, and whether you need a simple setup or deeper integration. I can then suggest a likely direction and collect your details for review.",
      },
      {
        question: "What information do you need from me?",
        answer:
          "The most useful details are your name, email, company, website URL, the problem you want to solve, any relevant pages or documents, budget range, and timeline. You can share only what you are comfortable providing at this stage.",
      },
    ],
    demoSamplesZh: [
      {
        question: "你们提供哪些服务？",
        answer:
          "我可以根据网站上已确认的内容，说明各项服务适合什么场景，并引导你进入下一步。如果你告诉我想解决的问题，我可以帮你判断可能适合的服务类型，并收集信息交给团队跟进。",
      },
      {
        question: "费用大概是多少？",
        answer:
          "费用取决于服务范围、交付周期和是否需要系统集成。我可以说明网站上公开的价格范围，但不会编造固定报价。你可以提供目标、预算范围和时间计划，我会把需求整理给团队评估。",
      },
      {
        question: "可以预约咨询吗？",
        answer:
          "可以。我可以引导你前往预约链接，或先收集你的姓名、邮箱、公司和简短需求说明。团队会根据情况确认时间并跟进下一步。",
      },
      {
        question: "你们支持小型企业吗？",
        answer:
          "支持。这个服务适合希望先用实用方案开始的小型企业。为了让团队更准确回复，你可以提供业务类型、网站、主要客户问题，以及是否需要配置安装或定制版本。",
      },
      {
        question: "你能帮我选择合适的服务吗？",
        answer:
          "可以先帮你缩小范围。请告诉我你希望达成的结果、客户是谁、现在已有的资料或系统，以及你需要简单配置还是更深度的集成。我可以给出初步方向并收集信息供团队审核。",
      },
      {
        question: "你需要我提供哪些信息？",
        answer:
          "最有帮助的信息包括姓名、邮箱、公司、网站地址、想解决的问题、相关页面或文档、预算范围和时间计划。你可以只提供当前愿意分享的内容。",
      },
    ],
    pricingOptionsEn: [
      "Agent Only: $49. Includes the ready-made website chatbot structure, bilingual conversation copy, lead capture flow, and setup instructions.",
      "Setup Service: $299. Includes help configuring the agent for your website, adjusting tone, validating key questions, and preparing the embed handoff.",
      "Custom Version: From $999. Adds deeper business customization such as documents, integrations, booking, notifications, CRM routing, and human handoff.",
    ],
    pricingOptionsZh: [
      "Agent Only：¥399。包含现成网站客服聊天机器人结构、双语对话文案、线索收集流程和配置说明。",
      "Setup Service：¥1999。包含网站配置协助、语气调整、关键问题测试和嵌入交付准备。",
      "Custom Version：¥6999 起。可加入更深度的业务定制，例如公司文档、系统集成、预约、通知、CRM 流转和人工转交。",
    ],
    customUpgradeOptionsEn: [
      "Upload company FAQ and service documents.",
      "Customize brand tone for English and Chinese conversations.",
      "Website embed setup and launch support.",
      "CRM integration for qualified lead routing.",
      "Email notification when a new lead is captured.",
      "Calendar booking integration for consultation scheduling.",
      "Expanded multi-language support beyond English and Chinese.",
      "Human handoff rules for complex, urgent, or sensitive inquiries.",
    ],
    customUpgradeOptionsZh: [
      "上传公司 FAQ 和服务文档。",
      "定制英文和中文对话的品牌语气。",
      "网站嵌入配置和上线支持。",
      "CRM 集成，用于有效线索流转。",
      "捕获新线索时发送邮件通知。",
      "日历预约集成，用于安排咨询。",
      "扩展英文和中文以外的多语言支持。",
      "为复杂、紧急或敏感咨询设置人工转交规则。",
    ],
    coverImageStyleEn:
      "Professional SaaS-style cover: a clean website chat widget on a business website dashboard, soft blue-cyan gradient background, structured chat bubbles, and a customer support icon.",
    coverImageStyleZh:
      "专业 SaaS 风格封面：商务网站仪表盘上的简洁聊天组件，柔和蓝青渐变背景，结构化聊天气泡和客服图标。",
  },
  {
    slug: "ecommerce-product-support-agent",
    titleEn: "E-commerce Product Support Agent",
    titleZh: "电商产品客服 Agent",
    shortDescriptionEn:
      "An AI product support agent that helps online stores answer product questions, recommend items, explain policies, and capture purchase intent.",
    shortDescriptionZh:
      "帮助电商网站自动回答商品问题、推荐产品、解释政策并收集购买意向的 AI 产品客服 Agent。",
    descriptionEn:
      "E-commerce Product Support Agent is a ready-to-sell AI product support chatbot for Shopify stores, WooCommerce stores, independent e-commerce websites, cross-border sellers, small online brands, Amazon sellers with independent websites, and product-based businesses. It answers product FAQ, recommends items based on shopper needs, explains shipping and return policies, handles sizing/specification questions, captures buyer intent, collects contact details when needed, and routes order tracking or custom quote requests to a human team. It does not claim real-time inventory or order tracking unless a custom Shopify/order/inventory integration is enabled.",
    descriptionZh:
      "电商产品客服 Agent 是一款面向 Shopify 店铺、WooCommerce 店铺、独立电商网站、跨境卖家、小型线上品牌、拥有独立站的 Amazon 卖家和产品型企业的 AI 商品客服聊天机器人。它可以回答商品 FAQ，根据买家需求推荐商品，解释物流、退换货和退款政策，回答尺码/规格问题，识别购买意向，在需要时收集联系方式，并把订单查询、批量采购或定制报价请求转交人工团队。除非启用 Shopify、订单或库存系统集成，否则它不会声称可以实时查询订单或库存。",
    featuresEn: [
      "Answers product FAQ, sizing, materials, compatibility, use-case, and specification questions from approved store content.",
      "Recommends products based on shopper needs, use case, budget, gift recipient, style, size, or buying intent.",
      "Explains shipping, delivery, return, refund, exchange, and warranty policies without inventing unsupported promises.",
      "Captures purchase intent, buyer email, phone, company, product interest, quantity, and inquiry details.",
      "Classifies intents such as product question, recommendation, shipping, return/refund, order tracking, purchase intent, and human handoff.",
      "Scores leads as hot, warm, cold, or invalid based on purchase intent, contact info, availability questions, bulk order needs, or checkout blockers.",
      "Supports human handoff for order tracking, exact policy disputes, complaints, bulk quote requests, and custom product questions.",
      "Supports English and Chinese shoppers from the same website chatbot.",
      "Can be embedded into Shopify, WooCommerce, or independent e-commerce websites with iframe or script embed code.",
      "Can be upgraded for Shopify, order, inventory, CRM, email, and custom product recommendation logic.",
    ],
    featuresZh: [
      "基于已审核的店铺内容回答商品 FAQ、尺码、材质、兼容性、使用场景和规格问题。",
      "根据买家需求、使用场景、预算、送礼对象、风格、尺码或购买意向推荐商品。",
      "解释物流、配送、退货、退款、换货和保修政策，不编造未确认承诺。",
      "收集购买意向、买家邮箱、电话、公司、感兴趣商品、数量和咨询详情。",
      "识别商品问题、商品推荐、物流问题、退换货/退款、订单查询、购买意向和人工转接等意图。",
      "根据购买意图、联系方式、库存/结账问题、批量采购或定制报价需求给线索评分。",
      "订单查询、政策争议、投诉、批量报价和复杂商品问题会触发人工转接。",
      "同一网站聊天组件支持英文和中文买家。",
      "可通过 iframe 或 script 嵌入 Shopify、WooCommerce 或独立电商网站。",
      "可升级接入 Shopify、订单、库存、CRM、邮件通知和自定义商品推荐逻辑。",
    ],
    faqEn: [
      {
        question: "What am I buying?",
        answer:
          "You are buying a ready-made e-commerce product support agent package with a hosted demo, product FAQ conversation flow, purchase-intent capture, embed code, setup guidance, and delivery documentation.",
      },
      {
        question: "Can it recommend products?",
        answer:
          "Yes. The standard version can recommend products from configured product notes, FAQ, categories, and approved guidance. Deeper catalog-aware logic can be added in a custom version.",
      },
      {
        question: "Can it track orders in real time?",
        answer:
          "Not by default. Real-time order lookup requires a Shopify, WooCommerce, or order system integration. Without that, the agent can collect the order number and email for human follow-up.",
      },
      {
        question: "Can it check inventory?",
        answer:
          "Not by default. The base agent can answer from configured availability notes. Real-time inventory requires a custom inventory integration.",
      },
      {
        question: "Can it explain returns and refunds?",
        answer:
          "Yes. It can explain approved return, refund, exchange, warranty, and shipping policies, and collect details for staff follow-up when a case needs review.",
      },
      {
        question: "Can I use it on Shopify or WooCommerce?",
        answer:
          "Yes. The launch package includes iframe and script embed options. Shopify/order/inventory data lookup can be added as a Custom Version.",
      },
    ],
    faqZh: [
      {
        question: "我购买的是什么？",
        answer:
          "你购买的是一套现成的电商产品客服 Agent，包含托管 Demo、商品 FAQ 对话流程、购买意向收集、嵌入代码、配置说明和交付文档。",
      },
      {
        question: "它可以推荐商品吗？",
        answer:
          "可以。标准版本可以基于已配置的商品说明、FAQ、商品分类和审核过的导购规则进行推荐。更深度的商品目录推荐逻辑可作为定制版本增加。",
      },
      {
        question: "它可以实时查询订单吗？",
        answer:
          "默认不支持实时订单查询。实时订单查询需要接入 Shopify、WooCommerce 或订单系统。未接入时，Agent 可以收集订单号和邮箱，转交人工跟进。",
      },
      {
        question: "它可以实时查询库存吗？",
        answer:
          "默认不支持实时库存查询。基础版本可以基于配置好的库存/可售说明回答。实时库存需要定制库存系统集成。",
      },
      {
        question: "它可以说明退换货和退款政策吗？",
        answer:
          "可以。它可以解释已审核的退货、退款、换货、保修和物流政策，并在需要人工审核时收集信息交给团队。",
      },
      {
        question: "可以用在 Shopify 或 WooCommerce 吗？",
        answer:
          "可以。发布版本包含 iframe 和 script 两种嵌入方式。Shopify、订单和库存数据查询可作为 Custom Version 增加。",
      },
    ],
    setupInstructionsEn:
      "Prepare product FAQ, product categories, key product descriptions, sizing/specification notes, shipping policy, return/refund policy, warranty notes, support contact email, and common shopper questions. Agent Only includes the hosted demo, embed code, and documentation. Agent + Setup includes help configuring product FAQ, shipping/return policy answers, brand tone, and website embed support. Custom Version can add Shopify, WooCommerce, order, inventory, CRM, email, and advanced recommendation integrations.",
    setupInstructionsZh:
      "请准备商品 FAQ、商品分类、核心商品说明、尺码/规格说明、物流政策、退货/退款政策、保修说明、客服邮箱和常见买家问题。Agent Only 包含托管 Demo、嵌入代码和使用文档。Agent + Setup 包含商品 FAQ 配置、物流/退换货政策配置、品牌语气调整和网站嵌入支持。Custom Version 可增加 Shopify、WooCommerce、订单、库存、CRM、邮件通知和高级推荐逻辑集成。",
    dataPermissionsEn:
      "The base agent uses only product FAQ, product descriptions, policy notes, and customer configuration you provide. It may collect shopper name, email, phone, company, product interest, quantity, order number, and inquiry details for follow-up. It does not access private order systems, payment data, customer accounts, inventory, or CRM records unless a custom integration is explicitly added and scoped.",
    dataPermissionsZh:
      "基础版本只使用你提供的商品 FAQ、商品说明、政策说明和客户配置。它可能会收集买家姓名、邮箱、电话、公司、感兴趣商品、数量、订单号和咨询详情，用于后续跟进。除非明确增加并限定范围的定制集成，否则它不会访问私有订单系统、支付数据、客户账户、库存或 CRM 记录。",
    categorySlug: "ecommerce",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 79,
    priceCny: 599,
    demoUrl: "/embed/agents/ecommerce-product-support-agent",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
    createdAt: "2026-05-24",
    ownerType: "platform",
    purchaseCount: 44,
    installCount: 96,
    rating: 4.8,
    reviewCount: 21,
    supportedLanguages: ["en", "zh"],
    tags: [
      "ecommerce",
      "product support",
      "product recommendations",
      "shipping",
      "returns",
      "purchase intent",
      "Shopify",
      "WooCommerce",
      "website embed",
      "bilingual",
    ],
    targetCustomersEn: [
      "Shopify stores that need product FAQ and purchase-intent support.",
      "WooCommerce stores that want to reduce repetitive product and policy questions.",
      "Independent e-commerce websites that need a guided product support chatbot.",
      "Cross-border sellers that need English and Chinese shopper support.",
      "Small online brands that want to capture product interest before checkout.",
      "Amazon sellers with independent websites that need brand-owned support and lead capture.",
      "Product-based businesses that receive repeated sizing, specification, shipping, and return questions.",
    ],
    targetCustomersZh: [
      "需要商品 FAQ 和购买意向支持的 Shopify 店铺。",
      "希望减少重复商品和政策咨询的 WooCommerce 店铺。",
      "需要导购型产品客服聊天机器人的独立电商网站。",
      "需要中英文买家支持的跨境卖家。",
      "希望在结账前收集商品兴趣的小型线上品牌。",
      "拥有独立站、需要品牌自有客服和线索收集的 Amazon 卖家。",
      "经常收到尺码、规格、物流和退换货问题的产品型企业。",
    ],
    useCasesEn: [
      "Answer product questions about sizing, specs, materials, compatibility, usage, and care.",
      "Recommend products for gifts, budgets, use cases, customer preferences, or buying goals.",
      "Explain shipping, delivery time, return, refund, exchange, warranty, and support policies.",
      "Collect purchase-intent leads when shoppers ask about availability, discounts, bulk orders, or custom quotes.",
      "Route order tracking questions to human follow-up unless order-system integration is enabled.",
      "Support English and Chinese shoppers from the same e-commerce website.",
    ],
    useCasesZh: [
      "回答关于尺码、规格、材质、兼容性、使用方式和保养说明的商品问题。",
      "根据送礼、预算、使用场景、偏好或购买目标推荐商品。",
      "解释物流、配送时间、退货、退款、换货、保修和客服政策。",
      "当买家询问库存、折扣、批量采购或定制报价时收集购买意向线索。",
      "未启用订单系统集成时，将订单查询问题转交人工跟进。",
      "同一电商网站支持英文和中文买家。",
    ],
    demoSamplesEn: [
      {
        question: "Which product is best for me?",
        answer:
          "I can help narrow it down. Tell me who the product is for, your budget range, preferred style or size, and how you plan to use it. I can recommend from configured product categories, and if you need a custom or bulk option, I can collect your details for the team.",
      },
      {
        question: "Do you offer free shipping?",
        answer:
          "I can explain the store's approved shipping policy and any published thresholds. I will not invent free-shipping promises. If your order or destination needs review, share your email and destination so the team can confirm.",
      },
      {
        question: "What is your return policy?",
        answer:
          "I can explain the configured return, refund, and exchange policy. If you already purchased and need help with a specific order, please share your order number and email so the team can follow up.",
      },
      {
        question: "Is this product available in different sizes?",
        answer:
          "I can answer from configured size and specification notes. If real-time inventory is not integrated, I can collect the product name, size, and your email so the team can confirm availability.",
      },
      {
        question: "Can I track my order?",
        answer:
          "Real-time order tracking requires Shopify, WooCommerce, or order system integration. Without that integration, I can collect your order number and email and route it to the support team.",
      },
      {
        question: "Can you recommend something for a gift?",
        answer:
          "Yes. Tell me the recipient, occasion, budget range, preferred style, and any constraints. I can suggest a product category from the configured catalog and collect your email if you want the team to follow up.",
      },
      {
        question: "Can I get a discount for bulk orders?",
        answer:
          "Bulk order pricing usually needs human review. Please share the product, quantity, company, target timeline, and contact email, and I will mark the inquiry as a high-intent lead for follow-up.",
      },
      {
        question: "Can I talk to a human?",
        answer:
          "Yes. Share your name, email, order number if relevant, and a short description of what you need. I will route the request to the team for human follow-up.",
      },
    ],
    demoSamplesZh: [
      {
        question: "哪款产品最适合我？",
        answer:
          "我可以先帮你缩小范围。请告诉我购买对象、预算范围、偏好风格或尺码，以及使用场景。我会基于已配置的商品分类给出推荐方向；如果涉及定制或批量采购，我可以收集信息交给团队跟进。",
      },
      {
        question: "你们包邮吗？",
        answer:
          "我可以说明店铺已确认的物流政策和公开的包邮门槛，但不会编造未确认承诺。如果你的订单或收货地区需要单独确认，请留下邮箱和地区，团队可以进一步确认。",
      },
      {
        question: "退货政策是什么？",
        answer:
          "我可以解释已配置的退货、退款和换货政策。如果你已经购买并需要处理具体订单，请提供订单号和邮箱，团队会跟进。",
      },
      {
        question: "这个产品有不同尺码吗？",
        answer:
          "我可以基于已配置的尺码和规格说明回答。如果没有接入实时库存，我可以收集商品名、尺码和邮箱，让团队确认是否可购买。",
      },
      {
        question: "我可以查询订单物流吗？",
        answer:
          "实时订单查询需要接入 Shopify、WooCommerce 或订单系统。如果未启用集成，我可以收集你的订单号和邮箱，并转交客服团队跟进。",
      },
      {
        question: "可以推荐一款适合送礼的产品吗？",
        answer:
          "可以。请告诉我收礼对象、场景、预算范围、偏好风格和限制条件。我可以从已配置的商品目录中推荐方向，并在你需要时收集邮箱让团队跟进。",
      },
      {
        question: "批量购买有折扣吗？",
        answer:
          "批量采购价格通常需要人工审核。请提供商品、数量、公司、目标时间和联系邮箱，我会把它标记为高意向线索交给团队跟进。",
      },
      {
        question: "可以转人工吗？",
        answer:
          "可以。请留下姓名、邮箱、相关订单号以及简短问题说明，我会把请求转交团队人工跟进。",
      },
    ],
    pricingOptionsEn: [
      "Agent Only: $79. Includes the e-commerce product support agent template, hosted demo, basic iframe/script embed code, product FAQ flow, purchase-intent capture, and documentation.",
      "Agent + Setup: $399. Includes product FAQ setup, shipping/return policy setup, brand tone adjustment, website embed support, and launch testing.",
      "Custom Version: From $1499. Adds Shopify/order/inventory integration, CRM/email integration, custom recommendation logic, bulk-order flow, and advanced handoff rules.",
    ],
    pricingOptionsZh: [
      "Agent Only：¥599。包含电商产品客服 Agent 模板、托管 Demo、基础 iframe/script 嵌入代码、商品 FAQ 流程、购买意向收集和文档。",
      "Agent + Setup：¥2999。包含商品 FAQ 配置、物流/退换货政策配置、品牌语气调整、网站嵌入支持和上线测试。",
      "Custom Version：¥9999 起。包含 Shopify/订单/库存集成、CRM/邮件集成、自定义推荐逻辑、批量采购流程和高级人工转接规则。",
    ],
    customUpgradeOptionsEn: [
      "Upload product catalog, product FAQ, size charts, policy documents, and brand voice notes.",
      "Shopify, WooCommerce, order, or inventory lookup integration.",
      "CRM and email integration for buyer-intent or bulk-order follow-up.",
      "Custom product recommendation logic by category, use case, budget, gift recipient, size, or compatibility.",
      "Human handoff for order tracking, complaints, policy disputes, high-value buyers, and custom quotes.",
      "Multi-language support beyond English and Chinese.",
      "Analytics for top questions, product interest, unanswered questions, and conversion blockers.",
    ],
    customUpgradeOptionsZh: [
      "上传商品目录、商品 FAQ、尺码表、政策文档和品牌语气说明。",
      "接入 Shopify、WooCommerce、订单或库存查询。",
      "CRM 和邮件集成，用于购买意向或批量采购跟进。",
      "按分类、场景、预算、送礼对象、尺码或兼容性定制商品推荐逻辑。",
      "针对订单查询、投诉、政策争议、高价值买家和定制报价设置人工转接。",
      "扩展英文和中文以外的多语言支持。",
      "分析热门问题、商品兴趣、未回答问题和转化阻碍。",
    ],
    coverImageStyleEn:
      "Professional SaaS/e-commerce cover: online store product cards, shopping cart, AI chat assistant, purchase-intent lead card, soft emerald-cyan gradient, premium business style.",
    coverImageStyleZh:
      "专业 SaaS/电商风格封面：线上商店商品卡片、购物车、AI 聊天助手、购买意向线索卡片，柔和绿色-青色渐变，商务高级感。",
  },
  {
    slug: "real-estate-lead-agent",
    titleEn: "Real Estate Lead Agent",
    titleZh: "房地产获客 Agent",
    shortDescriptionEn:
      "Qualifies property buyers and routes serious leads to sales teams.",
    shortDescriptionZh: "筛选购房客户并将高意向线索转给销售团队。",
    descriptionEn:
      "A lead capture assistant for real estate agencies that asks buyer intent, budget, location, and timeline questions.",
    descriptionZh:
      "帮助房地产机构收集购房意向、预算、区域和时间计划的获客助手。",
    featuresEn: [
      "Qualify buyer intent",
      "Collect budget and location preferences",
      "Route high-intent leads",
    ],
    featuresZh: ["筛选购房意向", "收集预算和区域偏好", "转交高意向线索"],
    faqEn: [
      {
        question: "Can it book viewings?",
        answer: "It can collect viewing preferences for sales follow-up.",
      },
      {
        question: "Can it support rental leads?",
        answer: "Yes. The flow can be adjusted for rental or purchase intent.",
      },
    ],
    faqZh: [
      {
        question: "可以预约看房吗？",
        answer: "可以收集看房偏好，供销售跟进。",
      },
      {
        question: "可以支持租赁线索吗？",
        answer: "可以。流程可调整为租赁或购房意向。",
      },
    ],
    setupInstructionsEn:
      "Configure property types, service areas, budget bands, and lead routing rules.",
    setupInstructionsZh: "配置房产类型、服务区域、预算区间和线索分配规则。",
    dataPermissionsEn:
      "Collects contact details and stated preferences. Financial documents are not needed for demos.",
    dataPermissionsZh:
      "收集联系方式和需求偏好。演示阶段不需要财务文件。",
    categorySlug: "real-estate",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 799,
    priceCny: 5799,
    demoUrl: "/agents/real-estate-lead-agent#live-demo",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    slug: "restaurant-booking-agent",
    titleEn: "Restaurant Booking Agent",
    titleZh: "餐厅预约 Agent",
    shortDescriptionEn:
      "Handles booking requests, FAQs, and private dining inquiries.",
    shortDescriptionZh: "处理订位、常见问题和包间咨询。",
    descriptionEn:
      "A local restaurant agent for reservation intake, opening hours, menu questions, and event booking requests.",
    descriptionZh:
      "面向餐饮商家的预约、营业时间、菜单咨询和活动订位 Agent。",
    featuresEn: [
      "Collect reservation requests",
      "Answer hours and menu questions",
      "Capture private dining inquiries",
    ],
    featuresZh: ["收集预约请求", "回答营业时间和菜单问题", "收集包间和活动咨询"],
    faqEn: [
      {
        question: "Does it confirm bookings automatically?",
        answer: "Not yet. Phase 2 still treats bookings as lead requests.",
      },
      {
        question: "Can it handle large parties?",
        answer: "Yes. It captures party size, time, and contact details.",
      },
    ],
    faqZh: [
      {
        question: "会自动确认预约吗？",
        answer: "暂时不会。第二阶段仍将预约作为线索请求处理。",
      },
      {
        question: "可以处理多人聚餐吗？",
        answer: "可以收集人数、时间和联系方式。",
      },
    ],
    setupInstructionsEn:
      "Add opening hours, seating rules, menu links, and notification recipients.",
    setupInstructionsZh: "添加营业时间、座位规则、菜单链接和通知接收人。",
    dataPermissionsEn:
      "Collects booking contact information and party details. Payment details are not required.",
    dataPermissionsZh: "收集预约联系方式和用餐信息，不需要支付信息。",
    categorySlug: "restaurant-local-business",
    deliveryType: "hosted_agent",
    pricingType: "monthly",
    priceUsd: 99,
    priceCny: 699,
    demoUrl: "/agents/restaurant-booking-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "course-enrollment-agent",
    titleEn: "Course Enrollment Agent",
    titleZh: "课程招生 Agent",
    shortDescriptionEn:
      "Explains courses, collects student goals, and books consultations.",
    shortDescriptionZh: "介绍课程、收集学习目标并预约咨询。",
    descriptionEn:
      "An education enrollment agent for schools, bootcamps, and training companies that need better inquiry follow-up.",
    descriptionZh:
      "面向学校、训练营和培训机构的招生咨询 Agent，提升咨询转化效率。",
    featuresEn: [
      "Explain course options",
      "Collect learning goals",
      "Prepare counselor handoff notes",
    ],
    featuresZh: ["介绍课程选择", "收集学习目标", "整理顾问交接信息"],
    faqEn: [
      {
        question: "Can it recommend courses?",
        answer: "Yes. Recommendations can follow approved eligibility rules.",
      },
      {
        question: "Can counselors review answers?",
        answer: "Yes. Content should be reviewed before publishing.",
      },
    ],
    faqZh: [
      {
        question: "可以推荐课程吗？",
        answer: "可以根据已审核的报名条件进行推荐。",
      },
      {
        question: "顾问可以审核回答吗？",
        answer: "可以。内容上线前应先审核。",
      },
    ],
    setupInstructionsEn:
      "Add course catalog, eligibility rules, pricing notes, and counselor routing details.",
    setupInstructionsZh: "添加课程目录、报名条件、价格说明和顾问分配信息。",
    dataPermissionsEn:
      "Collects education goals and contact details. Sensitive student records are not required.",
    dataPermissionsZh: "收集学习目标和联系方式，不需要敏感学生档案。",
    categorySlug: "education",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 599,
    priceCny: 4299,
    demoUrl: "/agents/course-enrollment-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "medical-beauty-consultation-agent",
    titleEn: "Medical Beauty Consultation Agent",
    titleZh: "医美咨询 Agent",
    shortDescriptionEn:
      "Pre-screens client needs and routes consultation requests.",
    shortDescriptionZh: "初步了解客户需求并分配咨询请求。",
    descriptionEn:
      "A medical beauty consultation intake agent with clear disclaimers and appointment-oriented workflows.",
    descriptionZh: "用于医美咨询初筛、风险提示和预约流程的 Agent。",
    featuresEn: [
      "Collect consultation goals",
      "Show non-diagnostic service information",
      "Route requests to clinic staff",
    ],
    featuresZh: ["收集咨询目标", "展示非诊断类服务信息", "将请求转给机构人员"],
    faqEn: [
      {
        question: "Does it give medical advice?",
        answer: "No. It collects context and routes users to qualified staff.",
      },
      {
        question: "Can it include disclaimers?",
        answer: "Yes. Safety and disclaimer text is part of setup.",
      },
    ],
    faqZh: [
      {
        question: "它会提供医疗建议吗？",
        answer: "不会。它收集背景信息，并引导用户联系专业人员。",
      },
      {
        question: "可以加入风险提示吗？",
        answer: "可以。安全说明和免责声明属于配置内容。",
      },
    ],
    setupInstructionsEn:
      "Add approved service descriptions, disclaimers, clinic routing, and appointment rules.",
    setupInstructionsZh: "添加已审核服务介绍、免责声明、机构分配和预约规则。",
    dataPermissionsEn:
      "Collects consultation intent and contact details. Avoid medical records or diagnosis data in demos.",
    dataPermissionsZh:
      "收集咨询意向和联系方式。演示模式避免输入病历或诊断数据。",
    categorySlug: "healthcare-medical-beauty",
    deliveryType: "custom_business_agent",
    pricingType: "custom_quote",
    priceUsd: 1200,
    priceCny: 8800,
    demoUrl: "/agents/medical-beauty-consultation-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "law-firm-intake-agent",
    titleEn: "Law Firm Intake Agent",
    titleZh: "律所客户初筛 Agent",
    shortDescriptionEn:
      "Collects intake details and prepares cases for attorney review.",
    shortDescriptionZh: "收集案件背景并整理给律师审核。",
    descriptionEn:
      "A law firm intake assistant for collecting structured case details while avoiding legal advice automation.",
    descriptionZh:
      "帮助律所结构化收集案情信息，同时避免自动化法律建议。",
    featuresEn: [
      "Collect structured intake details",
      "Classify matter type",
      "Prepare attorney handoff summaries",
    ],
    featuresZh: ["结构化收集案情", "分类案件类型", "生成律师交接摘要"],
    faqEn: [
      {
        question: "Does it provide legal advice?",
        answer: "No. It only collects information for attorney review.",
      },
      {
        question: "Can it collect conflict details?",
        answer: "It can collect basic fields for staff review.",
      },
    ],
    faqZh: [
      {
        question: "它会提供法律建议吗？",
        answer: "不会。它只收集信息并交由律师审核。",
      },
      {
        question: "可以收集利益冲突筛查信息吗？",
        answer: "可以收集基础字段供团队审核。",
      },
    ],
    setupInstructionsEn:
      "Configure practice areas, disclaimers, intake fields, and routing rules.",
    setupInstructionsZh: "配置业务领域、免责声明、初筛字段和分配规则。",
    dataPermissionsEn:
      "Collects client-provided intake details. Confidentiality language should be reviewed by the firm.",
    dataPermissionsZh: "收集客户主动提供的初筛信息。保密说明需由律所审核。",
    categorySlug: "legal",
    deliveryType: "hosted_agent",
    pricingType: "monthly",
    priceUsd: 299,
    priceCny: 2099,
    demoUrl: "/agents/law-firm-intake-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "internal-knowledge-base-agent",
    titleEn: "Internal Knowledge Base Agent",
    titleZh: "企业知识库 Agent",
    shortDescriptionEn:
      "Answers employee questions from approved internal documents.",
    shortDescriptionZh: "基于企业内部资料回答员工问题。",
    descriptionEn:
      "A company knowledge assistant for SOPs, HR policies, onboarding documents, and internal support.",
    descriptionZh:
      "面向 SOP、人事制度、入职文档和内部支持的企业知识库助手。",
    featuresEn: [
      "Answer from approved documents",
      "Cite source document names",
      "Escalate unanswered questions",
    ],
    featuresZh: ["基于已审核文档回答", "引用来源文档名称", "升级无法回答的问题"],
    faqEn: [
      {
        question: "Can it cite sources?",
        answer: "Yes. Source-aware answers are expected for internal knowledge.",
      },
      {
        question: "Can access be restricted?",
        answer: "Yes. Role-based access should be added with auth and RLS.",
      },
    ],
    faqZh: [
      {
        question: "可以引用来源吗？",
        answer: "可以。企业知识库场景应支持来源提示。",
      },
      {
        question: "可以限制访问权限吗？",
        answer: "可以。权限控制应在认证和 RLS 阶段加入。",
      },
    ],
    setupInstructionsEn:
      "Collect approved documents, define access rules, and configure unanswered-question routing.",
    setupInstructionsZh: "收集已审核文档，定义访问规则，并配置无法回答问题的转交流程。",
    dataPermissionsEn:
      "Uses company-provided documents. Sensitive documents should be permission-scoped before upload.",
    dataPermissionsZh:
      "使用企业提供的文档。敏感文档上传前应先划分权限范围。",
    categorySlug: "internal-knowledge-base",
    deliveryType: "custom_business_agent",
    pricingType: "custom_quote",
    priceUsd: 1500,
    priceCny: 10800,
    demoUrl: "/agents/internal-knowledge-base-agent#live-demo",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    slug: "ai-news-monitoring-agent",
    titleEn: "AI News Monitoring Agent",
    titleZh: "AI 资讯监控 Agent",
    shortDescriptionEn:
      "Tracks AI news and sends concise business-ready summaries.",
    shortDescriptionZh: "监控 AI 资讯并输出适合业务阅读的摘要。",
    descriptionEn:
      "A monitoring workflow for AI industry updates, competitor signals, and executive briefings.",
    descriptionZh: "用于 AI 行业动态、竞品信号和管理层简报的资讯监控工作流。",
    featuresEn: [
      "Track selected AI topics",
      "Summarize news for business readers",
      "Prepare weekly briefing drafts",
    ],
    featuresZh: ["监控指定 AI 主题", "为业务读者总结资讯", "生成周报草稿"],
    faqEn: [
      {
        question: "Can sources be customized?",
        answer: "Yes. Sources and topic keywords can be configured.",
      },
      {
        question: "Does it publish automatically?",
        answer: "No. Briefings should be reviewed before sharing.",
      },
    ],
    faqZh: [
      {
        question: "可以自定义来源吗？",
        answer: "可以。来源和主题关键词都能配置。",
      },
      {
        question: "会自动发布吗？",
        answer: "不会。简报建议审核后再分享。",
      },
    ],
    setupInstructionsEn:
      "Define topic keywords, sources, recipients, language, and briefing frequency.",
    setupInstructionsZh: "定义主题关键词、来源、接收人、语言和简报频率。",
    dataPermissionsEn:
      "Uses public news sources and configured keywords. Private competitive data should be reviewed first.",
    dataPermissionsZh:
      "使用公开资讯来源和配置关键词。私有竞品资料如需接入应先审核。",
    categorySlug: "ai-news-monitoring",
    deliveryType: "workflow_template",
    pricingType: "monthly",
    priceUsd: 149,
    priceCny: 999,
    demoUrl: "/agents/ai-news-monitoring-agent#live-demo",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    slug: "youtube-video-summary-agent",
    titleEn: "YouTube Video Summary Agent",
    titleZh: "YouTube 视频总结 Agent",
    shortDescriptionEn:
      "Turns video links into summaries, highlights, and action items.",
    shortDescriptionZh: "将视频链接转为摘要、重点和行动项。",
    descriptionEn:
      "A content productivity agent for summarizing videos, extracting key takeaways, and preparing notes.",
    descriptionZh: "用于视频总结、重点提取和笔记整理的内容效率 Agent。",
    featuresEn: [
      "Summarize long videos",
      "Extract key takeaways",
      "Create action-item notes",
    ],
    featuresZh: ["总结长视频", "提取核心观点", "生成行动项笔记"],
    faqEn: [
      {
        question: "Does it download videos?",
        answer: "No. It works from provided transcripts or supported links.",
      },
      {
        question: "Can it summarize in Chinese?",
        answer: "Yes. English and Chinese output are supported.",
      },
    ],
    faqZh: [
      {
        question: "它会下载视频吗？",
        answer: "不会。它基于提供的字幕或支持的链接工作。",
      },
      {
        question: "可以用中文总结吗？",
        answer: "可以。支持中英文输出。",
      },
    ],
    setupInstructionsEn:
      "Provide a transcript or supported video link, then select summary format and output language.",
    setupInstructionsZh: "提供字幕或支持的视频链接，然后选择总结格式和输出语言。",
    dataPermissionsEn:
      "Uses user-provided links or transcripts. Avoid uploading private videos without rights.",
    dataPermissionsZh: "使用用户提供的链接或字幕。请勿上传无权使用的私密视频。",
    categorySlug: "content-creation",
    deliveryType: "prompt_template",
    pricingType: "one_time",
    priceUsd: 79,
    priceCny: 499,
    demoUrl: "/agents/youtube-video-summary-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "resume-career-coach-agent",
    titleEn: "Resume / Career Coach Agent",
    titleZh: "简历与职业教练 Agent",
    shortDescriptionEn:
      "Reviews resumes and prepares practical interview coaching notes.",
    shortDescriptionZh: "优化简历并生成实用面试辅导建议。",
    descriptionEn:
      "A career coaching assistant for resume review, role matching, interview preparation, and follow-up drafts.",
    descriptionZh: "用于简历优化、岗位匹配、面试准备和跟进邮件草稿的职业教练助手。",
    featuresEn: [
      "Review resume structure",
      "Suggest role-specific improvements",
      "Prepare interview practice prompts",
    ],
    featuresZh: ["审核简历结构", "提出岗位相关优化建议", "生成面试练习问题"],
    faqEn: [
      {
        question: "Does it guarantee job offers?",
        answer: "No. It improves preparation but cannot guarantee outcomes.",
      },
      {
        question: "Can it support bilingual resumes?",
        answer: "Yes. English and Chinese workflows are supported.",
      },
    ],
    faqZh: [
      {
        question: "它能保证拿到 offer 吗？",
        answer: "不能。它提升材料和准备质量，但不保证结果。",
      },
      {
        question: "可以支持双语简历吗？",
        answer: "可以。支持中英文工作流。",
      },
    ],
    setupInstructionsEn:
      "Upload resume content, target role details, and preferred coaching language.",
    setupInstructionsZh: "上传简历内容、目标岗位信息和偏好的辅导语言。",
    dataPermissionsEn:
      "Uses resume and career goal information provided by the user. Remove sensitive identifiers when possible.",
    dataPermissionsZh:
      "使用用户提供的简历和职业目标信息。建议尽量移除敏感身份信息。",
    categorySlug: "education",
    deliveryType: "hosted_agent",
    pricingType: "one_time",
    priceUsd: 129,
    priceCny: 899,
    demoUrl: "/agents/resume-career-coach-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    slug: "local-service-business-agent",
    titleEn: "Local Service Business Agent",
    titleZh: "本地服务商家 Agent",
    shortDescriptionEn:
      "Captures local service requests and schedules follow-up calls.",
    shortDescriptionZh: "收集本地服务需求并安排后续沟通。",
    descriptionEn:
      "A lead and support agent for local service companies such as repair, cleaning, moving, and wellness businesses.",
    descriptionZh:
      "适合维修、清洁、搬家和健康服务等本地服务商家的线索与客服 Agent。",
    featuresEn: [
      "Collect service request details",
      "Estimate urgency and location",
      "Send follow-up notes to staff",
    ],
    featuresZh: ["收集服务需求", "判断紧急程度和位置", "向员工发送跟进信息"],
    faqEn: [
      {
        question: "Can it handle multiple service types?",
        answer: "Yes. Service categories and intake questions are configurable.",
      },
      {
        question: "Can it quote prices?",
        answer: "It can show approved ranges or collect details for manual quotes.",
      },
    ],
    faqZh: [
      {
        question: "可以处理多种服务吗？",
        answer: "可以。服务分类和需求问题都能配置。",
      },
      {
        question: "可以报价吗？",
        answer: "可以展示已审核价格区间，或收集信息供人工报价。",
      },
    ],
    setupInstructionsEn:
      "Add service categories, coverage areas, intake questions, and notification rules.",
    setupInstructionsZh: "添加服务分类、覆盖区域、需求问题和通知规则。",
    dataPermissionsEn:
      "Collects contact details, service needs, and location area. Exact address can wait for staff follow-up.",
    dataPermissionsZh:
      "收集联系方式、服务需求和所在区域。详细地址可在人工跟进时再收集。",
    categorySlug: "restaurant-local-business",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 399,
    priceCny: 2799,
    demoUrl: "/agents/local-service-business-agent#live-demo",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
];
