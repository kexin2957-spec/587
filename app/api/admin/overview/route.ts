import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminAgentRecords,
  getMockAgentLicenseStore,
  getMockCustomRequestStore,
  getMockLeadStore,
  getMockOrderStore,
  getMockPurchaseRequestStore,
  getMockSellerApplicationStore,
  getMockUsageLogStore,
} from "@/lib/server/marketplace-admin-store";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { getPendingReviewCount } from "@/lib/marketplace/reviews";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const supabaseOverview = await getSupabaseOverview();

  if (supabaseOverview) {
    return supabaseOverview;
  }

  const agents = getAdminAgentRecords();
  const orders = getMockOrderStore();
  const leads = getMockLeadStore();
  const licenses = getMockAgentLicenseStore();
  const usageLogs = getMockUsageLogStore();
  const today = new Date().toISOString().slice(0, 10);

  return NextResponse.json({
    data: {
      approvedAgents: agents.filter((agent) => agent.status === "approved").length,
      customRequests: getMockCustomRequestStore().length,
      featuredAgents: agents.filter((agent) => agent.is_featured).length,
      activeLicenses: licenses.filter((license) => license.status === "active").length,
      blockedDomainEvents: usageLogs.filter((log) => log.event_type === "blocked_domain")
        .length,
      deliveredOrders: orders.filter(
        (order) =>
          order.delivery_status === "delivered" ||
          order.order_status === "delivered" ||
          order.order_status === "completed",
      ).length,
      hotLeads: leads.filter((lead) => lead.lead_score === "hot").length,
      leads: leads.length,
      leadsToday: leads.filter((lead) => lead.created_at.startsWith(today)).length,
      licenses: licenses.length,
      orders: orders.length,
      paidOrders: orders.filter(
        (order) =>
          order.payment_status === "paid" ||
          order.payment_status === "manually_approved",
      ).length,
      pendingPayments: orders.filter((order) => order.payment_status === "pending")
        .length,
      purchaseRequests: getMockPurchaseRequestStore().length,
      pendingReviews: getPendingReviewCount(),
      sellerApplications: getMockSellerApplicationStore().length,
      submittedAgents: agents.filter((agent) => agent.status === "submitted")
        .length,
      totalAgents: agents.length,
      totalOrders: orders.length,
      usageLogs: usageLogs.length,
      verifiedAgents: agents.filter((agent) => agent.is_verified).length,
    },
    mode: "mock",
    ok: true,
  });
}

async function getSupabaseOverview() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl && !serviceRoleKey) {
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase URL and service role key are required for admin overview." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  async function countRows(
    table: string,
    filters: Record<string, string | boolean> = {},
  ) {
    let query = supabase.from(table).select("id", { count: "exact", head: true });

    for (const [column, value] of Object.entries(filters)) {
      query = query.eq(column, value);
    }

    const { count, error } = await query;

    return {
      count: count ?? 0,
      error: error?.message ?? null,
    };
  }

  async function countRowsSince(
    table: string,
    column: string,
    value: string,
    filters: Record<string, string | boolean> = {},
  ) {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte(column, value);

    for (const [filterColumn, filterValue] of Object.entries(filters)) {
      query = query.eq(filterColumn, filterValue);
    }

    const { count, error } = await query;

    return {
      count: count ?? 0,
      error: error?.message ?? null,
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalAgents,
    approvedAgents,
    submittedAgents,
    featuredAgents,
    verifiedAgents,
    sellerApplications,
    customRequests,
    purchaseRequests,
    orders,
    pendingPayments,
    paidOrders,
    manuallyApprovedOrders,
    deliveredOrders,
    leads,
    leadsToday,
    hotLeads,
    licenses,
    activeLicenses,
    usageLogs,
    blockedDomainEvents,
    pendingReviews,
  ] = await Promise.all([
    countRows("marketplace_agents"),
    countRows("marketplace_agents", { status: "approved" }),
    countRows("marketplace_agents", { status: "submitted" }),
    countRows("marketplace_agents", { is_featured: true }),
    countRows("marketplace_agents", { is_verified: true }),
    countRows("seller_applications"),
    countRows("custom_requests"),
    countRows("purchase_requests"),
    countRows("orders"),
    countRows("orders", { payment_status: "pending" }),
    countRows("orders", { payment_status: "paid" }),
    countRows("orders", { payment_status: "manually_approved" }),
    countRows("orders", { delivery_status: "delivered" }),
    countRows("leads"),
    countRowsSince("leads", "created_at", todayStart.toISOString()),
    countRows("leads", { lead_score: "hot" }),
    countRows("agent_licenses"),
    countRows("agent_licenses", { status: "active" }),
    countRows("usage_logs"),
    countRows("usage_logs", { event_type: "blocked_domain" }),
    countRows("agent_reviews", { status: "pending" }),
  ]);

  const firstError = [
    totalAgents,
    approvedAgents,
    submittedAgents,
    featuredAgents,
    verifiedAgents,
    sellerApplications,
    customRequests,
    purchaseRequests,
    orders,
    pendingPayments,
    paidOrders,
    manuallyApprovedOrders,
    deliveredOrders,
    leads,
    leadsToday,
    hotLeads,
    licenses,
    activeLicenses,
    usageLogs,
    blockedDomainEvents,
    pendingReviews,
  ].find((result) => result.error);

  if (firstError?.error) {
    return NextResponse.json({ error: firstError.error }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      approvedAgents: approvedAgents.count,
      activeLicenses: activeLicenses.count,
      blockedDomainEvents: blockedDomainEvents.count,
      customRequests: customRequests.count,
      deliveredOrders: deliveredOrders.count,
      featuredAgents: featuredAgents.count,
      hotLeads: hotLeads.count,
      leads: leads.count,
      leadsToday: leadsToday.count,
      licenses: licenses.count,
      orders: orders.count,
      paidOrders: paidOrders.count + manuallyApprovedOrders.count,
      pendingReviews: pendingReviews.count,
      pendingPayments: pendingPayments.count,
      purchaseRequests: purchaseRequests.count,
      sellerApplications: sellerApplications.count,
      submittedAgents: submittedAgents.count,
      totalAgents: totalAgents.count,
      totalOrders: orders.count,
      usageLogs: usageLogs.count,
      verifiedAgents: verifiedAgents.count,
    },
    mode: "supabase",
    ok: true,
  });
}
