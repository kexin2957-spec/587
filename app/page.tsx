"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCard } from "@/components/marketplace/agent-card";
import {
  coreTrustBadges,
  TrustBadgeList,
} from "@/components/marketplace/trust-badges";
import { demoAgents, demoCategories } from "@/lib/marketplace/demo-data";
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
  const featuredAgents = [
    ...demoAgents.filter((agent) => agent.isFeatured),
    ...demoAgents.filter((agent) => !agent.isFeatured),
  ].slice(0, 6);

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/80">
        <div className="app-container grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 shadow-sm">
              {t("home.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t("home.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/marketplace" variant="primary">
                {t("home.exploreAgents")}
              </CtaLink>
              <CtaLink href="/custom-service" variant="secondary">
                {t("home.requestCustomAgent")}
              </CtaLink>
              <CtaLink href="/become-a-seller" variant="secondary">
                {t("home.becomeSeller")}
              </CtaLink>
            </div>
          </div>

          <MarketplacePreview
            agents={featuredAgents.slice(0, 3)}
            language={language}
            t={t}
          />
        </div>
      </section>

      <section id="featured-agents" className="app-container py-14">
        <SectionHeading
          title={t("home.featuredAgents")}
          description={t("home.featuredAgentsDescription")}
          action={
            <Link href="/marketplace" className="text-sm font-semibold text-blue-700">
              {t("home.viewAll")}
            </Link>
          }
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredAgents.map((agent) => (
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
            {demoCategories.map((category) => {
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

function CtaLink({
  href,
  children,
  variant,
}: {
  href: string;
  children: ReactNode;
  variant: "darkSecondary" | "light" | "primary" | "secondary";
}) {
  const variants = {
    darkSecondary:
      "rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/15",
    light:
      "rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100",
    primary:
      "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800",
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
