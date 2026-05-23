"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { SellerApplicationForm } from "@/components/seller/seller-application-form";

const howItWorksKeys = [
  "seller.stepApply",
  "seller.stepUpload",
  "seller.stepReviewed",
  "seller.stepSelling",
  "seller.stepRevenue",
];

const sellableKeys = [
  "seller.sellPromptTemplates",
  "seller.sellWorkflowTemplates",
  "seller.sellHostedAgents",
  "seller.sellWebsiteChatbots",
  "seller.sellCustomBusinessAgents",
];

const revenueShareKeys = [
  "seller.revenueStandard",
  "seller.revenueReferral",
  "seller.revenueCustomService",
];

export default function BecomeSellerPage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/82">
        <div className="app-container grid gap-8 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {t("seller.eyebrow")}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("seller.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t("seller.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="#seller-application-form" variant="primary">
                {t("seller.applyCta")}
              </CtaLink>
              <CtaLink href="/seller/upload" variant="secondary">
                {t("seller.uploadAgentCta")}
              </CtaLink>
            </div>
          </div>
          <div className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {t("seller.reviewGuardTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {t("seller.reviewGuardDescription")}
            </p>
          </div>
        </div>
      </section>

      <main className="app-container py-14">
        <SectionHeading
          description={t("seller.howItWorksDescription")}
          title={t("seller.howItWorksTitle")}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {howItWorksKeys.map((key, index) => (
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

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            description={t("seller.whatCreatorsSellDescription")}
            title={t("seller.whatCreatorsSellTitle")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {sellableKeys.map((key) => (
              <SimpleCard key={key}>{t(key)}</SimpleCard>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            description={t("seller.revenueShareDescription")}
            title={t("seller.revenueShareTitle")}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {revenueShareKeys.map((key) => (
              <article
                className="premium-card p-5 text-sm font-semibold leading-6 text-slate-800"
                key={key}
              >
                {t(key)}
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            {t("seller.revenueFutureNote")}
          </p>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {t("seller.applicationEyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {t("seller.applicationTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {t("seller.applicationDescription")}
            </p>
          </div>
          <SellerApplicationForm />
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
