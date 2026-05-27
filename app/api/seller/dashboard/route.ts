import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isMockSellerModeEnabled,
  requireRoleForConfiguredSupabase,
} from "@/lib/auth/server";
import {
  REVENUE_SHARE_RULES,
  type DeliveryType,
  type PricingType,
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
  agent_rights_confirmed?: boolean | null;
  category_slug?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  creator_revenue_rate?: number | string | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_settings?: unknown;
  delivery_type?: DeliveryType | string | null;
  demo_answers?: unknown;
  demo_questions?: unknown;
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: unknown;
  faq_zh?: unknown;
  features_en?: unknown;
  features_zh?: unknown;
  id: string;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  limitations_en?: string | null;
  limitations_zh?: string | null;
  order_count?: number;
  platform_commission_rate?: number | string | null;
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_plans?: unknown;
  pricing_type?: PricingType | string | null;
  review_feedback?: string | null;
  review_reason_code?: string | null;
  revenue_cny?: number;
  revenue_usd?: number;
  revenue_share_type?: RevenueShareType | string | null;
  sample_conversation?: string | null;
  seller_email?: string | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  slug: string;
  status: string;
  tags?: unknown;
  title_en: string;
  title_zh: string;
  updated_at: string;
  view_count?: number | string | null;
};

type SellerOrderRecord = {
  agent_id: string;
  agent_slug: string | null;
  amount?: number | string | null;
  amount_cny: number | string | null;
  amount_usd: number | string | null;
  created_at: string;
  currency: "USD" | "CNY";
  customer_email?: string | null;
  customer_name?: string | null;
  id: string;
  owner_type?: "platform" | "seller" | string | null;
  order_number: string;
  order_status: string;
  payout_status?: string | null;
  payment_status: string;
  platform_fee_amount?: number | string | null;
  plan_id?: string | null;
  plan_name: string;
  seller_email?: string | null;
  seller_id?: string | null;
  seller_name?: string | null;
  seller_revenue_amount?: number | string | null;
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

  const sellerAuthorization = await requireSellerCenterAccessForEmail(sellerEmail);

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

async function requireSellerCenterAccessForEmail(sellerEmail: string) {
  const authorization = await requireRoleForConfiguredSupabase(
    ["buyer", "seller", "admin"],
    {
      allowMock: isMockSellerModeEnabled(),
      mockRole: "seller",
    },
  );

  if (!authorization.ok) {
    return authorization;
  }

  if (
    !authorization.actor.isMock &&
    authorization.actor.role !== "admin" &&
    authorization.actor.email?.toLowerCase() !== sellerEmail
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Seller Center access is limited to your own email." },
        { status: 403 },
      ),
    };
  }

  return authorization;
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
          "id, display_name, team_name, email, website, expertise, offers_custom_services, payout_preference, support_contact, status, created_at, updated_at",
        )
        .eq("email", sellerEmail)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("seller_applications")
        .select(
          "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, seller_terms_agreed, originality_confirmed, status, admin_note, created_at, updated_at",
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
      "id, slug, status, title_en, title_zh, short_description_en, short_description_zh, description_en, description_zh, cover_image_url, pricing_type, price_usd, price_cny, pricing_plans, delivery_type, delivery_settings, category_id, tags, demo_questions, demo_answers, sample_conversation, features_en, features_zh, faq_en, faq_zh, setup_instructions_en, setup_instructions_zh, data_permissions_en, data_permissions_zh, limitations_en, limitations_zh, agent_rights_confirmed, revenue_share_type, creator_revenue_rate, platform_commission_rate, review_feedback, review_reason_code, is_featured, is_verified, purchase_count, install_count, created_at, updated_at, agent_categories(slug, name_en, name_zh), seller_profiles!inner(email)",
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
  const orders = profile?.id
    ? await supabase
        .from("orders")
        .select(
          "id, order_number, agent_id, agent_slug, owner_type, seller_id, seller_email, seller_name, plan_id, plan_name, amount, amount_usd, amount_cny, currency, platform_fee_amount, seller_revenue_amount, payout_status, payment_status, order_status, customer_name, customer_email, created_at",
        )
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100)
    : agentIds.length
      ? await supabase
          .from("orders")
          .select(
            "id, order_number, agent_id, agent_slug, owner_type, seller_id, seller_email, seller_name, plan_id, plan_name, amount, amount_usd, amount_cny, currency, platform_fee_amount, seller_revenue_amount, payout_status, payment_status, order_status, customer_name, customer_email, created_at",
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
  const agentsWithMetrics = attachAgentSalesMetrics(normalizedAgents, sales);

  return NextResponse.json({
    data: {
      agents: agentsWithMetrics,
      applications: applications ?? [],
      payouts: payouts.data,
      profile,
      revenueShareRules: REVENUE_SHARE_RULES,
      sales,
      seller_email: sellerEmail,
      totals: buildSellerTotals(agentsWithMetrics, sales, payouts.data),
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
    .filter((order) => isSellerOrderForDashboard(order, sellerEmail, profile?.id, agents))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const payouts = getMockSellerPayoutStore()
    .filter((payout) => payout.seller_email.toLowerCase() === sellerEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sales = buildSellerSales(orders, agents);
  const agentsWithMetrics = attachAgentSalesMetrics(agents, sales);

  return {
    agents: agentsWithMetrics,
    applications,
    payouts,
    profile,
    revenueShareRules: REVENUE_SHARE_RULES,
    sales,
    seller_email: sellerEmail,
    totals: buildSellerTotals(agentsWithMetrics, sales, payouts),
  };
}

function normalizeSellerAgent(agent: SellerDashboardAgent & Record<string, unknown>) {
  const category = firstRelation(
    agent.agent_categories as
      | { slug?: string | null }
      | Array<{ slug?: string | null }>
      | null
      | undefined,
  );

  return {
    ...agent,
    category_slug:
      agent.category_slug ??
      category?.slug ??
      (typeof agent.category_id === "string" ? agent.category_id : ""),
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
    view_count:
      toNullableNumber(agent.view_count) ??
      toNullableNumber(agent.install_count as number | string | null | undefined) ??
      0,
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
      agent_id: agent?.id ?? order.agent_id,
      agent_title_en: agent?.title_en ?? "Seller agent",
      agent_title_zh: agent?.title_zh ?? agent?.title_en ?? "Seller agent",
      amount,
      created_at: order.created_at,
      creator_revenue:
        toNullableNumber(order.seller_revenue_amount) ??
        (paid ? roundCurrency(amount * rule.creatorRate) : 0),
      currency: order.currency,
      customer_email: maskEmail(order.customer_email),
      customer_name: maskName(order.customer_name),
      order_number: order.order_number,
      order_status: order.order_status,
      paid,
      payout_status: order.payout_status ?? "pending",
      payment_status: order.payment_status,
      plan_name: order.plan_name,
      platform_commission:
        toNullableNumber(order.platform_fee_amount) ??
        (paid ? roundCurrency(amount * rule.platformRate) : 0),
      revenue_share_label_en: rule.labelEn,
      revenue_share_label_zh: rule.labelZh,
      revenue_share_type: revenueShareType,
    };
  });
}

function attachAgentSalesMetrics(
  agents: ReturnType<typeof normalizeSellerAgent>[],
  sales: ReturnType<typeof buildSellerSales>,
) {
  return agents.map((agent) => {
    const agentSales = sales.filter(
      (sale) => sale.agent_id === agent.id || sale.agent_slug === agent.slug,
    );

    return {
      ...agent,
      order_count: agentSales.length,
      revenue_cny: sumCurrency(agentSales, "creator_revenue", "CNY"),
      revenue_usd: sumCurrency(agentSales, "creator_revenue", "USD"),
    };
  });
}

function isSellerOrderForDashboard(
  order: SellerOrderRecord,
  sellerEmail: string,
  sellerId: string | undefined,
  agents: ReturnType<typeof normalizeSellerAgent>[],
) {
  if (order.owner_type === "platform") {
    return false;
  }

  if (sellerId && order.seller_id === sellerId) {
    return true;
  }

  if (order.seller_email?.toLowerCase() === sellerEmail) {
    return true;
  }

  return agents.some(
    (agent) => agent.id === order.agent_id || agent.slug === order.agent_slug,
  );
}

function buildSellerTotals(
  agents: ReturnType<typeof normalizeSellerAgent>[],
  sales: ReturnType<typeof buildSellerSales>,
  payouts: Array<{ amount?: number | string | null; currency?: string | null; status?: string | null }>,
) {
  const hasSales = sales.length > 0;

  return {
    approvedAgents: agents.filter((agent) => agent.status === "approved").length,
    creatorRevenueCny: sumCurrency(sales, "creator_revenue", "CNY"),
    creatorRevenueUsd: sumCurrency(sales, "creator_revenue", "USD"),
    eligiblePayoutCny: hasSales
      ? sumSalePayoutRevenue(sales, "CNY", "eligible")
      : sumPayouts(payouts, "CNY", "eligible"),
    eligiblePayoutUsd: hasSales
      ? sumSalePayoutRevenue(sales, "USD", "eligible")
      : sumPayouts(payouts, "USD", "eligible"),
    needsChangesAgents: agents.filter((agent) => agent.status === "needs_changes").length,
    paidSalesCny: sumCurrency(sales, "amount", "CNY", true),
    paidSalesUsd: sumCurrency(sales, "amount", "USD", true),
    paidPayoutCny: hasSales
      ? sumSalePayoutRevenue(sales, "CNY", "paid")
      : sumPayouts(payouts, "CNY", "paid"),
    paidPayoutUsd: hasSales
      ? sumSalePayoutRevenue(sales, "USD", "paid")
      : sumPayouts(payouts, "USD", "paid"),
    pendingPayoutCny: hasSales
      ? sumSalePayoutRevenue(sales, "CNY", "pending")
      : sumPayouts(payouts, "CNY", "pending"),
    pendingPayoutUsd: hasSales
      ? sumSalePayoutRevenue(sales, "USD", "pending")
      : sumPayouts(payouts, "USD", "pending"),
    platformCommissionCny: sumCurrency(sales, "platform_commission", "CNY"),
    platformCommissionUsd: sumCurrency(sales, "platform_commission", "USD"),
    publishedAgents: agents.filter((agent) =>
      ["approved", "published"].includes(agent.status),
    ).length,
    submittedAgents: agents.filter((agent) =>
      ["submitted", "in_review", "needs_changes"].includes(agent.status),
    ).length,
    totalSales: sales.length,
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
  const storedAmount = toNullableNumber(order.amount);

  if (storedAmount !== null) {
    return storedAmount;
  }

  return order.currency === "CNY"
    ? toNullableNumber(order.amount_cny) ?? 0
    : toNullableNumber(order.amount_usd) ?? 0;
}

function maskEmail(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const [name, domain] = value.trim().split("@");

  if (!domain) {
    return "***";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

function maskName(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length <= 2
    ? `${normalized[0] ?? ""}*`
    : `${normalized.slice(0, 1)}***`;
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

function sumSalePayoutRevenue(
  sales: ReturnType<typeof buildSellerSales>,
  currency: "USD" | "CNY",
  status: string,
) {
  return roundCurrency(
    sales
      .filter((sale) => sale.currency === currency && sale.payout_status === status)
      .reduce((total, sale) => total + sale.creator_revenue, 0),
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

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
