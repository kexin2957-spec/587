"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCover } from "@/components/marketplace/agent-cover";
import { Badge } from "@/components/marketplace/badge";
import { getAgentMetadata } from "@/lib/marketplace/agent-metadata";
import { demoCategories, type DemoAgent } from "@/lib/marketplace/demo-data";
import { getAgentOrderPlans } from "@/lib/marketplace/order-plans";
import {
  formatPrice,
  formatSupportedLanguages,
  getLocalizedAgent,
  getLocalizedCategory,
  getLocalizedDeliveryType,
} from "@/lib/marketplace/localization";

type AgentCardProps = {
  agent: DemoAgent;
  variant?: "compact" | "marketplace";
};

export function AgentCard({ agent, variant = "compact" }: AgentCardProps) {
  const { language, t } = useTranslation();
  const localizedAgent = getLocalizedAgent(agent, language);
  const buyNowLabel = language === "zh" ? "立即购买" : "Buy Now";
  const priceFromLabel = language === "zh" ? "价格起" : "Price from";
  const isMediaDiagnosis = agent.slug === "media-account-diagnosis-agent";
  const metadata = getAgentMetadata(agent);
  const category = demoCategories.find((item) => item.slug === agent.categorySlug);
  const categoryLabel = category
    ? getLocalizedCategory(category, language).name
    : agent.categorySlug;
  const deliveryLabel = getLocalizedDeliveryType(agent.deliveryType, language);
  const supportedLanguageLabel = formatSupportedLanguages(
    metadata.supportedLanguages,
    language,
  );
  const creatorLabel =
    metadata.ownerType === "platform"
      ? t("marketplace.platform")
      : metadata.creatorName || t("marketplace.seller");
  const hasCustomVersion = getAgentOrderPlans(agent).some(
    (plan) => plan.id === "custom_version",
  );
  const demoHref =
    isMediaDiagnosis
      ? "/tools/media-account-diagnosis?sample=1"
      : agent.slug === "website-customer-support-agent"
      ? "/demo/website-customer-support-agent"
      : agent.slug === "ecommerce-product-support-agent"
        ? "/embed/agents/ecommerce-product-support-agent"
      : `/agents/${agent.slug}#live-demo`;

  return (
    <article
      data-testid="agent-card"
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/94 p-3 shadow-sm shadow-slate-950/[0.04] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-950/[0.08]"
    >
      <Link
        aria-label={localizedAgent.title}
        className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        href={`/agents/${agent.slug}`}
      >
        <AgentCover
          agent={agent}
          deliveryLabel={deliveryLabel}
          title={localizedAgent.title}
        />
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {categoryLabel}
        </p>

        <h2 className="text-lg font-semibold leading-snug text-slate-950">
          <Link href={`/agents/${agent.slug}`} className="hover:text-blue-800">
            {localizedAgent.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-600">
          {localizedAgent.shortDescription}
        </p>
        {isMediaDiagnosis ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {localizedAgent.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {isMediaDiagnosis ? (
            (agent.tags ?? ["账号诊断", "内容规划", "私域转化", "小红书/抖音"]).map(
              (tag, index) => (
                <Badge key={tag} tone={index === 0 ? "blue" : index === 1 ? "cyan" : "slate"}>
                  {tag}
                </Badge>
              ),
            )
          ) : (
            <>
              {agent.isVerified ? (
                <Badge tone="slate">{t("common.verified")}</Badge>
              ) : null}
              {agent.demoEnabled ? (
                <Badge tone="cyan">{t("agentDetail.liveDemo")}</Badge>
              ) : null}
              <Badge tone="amber">{t("common.businessReady")}</Badge>
            </>
          )}
        </div>

        <div className="mt-5 flex items-start justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {priceFromLabel}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {isMediaDiagnosis && language === "zh" ? "¥99 起" : formatPrice(agent, language)}
            </p>
            {hasCustomVersion ? (
              <p className="mt-1 text-xs font-semibold text-blue-700">
                {t("common.customVersionAvailable")}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t("marketplace.rating")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {metadata.rating.toFixed(1)} / 5
            </p>
            <p className="text-xs text-slate-500">
              {metadata.reviewCount} {t("marketplace.reviews")}
            </p>
          </div>
        </div>

        {variant === "marketplace" ? (
          <dl className="mt-4 grid gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt>{t("marketplace.deliveryType")}</dt>
              <dd className="text-right font-semibold text-slate-950">
                {deliveryLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>{t("marketplace.supportedLanguages")}</dt>
              <dd className="font-semibold text-slate-950">
                {supportedLanguageLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>{t("marketplace.creator")}</dt>
              <dd className="font-semibold text-slate-950">{creatorLabel}</dd>
            </div>
          </dl>
        ) : null}

        {isMediaDiagnosis ? (
          <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
            <Link
              href="/tools/media-account-diagnosis"
              className="rounded-xl bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              开始体检
            </Link>
            <Link
              href="/tools/media-account-diagnosis?sample=1"
              className="rounded-xl bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              查看示例
            </Link>
          </div>
        ) : (
          <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-3">
            {agent.demoEnabled ? (
              <a
                href={demoHref}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                {t("agentDetail.tryDemo")}
              </a>
            ) : null}
            <Link
              href={`/agents/${agent.slug}#buy`}
              className="rounded-xl bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {buyNowLabel}
            </Link>
            <Link
              href={`/agents/${agent.slug}`}
              className="rounded-xl bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              {t("common.viewDetails")}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
