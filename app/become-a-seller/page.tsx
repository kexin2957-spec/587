"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { SellerApplicationForm } from "@/components/seller/seller-application-form";

const copy = {
  en: {
    applicationDescription:
      "Tell us who you are, what you build, how you want to sell, and whether you can support custom service work.",
    applicationEyebrow: "Seller application",
    applicationTitle: "Apply before public selling",
    applyCta: "Apply to become a seller",
    commission:
      "The platform takes a commission from paid marketplace and custom-service sales.",
    customServices:
      "Approved sellers can offer custom versions, setup help, and business-specific implementation.",
    description:
      "Creators can apply to upload AI agents, submit them for platform review, and sell approved listings publicly.",
    guard:
      "Unsafe agents, copied work, copyright-infringing assets, deceptive claims, and unlicensed resale are not allowed.",
    howItWorksDescription:
      "The seller path is designed around review, safety, ownership, and clear revenue expectations.",
    howItWorksTitle: "How selling works",
    publicSelling:
      "Approved agents can be listed in the public marketplace after admin review.",
    review:
      "Every seller and every seller-uploaded agent must pass platform review before public publishing.",
    reviewTitle: "Review first",
    stepApply: "Apply as a seller",
    stepApproved: "Get approved",
    stepUpload: "Upload an agent",
    stepReview: "Agent review",
    stepSell: "Sell publicly",
    title: "Sell AI agents on the marketplace",
    uploadAgentCta: "Seller Center",
    whatCreatorsSellDescription:
      "Start with reusable agents, then expand into custom services when a buyer needs a tailored version.",
    whatCreatorsSellTitle: "What creators can sell",
  },
  zh: {
    applicationDescription:
      "告诉我们你是谁、擅长做什么、准备销售什么类型的 Agent，以及是否可以承接定制服务。",
    applicationEyebrow: "创作者申请",
    applicationTitle: "公开售卖前需要先申请",
    applyCta: "申请成为创作者",
    commission: "平台会从付费市场销售和定制服务订单中收取佣金。",
    customServices:
      "通过审核的创作者可以提供定制版本、部署协助和企业专属实施服务。",
    description:
      "创作者可以申请上传 AI Agent，提交平台审核，并在通过后公开销售已批准的 Agent。",
    guard:
      "不允许上传不安全、侵权、抄袭、含误导性承诺，或没有销售授权的 Agent。",
    howItWorksDescription:
      "创作者流程围绕审核、安全、版权归属和清晰分成预期设计。",
    howItWorksTitle: "销售流程",
    publicSelling: "通过审核的 Agent 可以在公开市场展示和销售。",
    review: "每个创作者和每个上传的 Agent，都需要通过平台审核后才能公开发布。",
    reviewTitle: "先审核，再发布",
    stepApply: "提交创作者申请",
    stepApproved: "平台审核创作者",
    stepUpload: "上传 Agent",
    stepReview: "Agent 进入审核",
    stepSell: "公开销售",
    title: "在平台销售你的 AI Agent",
    uploadAgentCta: "进入创作者中心",
    whatCreatorsSellDescription:
      "可以先从可复用 Agent 开始，当买家需要定制版本时，再扩展到定制服务。",
    whatCreatorsSellTitle: "创作者可以销售什么",
  },
};

const sellableItems = {
  en: [
    "Prompt templates",
    "Workflow templates",
    "Hosted agents",
    "Website chatbots",
    "Custom business agents",
  ],
  zh: [
    "Prompt 模板",
    "工作流模板",
    "托管 Agent",
    "网站聊天 Agent",
    "企业定制 Agent",
  ],
};

const revenueItems = {
  en: [
    "Standard marketplace sales: 70% creator / 30% platform",
    "Creator referral sales: 85% creator / 15% platform",
    "Custom service orders: 80% provider / 20% platform",
  ],
  zh: [
    "标准市场销售：70% 创作者 / 30% 平台",
    "创作者推荐销售：85% 创作者 / 15% 平台",
    "定制服务订单：80% 服务方 / 20% 平台",
  ],
};

export default function BecomeSellerPage() {
  const { language } = useTranslation();
  const text = copy[language];
  const steps = [
    text.stepApply,
    text.stepApproved,
    text.stepUpload,
    text.stepReview,
    text.stepSell,
  ];

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/85">
        <div className="app-container grid gap-8 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Seller program
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {text.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {text.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="#seller-application-form" variant="primary">
                {text.applyCta}
              </CtaLink>
              <CtaLink href="/seller" variant="secondary">
                {text.uploadAgentCta}
              </CtaLink>
            </div>
          </div>
          <aside className="premium-card border-blue-200 bg-blue-50/90 p-5">
            <h2 className="text-lg font-semibold text-blue-950">
              {text.reviewTitle}
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-blue-900">
              <p>{text.review}</p>
              <p>{text.publicSelling}</p>
              <p>{text.commission}</p>
              <p>{text.customServices}</p>
              <p className="font-semibold">{text.guard}</p>
            </div>
          </aside>
        </div>
      </section>

      <main className="app-container py-14">
        <SectionHeading
          description={text.howItWorksDescription}
          title={text.howItWorksTitle}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <article className="soft-card p-5" key={step}>
              <p className="text-sm font-semibold text-blue-700">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-semibold text-slate-950">{step}</h3>
            </article>
          ))}
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            description={text.whatCreatorsSellDescription}
            title={text.whatCreatorsSellTitle}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {sellableItems[language].map((item) => (
              <SimpleCard key={item}>{item}</SimpleCard>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            description={text.commission}
            title={language === "zh" ? "佣金与分成" : "Commission and revenue share"}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {revenueItems[language].map((item) => (
              <article
                className="premium-card p-5 text-sm font-semibold leading-6 text-slate-800"
                key={item}
              >
                {item}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {text.applicationEyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {text.applicationTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {text.applicationDescription}
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
