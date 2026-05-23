"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

const adminSections = [
  {
    href: "/admin/agents",
    titleKey: "admin.agentReviews",
    descriptionKey: "admin.agentReviewsDescription",
  },
  {
    href: "/admin/seller-applications",
    titleKey: "admin.sellerApplications",
    descriptionKey: "admin.sellerApplicationsDescription",
  },
  {
    href: "/admin/custom-requests",
    titleKey: "admin.customRequests",
    descriptionKey: "admin.customRequestsDescription",
  },
  {
    href: "/admin/purchase-requests",
    titleKey: "admin.purchaseRequests",
    descriptionKey: "admin.purchaseRequestsDescription",
  },
];

type OverviewData = {
  approvedAgents: number;
  customRequests: number;
  featuredAgents: number;
  pendingReviews: number;
  purchaseRequests: number;
  sellerApplications: number;
  submittedAgents: number;
  totalAgents: number;
  verifiedAgents: number;
};

const overviewCards: Array<{ key: keyof OverviewData; labelKey: string }> = [
  { key: "totalAgents", labelKey: "admin.totalAgents" },
  { key: "approvedAgents", labelKey: "admin.approvedAgents" },
  { key: "submittedAgents", labelKey: "admin.submittedAgents" },
  { key: "sellerApplications", labelKey: "admin.sellerApplications" },
  { key: "customRequests", labelKey: "admin.customRequests" },
  { key: "purchaseRequests", labelKey: "admin.purchaseRequests" },
  { key: "pendingReviews", labelKey: "admin.pendingReviews" },
  { key: "featuredAgents", labelKey: "admin.featuredAgents" },
  { key: "verifiedAgents", labelKey: "admin.verifiedAgents" },
];

export default function AdminPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadOverview() {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { data?: OverviewData };

      if (isActive) {
        setOverview(result.data ?? null);
      }
    }

    void loadOverview();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.title")}
      description={t("admin.description")}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            className="premium-card p-5"
            key={card.key}
          >
            <p className="text-sm font-medium text-slate-500">
              {t(card.labelKey)}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {overview ? overview[card.key] : "..."}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="premium-card p-5 hover:-translate-y-0.5"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              {t(section.titleKey)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t(section.descriptionKey)}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
