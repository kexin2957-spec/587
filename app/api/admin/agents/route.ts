import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminAgentRecords,
  getAgentOverrideStore,
  getMockSellerAgentStore,
  type AdminAgentRecord,
} from "@/lib/server/marketplace-admin-store";
import {
  AGENT_STATUSES,
  PRICING_TYPES,
  type AgentStatus,
  type DeliveryType,
  type PricingType,
} from "@/lib/marketplace/constants";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { writeRequestAuditLog } from "@/lib/server/audit-log";

type AgentPatchPayload = {
  admin_note?: string;
  feedback?: string;
  id?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_type?: PricingType;
  short_description_en?: string;
  short_description_zh?: string;
  slug?: string;
  status?: AgentStatus;
  title_en?: string;
  title_zh?: string;
};

type SupabaseAgentRecord = {
  admin_note?: string | null;
  agent_categories?:
    | { slug?: string | null }
    | { slug?: string | null }[]
    | null;
  category_id?: string | null;
  created_at: string;
  delivery_type: DeliveryType;
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  owner_type: "platform" | "seller";
  price_cny: number | string | null;
  price_usd: number | string | null;
  pricing_type: PricingType;
  review_feedback?: string | null;
  seller_profiles?:
    | { email?: string | null }
    | { email?: string | null }[]
    | null;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  title_en: string;
  title_zh: string;
  updated_at: string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const supabaseResponse = await getSupabaseAdminAgents();

  if (supabaseResponse) {
    return supabaseResponse;
  }

  return NextResponse.json({
    data: getAdminAgentRecords(),
    mode: "mock",
    ok: true,
  });
}

export async function PATCH(request: Request) {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as AgentPatchPayload;
  const targetKey = payload.id || payload.slug;

  if (!targetKey) {
    return NextResponse.json({ error: "Agent id is required." }, { status: 400 });
  }

  if (payload.status && !AGENT_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (payload.pricing_type && !PRICING_TYPES.includes(payload.pricing_type)) {
    return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
  }

  const supabaseResponse = await patchSupabaseAdminAgent(targetKey, payload);

  if (supabaseResponse) {
    if (supabaseResponse.status < 400) {
      await writeAgentAuditLog(request, payload, targetKey);
    }

    return supabaseResponse;
  }

  const sellerAgent = getMockSellerAgentStore().find(
    (agent) => agent.id === targetKey || agent.slug === targetKey,
  );
  const now = new Date().toISOString();

  if (sellerAgent) {
    if (payload.status) {
      sellerAgent.status = payload.status;
    }

    if (typeof payload.is_featured === "boolean") {
      sellerAgent.is_featured = payload.is_featured;
    }

    if (typeof payload.is_verified === "boolean") {
      sellerAgent.is_verified = payload.is_verified;
    }

    if (typeof payload.feedback === "string") {
      sellerAgent.review_feedback = payload.feedback.trim() || null;
    }

    applyAgentContentUpdates(sellerAgent, payload);

    if (typeof payload.admin_note === "string") {
      sellerAgent.admin_note = payload.admin_note.trim() || null;
    }

    sellerAgent.updated_at = now;

    await writeAgentAuditLog(request, payload, sellerAgent.id);

    return NextResponse.json({
      data: sellerAgent,
      mode: "mock",
      ok: true,
    });
  }

  const platformAgent = getAdminAgentRecords().find(
    (agent) => agent.owner_type === "platform" && agent.slug === targetKey,
  );

  if (!platformAgent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const overrideStore = getAgentOverrideStore();
  const nextOverride = {
    ...(overrideStore[platformAgent.slug] ?? {}),
    updated_at: now,
  };

  if (payload.status) {
    nextOverride.status = payload.status;
  }

  if (typeof payload.is_featured === "boolean") {
    nextOverride.is_featured = payload.is_featured;
  }

  if (typeof payload.is_verified === "boolean") {
    nextOverride.is_verified = payload.is_verified;
  }

  if (typeof payload.feedback === "string") {
    nextOverride.review_feedback = payload.feedback.trim() || null;
  }

  if (typeof payload.admin_note === "string") {
    nextOverride.admin_note = payload.admin_note.trim() || null;
  }

  Object.assign(nextOverride, extractAgentContentUpdates(payload));

  overrideStore[platformAgent.slug] = nextOverride;

  await writeAgentAuditLog(request, payload, platformAgent.slug);

  return NextResponse.json({
    data: getAdminAgentRecords().find((agent) => agent.slug === platformAgent.slug),
    mode: "mock",
    ok: true,
  });
}

async function writeAgentAuditLog(
  request: Request,
  payload: AgentPatchPayload,
  resourceId: string,
) {
  await writeRequestAuditLog(request, {
    action: "agent.admin_update",
    metadata: {
      featured: payload.is_featured ?? null,
      status: payload.status ?? null,
      verified: payload.is_verified ?? null,
    },
    resourceId,
    resourceType: "marketplace_agent",
  });
}

async function getSupabaseAdminAgents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl && !serviceRoleKey) {
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase URL and service role key are required for admin agents." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("marketplace_agents")
    .select(
      "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, delivery_type, category_id, admin_note, review_feedback, created_at, updated_at, agent_categories(slug), seller_profiles(email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((record) =>
      normalizeSupabaseAdminAgent(record as SupabaseAgentRecord),
    ),
    mode: "supabase",
    ok: true,
  });
}

async function patchSupabaseAdminAgent(
  targetKey: string,
  payload: AgentPatchPayload,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl && !serviceRoleKey) {
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase URL and service role key are required for admin agents." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const lookupColumn = isUuid(targetKey) ? "id" : "slug";
  const { data: existingAgent, error: lookupError } = await supabase
    .from("marketplace_agents")
    .select("id")
    .eq(lookupColumn, targetKey)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existingAgent?.id) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const updates: {
    admin_note?: string | null;
    is_featured?: boolean;
    is_verified?: boolean;
    price_cny?: number | null;
    price_usd?: number | null;
    pricing_type?: PricingType;
    review_feedback?: string | null;
    short_description_en?: string;
    short_description_zh?: string;
    status?: AgentStatus;
    title_en?: string;
    title_zh?: string;
  } = {};

  if (payload.status) {
    updates.status = payload.status;
  }

  if (typeof payload.is_featured === "boolean") {
    updates.is_featured = payload.is_featured;
  }

  if (typeof payload.is_verified === "boolean") {
    updates.is_verified = payload.is_verified;
  }

  if (typeof payload.feedback === "string") {
    updates.review_feedback = payload.feedback.trim() || null;
  }

  if (typeof payload.admin_note === "string") {
    updates.admin_note = payload.admin_note.trim() || null;
  }

  Object.assign(updates, extractAgentContentUpdates(payload));

  const { data, error } = await supabase
    .from("marketplace_agents")
    .update(updates)
    .eq("id", existingAgent.id)
    .select(
      "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, delivery_type, category_id, admin_note, review_feedback, created_at, updated_at, agent_categories(slug), seller_profiles(email)",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: normalizeSupabaseAdminAgent(data as SupabaseAgentRecord),
    mode: "supabase",
    ok: true,
  });
}

function normalizeSupabaseAdminAgent(record: SupabaseAgentRecord): AdminAgentRecord {
  const category = firstRelation(record.agent_categories);
  const sellerProfile = firstRelation(record.seller_profiles);

  return {
    admin_note: record.admin_note ?? null,
    category_slug: category?.slug ?? record.category_id ?? "",
    created_at: record.created_at,
    delivery_type: record.delivery_type,
    id: record.id,
    is_featured: record.is_featured,
    is_verified: record.is_verified,
    owner_type: record.owner_type,
    price_cny: toNullableNumber(record.price_cny),
    price_usd: toNullableNumber(record.price_usd),
    pricing_type: record.pricing_type,
    review_feedback: record.review_feedback ?? null,
    seller_email: sellerProfile?.email ?? null,
    short_description_en: record.short_description_en,
    short_description_zh: record.short_description_zh,
    slug: record.slug,
    status: record.status,
    title_en: record.title_en,
    title_zh: record.title_zh,
    updated_at: record.updated_at,
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function extractAgentContentUpdates(payload: AgentPatchPayload) {
  const updates: {
    price_cny?: number | null;
    price_usd?: number | null;
    pricing_type?: PricingType;
    short_description_en?: string;
    short_description_zh?: string;
    title_en?: string;
    title_zh?: string;
  } = {};

  if (typeof payload.title_en === "string") {
    updates.title_en = payload.title_en.trim();
  }

  if (typeof payload.title_zh === "string") {
    updates.title_zh = payload.title_zh.trim();
  }

  if (typeof payload.short_description_en === "string") {
    updates.short_description_en = payload.short_description_en.trim();
  }

  if (typeof payload.short_description_zh === "string") {
    updates.short_description_zh = payload.short_description_zh.trim();
  }

  if (payload.pricing_type) {
    updates.pricing_type = payload.pricing_type;
  }

  if (typeof payload.price_usd === "number" || payload.price_usd === null) {
    updates.price_usd = payload.price_usd;
  }

  if (typeof payload.price_cny === "number" || payload.price_cny === null) {
    updates.price_cny = payload.price_cny;
  }

  return updates;
}

function applyAgentContentUpdates(
  agent: AdminAgentRecord,
  payload: AgentPatchPayload,
) {
  Object.assign(agent, extractAgentContentUpdates(payload));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
