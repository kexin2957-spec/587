"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CustomRequestForm } from "@/components/custom-service/custom-request-form";
import { useTranslation } from "@/components/i18n/language-provider";

const useCaseKeys = [
  "customService.useCaseCustomerSupport",
  "customService.useCaseSalesLead",
  "customService.useCaseEcommerce",
  "customService.useCaseKnowledgeBase",
  "customService.useCaseBooking",
  "customService.useCaseAutomation",
];

const buildKeys = [
  "customService.buildWebsiteChatbot",
  "customService.buildKnowledgeAssistant",
  "customService.buildLeadQualification",
  "customService.buildOrderSupport",
  "customService.buildContentWorkflow",
  "customService.buildResearchMonitoring",
  "customService.buildApiIntegrated",
];

const processKeys = [
  "customService.processSubmit",
  "customService.processReview",
  "customService.processQuote",
  "customService.processBuild",
  "customService.processLaunch",
];

const pricingKeys = [
  {
    description: "customService.basicSetupDescription",
    label: "customService.basicSetup",
  },
  {
    description: "customService.businessAgentDescription",
    label: "customService.businessAgent",
  },
  {
    description: "customService.advancedIntegrationsDescription",
    label: "customService.advancedIntegrations",
  },
];

export default function CustomServicePage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/82">
        <div className="app-container grid gap-8 py-14 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {t("customService.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("customService.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t("customService.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="#custom-request-form" variant="primary">
                {t("customService.startCustomRequest")}
              </CtaLink>
              <CtaLink href="/marketplace" variant="secondary">
                {t("customService.exploreReadyAgents")}
              </CtaLink>
            </div>
          </div>
          <div className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {t("customService.heroCardTitle")}
            </h2>
            <div className="mt-5 grid gap-3">
              {processKeys.slice(0, 3).map((key, index) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  key={key}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-800">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="app-container py-14">
        <SectionHeading
          description={t("customService.useCasesDescription")}
          title={t("customService.useCasesTitle")}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCaseKeys.map((key) => (
            <SimpleCard key={key}>{t(key)}</SimpleCard>
          ))}
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            description={t("customService.whatBuildDescription")}
            title={t("customService.whatBuildTitle")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {buildKeys.map((key) => (
              <div
                className="soft-card p-4 text-sm font-semibold text-slate-800"
                key={key}
              >
                {t(key)}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            description={t("customService.processDescription")}
            title={t("customService.processTitle")}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {processKeys.map((key, index) => (
              <article
                className="soft-card p-5"
                key={key}
              >
                <p className="text-sm font-semibold text-blue-700">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-semibold text-slate-950">{t(key)}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            description={t("customService.pricingDescription")}
            title={t("customService.pricingTitle")}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pricingKeys.map((item) => (
              <article
                className="premium-card p-5"
                key={item.label}
              >
                <h3 className="text-lg font-semibold text-slate-950">
                  {t(item.label)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t(item.description)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {t("customService.formEyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {t("customService.formSectionTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {t("customService.formSectionDescription")}
            </p>
          </div>
          <CustomRequestForm />
        </section>
      </main>
    </div>
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
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function SimpleCard({ children }: { children: ReactNode }) {
  return (
    <article className="soft-card p-5 text-base font-semibold text-slate-950">
      {children}
    </article>
  );
}

function CtaLink({
  children,
  href,
  variant,
}: {
  children: ReactNode;
  href: string;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
      : "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50";

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
