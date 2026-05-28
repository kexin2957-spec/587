"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCard } from "@/components/marketplace/agent-card";
import {
  coreTrustBadges,
  TrustBadgeList,
} from "@/components/marketplace/trust-badges";
import {
  demoAgents,
  demoCategories,
  launchAgentSlugs,
} from "@/lib/marketplace/demo-data";
import {
  formatPrice,
  getLocalizedAgent,
  getLocalizedCategory,
} from "@/lib/marketplace/localization";

const howItWorksKeys = [
  "home.buyerStep1",
  "home.buyerStep2",
  "home.buyerStep3",
  "home.buyerStep4",
];

const faqItems = [
  ["faq.whatBuyingQuestion", "faq.whatBuyingAnswer"],
  ["faq.tryBeforeBuyingQuestion", "faq.tryBeforeBuyingAnswer"],
  ["faq.customizeQuestion", "faq.customizeAnswer"],
  ["faq.creatorUploadQuestion", "faq.creatorUploadAnswer"],
  ["faq.reviewQuestion", "faq.reviewAnswer"],
  ["faq.bilingualQuestion", "faq.bilingualAnswer"],
] as const;

export default function Home() {
  const { language, t } = useTranslation();
  const launchAgents = launchAgentSlugs
    .map((slug) => demoAgents.find((agent) => agent.slug === slug))
    .filter((agent): agent is (typeof demoAgents)[number] => Boolean(agent));
  const launchCategorySlugs = new Set(
    launchAgents.map((agent) => agent.categorySlug),
  );
  const heroCopy =
    language === "zh"
      ? {
          description:
            "无需从零开发，即可拥有网站客服、销售获客、电商客服、新媒体账号体检和定制 AI 工作流。",
          launchDescription:
            "先从已经标准化的三个业务 Agent 开始：网站销售获客、电商商品咨询，以及新媒体账号体检。",
          launchTitle: "三个可立即上线的 Agent",
          requestCustomAgent: "定制 AI Agent",
          title: "购买现成 AI Agent，快速上线你的业务 AI 员工。",
        }
      : {
          description:
            "Launch website chatbots, lead capture agents, social media account diagnosis, and custom AI workflows without starting from scratch.",
          launchDescription:
            "Start with three standardized launch products: website sales, e-commerce product support, and social media account diagnosis.",
          launchTitle: "Three launch-ready agents",
          requestCustomAgent: "Request Custom Agent",
          title: "Buy ready-made AI agents for your business.",
        };

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/88">
        <div className="app-container grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 shadow-sm">
              {t("home.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-full text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:max-w-4xl sm:text-5xl lg:text-6xl">
              {language === "zh" ? (
                <>
                  购买现成 AI Agent，
                  <br />
                  快速上线你的业务 AI 员工。
                </>
              ) : (
                heroCopy.title
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {heroCopy.description}
            </p>
            <div className="mt-8 flex">
              <CtaLink href="/custom-service" variant="primaryLarge">
                {heroCopy.requestCustomAgent}
              </CtaLink>
            </div>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
              <HeroSignal value={t("common.verified")} label={t("common.platformReviewed")} />
              <HeroSignal value={t("common.liveDemoAvailable")} label={t("common.businessReady")} />
              <HeroSignal value={t("common.websiteEmbed")} label={t("common.leadCapture")} />
            </div>
          </div>

          <MarketplacePreview
            agents={launchAgents}
            language={language}
            t={t}
          />
        </div>
      </section>

      <section id="featured-agents" className="app-container py-14">
        <SectionHeading
          title={heroCopy.launchTitle}
          description={heroCopy.launchDescription}
          action={
            <Link href="/marketplace" className="text-sm font-semibold text-blue-700">
              {t("home.viewAll")}
            </Link>
          }
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {launchAgents.map((agent) => (
            <AgentCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </section>

      <section id="categories" className="border-y border-slate-200/80 bg-white/74">
        <div className="app-container py-14">
          <SectionHeading
            title={t("home.categoriesTitle")}
            description={t("home.categoriesDescription")}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {demoCategories
              .filter((category) => launchCategorySlugs.has(category.slug))
              .map((category) => {
                const localizedCategory = getLocalizedCategory(category, language);

                return (
                  <Link
                    key={category.slug}
                    href={`/marketplace?category=${category.slug}`}
                    className="soft-card group p-5"
                  >
                    <h3 className="font-semibold text-slate-950 group-hover:text-blue-800">
                      {localizedCategory.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {localizedCategory.description}
                    </p>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <section className="app-container py-14">
        <SectionHeading
          title={t("home.howItWorksTitle")}
          description={t("home.howItWorksDescription")}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {howItWorksKeys.map((key, index) => (
            <article
              key={key}
              className="soft-card relative overflow-hidden p-5"
            >
              <p className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-800">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 font-semibold text-slate-950">{t(key)}</h3>
            </article>
          ))}
        </div>
      </section>

      <ConversionReadinessSection language={language} />

      <section className="border-y border-slate-200/80 bg-white/74">
        <div className="app-container grid gap-5 py-14 lg:grid-cols-2">
          <ConversionPanel
            title={t("home.customServiceTitle")}
            description={t("home.customServiceDescription")}
            href="/custom-service"
            label={t("home.requestCustomAgent")}
          />
          <ConversionPanel
            title={t("home.sellerTitle")}
            description={t("home.sellerDescription")}
            href="/become-a-seller"
            label={t("home.becomeSeller")}
          />
        </div>
      </section>

      <section className="app-container py-14">
        <SectionHeading
          title={t("home.trustTitle")}
          description={t("home.trustDescription")}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coreTrustBadges.map((type) => (
            <div
              key={type}
              className="soft-card p-5 text-sm font-semibold text-slate-800"
            >
              <TrustBadgeList types={[type]} />
            </div>
          ))}
        </div>
      </section>

      <section className="app-container pb-14">
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/15 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("home.bottomCtaTitle")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {t("home.bottomCtaDescription")}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <CtaLink href="/marketplace" variant="light">
              {t("home.exploreAgents")}
            </CtaLink>
            <CtaLink href="/custom-service" variant="darkSecondary">
              {t("home.requestCustomAgent")}
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-white/84">
        <div className="app-container py-14">
          <SectionHeading
            title={t("home.faqTitle")}
            description={t("home.faqDescription")}
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {faqItems.map(([questionKey, answerKey]) => (
              <article
                key={questionKey}
                className="soft-card p-5"
              >
                <h3 className="font-semibold text-slate-950">
                  {t(questionKey)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t(answerKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ConversionReadinessSection({ language }: { language: "en" | "zh" }) {
  const copy =
    language === "zh"
      ? {
          title: "不确定哪款 Agent 适合你的业务？",
          description:
            "先从现成 Agent 快速验证需求；如果需要更深集成、内部知识库或定制流程，再升级到 Custom Version。",
          cards: [
            {
              body: "告诉我们行业、网站、目标和预算，我们会建议从网站销售 Agent、电商 Agent，还是定制项目开始。",
              cta: "请求定制 AI Agent",
              href: "/custom-service",
              title: "Request a custom AI agent",
            },
            {
              body: "提交订单后会确认付款和联系方式，然后交付托管 Agent URL、嵌入代码、客户后台、安装文档和基础支持。",
              cta: "查看安装文档",
              href: "/docs/install-website-agent",
              title: "What happens after purchase",
            },
            {
              body: "托管 Agent 把核心逻辑、授权校验、配置、线索和用量记录放在服务端，比裸 prompt template 更适合真实网站上线。",
              cta: "浏览 Agent 商店",
              href: "/marketplace",
              title: "Why choose hosted agent instead of prompt template",
            },
            {
              body: "不想自己安装？选择 Agent + Setup 或提交支持请求，我们可以协助嵌入、配置 FAQ、测试线索流和检查上线状态。",
              cta: "Book setup support",
              href: "/custom-service#custom-request-form",
              title: "Book setup support",
            },
          ],
        }
      : {
          title: "Not sure which agent fits your business?",
          description:
            "Start with a ready-made agent to validate demand quickly, then upgrade to Custom Version when you need deeper integrations, private knowledge, or custom workflows.",
          cards: [
            {
              body: "Share your industry, website, goal, and budget. We will help you choose the Website Sales Agent, E-commerce Agent, or a custom project path.",
              cta: "Request Custom AI Agent",
              href: "/custom-service",
              title: "Request a custom AI agent",
            },
            {
              body: "After purchase we confirm payment and contact details, then deliver the hosted URL, embed code, customer dashboard, install docs, and basic support.",
              cta: "Read install docs",
              href: "/docs/install-website-agent",
              title: "What happens after purchase",
            },
            {
              body: "Hosted agents keep core logic, license checks, configuration, lead capture, and usage logs server-side, which is better for real website deployment than raw prompts.",
              cta: "Explore Agents",
              href: "/marketplace",
              title: "Why choose hosted agent instead of prompt template",
            },
            {
              body: "Need help installing? Choose Agent + Setup or submit a support request so we can help embed, configure FAQ, test leads, and check launch readiness.",
              cta: "Book setup support",
              href: "/custom-service#custom-request-form",
              title: "Book setup support",
            },
          ],
        };

  return (
    <section className="border-y border-slate-200/80 bg-white/76">
      <div className="app-container py-14">
        <SectionHeading title={copy.title} description={copy.description} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {copy.cards.map((card) => (
            <article className="soft-card p-5" key={card.title}>
              <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              <Link
                className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:border-blue-300 hover:bg-blue-50"
                href={card.href}
              >
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaLink({
  href,
  children,
  variant,
}: {
  href: string;
  children: ReactNode;
  variant: "darkSecondary" | "light" | "primary" | "primaryLarge" | "secondary";
}) {
  const variants = {
    darkSecondary:
      "rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/15",
    light:
      "rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100",
    primary:
      "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800",
    primaryLarge:
      "rounded-2xl bg-slate-950 px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:min-w-64",
    secondary:
      "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50",
  };

  return (
    <Link href={href} className={variants[variant]}>
      {children}
    </Link>
  );
}

function ConversionPanel({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <article className="premium-card p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
      >
        {label}
      </Link>
    </article>
  );
}

function HeroSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/86 p-4 shadow-sm">
      <p className="font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase text-slate-500">
        {label}
      </p>
    </div>
  );
}

function MarketplacePreview({
  agents,
  language,
  t,
}: {
  agents: typeof demoAgents;
  language: "en" | "zh";
  t: (key: string) => string;
}) {
  return (
    <div className="premium-card overflow-hidden p-4 sm:p-5">
      <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
              {t("nav.marketplace")}
            </p>
            <p className="mt-1 text-lg font-semibold">{t("marketplace.title")}</p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            {t("common.platformReviewed")}
          </span>
        </div>
        <div className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">
          {t("marketplace.searchPlaceholder")}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {agents.map((agent) => {
          const localizedAgent = getLocalizedAgent(agent, language);

          return (
            <Link
              key={agent.slug}
              href={`/agents/${agent.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {localizedAgent.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                    {localizedAgent.shortDescription}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {formatPrice(agent, language)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
