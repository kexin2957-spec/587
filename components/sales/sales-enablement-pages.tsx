"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCard } from "@/components/marketplace/agent-card";
import { SalesLeadForm } from "@/components/sales/sales-lead-form";
import {
  demoAgents,
  launchAgentSlugs,
} from "@/lib/marketplace/demo-data";

const trustBadges = {
  en: [
    "Platform hosted",
    "License protected",
    "Website embed ready",
    "Lead capture ready",
    "Setup support",
    "English/Chinese support",
  ],
  zh: [
    "平台托管",
    "授权保护",
    "可嵌入网站",
    "可收集线索",
    "可选安装支持",
    "中英文支持",
  ],
} as const;

const deliverySteps = {
  en: [
    "Choose the agent",
    "Submit the order",
    "Confirm payment/contact",
    "Provide business info",
    "Configure the agent",
    "Generate embed code",
    "Install on website",
    "Collect leads",
  ],
  zh: [
    "选择 Agent",
    "提交订单",
    "确认付款/联系方式",
    "提供业务信息",
    "配置 Agent",
    "生成嵌入代码",
    "安装到网站",
    "收集线索",
  ],
} as const;

const pricingPlans = {
  en: [
    {
      delivery: "1 business day",
      includes:
        "Hosted agent URL, embed code, customer dashboard, install guide, lead dashboard, basic support.",
      name: "Agent Only",
      price: "from $49 / ¥399",
    },
    {
      delivery: "2-4 business days",
      includes:
        "Everything in Agent Only plus business info, FAQ, tone, handoff, and launch setup support.",
      name: "Agent + Setup",
      price: "from $299 / ¥1999",
    },
    {
      delivery: "quoted after scope review",
      includes:
        "Custom workflows, CRM/Shopify/calendar/API planning, deeper knowledge setup, custom routing.",
      name: "Custom Version",
      price: "from $999 / ¥6999",
    },
  ],
  zh: [
    {
      delivery: "1 个工作日",
      includes:
        "托管 Agent URL、嵌入代码、客户后台、安装指南、线索后台、基础支持。",
      name: "Agent 本体",
      price: "$49 / ¥399 起",
    },
    {
      delivery: "2-4 个工作日",
      includes:
        "包含 Agent 本体，并协助配置业务信息、FAQ、语气、转人工规则和上线测试。",
      name: "Agent + 配置安装",
      price: "$299 / ¥1999 起",
    },
    {
      delivery: "评估需求后报价",
      includes:
        "定制流程、CRM/Shopify/日历/API 方案、更深知识配置、自定义流转规则。",
      name: "定制版本",
      price: "$999 / ¥6999 起",
    },
  ],
} as const;

const salesFaq = {
  en: [
    {
      answer:
        "A normal chatbot usually answers generic questions. These agents are packaged as hosted business workflows with demos, lead capture, delivery docs, license protection, customer configuration, and admin visibility.",
      question: "What is the difference from a normal chatbot?",
    },
    {
      answer:
        "Yes. Customers receive iframe and script embed options. License protection limits normal use to authorized domains.",
      question: "Can it be embedded on my website?",
    },
    {
      answer:
        "Agent Only is usually delivered in 1 business day after payment/contact confirmation. Setup plans usually take 2-4 business days after content is confirmed.",
      question: "How long does delivery take?",
    },
    {
      answer:
        "The standard agents do not include real-time Shopify, CRM, WeChat, order, or inventory lookup. Those are Custom Version upgrades.",
      question: "Can it connect to Shopify/CRM/WeChat?",
    },
    {
      answer:
        "Core agent logic stays server-side. Public pages do not expose sensitive runtime instructions, credentials, or other customers' data.",
      question: "Is customer data safe?",
    },
    {
      answer:
        "Yes. Customers can edit business info, FAQ, pricing ranges, welcome message, contact info, and handoff rules. Deeper workflows use Custom Version.",
      question: "Can I customize it?",
    },
    {
      answer:
        "After purchase, the customer receives an order confirmation, payment/contact instructions, delivery package, hosted agent URL, embed code, dashboard access, docs, and support instructions.",
      question: "What happens after purchase?",
    },
    {
      answer:
        "Yes. Setup support is available through Agent + Setup or Custom Version when the customer wants help configuring and installing the agent.",
      question: "Do you provide setup support?",
    },
  ],
  zh: [
    {
      answer:
        "普通聊天机器人通常只回答通用问题。这里售卖的是托管式业务 Agent，包含 Demo、线索收集、交付文档、授权保护、客户配置后台和管理端可见性。",
      question: "和普通聊天机器人有什么区别？",
    },
    {
      answer:
        "可以。客户会收到 iframe 和 script 两种嵌入方式。授权保护会限制 Agent 只在已授权域名正常使用。",
      question: "可以嵌入我的官网吗？",
    },
    {
      answer:
        "Agent 本体通常在付款和联系方式确认后 1 个工作日交付。配置安装套餐通常在内容确认后 2-4 个工作日交付。",
      question: "多久可以交付？",
    },
    {
      answer:
        "标准 Agent 不包含实时 Shopify、CRM、微信、订单或库存查询。这些属于定制版本升级范围。",
      question: "可以连接 Shopify、CRM 或微信吗？",
    },
    {
      answer:
        "核心 Agent 逻辑保留在服务端。公开页面不会暴露敏感运行指令、凭证或其他客户数据。",
      question: "客户数据安全吗？",
    },
    {
      answer:
        "可以。客户可以编辑业务信息、FAQ、价格范围、欢迎语、联系方式和转人工规则。更复杂流程走定制版本。",
      question: "可以自定义吗？",
    },
    {
      answer:
        "购买后客户会看到订单确认、付款/联系说明，并在交付后收到托管 Agent URL、嵌入代码、客户后台、文档和支持说明。",
      question: "购买后会发生什么？",
    },
    {
      answer:
        "提供。客户如果需要协助配置和安装，可以选择 Agent + Setup 或定制版本。",
      question: "你们提供安装支持吗？",
    },
  ],
} as const;

const aboutCopy = {
  en: {
    bottom:
      "For simple use cases, start with a launch-ready agent. For deeper workflows, request a custom version with integrations and private knowledge.",
    delivery:
      "Delivery starts with a selected plan and order. After payment/contact confirmation, we prepare the hosted agent, configure business information, generate embed code, provide installation documentation, and make leads visible in the dashboard.",
    heroDescription:
      "We sell hosted, license-protected AI agents that businesses can test, buy, configure, and embed without starting from a blank prompt.",
    heroTitle: "Why buy hosted AI agents instead of prompt templates?",
    platform:
      "AI Agent Marketplace packages business-ready agents for website sales, lead capture, e-commerce support, and custom AI workflows.",
    receive:
      "Customers receive a hosted agent URL, website embed code, customer configuration access, lead dashboard, installation guide, basic support, and optional setup service.",
    templates:
      "Prompt templates leave the customer responsible for hosting, security, UI, lead capture, updates, and operations. Hosted agents keep private logic server-side and provide a complete delivery package.",
    trust:
      "Listings are standardized, public claims are limited to supported capabilities, license/domain protection blocks unauthorized reuse, and sensitive runtime logic stays on the backend.",
  },
  zh: {
    bottom:
      "简单场景可以从现成 Agent 开始。更深业务流程可以申请定制版本，接入系统和私有知识。",
    delivery:
      "交付从选择套餐和提交订单开始。确认付款/联系方式后，我们准备托管 Agent、配置业务信息、生成嵌入代码、提供安装文档，并让线索在后台可见。",
    heroDescription:
      "我们销售托管式、授权保护的 AI Agent，让企业可以先体验、再购买、配置并嵌入网站，而不是从一段提示词从零开始。",
    heroTitle: "为什么选择托管 AI Agent，而不是简单 Prompt 模板？",
    platform:
      "AI Agent Marketplace 将网站销售获客、电商客服和定制 AI 工作流包装成可交付的业务 Agent。",
    receive:
      "客户会收到托管 Agent URL、网站嵌入代码、客户配置入口、线索后台、安装指南、基础支持和可选安装服务。",
    templates:
      "Prompt 模板需要客户自己处理托管、安全、界面、线索收集、更新和运营。托管 Agent 把私有逻辑留在服务端，并提供完整交付包。",
    trust:
      "商品结构标准化，公开承诺只覆盖已支持能力；授权/域名保护可阻止未授权复用，敏感运行逻辑保留在后端。",
  },
} as const;

const demoCases = {
  en: [
    {
      agent: "Website Sales & Lead Capture Agent",
      demoHref: "/demo/website-customer-support-agent",
      delivery:
        "Hosted agent URL, embed code, customer dashboard, lead dashboard, install guide, and optional setup.",
      features: [
        "Answers approved website FAQ",
        "Explains services and pricing ranges",
        "Collects name, email, company, and inquiry",
        "Detects intent and lead score",
        "Hands off custom projects to a human",
      ],
      industries: ["Consulting", "Agencies", "B2B services", "Local services", "SaaS"],
      pain:
        "Visitors ask similar questions, leave without contacting sales, and the business has no simple way to qualify leads from the website.",
      solution:
        "Install a hosted sales and lead capture agent that answers common questions, qualifies intent, and sends high-value requests to the team.",
      title: "Demo case: business website lead capture",
      upgrades: ["CRM integration", "Calendar booking", "Custom qualification workflow", "Internal docs"],
    },
    {
      agent: "E-commerce Product Support Agent",
      demoHref: "/demo/ecommerce-product-support-agent",
      delivery:
        "Hosted e-commerce support agent, website embed, product FAQ configuration, lead/purchase-intent dashboard, install guide, and setup option.",
      features: [
        "Answers product and policy questions",
        "Explains shipping, returns, and warranty rules",
        "Recommends products from approved content",
        "Flags purchase intent and handoff needs",
        "Avoids unsupported real-time order/inventory claims",
      ],
      industries: ["DTC stores", "Beauty", "Apparel", "Home goods", "Digital products"],
      pain:
        "Shoppers hesitate before purchase, ask repetitive product questions, and support teams lose time on shipping and return explanations.",
      solution:
        "Install a hosted product support agent that handles common shopper questions and captures purchase intent before checkout.",
      title: "Demo case: online store product support",
      upgrades: ["Shopify integration", "Order lookup", "Inventory lookup", "Custom product recommendation logic"],
    },
  ],
  zh: [
    {
      agent: "Website Sales & Lead Capture Agent",
      demoHref: "/demo/website-customer-support-agent",
      delivery:
        "托管 Agent URL、嵌入代码、客户后台、线索后台、安装指南和可选配置服务。",
      features: [
        "回答已确认的网站 FAQ",
        "说明服务和价格范围",
        "收集姓名、邮箱、公司和需求",
        "识别意图和线索评分",
        "把定制项目转交人工跟进",
      ],
      industries: ["咨询服务", "营销/技术服务商", "B2B 服务", "本地服务", "SaaS"],
      pain:
        "访客反复询问类似问题，离开网站前没有留下联系方式，企业也缺少简单的线索初筛方式。",
      solution:
        "安装托管式销售获客 Agent，回答常见问题、筛选意向，并把高价值需求转交团队。",
      title: "Demo 案例：企业官网销售获客",
      upgrades: ["CRM 集成", "日历预约", "定制筛选流程", "内部文档知识库"],
    },
    {
      agent: "E-commerce Product Support Agent",
      demoHref: "/demo/ecommerce-product-support-agent",
      delivery:
        "托管电商客服 Agent、网站嵌入、产品 FAQ 配置、购买意向后台、安装指南和可选配置服务。",
      features: [
        "回答产品和政策问题",
        "说明物流、退换货和保修规则",
        "基于已批准内容推荐产品",
        "识别购买意向和转人工需求",
        "避免声称未接入的实时订单/库存能力",
      ],
      industries: ["独立站", "美妆", "服饰", "家居", "数字产品"],
      pain:
        "买家下单前犹豫，重复询问产品问题，客服团队在物流和退换货说明上消耗大量时间。",
      solution:
        "安装托管式产品客服 Agent，在结账前回答常见购物问题并收集购买意向。",
      title: "Demo 案例：在线商店产品客服",
      upgrades: ["Shopify 集成", "订单查询", "库存查询", "定制商品推荐逻辑"],
    },
  ],
} as const;

export function AboutWhyUsPage() {
  const { language } = useTranslation();
  const localizedCopy = aboutCopy[language];

  return (
    <main>
      <HeroSection
        eyebrow={language === "zh" ? "关于 / 为什么选择我们" : "About / Why Us"}
        title={localizedCopy.heroTitle}
        description={localizedCopy.heroDescription}
        primaryHref="/sales-kit"
        primaryLabel={language === "zh" ? "查看销售资料页" : "View Sales Kit"}
        secondaryHref="/case-studies"
        secondaryLabel={language === "zh" ? "查看 Demo 案例" : "View Demo Cases"}
      />

      <section className="app-container grid gap-5 py-14 md:grid-cols-2">
        {[
          [language === "zh" ? "平台做什么" : "What the platform does", localizedCopy.platform],
          [
            language === "zh" ? "为什么不是 Prompt 模板" : "Why not prompt templates",
            localizedCopy.templates,
          ],
          [language === "zh" ? "客户收到什么" : "What customers receive", localizedCopy.receive],
          [language === "zh" ? "交付如何进行" : "How delivery works", localizedCopy.delivery],
          [language === "zh" ? "为什么可信" : "Why it is trustworthy", localizedCopy.trust],
          [language === "zh" ? "下一步" : "Next step", localizedCopy.bottom],
        ].map(([title, description]) => (
          <article className="premium-card p-6" key={title}>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </article>
        ))}
      </section>

      <TrustSection />
      <DeliveryProcessSection />
    </main>
  );
}

export function CaseStudiesPage() {
  const { language } = useTranslation();
  const cases = demoCases[language];

  return (
    <main>
      <HeroSection
        eyebrow={language === "zh" ? "Demo 案例" : "Demo Cases"}
        title={
          language === "zh"
            ? "给销售团队使用的真实场景演示，不是假客户背书。"
            : "Sales-ready demo cases, clearly labeled as demos, not fake customer proof."
        }
        description={
          language === "zh"
            ? "这两个案例用于讲清楚客户痛点、解决方案、交付包和可升级方向，适合短视频、私域和一对一销售讲解。"
            : "Use these cases to explain customer pain, solution, delivery package, and upgrade paths in social videos and direct outreach."
        }
        primaryHref="/sales-kit"
        primaryLabel={language === "zh" ? "打开销售资料页" : "Open Sales Kit"}
        secondaryHref="#demo-cases"
        secondaryLabel={language === "zh" ? "查看案例" : "View Cases"}
      />

      <section className="app-container grid gap-6 py-14" id="demo-cases">
        {cases.map((demoCase) => (
          <article
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            key={demoCase.title}
          >
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="bg-slate-950 p-6 text-white sm:p-8">
                <p className="text-sm font-semibold text-blue-200">
                  {language === "zh" ? "明确标注：Demo 案例" : "Clearly labeled: demo case"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {demoCase.title}
                </h2>
                <p className="mt-4 text-sm font-medium text-slate-300">
                  {demoCase.agent}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <CtaLink href={demoCase.demoHref} variant="light">
                    {language === "zh" ? "打开 Demo" : "Open Demo"}
                  </CtaLink>
                  <CtaLink
                    href={
                      demoCase.agent.startsWith("Website")
                        ? "/agents/website-customer-support-agent"
                        : "/agents/ecommerce-product-support-agent"
                    }
                    variant="outlineLight"
                  >
                    {language === "zh" ? "查看商品页" : "View Product"}
                  </CtaLink>
                </div>
              </div>
              <div className="grid gap-5 p-6 sm:p-8">
                <CaseBlock
                  title={language === "zh" ? "客户痛点" : "Customer pain point"}
                  body={demoCase.pain}
                />
                <CaseBlock
                  title={language === "zh" ? "解决方案" : "Solution"}
                  body={demoCase.solution}
                />
                <CaseList
                  items={demoCase.features}
                  title={language === "zh" ? "Agent 功能" : "Agent features"}
                />
                <CaseBlock
                  title={language === "zh" ? "交付包" : "Delivery package"}
                  body={demoCase.delivery}
                />
                <CaseList
                  items={demoCase.industries}
                  title={language === "zh" ? "适合行业" : "Suitable industries"}
                />
                <CaseList
                  items={demoCase.upgrades}
                  title={language === "zh" ? "定制升级方向" : "Custom upgrade options"}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export function SalesKitPage() {
  const { language } = useTranslation();
  const launchAgents = launchAgentSlugs
    .map((slug) => demoAgents.find((agent) => agent.slug === slug))
    .filter((agent): agent is (typeof demoAgents)[number] => Boolean(agent));

  return (
    <main>
      <HeroSection
        eyebrow={language === "zh" ? "销售资料包" : "Sales Enablement Kit"}
        title={
          language === "zh"
            ? "一句话讲清楚：购买托管 AI Agent，快速上线业务 AI 员工。"
            : "A simple sales pitch: buy hosted AI agents and launch business AI workers faster."
        }
        description={
          language === "zh"
            ? "适合销售人员在抖音、小红书、微信、私域和直客沟通中使用：包含产品、价格、Demo、交付、FAQ 和线索表单。"
            : "Built for salespeople promoting through Douyin, Xiaohongshu, WeChat, direct outreach, and live demos."
        }
        primaryHref="#sales-lead-form"
        primaryLabel={language === "zh" ? "提交销售线索" : "Submit Sales Lead"}
        secondaryHref="/custom-service"
        secondaryLabel={language === "zh" ? "申请定制 Agent" : "Request Custom Agent"}
      />

      <section className="app-container py-14">
        <SectionHeading
          title={language === "zh" ? "两个首发 Agent" : "Two launch agents"}
          description={
            language === "zh"
              ? "销售时优先推荐这两个标准化产品：一个解决官网获客，一个解决电商售前客服。"
              : "Lead with these two standardized products: one for business websites and one for online stores."
          }
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {launchAgents.map((agent) => (
            <AgentCard agent={agent} key={agent.slug} />
          ))}
        </div>
      </section>

      <PricingSummarySection />
      <DeliveryProcessSection />
      <TrustSection />
      <FaqSection />

      <section className="border-y border-slate-200 bg-white/76">
        <div className="app-container grid gap-8 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {language === "zh" ? "销售转化" : "Sales conversion"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {language === "zh"
                ? "把社媒咨询变成可跟进线索。"
                : "Turn social interest into qualified follow-up."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {language === "zh"
                ? "记录客户行业、业务类型、预算、时间线、来源渠道和销售员代码，方便销售团队分配 Demo、报价和后续跟进。"
                : "Capture industry, business type, budget, timeline, source channel, and salesperson code so the team can assign the right demo and follow-up path."}
            </p>
          </div>
          <SalesLeadForm />
        </div>
      </section>

      <section className="app-container py-14">
        <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {language === "zh"
                ? "不确定客户适合哪个 Agent？"
                : "Not sure which agent fits the customer?"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {language === "zh"
                ? "先用销售线索表单收集需求，再引导客户体验 Demo 或提交定制服务。"
                : "Capture the requirement first, then send the right demo or move into a custom service request."}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <CtaLink href="/case-studies" variant="light">
              {language === "zh" ? "查看 Demo 案例" : "View Demo Cases"}
            </CtaLink>
            <CtaLink href="/custom-service" variant="outlineLight">
              {language === "zh" ? "定制 AI Agent" : "Custom AI Agent"}
            </CtaLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingSummarySection() {
  const { language } = useTranslation();
  const plans = pricingPlans[language];

  return (
    <section className="border-y border-slate-200 bg-white/76">
      <div className="app-container py-14">
        <SectionHeading
          title={language === "zh" ? "价格摘要" : "Pricing summary"}
          description={
            language === "zh"
              ? "销售讲解时可以先用三档套餐建立预期，再根据是否需要集成推荐定制版本。"
              : "Use the three standard plan levels to set expectations, then recommend Custom Version when integration is needed."
          }
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article className="premium-card p-6" key={plan.name}>
              <h3 className="text-xl font-semibold text-slate-950">{plan.name}</h3>
              <p className="mt-2 text-2xl font-semibold text-blue-800">
                {plan.price}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {plan.includes}
              </p>
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {language === "zh" ? "交付：" : "Delivery: "}
                {plan.delivery}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliveryProcessSection() {
  const { language } = useTranslation();
  const steps = deliverySteps[language];

  return (
    <section className="app-container py-14">
      <SectionHeading
        title={language === "zh" ? "交付流程" : "Delivery process"}
        description={
          language === "zh"
            ? "从选择 Agent 到网站上线和线索收集，销售团队可以用这条流程解释购买后会发生什么。"
            : "Use this flow to explain what happens after purchase, from selecting the agent to collecting website leads."
        }
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <article className="soft-card p-5" key={step}>
            <p className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-800">
              {index + 1}
            </p>
            <h3 className="mt-4 font-semibold text-slate-950">{step}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  const { language } = useTranslation();

  return (
    <section className="border-y border-slate-200 bg-white/76">
      <div className="app-container py-14">
        <SectionHeading
          title={language === "zh" ? "信任点" : "Trust signals"}
          description={
            language === "zh"
              ? "销售沟通时重点强调：这不是裸提示词，也不是复制源码，而是托管、授权、可配置、可交付的业务 Agent。"
              : "The key message: this is not raw prompts or copied source code. It is hosted, licensed, configurable, and delivered as a business agent."
          }
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustBadges[language].map((badge) => (
            <div
              className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900"
              key={badge}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { language } = useTranslation();
  const items = salesFaq[language];

  return (
    <section className="app-container py-14">
      <SectionHeading
        title={language === "zh" ? "销售 FAQ" : "Sales FAQ"}
        description={
          language === "zh"
            ? "用于回答客户常见异议，帮助销售人员保持承诺清晰、不夸大能力。"
            : "Use these answers to handle common objections while keeping promises clear and accurate."
        }
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article className="soft-card p-5" key={item.question}>
            <h3 className="font-semibold text-slate-950">{item.question}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroSection({
  description,
  eyebrow,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  title,
}: {
  description: string;
  eyebrow: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
}) {
  const { language } = useTranslation();

  return (
    <section className="border-b border-slate-200/80 bg-white/88">
      <div className="app-container grid gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:py-20">
        <div>
          <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 shadow-sm">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href={primaryHref} variant="primary">
              {primaryLabel}
            </CtaLink>
            <CtaLink href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </CtaLink>
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="grid gap-3">
            {trustBadges[language].slice(0, 4).map((badge, index) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                key={badge}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function CaseBlock({ body, title }: { body: string; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function CaseList({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        {title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CtaLink({
  children,
  href,
  variant,
}: {
  children: React.ReactNode;
  href: string;
  variant: "light" | "outlineLight" | "primary" | "secondary";
}) {
  const className = {
    light:
      "rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100",
    outlineLight:
      "rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10",
    primary:
      "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800",
    secondary:
      "rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-300 hover:bg-slate-50",
  }[variant];

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
