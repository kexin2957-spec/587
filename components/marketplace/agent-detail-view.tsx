"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCard } from "@/components/marketplace/agent-card";
import { AgentRequestDialog } from "@/components/marketplace/agent-request-dialog";
import { Badge } from "@/components/marketplace/badge";
import {
  getAgentTrustBadgeTypes,
  TrustBadgeList,
} from "@/components/marketplace/trust-badges";
import { getAgentMetadata } from "@/lib/marketplace/agent-metadata";
import { getAgentDetailContent } from "@/lib/marketplace/agent-detail-content";
import type { PurchaseRequestType } from "@/lib/marketplace/constants";
import { demoAgents, demoCategories, type DemoAgent } from "@/lib/marketplace/demo-data";
import {
  formatPrice,
  formatSupportedLanguages,
  getDeliveryTypeExplanation,
  getLocalizedAgent,
  getLocalizedCategory,
  getLocalizedDeliveryType,
} from "@/lib/marketplace/localization";
import {
  getApprovedAgentReviews,
  getLocalizedReview,
  type AgentReview,
} from "@/lib/marketplace/reviews";

type AgentDetailViewProps = {
  agent: DemoAgent;
};

export function AgentDetailView({ agent }: AgentDetailViewProps) {
  const { language, t } = useTranslation();
  const [activeRequestType, setActiveRequestType] =
    useState<PurchaseRequestType | null>(null);
  const localizedAgent = getLocalizedAgent(agent, language);
  const metadata = getAgentMetadata(agent);
  const category = demoCategories.find((item) => item.slug === agent.categorySlug);
  const localizedCategory = category
    ? getLocalizedCategory(category, language)
    : null;
  const detailContent = getAgentDetailContent({ agent, category, language });
  const reviews = getApprovedAgentReviews(agent);
  const similarAgents = useMemo(() => getSimilarAgents(agent), [agent]);

  return (
    <div className="app-container py-8 sm:py-10">
      <section className="premium-card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {localizedCategory ? (
                <Badge tone="blue">{localizedCategory.name}</Badge>
              ) : null}
              {agent.isFeatured ? (
                <Badge tone="emerald">{t("common.featured")}</Badge>
              ) : null}
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {localizedAgent.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {localizedAgent.shortDescription}
            </p>
            <TrustBadgeList
              className="mt-5 flex flex-wrap gap-2"
              types={getAgentTrustBadgeTypes(agent)}
            />
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label={t("agentDetail.pricing")} value={formatPrice(agent, language)} />
              <InfoItem
                label={t("marketplace.rating")}
                value={`${metadata.rating.toFixed(1)} / 5 - ${metadata.reviewCount} ${t("marketplace.reviews")}`}
              />
              <InfoItem
                label={t("agentDetail.deliveryType")}
                value={getLocalizedDeliveryType(agent.deliveryType, language)}
              />
              <InfoItem
                label={t("marketplace.supportedLanguages")}
                value={formatSupportedLanguages(metadata.supportedLanguages, language)}
              />
              <InfoItem
                label={t("marketplace.creator")}
                value={
                  metadata.ownerType === "platform"
                    ? t("marketplace.platform")
                    : metadata.creatorName
                }
              />
            </dl>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-inner shadow-white lg:sticky lg:top-24">
            <p className="text-2xl font-semibold text-slate-950">
              {formatPrice(agent, language)}
            </p>
            <div className="mt-4 grid gap-2">
              <a
                href="#live-demo"
                className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
              >
                {t("agentDetail.tryDemo")}
              </a>
              <button
                data-testid="buy-agent-button"
                type="button"
                onClick={() => setActiveRequestType("buy_agent")}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
              >
                {t("agentDetail.buyAgent")}
              </button>
              <button
                data-testid="custom-version-button"
                type="button"
                onClick={() => setActiveRequestType("custom_version")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              >
                {t("agentDetail.requestCustomVersion")}
              </button>
              <button
                type="button"
                onClick={() => setActiveRequestType("setup_service")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              >
                {t("agentDetail.buySetupService")}
              </button>
            </div>
            <TrustBadgeList
              className="mt-5 flex flex-wrap gap-2"
              types={getAgentTrustBadgeTypes(agent)}
            />
          </aside>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <main className="grid gap-6">
          <DemoSection agent={agent} detailContent={detailContent} />
          <ContentSection title={t("agentDetail.whoFor")} items={detailContent.whoFor} />
          <ContentSection title={t("agentDetail.features")} items={localizedAgent.features} />
          <ContentSection
            title={t("agentDetail.exampleUseCases")}
            items={detailContent.useCases}
          />
          <SampleSection detailContent={detailContent} />
          <section className="premium-card p-5">
            <h2 className="text-xl font-semibold text-slate-950">
              {t("agentDetail.deliveryType")}
            </h2>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {getLocalizedDeliveryType(agent.deliveryType, language)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {getDeliveryTypeExplanation(agent.deliveryType, language)}
            </p>
          </section>
          <TextSection
            title={t("agentDetail.setupInstructions")}
            body={localizedAgent.setupInstructions}
          />
          <TextSection
            title={t("agentDetail.dataPermissionsNotice")}
            body={localizedAgent.dataPermissions}
          />
          <TextSection
            title={t("agentDetail.versionChangelog")}
            body={`${detailContent.version} - ${detailContent.changelog}`}
          />
          <FaqSection faq={localizedAgent.faq} title={t("agentDetail.faq")} />
          <ReviewsSection
            rating={metadata.rating}
            reviewCount={metadata.reviewCount}
            reviews={reviews}
          />
        </main>

        <aside className="grid h-fit gap-6">
          <section className="premium-card p-5">
            <h2 className="font-semibold text-slate-950">{t("agentDetail.trust")}</h2>
            <TrustBadgeList
              className="mt-4 flex flex-wrap gap-2"
              types={getAgentTrustBadgeTypes(agent)}
            />
          </section>
        </aside>
      </div>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {t("agentDetail.similarAgents")}
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {similarAgents.map((similarAgent) => (
            <AgentCard key={similarAgent.slug} agent={similarAgent} />
          ))}
        </div>
      </section>

      {activeRequestType ? (
        <AgentRequestDialog
          agent={agent}
          requestType={activeRequestType}
          onClose={() => setActiveRequestType(null)}
        />
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function DemoSection({
  agent,
  detailContent,
}: {
  agent: DemoAgent;
  detailContent: ReturnType<typeof getAgentDetailContent>;
}) {
  const { t } = useTranslation();
  const questions =
    detailContent.demo.questions.zh.length > 0
      ? detailContent.demo.questions.zh
      : detailContent.demo.questions.en;
  const output = detailContent.demo.output.zh || detailContent.demo.output.en;

  return (
    <section
      id="live-demo"
      className="premium-card p-5"
    >
      <h2 className="text-xl font-semibold text-slate-950">
        {t("agentDetail.liveDemo")}
      </h2>
      {agent.demoEnabled ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              {t("agentDetail.sampleQuestions")}
            </h3>
            <div className="mt-3 grid gap-2">
              {questions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <h3 className="ml-2 text-sm font-semibold text-slate-950">
                {t("agentDetail.sampleOutput")}
              </h3>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 p-3 text-sm leading-6 text-slate-700">
                {questions[0]}
              </div>
              <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-sm bg-slate-950 p-4 text-sm leading-6 text-white">
                {output}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t("agentDetail.demoUnavailable")}
        </p>
      )}
    </section>
  );
}

function ContentSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SampleSection({
  detailContent,
}: {
  detailContent: ReturnType<typeof getAgentDetailContent>;
}) {
  const { t } = useTranslation();
  const questions =
    detailContent.demo.questions.zh.length > 0
      ? detailContent.demo.questions.zh
      : detailContent.demo.questions.en;
  const output = detailContent.demo.output.zh || detailContent.demo.output.en;

  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">
        {t("agentDetail.sampleQuestionsOutputs")}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {t("agentDetail.sampleQuestions")}
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            {questions.map((question) => (
              <li key={question} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {question}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {t("agentDetail.sampleOutput")}
          </h3>
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {output}
          </p>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: AgentReview[];
}) {
  const { language, t } = useTranslation();

  return (
    <section
      className="premium-card p-5"
      data-testid="agent-reviews"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {t("agentDetail.reviewsTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("agentDetail.reviewsDescription")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">
          {rating.toFixed(1)} / 5 - {reviewCount} {t("marketplace.reviews")}
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-950">
                {review.reviewerName}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {review.rating} / 5 - {review.createdAt}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {getLocalizedReview(review, language)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </section>
  );
}

function FaqSection({
  title,
  faq,
}: {
  title: string;
  faq: Array<{ question: string; answer: string }>;
}) {
  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">
        {faq.map((item) => (
          <div key={item.question} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              {item.question}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getSimilarAgents(agent: DemoAgent) {
  const sameCategory = demoAgents.filter(
    (candidate) =>
      candidate.categorySlug === agent.categorySlug && candidate.slug !== agent.slug,
  );
  const fallbackAgents = demoAgents.filter((candidate) => candidate.slug !== agent.slug);

  return [...sameCategory, ...fallbackAgents].slice(0, 4);
}
