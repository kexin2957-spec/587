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
};

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
    titleEn: "Website Customer Support Agent",
    titleZh: "网站客服 Agent",
    shortDescriptionEn:
      "Answers common website questions and captures qualified leads.",
    shortDescriptionZh: "回答网站常见问题并收集合格线索。",
    descriptionEn:
      "A ready-made website chatbot for businesses that need fast customer support coverage without hiring a larger support team.",
    descriptionZh:
      "适合企业网站的智能客服，可快速覆盖常见咨询并减少人工客服压力。",
    featuresEn: [
      "Answer approved website FAQs",
      "Collect contact details and intent",
      "Escalate complex requests to the team",
    ],
    featuresZh: ["回答已审核网站 FAQ", "收集联系方式和需求意向", "将复杂咨询转交团队"],
    faqEn: [
      {
        question: "Can it use our website content?",
        answer: "Yes. Setup starts from approved pages, FAQs, and policy docs.",
      },
      {
        question: "Does it replace human support?",
        answer: "No. It handles first-line questions and escalates exceptions.",
      },
    ],
    faqZh: [
      {
        question: "可以使用我们网站的内容吗？",
        answer: "可以。配置时会使用已确认的网站页面、FAQ 和政策文档。",
      },
      {
        question: "它会完全替代人工客服吗？",
        answer: "不会。它负责一线常见问题，并将复杂情况转交人工。",
      },
    ],
    setupInstructionsEn:
      "Connect approved website pages, add FAQ documents, configure escalation rules, and embed the chat widget.",
    setupInstructionsZh:
      "连接已审核的网站页面，添加 FAQ 文档，配置转人工规则，并嵌入聊天组件。",
    dataPermissionsEn:
      "Uses approved website and FAQ content. It does not require payment data or private customer records.",
    dataPermissionsZh:
      "使用已审核的网站和 FAQ 内容，不需要支付数据或客户隐私档案。",
    categorySlug: "customer-support",
    deliveryType: "website_chatbot",
    pricingType: "one_time",
    priceUsd: 499,
    priceCny: 3599,
    demoUrl: "https://demo.example.com/agents/website-customer-support",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    slug: "ecommerce-product-support-agent",
    titleEn: "E-commerce Product Support Agent",
    titleZh: "电商产品客服 Agent",
    shortDescriptionEn:
      "Guides shoppers through product questions, returns, and order help.",
    shortDescriptionZh: "帮助买家咨询商品、退换货和订单问题。",
    descriptionEn:
      "A commerce support agent for product catalogs, shipping questions, return policies, and conversion-focused recommendations.",
    descriptionZh:
      "面向电商商品目录、物流、退换货政策和转化推荐的客服 Agent。",
    featuresEn: [
      "Answer product questions",
      "Explain shipping and returns",
      "Recommend products from customer needs",
    ],
    featuresZh: ["回答商品问题", "解释物流与退换货政策", "根据需求推荐商品"],
    faqEn: [
      {
        question: "Can it connect to a catalog?",
        answer: "Yes. Catalog integration can be added after the foundation.",
      },
      {
        question: "Can it handle returns?",
        answer: "It can explain policies and collect details for staff follow-up.",
      },
    ],
    faqZh: [
      {
        question: "可以连接商品目录吗？",
        answer: "可以。基础功能完成后可接入商品目录。",
      },
      {
        question: "可以处理退货吗？",
        answer: "可以解释政策并收集退货信息，交给团队跟进。",
      },
    ],
    setupInstructionsEn:
      "Upload product FAQs, return policies, shipping rules, and sample catalog content.",
    setupInstructionsZh:
      "上传商品 FAQ、退换货政策、物流规则和示例商品内容。",
    dataPermissionsEn:
      "Uses product and policy data. Order system access should be scoped later.",
    dataPermissionsZh:
      "使用商品和政策数据。订单系统权限后续应按范围接入。",
    categorySlug: "ecommerce",
    deliveryType: "hosted_agent",
    pricingType: "monthly",
    priceUsd: 199,
    priceCny: 1399,
    demoUrl: "https://demo.example.com/agents/ecommerce-product-support",
    demoEnabled: true,
    isFeatured: true,
    isVerified: true,
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
    demoUrl: "https://demo.example.com/agents/real-estate-lead",
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
    demoUrl: "https://demo.example.com/agents/restaurant-booking",
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
    demoUrl: "https://demo.example.com/agents/course-enrollment",
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
    demoUrl: "https://demo.example.com/agents/medical-beauty-consultation",
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
    demoUrl: "https://demo.example.com/agents/law-firm-intake",
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
    demoUrl: "https://demo.example.com/agents/internal-knowledge-base",
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
    demoUrl: "https://demo.example.com/agents/ai-news-monitoring",
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
    demoUrl: "https://demo.example.com/agents/youtube-video-summary",
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
    demoUrl: "https://demo.example.com/agents/resume-career-coach",
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
    demoUrl: "https://demo.example.com/agents/local-service-business",
    demoEnabled: true,
    isFeatured: false,
    isVerified: true,
  },
];
