"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function PricingPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("nav.pricing")}
      title={t("pricingPage.title")}
      description={t("pricingPage.description")}
    >
      <div className="premium-card p-5">
        <p className="text-sm font-medium text-slate-700">
          {t("common.comingSoon")}
        </p>
      </div>
    </PageShell>
  );
}
