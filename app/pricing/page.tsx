"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function PricingPage() {
  const { language, t } = useTranslation();
  const note =
    language === "zh"
      ? "当前发布版本使用商品页的三档方案和人工订单确认流程。请进入具体 Agent 商品页查看 Agent Only、Agent + Setup 和 Custom Version 价格。"
      : "The launch version uses the three plan tiers on each agent product page with manual order confirmation. Open an agent page to view Agent Only, Agent + Setup, and Custom Version pricing.";

  return (
    <PageShell
      eyebrow={t("nav.pricing")}
      title={t("pricingPage.title")}
      description={t("pricingPage.description")}
    >
      <div className="premium-card p-5">
        <p className="text-sm leading-6 text-slate-700">{note}</p>
      </div>
    </PageShell>
  );
}
