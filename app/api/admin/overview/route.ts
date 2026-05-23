import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminAgentRecords,
  getMockCustomRequestStore,
  getMockPurchaseRequestStore,
  getMockSellerApplicationStore,
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

  return NextResponse.json({
    data: {
      approvedAgents: agents.filter((agent) => agent.status === "approved").length,
      customRequests: getMockCustomRequestStore().length,
      featuredAgents: agents.filter((agent) => agent.is_featured).length,
      purchaseRequests: getMockPurchaseRequestStore().length,
      pendingReviews: getPendingReviewCount(),
      sellerApplications: getMockSellerApplicationStore().length,
      submittedAgents: agents.filter((agent) => agent.status === "submitted")
        .length,
      totalAgents: agents.length,
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

  const [
    totalAgents,
    approvedAgents,
    submittedAgents,
    featuredAgents,
    verifiedAgents,
    sellerApplications,
    customRequests,
    purchaseRequests,
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
    pendingReviews,
  ].find((result) => result.error);

  if (firstError?.error) {
    return NextResponse.json({ error: firstError.error }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      approvedAgents: approvedAgents.count,
      customRequests: customRequests.count,
      featuredAgents: featuredAgents.count,
      pendingReviews: pendingReviews.count,
      purchaseRequests: purchaseRequests.count,
      sellerApplications: sellerApplications.count,
      submittedAgents: submittedAgents.count,
      totalAgents: totalAgents.count,
      verifiedAgents: verifiedAgents.count,
    },
    mode: "supabase",
    ok: true,
  });
}
