"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslation } from "@/components/i18n/language-provider";
import { SellerUploadForm } from "@/components/seller/seller-upload-form";

export default function SellerUploadPage() {
  const { isConfigured, isLoading, profile, user } = useAuth();
  const { t } = useTranslation();
  const accessNote = getSellerAccessNote({
    isConfigured,
    isLoading,
    role: profile?.role,
    userEmail: user?.email ?? null,
  });

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/82">
        <div className="app-container py-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {t("seller.uploadEyebrow")}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {t("seller.uploadTitle")}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {t("seller.uploadDescription")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/become-a-seller"
            >
              {t("seller.becomeSeller")}
            </Link>
            <Link
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/seller/agents"
            >
              {t("seller.viewReviewQueue")}
            </Link>
          </div>
        </div>
      </section>

      <main className="app-container grid gap-8 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <aside className="premium-card border-blue-200 bg-blue-50/92 p-5 text-sm leading-6 text-blue-900 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-blue-950">
            {t("seller.reviewRequiredTitle")}
          </h2>
          <p className="mt-3">{t("seller.reviewRequiredDescription")}</p>
          <p className="mt-3">{t(accessNote)}</p>
        </aside>
        <SellerUploadForm />
      </main>
    </div>
  );
}

function getSellerAccessNote({
  isConfigured,
  isLoading,
  role,
  userEmail,
}: {
  isConfigured: boolean;
  isLoading: boolean;
  role?: string;
  userEmail: string | null;
}) {
  if (!isConfigured) {
    return "seller.uploadAuthSetupNote";
  }

  if (isLoading) {
    return "seller.uploadAuthLoadingNote";
  }

  if (!userEmail) {
    return "seller.uploadGuestModeNote";
  }

  if (role === "seller" || role === "admin") {
    return "seller.uploadSellerModeNote";
  }

  return "seller.uploadBuyerModeNote";
}
