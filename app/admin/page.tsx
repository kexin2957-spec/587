"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

const adminSections = [
  {
    description: "View all orders, update payment/order/delivery status, generate licenses, and manage delivery packages.",
    href: "/admin/orders",
    title: "Orders",
  },
  {
    description: "Review lead submissions, transcripts, intent, score, status, and admin notes.",
    href: "/admin/leads",
    title: "Leads",
  },
  {
    description: "Activate, suspend, expire, and inspect licenses, allowed domains, and license usage.",
    href: "/admin/licenses",
    title: "Licenses",
  },
  {
    description: "Monitor widget loads, chats, leads, blocked domains, and license errors.",
    href: "/admin/usage",
    title: "Usage",
  },
  {
    description: "Edit customer business profiles, FAQ, knowledge documents, handoff rules, and widget settings.",
    href: "/admin/customer-configs",
    title: "Customer Configs",
  },
  {
    description: "Manage platform agents, public product content, pricing plans, featured status, and verified status.",
    href: "/admin/agents",
    title: "Agents",
  },
  {
    description: "Inspect server-side AI agent sessions, messages, detected intent, lead score, handoff, and source URL.",
    href: "/admin/agent-sessions",
    title: "Runtime Sessions",
  },
  {
    description: "Review custom AI Agent project requests, quotes, follow-ups, and status.",
    href: "/admin/custom-requests",
    title: "Custom Requests",
  },
  {
    description: "Review seller onboarding submissions, approval state, and early access workflow.",
    href: "/admin/seller-applications",
    title: "Seller Applications",
  },
  {
    description: "Legacy purchase requests inbox for earlier marketplace flows.",
    href: "/admin/purchase-requests",
    title: "Purchase Requests",
  },
];

type OverviewData = {
  activeLicenses: number;
  approvedAgents: number;
  blockedDomainEvents: number;
  customRequests: number;
  deliveredOrders: number;
  featuredAgents: number;
  hotLeads: number;
  leads: number;
  leadsToday: number;
  licenses: number;
  orders: number;
  paidOrders: number;
  pendingReviews: number;
  pendingPayments: number;
  purchaseRequests: number;
  sellerApplications: number;
  submittedAgents: number;
  totalAgents: number;
  totalOrders: number;
  usageLogs: number;
  verifiedAgents: number;
};

type OverviewResponse = {
  data?: OverviewData;
  mode?: "mock" | "supabase";
};

const overviewCards: Array<{ key: keyof OverviewData; label: string }> = [
  { key: "totalOrders", label: "Total orders" },
  { key: "pendingPayments", label: "Pending payments" },
  { key: "paidOrders", label: "Paid orders" },
  { key: "deliveredOrders", label: "Delivered orders" },
  { key: "activeLicenses", label: "Active licenses" },
  { key: "leadsToday", label: "Leads today" },
  { key: "hotLeads", label: "Hot leads" },
  { key: "customRequests", label: "Custom requests" },
  { key: "blockedDomainEvents", label: "Blocked domains" },
  { key: "totalAgents", label: "Total agents" },
  { key: "sellerApplications", label: "Seller applications" },
  { key: "usageLogs", label: "Usage logs" },
];

export default function AdminPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewMode, setOverviewMode] = useState<"mock" | "supabase" | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadOverview() {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as OverviewResponse;

      if (isActive) {
        setOverview(result.data ?? null);
        setOverviewMode(result.mode ?? null);
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
      {overviewMode === "mock" ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Development mock admin mode is active. Production launch should use Supabase Auth with an admin profile.
        </div>
      ) : null}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            className="premium-card p-5"
            key={card.key}
          >
            <p className="text-sm font-medium text-slate-500">
              {card.label}
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
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
