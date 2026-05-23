"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/layout/site-header";

const footerLinks = [
  { href: "/marketplace", labelKey: "nav.marketplace" },
  { href: "/custom-service", labelKey: "nav.customService" },
  { href: "/become-a-seller", labelKey: "nav.becomeSeller" },
];

const policyLinks = [
  { href: "/policies/refund-policy", labelKey: "policies.refundPolicy" },
  { href: "/policies/privacy-policy", labelKey: "policies.privacyPolicy" },
  { href: "/policies/terms", labelKey: "policies.terms" },
  { href: "/policies/seller-guidelines", labelKey: "policies.sellerGuidelines" },
  { href: "/policies/review-policy", labelKey: "policies.reviewPolicy" },
];

export function SiteFooter() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="border-t border-slate-200/80 bg-white/88 backdrop-blur">
      <div className="app-container grid gap-8 py-10 text-sm text-slate-600 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
              AI
            </span>
            <span className="font-semibold text-slate-950">{t("nav.brand")}</span>
          </Link>
          <p className="mt-4 leading-6">{t("footer.tagline")}</p>
          <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium leading-5 text-blue-900">
            {t("common.platformReviewed")} / {t("common.businessReady")} /{" "}
            {t("common.dataPrivacyNotice")}
          </p>
        </div>

        <nav className="grid content-start gap-2">
          <p className="mb-1 font-semibold text-slate-950">{t("nav.marketplace")}</p>
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-fit font-medium text-slate-600 hover:text-slate-950"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <span className="text-slate-500">{t("footer.contact")}</span>
        </nav>

        <div className="grid content-start gap-5 md:justify-self-end">
          <nav className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
            <p className="font-semibold text-slate-950 sm:col-span-2 md:col-span-1">
              {t("footer.policies")}
            </p>
            {policyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="w-fit font-medium text-slate-600 hover:text-slate-950"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher
            language={language}
            setLanguage={setLanguage}
            label={t("nav.language")}
            englishLabel={t("nav.english")}
            chineseLabel={t("nav.chinese")}
          />
        </div>
      </div>
    </footer>
  );
}
