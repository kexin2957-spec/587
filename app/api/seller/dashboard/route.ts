import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSellerAccountForEmail } from "@/lib/auth/server";
import {
  REVENUE_SHARE_RULES,
  type RevenueShareType,
} from "@/lib/marketplace/constants";
import {
  getMockOrderStore,
  getMockSellerAgentStore,
  getMockSellerApplicationStore,
  getMockSellerPayoutStore,
  getMockSellerProfileStore,
} from "@/lib/server/marketplace-admin-store";

type SellerDashboardAgent = {
  created_at: string;
  creator_revenue_rate?: number | string | null;
  id: string;
  platform_commission_rate?: number | string | null;
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  revenue_share_type?: RevenueShareType | string | null;
  seller_email?: string | null;
  slug: string;
  status: string;
  title_en: string;
  title_zh: string;
  updated_at: string;
};

type SellerOrderRecord = {
  agent_id: string;
  agent_slug: string | null;
  amount_cny: number | string | null;
  amount_usd: number | string | null;
  created_at: string;
  currency: "USD" | "CNY";
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  plan_id?: string | null;
  plan_name: string;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sellerEmail = new URL(request.url).searchParams
    .get("seller_email")
    ?.trim()
    .toLowerCase();

  if (!sellerEmail || !/^\S+@\S+\.\S+$/.test(sellerEmail)) {
    return NextResponse.json(
      { error: "A valid seller_email query parameter is required." },
      { status: 400 },
    );
  }

  const sellerAuthorization = await requireSellerAccountForEmail(sellerEmail);

  if (!sellerAuthorization.ok) {
    return sellerAuthorization.response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return getSupabaseSellerDashboard(sellerEmail, supabaseUrl, serviceRoleKey);
  }

  if (supabaseUrl && !serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for seller dashboard data." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: getMockSellerDashboard(sellerEmail),
    mode: "mock",
    ok: true,
  });
}

async function getSupabaseSellerDashboard(
  sellerEmail: string,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const [{ data: profiles, error: profileError }, { data: applications, error: applicationError }] =
    await Promise.all([
      supabase
        .from("seller_profiles")
        .select(
          "id, display_name, team_name, email, website, expertise, offers_custom_services, payout_preference, status, created_at, updated_at",
        )
        .eq("email", sellerEmail)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("seller_applications")
        .select(
          "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, status, admin_note, created_at, updated_at",
        )
        .eq("email", sellerEmail)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (profileError || applicationError) {
    return NextResponse.json(
      { error: profileError?.message ?? applicationError?.message },
      { status: 500 },
    );
  }

  const profile = profiles?.[0] ?? null;
  const { data: agents, error: agentError } = await supabase
    .from("marketplace_agents")
    .select(
      "id, slug, status, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, revenue_share_type, creator_revenue_rate, platform_commission_rate, review_feedback, is_featured, is_verified, created_at, updated_at, seller_profiles!inner(email)",
    )
    .eq("owner_type", "seller")
    .eq("seller_profiles.email", sellerEmail)
    .order("created_at", { ascending: false })
    .limit(100);

  if (agentError) {
    return NextResponse.json({ error: agentError.message }, { status: 500 });
  }

  const normalizedAgents = (agents ?? []).map((agent) =>
    normalizeSellerAgent(agent as SellerDashboardAgent),
  );
  const agentIds = normalizedAgents.map((agent) => agent.id);
  const orders = agentIds.length
    ? await supabase
        .from("orders")
        .select(
          "id, order_number, agent_id, agent_slug, plan_id, plan_name, amount_usd, amount_cny, currency, payment_status, order_status, created_at",
        )
        .in("agent_id", agentIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };

  if (orders.error) {
    return NextResponse.json({ error: orders.error.message }, { status: 500 });
  }

  const payouts = profile?.id
    ? await supabase
        .from("seller_payouts")
        .select("id, seller_id, amount, currency, status, notes, created_at, updated_at")
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };

  if (payouts.error) {
    return NextResponse.json({ error: payouts.error.message }, { status: 500 });
  }

  const sales = buildSellerSales(
    (orders.data ?? []) as SellerOrderRecord[],
    normalizedAgents,
  );

  return NextResponse.json({
    data: {
      agents: normalizedAgents,
      applications: applications ?? [],
      payouts: payouts.data,
      profile,
      revenueShareRules: REVENUE_SHARE_RULES,
      sales,
      seller_email: sellerEmail,
      totals: buildSellerTotals(normalizedAgents, sales, payouts.data),
    },
    mode: "supabase",
    ok: true,
  });
}

function getMockSellerDashboard(sellerEmail: string) {
  const profile =
    getMockSellerProfileStore().find(
      (item) => item.email.toLowerCase() === sellerEmail,
    ) ?? null;
  const agents = getMockSellerAgentStore()
    .filter((agent) => agent.seller_email.toLowerCase() === sellerEmail)
    .map(normalizeSellerAgent)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const applications = getMockSellerApplicationStore()
    .filter((application) => application.email.toLowerCase() === sellerEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const orders = getMockOrderStore()
    .filter((order) =>
      agents.some(
        (agent) => agent.id === order.agent_id || agent.slug === order.agent_slug,
      ),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const payouts = getMockSellerPayoutStore()
    .filter((payout) => payout.seller_email.toLowerCase() === sellerEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sales = buildSellerSales(orders, agents);

  return {
    agents,
    applications,
    payouts,
    profile,
    revenueShareRules: REVENUE_SHARE_RULES,
    sales,
    seller_email: sellerEmail,
    totals: buildSellerTotals(agents, sales, payouts),
  };
}

function normalizeSellerAgent(agent: SellerDashboardAgent & Record<string, unknown>) {
  return {
    ...agent,
    creator_revenue_rate:
      toNullableNumber(agent.creator_revenue_rate) ??
      REVENUE_SHARE_RULES.third_party_standard.creatorRate,
    platform_commission_rate:
      toNullableNumber(agent.platform_commission_rate) ??
      REVENUE_SHARE_RULES.third_party_standard.platformRate,
    price_cny: toNullableNumber(agent.price_cny),
    price_usd: toNullableNumber(agent.price_usd),
    revenue_share_type:
      agent.revenue_share_type === "creator_referral" ||
      agent.revenue_share_type === "custom_service_order" ||
      agent.revenue_share_type === "platform_owned"
        ? agent.revenue_share_type
        : "third_party_standard",
  };
}

function buildSellerSales(
  orders: SellerOrderRecord[],
  agents: ReturnType<typeof normalizeSellerAgent>[],
) {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const agentsBySlug = new Map(agents.map((agent) => [agent.slug, agent]));

  return orders.map((order) => {
    const agent =
      agentsById.get(order.agent_id) ||
      (order.agent_slug ? agentsBySlug.get(order.agent_slug) : undefined);
    const revenueShareType = getRevenueShareType(order, agent?.revenue_share_type);
    const rule = REVENUE_SHARE_RULES[revenueShareType];
    const paid =
      order.payment_status === "paid" || order.payment_status === "manually_approved";
    const amount = getOrderAmount(order);

    return {
      agent_slug: agent?.slug ?? order.agent_slug,
      agent_title_en: agent?.title_en ?? "Seller agent",
      agent_title_zh: agent?.title_zh ?? agent?.title_en ?? "Seller agent",
      amount,
      created_at: order.created_at,
      creator_revenue: paid ? roundCurrency(amount * rule.creatorRate) : 0,
      currency: order.currency,
      order_number: order.order_number,
      order_status: order.order_status,
      paid,
      payment_status: order.payment_status,
      plan_name: order.plan_name,
      platform_commission: paid ? roundCurrency(amount * rule.platformRate) : 0,
      revenue_share_label_en: rule.labelEn,
      revenue_share_label_zh: rule.labelZh,
      revenue_share_type: revenueShareType,
    };
  });
}

function buildSellerTotals(
  agents: ReturnType<typeof normalizeSellerAgent>[],
  sales: ReturnType<typeof buildSellerSales>,
  payouts: Array<{ amount?: number | string | null; currency?: string | null; status?: string | null }>,
) {
  return {
    approvedAgents: agents.filter((agent) => agent.status === "approved").length,
    creatorRevenueCny: sumCurrency(sales, "creator_revenue", "CNY"),
    creatorRevenueUsd: sumCurrency(sales, "creator_revenue", "USD"),
    paidSalesCny: sumCurrency(sales, "amount", "CNY", true),
    paidSalesUsd: sumCurrency(sales, "amount", "USD", true),
    pendingPayoutCny: sumPayouts(payouts, "CNY", "pending"),
    pendingPayoutUsd: sumPayouts(payouts, "USD", "pending"),
    platformCommissionCny: sumCurrency(sales, "platform_commission", "CNY"),
    platformCommissionUsd: sumCurrency(sales, "platform_commission", "USD"),
    submittedAgents: agents.filter((agent) =>
      ["submitted", "in_review", "needs_changes"].includes(agent.status),
    ).length,
    totalAgents: agents.length,
  };
}

function getRevenueShareType(
  order: SellerOrderRecord,
  agentShareType: string | null | undefined,
): RevenueShareType {
  if (order.plan_id === "custom_version") {
    return "custom_service_order";
  }

  if (agentShareType === "creator_referral") {
    return "creator_referral";
  }

  return "third_party_standard";
}

function getOrderAmount(order: SellerOrderRecord) {
  return order.currency === "CNY"
    ? toNullableNumber(order.amount_cny) ?? 0
    : toNullableNumber(order.amount_usd) ?? 0;
}

function sumCurrency(
  sales: ReturnType<typeof buildSellerSales>,
  key: "amount" | "creator_revenue" | "platform_commission",
  currency: "USD" | "CNY",
  paidOnly = false,
) {
  return roundCurrency(
    sales
      .filter((sale) => sale.currency === currency && (!paidOnly || sale.paid))
      .reduce((total, sale) => total + sale[key], 0),
  );
}

function sumPayouts(
  payouts: Array<{ amount?: number | string | null; currency?: string | null; status?: string | null }>,
  currency: "USD" | "CNY",
  status: string,
) {
  return roundCurrency(
    payouts
      .filter((payout) => payout.currency === currency && payout.status === status)
      .reduce((total, payout) => total + (toNullableNumber(payout.amount) ?? 0), 0),
  );
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
