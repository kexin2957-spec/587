"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/language-provider";

type LocalizedText = {
  en: string;
  zh: string;
};

type DocSection = {
  body?: LocalizedText;
  items: LocalizedText[];
  title: LocalizedText;
};

type AgentDocContent = {
  agentSlug: string;
  accent: string;
  agentName: LocalizedText;
  description: LocalizedText;
  docsEyebrow: LocalizedText;
  installLabel: LocalizedText;
  sections: DocSection[];
  supportHref: string;
};

const sharedLabels = {
  en: {
    backToMarketplace: "Back to marketplace",
    contactSupport: "Request setup support",
    customerDashboard: "Open customer dashboard",
    installGuide: "Installation guide",
    quickChecklist: "Post-purchase checklist",
    quickSteps: [
      "Open your customer dashboard from the order confirmation page.",
      "Copy the hosted agent URL and embed code from the delivery panel.",
      "Complete the business configuration fields before public launch.",
      "Install the iframe or script on your website and submit a test lead.",
      "Review collected leads and request setup support when needed.",
    ],
    title: "Customer Delivery Documentation",
  },
  zh: {
    backToMarketplace: "返回 Agent 商店",
    contactSupport: "请求安装支持",
    customerDashboard: "打开客户后台",
    installGuide: "安装指南",
    quickChecklist: "购买后的检查清单",
    quickSteps: [
      "从订单确认页打开你的客户交付后台。",
      "在交付面板中复制托管 Agent 链接和嵌入代码。",
      "正式上线前补全业务配置字段。",
      "把 iframe 或 script 安装到网站，并提交一条测试线索。",
      "查看已收集线索，需要时请求安装支持。",
    ],
    title: "客户交付文档",
  },
};

const docs: Record<"website" | "ecommerce", AgentDocContent> = {
  website: {
    accent: "from-blue-700 via-cyan-600 to-emerald-500",
    agentName: {
      en: "Website Sales & Lead Capture Agent",
      zh: "网站销售与获客 Agent",
    },
    agentSlug: "website-customer-support-agent",
    description: {
      en: "Use this guide after purchase to install the website sales chatbot, configure approved business information, test lead capture, and understand what is included before requesting deeper integrations.",
      zh: "购买后请使用这份指南安装网站销售客服 Agent、配置已确认的业务信息、测试线索收集，并了解标准交付范围与定制升级边界。",
    },
    docsEyebrow: {
      en: "Website agent delivery",
      zh: "网站 Agent 交付",
    },
    installLabel: {
      en: "Website install flow",
      zh: "网站安装流程",
    },
    sections: [
      {
        title: { en: "What you receive", zh: "你会收到什么" },
        body: {
          en: "Your order creates a delivery package that can be reviewed before the agent is installed on a live website.",
          zh: "订单创建后会生成一套交付包，你可以在正式安装到网站前先检查和测试。",
        },
        items: [
          { en: "Hosted agent URL for review and testing", zh: "用于检查和测试的托管 Agent 链接" },
          { en: "Iframe/script website embed code", zh: "iframe/script 网站嵌入代码" },
          { en: "Customer configuration page", zh: "客户配置页面" },
          { en: "Lead collection dashboard", zh: "线索收集后台" },
          { en: "Setup guide and launch checklist", zh: "安装指南和上线检查清单" },
          { en: "Basic support instructions and optional setup service", zh: "基础支持说明和可选安装服务" },
        ],
      },
      {
        title: { en: "How to install on your website", zh: "如何安装到你的网站" },
        body: {
          en: "Use the iframe for a simple embedded block, or use the script option when you want the floating chat bubble experience.",
          zh: "如果只需要简单嵌入区域，请使用 iframe；如果需要悬浮聊天气泡，请使用 script 版本。",
        },
        items: [
          { en: "Copy the iframe or script embed code from your customer dashboard.", zh: "从客户后台复制 iframe 或 script 嵌入代码。" },
          { en: "Paste the code before the closing body tag, or into your website builder embed/custom-code block.", zh: "把代码粘贴到 closing body tag 前，或粘贴到建站工具的嵌入/自定义代码区。" },
          { en: "Publish or preview the page and confirm the chat bubble or embed area appears.", zh: "发布或预览页面，确认聊天气泡或嵌入区域正常出现。" },
          { en: "Submit a test lead with a name, email, and service question.", zh: "提交一条包含姓名、邮箱和服务问题的测试线索。" },
          { en: "Return to the lead dashboard and confirm the test lead is visible.", zh: "回到线索后台，确认测试线索已经出现。" },
        ],
      },
      {
        title: { en: "How to configure business info", zh: "如何配置业务信息" },
        items: [
          { en: "Business name, welcome message, and company introduction", zh: "业务名称、欢迎语和公司介绍" },
          { en: "Services, packages, pricing ranges, and availability notes", zh: "服务项目、套餐、价格范围和可用性说明" },
          { en: "FAQ questions and approved answers", zh: "FAQ 问题和已确认答案" },
          { en: "Contact information and preferred handoff rules", zh: "联系方式和人工转接规则" },
          { en: "Disallowed claims, sensitive topics, and promises the agent must avoid", zh: "禁止承诺、敏感话题和 Agent 不应表达的内容" },
        ],
      },
      {
        title: { en: "How to test", zh: "如何测试" },
        items: [
          { en: "Ask common service and company questions.", zh: "询问常见服务和公司问题。" },
          { en: "Ask pricing and package questions to confirm careful wording.", zh: "询问价格和套餐问题，确认回答足够谨慎。" },
          { en: "Submit a lead and check the lead dashboard.", zh: "提交一条线索并检查线索后台。" },
          { en: "Ask for human support and confirm the handoff message appears.", zh: "请求人工支持，确认转接提示正常出现。" },
          { en: "Review both the customer dashboard and admin order detail before launch.", zh: "上线前同时检查客户后台和管理员订单详情。" },
        ],
      },
      {
        title: { en: "What the agent can do", zh: "Agent 可以做什么" },
        items: [
          { en: "Answer approved website FAQ and service questions.", zh: "回答已确认的网站 FAQ 和服务问题。" },
          { en: "Explain service ranges without guaranteeing outcomes.", zh: "说明服务范围，但不保证业务结果。" },
          { en: "Collect visitor contact details and qualify lead intent.", zh: "收集访客联系方式并初步判断线索意向。" },
          { en: "Support English and Chinese conversations from the same website widget.", zh: "在同一个网站组件中支持中英文对话。" },
        ],
      },
      {
        title: { en: "What the agent cannot do", zh: "Agent 不能做什么" },
        items: [
          { en: "It does not access CRM, calendars, payment systems, or private APIs unless upgraded.", zh: "除非升级定制版，否则不会访问 CRM、日历、支付系统或私有 API。" },
          { en: "It cannot guarantee lead volume, conversion rate, revenue, or business results.", zh: "不能保证线索数量、转化率、收入或其他业务结果。" },
          { en: "It must not provide unsupported legal, medical, financial, or regulated advice.", zh: "不能提供未支持的法律、医疗、金融或受监管建议。" },
          { en: "It does not include custom workflow logic unless you order a Custom Version.", zh: "除非购买 Custom Version，否则不包含定制工作流逻辑。" },
        ],
      },
      {
        title: { en: "When to upgrade to Custom Version", zh: "什么时候升级到定制版" },
        items: [
          { en: "You need CRM lead sync, calendar booking, email routing, or team notifications.", zh: "你需要 CRM 线索同步、日历预约、邮件分发或团队通知。" },
          { en: "You want the agent to answer from internal docs or approved private knowledge.", zh: "你希望 Agent 基于内部文档或已授权私有知识回答。" },
          { en: "You need API integration, multi-step workflows, approvals, or custom business logic.", zh: "你需要 API 集成、多步骤工作流、审批或定制业务逻辑。" },
        ],
      },
      {
        title: { en: "How to request setup support", zh: "如何请求安装支持" },
        items: [
          { en: "Open the customer dashboard and use the setup/custom help CTA.", zh: "打开客户后台，点击安装/定制帮助入口。" },
          { en: "Send your website platform, target page, and preferred launch time.", zh: "发送你的建站平台、目标页面和期望上线时间。" },
          { en: "Share access instructions only through an approved secure channel.", zh: "只通过已确认的安全渠道提供访问说明。" },
        ],
      },
    ],
    supportHref: "/custom-service#custom-request-form",
  },
  ecommerce: {
    accent: "from-fuchsia-700 via-rose-600 to-amber-500",
    agentName: {
      en: "E-commerce Product Support Agent",
      zh: "电商产品客服 Agent",
    },
    agentSlug: "ecommerce-product-support-agent",
    description: {
      en: "Use this guide after purchase to install the product support agent, configure store policies and product information, test customer questions, and decide when a custom store integration is needed.",
      zh: "购买后请使用这份指南安装电商产品客服 Agent、配置店铺政策和商品信息、测试买家问题，并判断何时需要定制店铺集成。",
    },
    docsEyebrow: {
      en: "E-commerce agent delivery",
      zh: "电商 Agent 交付",
    },
    installLabel: {
      en: "Store install flow",
      zh: "店铺安装流程",
    },
    sections: [
      {
        title: { en: "What you receive", zh: "你会收到什么" },
        body: {
          en: "Your order creates a delivery package for installing the product support agent on a store, product page, help center, or landing page.",
          zh: "订单创建后会生成一套交付包，可用于把产品客服 Agent 安装到店铺、商品页、帮助中心或落地页。",
        },
        items: [
          { en: "Hosted agent URL for review and product-policy testing", zh: "用于检查商品和政策回答的托管 Agent 链接" },
          { en: "Iframe/script embed code for store pages", zh: "适用于店铺页面的 iframe/script 嵌入代码" },
          { en: "Customer configuration page", zh: "客户配置页面" },
          { en: "Lead and request collection dashboard", zh: "线索和请求收集后台" },
          { en: "Setup guide and store testing checklist", zh: "安装指南和店铺测试清单" },
          { en: "Basic support instructions and optional setup service", zh: "基础支持说明和可选安装服务" },
        ],
      },
      {
        title: { en: "How to install on your website", zh: "如何安装到你的网站" },
        body: {
          en: "Install it on product pages, store help pages, or a custom code area provided by your store platform.",
          zh: "你可以把它安装到商品页、店铺帮助页，或店铺平台提供的自定义代码区域。",
        },
        items: [
          { en: "Copy the iframe or script embed code from your customer dashboard.", zh: "从客户后台复制 iframe 或 script 嵌入代码。" },
          { en: "Paste the code before the closing body tag, or into your store builder embed/custom-code block.", zh: "把代码粘贴到 closing body tag 前，或粘贴到店铺工具的嵌入/自定义代码区。" },
          { en: "Preview the store page and confirm the chat bubble or embed area appears.", zh: "预览店铺页面，确认聊天气泡或嵌入区域正常出现。" },
          { en: "Submit a test product question or purchase-intent lead.", zh: "提交一条测试商品问题或购买意向线索。" },
          { en: "Return to the lead dashboard and confirm the test request is visible.", zh: "回到线索后台，确认测试请求已经出现。" },
        ],
      },
      {
        title: { en: "How to configure business info", zh: "如何配置业务信息" },
        items: [
          { en: "Store name, welcome message, and brand introduction", zh: "店铺名称、欢迎语和品牌介绍" },
          { en: "Products, categories, sizing notes, bundles, and availability guidance", zh: "商品、分类、尺码说明、组合套餐和可用性说明" },
          { en: "FAQ, shipping policy, returns/refunds, warranty, and contact rules", zh: "FAQ、物流政策、退换货、保修和联系方式规则" },
          { en: "Pricing ranges, discount limits, and when to hand off to a human", zh: "价格范围、折扣边界，以及何时转人工" },
          { en: "Disallowed claims such as medical claims, guaranteed delivery dates, or unapproved discounts", zh: "禁止表达的内容，例如医疗功效、保证送达日期或未批准折扣" },
        ],
      },
      {
        title: { en: "How to test", zh: "如何测试" },
        items: [
          { en: "Ask product, sizing, compatibility, shipping, and returns questions.", zh: "询问商品、尺码、兼容性、物流和退换货问题。" },
          { en: "Ask pricing and discount questions to confirm approved boundaries.", zh: "询问价格和折扣问题，确认回答不越过已批准边界。" },
          { en: "Submit a lead or product request and check the dashboard.", zh: "提交一条线索或商品咨询，并检查后台。" },
          { en: "Ask for human support, complaint handling, or exact order help.", zh: "请求人工支持、投诉处理或精确订单帮助。" },
          { en: "Review both the customer dashboard and admin order detail before launch.", zh: "上线前同时检查客户后台和管理员订单详情。" },
        ],
      },
      {
        title: { en: "What the agent can do", zh: "Agent 可以做什么" },
        items: [
          { en: "Answer approved product, shipping, returns, and store FAQ.", zh: "回答已确认的商品、物流、退换货和店铺 FAQ。" },
          { en: "Recommend product categories based on visitor needs when content is provided.", zh: "在提供内容后，根据访客需求推荐商品类别。" },
          { en: "Collect contact details for purchase intent, bulk orders, or support follow-up.", zh: "为购买意向、批量订单或售后跟进收集联系方式。" },
          { en: "Support English and Chinese conversations from the same store widget.", zh: "在同一个店铺组件中支持中英文对话。" },
        ],
      },
      {
        title: { en: "What the agent cannot do", zh: "Agent 不能做什么" },
        items: [
          { en: "It does not perform real-time Shopify, order, inventory, payment, or shipping lookup unless integrated.", zh: "除非完成集成，否则不会实时查询 Shopify、订单、库存、支付或物流。" },
          { en: "It cannot guarantee sales, conversion lift, shipping outcomes, or customer satisfaction.", zh: "不能保证销量、转化提升、物流结果或客户满意度。" },
          { en: "It must not provide unsupported legal, medical, financial, or regulated advice.", zh: "不能提供未支持的法律、医疗、金融或受监管建议。" },
          { en: "It does not include custom workflow logic unless you order a Custom Version.", zh: "除非购买 Custom Version，否则不包含定制工作流逻辑。" },
        ],
      },
      {
        title: { en: "When to upgrade to Custom Version", zh: "什么时候升级到定制版" },
        items: [
          { en: "You need Shopify, order status, inventory, shipping, CRM, or email integration.", zh: "你需要 Shopify、订单状态、库存、物流、CRM 或邮件集成。" },
          { en: "You want custom product recommendation rules, bundled offers, or internal policy logic.", zh: "你需要定制商品推荐规则、组合优惠或内部政策逻辑。" },
          { en: "You need API integration, custom workflows, approval rules, or internal documents.", zh: "你需要 API 集成、定制工作流、审批规则或内部文档。" },
        ],
      },
      {
        title: { en: "How to request setup support", zh: "如何请求安装支持" },
        items: [
          { en: "Open the customer dashboard and use the setup/custom help CTA.", zh: "打开客户后台，点击安装/定制帮助入口。" },
          { en: "Send your store platform, target pages, product policy notes, and launch timing.", zh: "发送你的店铺平台、目标页面、商品政策说明和期望上线时间。" },
          { en: "Share access instructions only through an approved secure channel.", zh: "只通过已确认的安全渠道提供访问说明。" },
        ],
      },
    ],
    supportHref: "/custom-service#custom-request-form",
  },
};

export function AgentInstallDocPage({ type }: { type: "website" | "ecommerce" }) {
  const { language } = useTranslation();
  const content = docs[type];
  const labels = sharedLabels[language];

  return (
    <main className="app-container py-10">
      <section className={`overflow-hidden rounded-3xl bg-gradient-to-br ${content.accent} p-[1px] shadow-sm`}>
        <div className="rounded-3xl bg-white/95 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                {content.docsEyebrow[language]}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {labels.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold text-slate-800">
                {content.agentName[language]}
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {content.description[language]}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  href={content.supportHref}
                >
                  {labels.contactSupport}
                </Link>
                <Link
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                  href="/marketplace"
                >
                  {labels.backToMarketplace}
                </Link>
              </div>
            </div>
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">
                {labels.quickChecklist}
              </h2>
              <ol className="mt-4 grid gap-3">
                {labels.quickSteps.map((step, index) => (
                  <li
                    className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-slate-700"
                    key={step}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5">
        {content.sections.map((section, index) => (
          <article
            className="premium-card p-5 sm:p-6"
            data-testid={`install-doc-section-${index + 1}`}
            key={section.title.en}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {index === 1 ? content.installLabel[language] : labels.installGuide}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {section.title[language]}
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {content.agentName[language]}
              </span>
            </div>
            {section.body ? (
              <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">
                {section.body[language]}
              </p>
            ) : null}
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <li
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                  key={item.en}
                >
                  {item[language]}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
              {content.agentName[language]}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {language === "zh"
                ? "需要我们帮你安装或做更深集成？"
                : "Need us to install it or build deeper integration?"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              {language === "zh"
                ? "提交安装支持或定制需求时，请带上订单号、目标页面、业务资料和需要集成的系统。"
                : "When requesting support, include your order number, target pages, business content, and the systems you want connected."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-slate-100"
              href={content.supportHref}
            >
              {labels.contactSupport}
            </Link>
            <Link
              className="rounded-xl border border-white/30 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              href="/marketplace"
            >
              {labels.backToMarketplace}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
