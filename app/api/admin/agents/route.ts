import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminAgentRecords,
  getAgentOverrideStore,
  getMockSellerAgentStore,
  type AdminAgentRecord,
} from "@/lib/server/marketplace-admin-store";
import { getAgentPublishWarnings } from "@/lib/marketplace/agent-quality";
import {
  AGENT_REVIEW_REASON_CODES,
  AGENT_STATUSES,
  PRICING_TYPES,
  SUPPORTED_LANGUAGES,
  type AgentReviewReasonCode,
  type AgentStatus,
  type DeliveryType,
  type PricingType,
  type SupportedLanguage,
} from "@/lib/marketplace/constants";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { writeRequestAuditLog } from "@/lib/server/audit-log";

type FaqItem = {
  answer: string;
  question: string;
};

type AgentPatchPayload = {
  admin_note?: string;
  feedback?: string;
  id?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_type?: PricingType;
  review_reason_code?: AgentReviewReasonCode | null;
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
  agent_rights_confirmed?: boolean | null;
  category_id?: string | null;
  content_safety_confirmed?: boolean | null;
  cover_image_url?: string | null;
  created_at: string;
  custom_upgrade_options_en?: string | null;
  custom_upgrade_options_zh?: string | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_settings?: unknown;
  delivery_type: DeliveryType;
  demo_answers?: unknown;
  demo_enabled?: boolean | null;
  demo_questions?: unknown;
  demo_url?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: unknown;
  faq_zh?: unknown;
  features_en?: unknown;
  features_zh?: unknown;
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  limitations_en?: string | null;
  limitations_zh?: string | null;
  owner_type: "platform" | "seller";
  price_cny: number | string | null;
  price_usd: number | string | null;
  pricing_plans?: unknown;
  pricing_type: PricingType;
  review_feedback?: string | null;
  review_policy_confirmed?: boolean | null;
  review_reason_code?: string | null;
  sample_conversation?: string | null;
  seller_profiles?:
    | { email?: string | null }
    | { email?: string | null }[]
    | null;
  sensitive_disclaimer_confirmed?: boolean | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  supported_languages?: unknown;
  suspension_policy_confirmed?: boolean | null;
  tags?: unknown;
  title_en: string;
  title_zh: string;
  updated_at: string;
  use_cases_en?: unknown;
  use_cases_zh?: unknown;
  video_url?: string | null;
  what_customer_receives_en?: string | null;
  what_customer_receives_zh?: string | null;
  who_it_is_for_en?: string | null;
  who_it_is_for_zh?: string | null;
};

const adminAgentSelect = [
  "id",
  "slug",
  "owner_type",
  "status",
  "is_featured",
  "is_verified",
  "title_en",
  "title_zh",
  "short_description_en",
  "short_description_zh",
  "description_en",
  "description_zh",
  "pricing_type",
  "price_usd",
  "price_cny",
  "delivery_type",
  "category_id",
  "tags",
  "supported_languages",
  "demo_url",
  "demo_enabled",
  "features_en",
  "features_zh",
  "faq_en",
  "faq_zh",
  "setup_instructions_en",
  "setup_instructions_zh",
  "data_permissions_en",
  "data_permissions_zh",
  "admin_note",
  "review_feedback",
  "review_reason_code",
  "cover_image_url",
  "who_it_is_for_en",
  "who_it_is_for_zh",
  "use_cases_en",
  "use_cases_zh",
  "what_customer_receives_en",
  "what_customer_receives_zh",
  "limitations_en",
  "limitations_zh",
  "custom_upgrade_options_en",
  "custom_upgrade_options_zh",
  "demo_questions",
  "demo_answers",
  "sample_conversation",
  "pricing_plans",
  "delivery_settings",
  "agent_rights_confirmed",
  "content_safety_confirmed",
  "review_policy_confirmed",
  "suspension_policy_confirmed",
  "sensitive_disclaimer_confirmed",
  "video_url",
  "created_at",
  "updated_at",
  "agent_categories(slug)",
  "seller_profiles(email)",
].join(", ");

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

  const validationError = validatePatchPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
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
    applyAdminPatch(sellerAgent, payload, now);

    await writeAgentAuditLog(request, payload, sellerAgent.id);

    return NextResponse.json({
      data: sellerAgent,
      mode: "mock",
      ok: true,
      warnings:
        payload.status === "published" ? getPublishWarnings(sellerAgent) : [],
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

  if (typeof payload.review_reason_code !== "undefined") {
    nextOverride.review_reason_code = payload.review_reason_code || null;
  }

  Object.assign(nextOverride, extractAgentContentUpdates(payload));

  overrideStore[platformAgent.slug] = nextOverride;

  await writeAgentAuditLog(request, payload, platformAgent.slug);

  const updatedAgent = getAdminAgentRecords().find(
    (agent) => agent.slug === platformAgent.slug,
  );

  return NextResponse.json({
    data: updatedAgent,
    mode: "mock",
    ok: true,
    warnings:
      payload.status === "published" && updatedAgent
        ? getPublishWarnings(updatedAgent)
        : [],
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
      reason: payload.review_reason_code ?? null,
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
    .select(adminAgentSelect)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((record) =>
      normalizeSupabaseAdminAgent(record as unknown as SupabaseAgentRecord),
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

  const updates = buildSupabaseUpdates(payload);

  const { data, error } = await supabase
    .from("marketplace_agents")
    .update(updates)
    .eq("id", existingAgent.id)
    .select(adminAgentSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = normalizeSupabaseAdminAgent(
    data as unknown as SupabaseAgentRecord,
  );

  return NextResponse.json({
    data: normalized,
    mode: "supabase",
    ok: true,
    warnings:
      payload.status === "published" ? getPublishWarnings(normalized) : [],
  });
}

function applyAdminPatch(
  agent: AdminAgentRecord,
  payload: AgentPatchPayload,
  updatedAt: string,
) {
  if (payload.status) {
    agent.status = payload.status;
  }

  if (typeof payload.is_featured === "boolean") {
    agent.is_featured = payload.is_featured;
  }

  if (typeof payload.is_verified === "boolean") {
    agent.is_verified = payload.is_verified;
  }

  if (typeof payload.feedback === "string") {
    agent.review_feedback = payload.feedback.trim() || null;
  }

  if (typeof payload.admin_note === "string") {
    agent.admin_note = payload.admin_note.trim() || null;
  }

  if (typeof payload.review_reason_code !== "undefined") {
    agent.review_reason_code = payload.review_reason_code || null;
  }

  applyAgentContentUpdates(agent, payload);
  agent.updated_at = updatedAt;
}

function buildSupabaseUpdates(payload: AgentPatchPayload) {
  const updates: {
    admin_note?: string | null;
    is_featured?: boolean;
    is_verified?: boolean;
    price_cny?: number | null;
    price_usd?: number | null;
    pricing_type?: PricingType;
    review_feedback?: string | null;
    review_reason_code?: AgentReviewReasonCode | null;
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

  if (typeof payload.review_reason_code !== "undefined") {
    updates.review_reason_code = payload.review_reason_code || null;
  }

  Object.assign(updates, extractAgentContentUpdates(payload));

  return updates;
}

function normalizeSupabaseAdminAgent(record: SupabaseAgentRecord): AdminAgentRecord {
  const category = firstRelation(record.agent_categories);
  const sellerProfile = firstRelation(record.seller_profiles);

  return {
    admin_note: record.admin_note ?? null,
    agent_rights_confirmed: Boolean(record.agent_rights_confirmed),
    category_slug: category?.slug ?? record.category_id ?? "",
    content_safety_confirmed: Boolean(record.content_safety_confirmed),
    cover_image_url: record.cover_image_url ?? null,
    created_at: record.created_at,
    custom_upgrade_options_en: record.custom_upgrade_options_en ?? "",
    custom_upgrade_options_zh: record.custom_upgrade_options_zh ?? "",
    data_permissions_en: record.data_permissions_en ?? "",
    data_permissions_zh: record.data_permissions_zh ?? "",
    delivery_settings: toRecord(record.delivery_settings),
    delivery_type: record.delivery_type,
    demo_answers: toStringArray(record.demo_answers),
    demo_enabled: Boolean(record.demo_enabled),
    demo_questions: toStringArray(record.demo_questions),
    demo_url: record.demo_url ?? null,
    description_en: record.description_en ?? "",
    description_zh: record.description_zh ?? "",
    faq_en: toFaqItems(record.faq_en),
    faq_zh: toFaqItems(record.faq_zh),
    features_en: toStringArray(record.features_en),
    features_zh: toStringArray(record.features_zh),
    id: record.id,
    is_featured: record.is_featured,
    is_verified: record.is_verified,
    limitations_en: record.limitations_en ?? "",
    limitations_zh: record.limitations_zh ?? "",
    owner_type: record.owner_type,
    price_cny: toNullableNumber(record.price_cny),
    price_usd: toNullableNumber(record.price_usd),
    pricing_plans: toRecordArray(record.pricing_plans),
    pricing_type: record.pricing_type,
    review_feedback: record.review_feedback ?? null,
    review_policy_confirmed: Boolean(record.review_policy_confirmed),
    review_reason_code: toReviewReasonCode(record.review_reason_code),
    sample_conversation: record.sample_conversation ?? "",
    seller_email: sellerProfile?.email ?? null,
    sensitive_disclaimer_confirmed: Boolean(
      record.sensitive_disclaimer_confirmed,
    ),
    setup_instructions_en: record.setup_instructions_en ?? "",
    setup_instructions_zh: record.setup_instructions_zh ?? "",
    short_description_en: record.short_description_en,
    short_description_zh: record.short_description_zh,
    slug: record.slug,
    status: record.status,
    supported_languages: toSupportedLanguages(record.supported_languages),
    suspension_policy_confirmed: Boolean(record.suspension_policy_confirmed),
    tags: toStringArray(record.tags),
    title_en: record.title_en,
    title_zh: record.title_zh,
    updated_at: record.updated_at,
    use_cases_en: toStringArray(record.use_cases_en),
    use_cases_zh: toStringArray(record.use_cases_zh),
    video_url: record.video_url ?? null,
    what_customer_receives_en: record.what_customer_receives_en ?? "",
    what_customer_receives_zh: record.what_customer_receives_zh ?? "",
    who_it_is_for_en: record.who_it_is_for_en ?? "",
    who_it_is_for_zh: record.who_it_is_for_zh ?? "",
  };
}

function validatePatchPayload(payload: AgentPatchPayload) {
  if (payload.status && !AGENT_STATUSES.includes(payload.status)) {
    return "Invalid status.";
  }

  if (payload.pricing_type && !PRICING_TYPES.includes(payload.pricing_type)) {
    return "Invalid pricing type.";
  }

  if (
    payload.review_reason_code &&
    !AGENT_REVIEW_REASON_CODES.includes(payload.review_reason_code)
  ) {
    return "Invalid review reason code.";
  }

  return null;
}

function getPublishWarnings(agent: AdminAgentRecord) {
  return getAgentPublishWarnings(agent);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined") {
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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function toFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const question =
        typeof record.question === "string" ? record.question.trim() : "";
      const answer = typeof record.answer === "string" ? record.answer.trim() : "";

      return question && answer ? { answer, question } : null;
    })
    .filter((item): item is FaqItem => Boolean(item));
}

function toRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toRecordArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function toSupportedLanguages(value: unknown): SupportedLanguage[] {
  const languages = toStringArray(value).filter(
    (language): language is SupportedLanguage =>
      SUPPORTED_LANGUAGES.includes(language as SupportedLanguage),
  );

  return languages.length ? languages : ["en", "zh"];
}

function toReviewReasonCode(value: string | null | undefined) {
  return value &&
    AGENT_REVIEW_REASON_CODES.includes(value as AgentReviewReasonCode)
    ? (value as AgentReviewReasonCode)
    : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
