"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { AgentCard } from "@/components/marketplace/agent-card";
import { AgentCover } from "@/components/marketplace/agent-cover";
import { AgentOrderDialog } from "@/components/marketplace/agent-order-dialog";
import { AgentRequestDialog } from "@/components/marketplace/agent-request-dialog";
import { Badge } from "@/components/marketplace/badge";
import {
  getAgentTrustBadgeTypes,
  TrustBadgeList,
} from "@/components/marketplace/trust-badges";
import { WebsiteSupportAgentDemo } from "@/components/marketplace/website-support-agent-demo";
import { getAgentMetadata } from "@/lib/marketplace/agent-metadata";
import { getAgentDetailContent } from "@/lib/marketplace/agent-detail-content";
import {
  formatPlanAmount,
  getAgentOrderPlans,
  localizeOrderPlan,
  type AgentOrderPlan,
} from "@/lib/marketplace/order-plans";
import type { PurchaseRequestType } from "@/lib/marketplace/constants";
import {
  demoAgents,
  demoCategories,
  launchAgentSlugs,
  type DemoAgent,
} from "@/lib/marketplace/demo-data";
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
  const orderPlans = useMemo(() => getAgentOrderPlans(agent), [agent]);
  const [selectedPlanId, setSelectedPlanId] = useState(orderPlans[0]?.id);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const localizedAgent = getLocalizedAgent(agent, language);
  const metadata = getAgentMetadata(agent);
  const category = demoCategories.find((item) => item.slug === agent.categorySlug);
  const localizedCategory = category
    ? getLocalizedCategory(category, language)
    : null;
  const detailContent = getAgentDetailContent({ agent, category, language });
  const reviews = getApprovedAgentReviews(agent);
  const similarAgents = useMemo(() => getSimilarAgents(agent), [agent]);
  const selectedPlan =
    orderPlans.find((plan) => plan.id === selectedPlanId) ?? orderPlans[0];
  const orderCopy = getOrderCopy(language);

  return (
    <div className="app-container pb-24 pt-8 sm:pt-10 lg:pb-10">
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

          <aside
            id="buy"
            className="h-fit rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-inner shadow-white lg:sticky lg:top-24"
          >
            <AgentCover
              agent={agent}
              deliveryLabel={getLocalizedDeliveryType(agent.deliveryType, language)}
              title={localizedAgent.title}
            />
            <p className="mt-4 text-2xl font-semibold text-slate-950">
              {formatPrice(agent, language)}
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <h2 className="text-sm font-semibold text-slate-950">
                {orderCopy.choosePlan}
              </h2>
              <div className="mt-3 grid gap-2">
                {orderPlans.map((plan) => {
                  const localizedPlan = localizeOrderPlan(plan, language);
                  const isSelected = selectedPlan?.id === plan.id;

                  return (
                    <button
                      className={`rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60"
                      }`}
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-950">
                          {localizedPlan.name}
                        </span>
                        <span className="text-sm font-semibold text-blue-900">
                          {formatPlanAmount(plan, language)}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {localizedPlan.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <a
                href={getDemoHref(agent.slug)}
                className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
              >
                {getDemoLabel(agent.slug, t)}
              </a>
              <button
                data-testid="order-agent-button"
                type="button"
                onClick={() => setIsOrderDialogOpen(true)}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
              >
                {orderCopy.orderNow}
              </button>
              <button
                type="button"
                onClick={() => setActiveRequestType("custom_version")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              >
                {t("agentDetail.requestCustomVersion")}
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
          <ContentSection
            title={t("agentDetail.targetCustomers")}
            items={detailContent.targetCustomers}
          />
          <PlanComparisonSection
            onCustomVersion={() => setActiveRequestType("custom_version")}
            onOrder={() => setIsOrderDialogOpen(true)}
            onSelectPlan={setSelectedPlanId}
            plans={orderPlans}
            selectedPlanId={selectedPlan?.id}
          />
          {agent.slug === "website-customer-support-agent" ? <WebsiteSalesLaunchSections /> : null}
          {agent.slug === "ecommerce-product-support-agent" ? <EcommerceLaunchSections /> : null}
          <ContentSection title={t("agentDetail.features")} items={localizedAgent.features} />
          <ContentSection
            title={t("agentDetail.exampleUseCases")}
            items={detailContent.useCases}
          />
          <DemoSection agent={agent} detailContent={detailContent} />
          <SampleSection detailContent={detailContent} />
          <CustomerReceivesSection agent={agent} />
          <DeliveryProcessSection />
          <HostedVsPromptSection />
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
          <StandardLimitationsSection agent={agent} />
          <CustomVersionCallout
            onCustomVersion={() => setActiveRequestType("custom_version")}
          />
          <SetupSupportCallout onOrder={() => setIsOrderDialogOpen(true)} />
          {detailContent.customUpgradeOptions.length > 0 ? (
            <ContentSection
              title={t("agentDetail.customUpgradeOptions")}
              items={detailContent.customUpgradeOptions}
            />
          ) : null}
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
          <BottomCtaSection
            demoHref={getDemoHref(agent.slug)}
            localizedTitle={localizedAgent.title}
            onCustomVersion={() => setActiveRequestType("custom_version")}
            onOrder={() => setIsOrderDialogOpen(true)}
          />
        </main>

        <aside className="grid h-fit gap-6">
          {agent.ownerType === "seller" ? <SellerProfileSection agent={agent} /> : null}
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
      {isOrderDialogOpen && selectedPlan ? (
        <AgentOrderDialog
          agent={agent}
          plan={selectedPlan}
          onClose={() => setIsOrderDialogOpen(false)}
        />
      ) : null}
      <MobileStickyAgentCta
        demoHref={getDemoHref(agent.slug)}
        onCustomVersion={() => setActiveRequestType("custom_version")}
        onOrder={() => setIsOrderDialogOpen(true)}
      />
    </div>
  );
}

function getOrderCopy(language: "en" | "zh") {
  return language === "zh"
    ? {
        choosePlan: "选择购买方案",
        orderNow: "立即下单",
      }
      : {
          choosePlan: "Choose a plan",
          orderNow: "Buy Now",
      };
}

function getDemoHref(slug: string) {
  if (slug === "website-customer-support-agent") {
    return "/demo/website-customer-support-agent";
  }

  if (slug === "ecommerce-product-support-agent") {
    return "/embed/agents/ecommerce-product-support-agent";
  }

  return "#live-demo";
}

function getDemoLabel(
  slug: string,
  t: (key: "agentDetail.openProductDemo" | "agentDetail.tryDemo") => string,
) {
  return slug === "website-customer-support-agent" ||
    slug === "ecommerce-product-support-agent"
    ? t("agentDetail.openProductDemo")
    : t("agentDetail.tryDemo");
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

function PlanComparisonSection({
  onCustomVersion,
  onOrder,
  onSelectPlan,
  plans,
  selectedPlanId,
}: {
  onCustomVersion: () => void;
  onOrder: () => void;
  onSelectPlan: (planId: AgentOrderPlan["id"]) => void;
  plans: AgentOrderPlan[];
  selectedPlanId?: AgentOrderPlan["id"];
}) {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          bestFor: "适合",
          deliveryTime: "交付时间",
          included: "包含内容",
          limitations: "限制",
          title: "选择购买方案",
        }
      : {
          bestFor: "Best for",
          deliveryTime: "Delivery time",
          included: "Included",
          limitations: "Limitations",
          title: "Choose a purchase plan",
        };

  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const localizedPlan = localizeOrderPlan(plan, language);
          const isSelected = selectedPlanId === plan.id;
          const openPlan =
            plan.id === "custom_version"
              ? onCustomVersion
              : () => {
                  onSelectPlan(plan.id);
                  onOrder();
                };

          return (
            <article
              className={`flex h-full flex-col rounded-2xl border p-4 ${
                isSelected
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : "border-slate-200 bg-slate-50/80"
              }`}
              key={plan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {localizedPlan.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {localizedPlan.description}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold text-blue-900">
                  {formatPlanAmount(plan, language)}
                </p>
              </div>

              <PlanField label={copy.bestFor}>{localizedPlan.bestFor}</PlanField>
              <PlanField label={copy.deliveryTime}>
                {localizedPlan.deliveryTime}
              </PlanField>
              <PlanList label={copy.included} items={localizedPlan.includedItems} />
              <PlanList label={copy.limitations} items={localizedPlan.limitations} />

              <button
                className="mt-auto rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                onClick={openPlan}
                type="button"
              >
                {localizedPlan.cta}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PlanField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{children}</p>
    </div>
  );
}

function PlanList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
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

  if (agent.slug === "website-customer-support-agent") {
    return (
      <WebsiteSupportAgentDemo
        agent={agent}
        samples={detailContent.demoSamples}
      />
    );
  }

  if (agent.slug === "ecommerce-product-support-agent") {
    return <EcommerceAgentDemo agent={agent} samples={detailContent.demoSamples} />;
  }

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

function EcommerceAgentDemo({
  agent,
  samples,
}: {
  agent: DemoAgent;
  samples: ReturnType<typeof getAgentDetailContent>["demoSamples"];
}) {
  const { language, t } = useTranslation();
  const copy =
    language === "zh"
      ? {
          description:
            "这是可交付版本的嵌入式电商客服 widget 预览。它会回答商品问题、说明物流退换货政策、推荐商品，并在订单查询、批量采购或人工请求时收集线索。",
          note:
            "提示：未接入 Shopify/订单系统前，它不会声称能实时查订单或库存，而是收集信息并转交人工。",
          preview: "电商网站嵌入预览",
        }
      : {
          description:
            "This is the embeddable e-commerce support widget preview included in delivery. It answers product questions, explains shipping and returns, recommends products, and captures leads when shoppers ask about order tracking, bulk orders, or human help.",
          note:
            "Launch-safe behavior: without Shopify/order integration, it does not claim real-time order or inventory lookup. It collects details for human follow-up.",
          preview: "E-commerce website embed preview",
        };

  return (
    <section id="live-demo" className="premium-card p-5">
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {t("agentDetail.liveDemo")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {copy.description}
          </p>
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            {copy.note}
          </p>
          <div className="mt-4 grid gap-2">
            {samples.slice(0, 4).map((sample) => (
              <div
                key={sample.question}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-xs font-semibold text-slate-950">
                  {sample.question}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                  {sample.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/80 px-3 py-2">
            <span className="text-sm font-semibold text-slate-950">
              {copy.preview}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
              {agent.titleEn}
            </span>
          </div>
          <iframe
            className="h-[460px] w-full rounded-xl border border-slate-200 bg-white sm:h-[520px]"
            src="/embed/agents/ecommerce-product-support-agent"
            title="E-commerce Product Support Agent widget demo"
          />
        </div>
      </div>
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

function CustomerReceivesSection({ agent }: { agent: DemoAgent }) {
  const { language } = useTranslation();
  const sellerItems =
    language === "zh"
      ? agent.whatCustomerReceivesZh?.length
        ? agent.whatCustomerReceivesZh
        : agent.whatCustomerReceivesEn
      : agent.whatCustomerReceivesEn?.length
        ? agent.whatCustomerReceivesEn
        : agent.whatCustomerReceivesZh;
  const copy =
    language === "zh"
      ? {
          title: "购买后客户会收到什么",
          description:
            "这是每个可售 Agent 的标准交付清单。订单提交后，我们会先确认付款和必要业务信息，再准备对应交付内容。",
          items: [
            "托管 Agent URL，用于上线前测试和客户确认",
            "网站嵌入代码，可用于 iframe 或 script 安装",
            "客户配置入口，用于维护公司信息、FAQ、规则和基础内容",
            "线索收集后台，用于查看访客咨询和购买意向",
            "安装指南，包含嵌入、测试和上线检查步骤",
            "基础支持，用于处理安装和基础配置问题",
            "可选配置服务，用于由我们协助安装和整理内容",
          ],
        }
      : {
          title: "What the customer receives after purchase",
          description:
            "This is the standard delivery checklist for each sellable agent. After an order is submitted, we confirm payment and business details before preparing the matching deliverables.",
          items: [
            "Hosted agent URL for pre-launch testing and customer review",
            "Website embed code for iframe or script installation",
            "Customer configuration access for company info, FAQ, rules, and basic content",
            "Lead collection dashboard for visitor inquiries and purchase intent",
            "Installation guide with embed, testing, and launch-check steps",
            "Basic support for installation and standard configuration questions",
            "Optional setup service if the customer wants us to install and configure it",
          ],
        };
  const items = sellerItems?.length ? sellerItems : copy.items;

  return (
    <section className="premium-card p-5" id="delivery">
      <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeliveryProcessSection() {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          title: "标准交付流程",
          steps: [
            "客户提交订单并选择 Agent Only、Agent + Setup 或 Custom Version。",
            "我们确认联系方式、付款方式、业务网站和必要配置资料。",
            "Agent 根据所选方案准备：基础版本按标准内容交付，配置服务会整理 FAQ、语气和嵌入测试，定制版本先确认范围。",
            "托管 Agent URL、网站嵌入代码和安装说明在确认后交付。",
            "客户自行安装，或选择配置服务由我们协助安装。",
            "上线后访客线索可在后台查看，并用于后续销售或客服跟进。",
          ],
        }
      : {
          title: "Delivery process",
          steps: [
            "The customer submits an order and chooses Agent Only, Agent + Setup, or Custom Version.",
            "We confirm contact details, payment method, business website, and required setup materials.",
            "The agent is prepared based on the selected plan: standard delivery for Agent Only, FAQ/tone/embed testing for Setup, or scope review for Custom Version.",
            "The hosted agent URL, website embed code, and installation guide are delivered after confirmation.",
            "The customer installs the widget, or requests setup help if they chose the setup service.",
            "After launch, leads can be viewed in the dashboard and used for sales or support follow-up.",
          ],
        };

  return (
    <section className="premium-card p-5">
      <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
      <ol className="mt-4 grid gap-3">
        {copy.steps.map((step, index) => (
          <li
            className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700"
            key={step}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HostedVsPromptSection() {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          title: "为什么选择托管 Agent，而不是裸 prompt template",
          description:
            "真实业务上线需要授权、嵌入、配置、线索、用量和后续支持。托管 Agent 把这些交付能力打包好，同时把核心逻辑留在服务端。",
          items: [
            "核心 Agent 逻辑、私有规则和 license 校验保留在服务端，不交付裸 prompt 或内部工作流。",
            "客户拿到的是托管访问、网站嵌入代码、配置入口、线索后台和安装说明。",
            "可以限制授权域名，减少复制嵌入代码后在其他网站转售或滥用的风险。",
            "后续可以升级 CRM、Shopify、日历、内部文档、API 和自定义流程。",
          ],
        }
      : {
          title: "Why choose a hosted agent instead of a prompt template",
          description:
            "Real business deployment needs licensing, embedding, configuration, leads, usage visibility, and support. Hosted agents package those delivery pieces while keeping core logic server-side.",
          items: [
            "Core agent logic, sensitive runtime instructions, and license checks stay on the server instead of being shipped as raw templates.",
            "Customers receive hosted access, website embed code, configuration access, lead dashboard, and install docs.",
            "Authorized domains reduce the risk of copied embed code being reused or resold on other websites.",
            "The same hosted base can later upgrade into CRM, Shopify, calendar, internal docs, API, and custom workflows.",
          ],
        };

  return (
    <section className="premium-card border-slate-300 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {copy.items.map((item) => (
          <li
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StandardLimitationsSection({ agent }: { agent: DemoAgent }) {
  const { language } = useTranslation();
  const sellerItems =
    language === "zh"
      ? agent.limitationsZh?.length
        ? agent.limitationsZh
        : agent.limitationsEn
      : agent.limitationsEn?.length
        ? agent.limitationsEn
        : agent.limitationsZh;
  const items = sellerItems?.length
    ? sellerItems
    :
    language === "zh"
      ? [
          "除非升级并明确接入，否则不提供实时 CRM、订单、库存、支付或内部系统查询。",
          "不保证线索数量、转化率、销售额、客户满意度或其他业务结果。",
          "不提供不受支持的法律、医疗、金融、税务或其他受监管专业建议。",
          "不包含超出标准内容的定制工作流、API 集成、复杂权限或自动化审批。",
          agent.slug === "ecommerce-product-support-agent"
            ? "基础版本不会承诺实时库存、实时物流、退款审批或折扣审批。"
            : "基础版本不会替代正式报价、合同条款、销售承诺或人工客户经理判断。",
        ]
      : [
          "No real-time CRM, order, inventory, payment, or internal-system lookup unless upgraded and explicitly integrated.",
          "No guaranteed lead volume, conversion lift, sales revenue, customer satisfaction, or other business outcome.",
          "No unsupported legal, medical, financial, tax, or other regulated professional advice.",
          "No custom workflow, API integration, complex permissions, or automated approval flow outside the standard scope.",
          agent.slug === "ecommerce-product-support-agent"
            ? "The base version does not promise real-time inventory, shipping status, refund approval, or discount approval."
            : "The base version does not replace formal quotes, contract terms, sales commitments, or human account-manager judgment.",
        ];

  return (
    <ContentSection
      title={language === "zh" ? "限制和边界" : "Limitations and boundaries"}
      items={items}
    />
  );
}

function SetupSupportCallout({ onOrder }: { onOrder: () => void }) {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          button: "Book setup support",
          description:
            "选择 Agent + Setup 后，我们可以协助整理 FAQ、设置欢迎语和转人工规则、提供嵌入指导，并检查测试线索是否能进入后台。",
          title: "需要我们帮你安装和配置？",
        }
      : {
          button: "Book setup support",
          description:
            "Choose Agent + Setup when you want help preparing FAQ, welcome copy, handoff rules, embed guidance, and lead-flow testing before launch.",
          title: "Want help installing and configuring it?",
        };

  return (
    <section className="premium-card border-emerald-200 bg-emerald-50/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{copy.description}</p>
        </div>
        <button
          className="shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-950/20 hover:bg-emerald-600"
          onClick={onOrder}
          type="button"
        >
          {copy.button}
        </button>
      </div>
    </section>
  );
}

function CustomVersionCallout({
  onCustomVersion,
}: {
  onCustomVersion: () => void;
}) {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          button: "申请定制版本",
          description:
            "如果你需要更深集成、私有知识、复杂流程或行业特定规则，请走 Custom Version。我们会先确认范围，再报价和排期。",
          items: [
            "CRM、销售线索流转和邮件通知",
            "Shopify、订单、库存、支付或物流系统集成",
            "日历预约、内部文档、API 和自定义工作流",
            "复杂人工转接、权限、审核和多角色后台流程",
          ],
          kicker: "Need deeper integration?",
          title: "需要更深度集成？",
        }
      : {
          button: "Request Custom Version",
          description:
            "If you need deeper integrations, private knowledge, complex workflows, or industry-specific rules, use Custom Version. We review scope first, then quote price and timeline.",
          items: [
            "CRM, lead routing, and email notifications",
            "Shopify, order, inventory, payment, or shipping-system integration",
            "Calendar booking, internal docs, APIs, and custom workflows",
            "Advanced handoff, permissions, review, and multi-role admin flows",
          ],
          kicker: "Need deeper integration?",
          title: "Request a custom version",
        };

  return (
    <section className="premium-card border-blue-200 bg-blue-50/70 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        {copy.kicker}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {copy.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">{copy.description}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {copy.items.map((item) => (
          <li
            className="rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-sm text-slate-700"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
      <button
        className="mt-5 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
        onClick={onCustomVersion}
        type="button"
      >
        {copy.button}
      </button>
    </section>
  );
}

function SellerProfileSection({ agent }: { agent: DemoAgent }) {
  const { language, t } = useTranslation();
  const profile = agent.sellerProfile;
  const name = profile?.displayName || agent.creatorName || "Seller";
  const copy =
    language === "zh"
      ? {
          expertise: "专业领域",
          seller: "创作者",
          team: "团队",
          verified: "平台审核后发布",
          website: "网站",
        }
      : {
          expertise: "Expertise",
          seller: "Creator",
          team: "Team",
          verified: "Published after platform review",
          website: "Website",
        };

  return (
    <section className="premium-card p-5">
      <h2 className="font-semibold text-slate-950">{copy.seller}</h2>
      <p className="mt-2 text-lg font-semibold text-slate-950">{name}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{copy.verified}</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <InfoItem
          label={t("marketplace.creator")}
          value={name}
        />
        {profile?.teamName ? (
          <InfoItem label={copy.team} value={profile.teamName} />
        ) : null}
        {profile?.expertise ? (
          <InfoItem label={copy.expertise} value={profile.expertise} />
        ) : null}
        {profile?.website ? (
          <InfoItem label={copy.website} value={profile.website} />
        ) : null}
      </dl>
    </section>
  );
}

function MobileStickyAgentCta({
  demoHref,
  onCustomVersion,
  onOrder,
}: {
  demoHref: string;
  onCustomVersion: () => void;
  onOrder: () => void;
}) {
  const { language, t } = useTranslation();
  const buyNow = language === "zh" ? "立即购买" : "Buy Now";
  const customize = language === "zh" ? "定制" : "Customize";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl shadow-slate-950/15 backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 gap-2">
        <a
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-950 shadow-sm"
          href={demoHref}
        >
          {t("agentDetail.tryDemo")}
        </a>
        <button
          className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-sm"
          onClick={onOrder}
          type="button"
        >
          {buyNow}
        </button>
        <button
          className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm"
          onClick={onCustomVersion}
          type="button"
        >
          {customize}
        </button>
      </div>
    </div>
  );
}

function BottomCtaSection({
  demoHref,
  localizedTitle,
  onCustomVersion,
  onOrder,
}: {
  demoHref: string;
  localizedTitle: string;
  onCustomVersion: () => void;
  onOrder: () => void;
}) {
  const { language, t } = useTranslation();
  const copy =
    language === "zh"
      ? {
          title: "准备把这个 Agent 放到你的业务里？",
          description:
            "你可以先体验 Demo，再提交订单或定制需求。订单创建后，我们会联系你确认付款、配置和交付细节。",
          order: "立即下单",
        }
      : {
          title: "Ready to use this agent for your business?",
          description:
            "Try the demo first, then place an order or request a custom version. After the order is created, we will contact you to confirm payment, setup, and delivery details.",
          order: "Buy Now",
        };

  return (
    <section className="premium-card bg-slate-950 p-5 text-white">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-200">
            {localizedTitle}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            {copy.description}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <a
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/15"
            href={demoHref}
          >
            {t("agentDetail.tryDemo")}
          </a>
          <button
            className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
            onClick={onOrder}
            type="button"
          >
            {copy.order}
          </button>
          <button
            className="rounded-xl border border-white/20 bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400"
            onClick={onCustomVersion}
            type="button"
          >
            {t("agentDetail.requestCustomVersion")}
          </button>
        </div>
      </div>
    </section>
  );
}

function WebsiteSalesLaunchSections() {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          benefitsTitle: "核心收益",
          benefits: [
            "把匿名网站访客转化为带联系方式和需求背景的可跟进线索。",
            "在销售介入前先回答常见问题，减少重复沟通。",
            "通过意图识别和追问，把询价、预约、定制和客服问题分流。",
            "自动给线索标记 hot / warm / cold，方便优先跟进。",
          ],
          flowTitle: "线索捕获流程",
          flow: [
            "访客提出服务、价格、预约或定制相关问题。",
            "Agent 根据 FAQ、服务说明和价格范围回答，不编造承诺。",
            "Agent 追问服务类型、预算范围、网站、时间线和联系方式。",
            "系统保存线索、意图、评分、对话摘要和 transcript。",
            "后台可查看线索并更新状态：new / contacted / qualified / won / lost。",
          ],
          handoffTitle: "人工转接规则",
          handoff: [
            "访客要求人工、电话、合同、精确报价或定制方案时触发。",
            "访客投诉、表达不满或 Agent 不确定时触发。",
            "Agent 会收集姓名、邮箱、公司、网站和需求摘要，并标记 needs_human。",
          ],
          limitationsTitle: "它不会做什么",
          limitations: [
            "不会替代正式销售报价、合同条款或法律承诺。",
            "不会默认访问 CRM、支付、客户数据库或内部系统。",
            "不会回答未配置、未审核或高风险的私有信息。",
            "复杂集成需要 Custom Version。",
          ],
          docsTitle: "客户交付文档包含",
          docs: [
            "iframe 和 script 两种嵌入方式。",
            "客户配置后台：公司介绍、服务、FAQ、价格范围、联系方式和转接规则。",
            "测试问题清单和上线检查步骤。",
            "线索后台查看和跟进说明。",
          ],
        }
      : {
          benefitsTitle: "Key benefits",
          benefits: [
            "Turn anonymous website visitors into follow-up-ready leads with contact details and context.",
            "Answer common questions before sales gets involved, reducing repetitive conversations.",
            "Classify pricing, booking, custom project, support, and handoff requests automatically.",
            "Score leads as hot, warm, or cold so the team knows who to follow up first.",
          ],
          flowTitle: "Lead capture flow",
          flow: [
            "A visitor asks about services, pricing, booking, support, or custom work.",
            "The agent answers from approved FAQ, service notes, and pricing ranges without inventing promises.",
            "The agent asks follow-up questions about service interest, budget, website, timeline, and contact details.",
            "The system saves the lead, intent, score, conversation summary, and transcript.",
            "Admin can review leads and update status: new / contacted / qualified / won / lost.",
          ],
          handoffTitle: "Human handoff rules",
          handoff: [
            "Triggered when visitors ask for a human, call, contract, exact quote, or custom project.",
            "Triggered when visitors complain, express frustration, or the agent is unsure.",
            "The agent collects name, email, company, website, and inquiry summary, then marks needs_human.",
          ],
          limitationsTitle: "What it does not do",
          limitations: [
            "It does not replace formal sales quotes, contract terms, or legal commitments.",
            "It does not access CRM, payments, customer databases, or private systems by default.",
            "It does not answer unapproved, unconfigured, or high-risk private information.",
            "Advanced integrations require the Custom Version.",
          ],
          docsTitle: "Customer delivery documentation includes",
          docs: [
            "Both iframe and script embed options.",
            "Customer config dashboard for company intro, services, FAQ, pricing ranges, contact info, and handoff rules.",
            "Testing question checklist and launch QA steps.",
            "Lead dashboard review and follow-up workflow.",
          ],
        };

  return (
    <div className="grid gap-6">
      <ContentSection title={copy.benefitsTitle} items={copy.benefits} />
      <ContentSection title={copy.flowTitle} items={copy.flow} />
      <ContentSection title={copy.handoffTitle} items={copy.handoff} />
    </div>
  );
}

function EcommerceLaunchSections() {
  const { language } = useTranslation();
  const copy =
    language === "zh"
      ? {
          benefitsTitle: "核心收益",
          benefits: [
            "减少重复商品、物流、退货、尺码和规格咨询，让客服团队处理更高价值问题。",
            "在买家犹豫时主动追问需求、预算、使用场景和偏好，帮助推荐更合适的商品。",
            "识别购买意向、批量采购、折扣、订单查询和人工请求，把高价值机会保存到后台。",
            "同一个网站 widget 支持英文和中文买家，适合跨境店铺和独立站。",
          ],
          flowTitle: "购买意向收集流程",
          flow: [
            "买家询问商品推荐、物流、退换货、尺码、库存、折扣或订单问题。",
            "Agent 基于已配置商品 FAQ、政策说明和导购规则回答，不编造实时库存或订单状态。",
            "当买家表现出购买意向时，追问商品、数量、预算、时间、联系方式和特殊需求。",
            "系统保存买家姓名、邮箱、电话、公司、感兴趣商品、意图、评分、摘要和对话记录。",
            "后台可按 new / contacted / qualified / won / lost / invalid 跟进线索。",
          ],
          handoffTitle: "人工转接规则",
          handoff: [
            "买家要求真人、电话、精确折扣、批量报价、订单查询或合同条款时触发。",
            "买家投诉、对退货退款有争议、询问未配置的库存/订单实时信息时触发。",
            "Agent 会收集订单号、邮箱、商品、数量、问题摘要和联系方式，并标记为需要人工跟进。",
          ],
          limitationsTitle: "它不会做什么",
          limitations: [
            "默认不实时查询 Shopify、WooCommerce、订单系统、支付信息或库存。",
            "默认不承诺具体配送时效、退款结果、折扣审批或库存可用性。",
            "不会替代客服团队处理复杂投诉、争议、合同、支付或法律问题。",
            "实时订单/库存、CRM、邮件通知和高级推荐逻辑需要 Custom Version。",
          ],
          docsTitle: "客户交付文档包含",
          docs: [
            "iframe 和 script 两种网站嵌入方式。",
            "商品 FAQ、物流政策、退换货政策、联系方式、营业时间和人工转接规则配置说明。",
            "上线前测试问题清单：商品推荐、物流、退货、订单查询、人工转接和线索收集。",
            "后台查看线索、更新状态、记录备注和处理高意向买家的操作说明。",
          ],
        }
      : {
          benefitsTitle: "Key benefits",
          benefits: [
            "Reduce repetitive product, shipping, return, sizing, and specification questions so support can focus on higher-value cases.",
            "Ask shoppers about needs, budget, use case, and preferences when they are unsure, then recommend suitable products.",
            "Capture purchase intent, bulk-order requests, discount questions, order lookup needs, and human handoff requests in the backend.",
            "Support English and Chinese shoppers from the same website widget, useful for cross-border stores and independent brands.",
          ],
          flowTitle: "Purchase-intent capture flow",
          flow: [
            "A shopper asks about product recommendations, shipping, returns, sizing, inventory, discounts, or orders.",
            "The agent answers from configured product FAQ, policy notes, and shopping guidance without inventing real-time inventory or order status.",
            "When purchase intent appears, it asks about product, quantity, budget, timeline, contact details, and special requirements.",
            "The system saves buyer name, email, phone, company, product interest, intent, score, summary, and transcript.",
            "Admin can follow up by status: new / contacted / qualified / won / lost / invalid.",
          ],
          handoffTitle: "Human handoff rules",
          handoff: [
            "Triggered when shoppers ask for a human, call, exact discount, bulk quote, order tracking, or contract terms.",
            "Triggered for complaints, return/refund disputes, or unconfigured real-time order/inventory questions.",
            "The agent collects order number, email, product, quantity, issue summary, and contact details, then marks the lead for human follow-up.",
          ],
          limitationsTitle: "What it does not do",
          limitations: [
            "It does not access Shopify, WooCommerce, order systems, payment data, or inventory in real time by default.",
            "It does not promise exact shipping times, refund approval, discount approval, or inventory availability by default.",
            "It does not replace support teams for complex complaints, disputes, contracts, payments, or legal matters.",
            "Real-time order/inventory lookup, CRM, email notifications, and advanced recommendation logic require the Custom Version.",
          ],
          docsTitle: "Customer delivery documentation includes",
          docs: [
            "Both iframe and script website embed options.",
            "Configuration guide for product FAQ, shipping policy, return/refund policy, contact info, business hours, and handoff rules.",
            "Pre-launch testing checklist for recommendations, shipping, returns, order lookup, human handoff, and lead capture.",
            "Admin workflow for reviewing leads, updating status, adding notes, and following up with high-intent buyers.",
          ],
        };

  return (
    <div className="grid gap-6">
      <ContentSection title={copy.benefitsTitle} items={copy.benefits} />
      <ContentSection title={copy.flowTitle} items={copy.flow} />
      <ContentSection title={copy.handoffTitle} items={copy.handoff} />
    </div>
  );
}

function SampleSection({
  detailContent,
}: {
  detailContent: ReturnType<typeof getAgentDetailContent>;
}) {
  const { t } = useTranslation();
  if (detailContent.demoSamples.length > 0) {
    return (
      <section className="premium-card p-5">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("agentDetail.sampleQuestionsOutputs")}
        </h2>
        <div className="mt-4 grid gap-3">
          {detailContent.demoSamples.map((sample) => (
            <article
              key={sample.question}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-950">
                {sample.question}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {sample.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  }

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
  const launchAgents = demoAgents.filter((candidate) =>
    launchAgentSlugs.includes(candidate.slug as (typeof launchAgentSlugs)[number]),
  );
  const sameCategory = launchAgents.filter(
    (candidate) =>
      candidate.categorySlug === agent.categorySlug && candidate.slug !== agent.slug,
  );
  const fallbackAgents = launchAgents.filter((candidate) => candidate.slug !== agent.slug);

  return [...sameCategory, ...fallbackAgents].slice(0, 4);
}
