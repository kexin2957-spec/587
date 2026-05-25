import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  requireAdminForConfiguredSupabase,
  requireSellerAccountForEmail,
} from "@/lib/auth/server";
import { demoAgents, demoCategories } from "@/lib/marketplace/demo-data";
import {
  getMockSellerAgentStore,
  getMockSellerProfileStore,
} from "@/lib/server/marketplace-admin-store";
import { writeRequestAuditLog } from "@/lib/server/audit-log";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";
import {
  AGENT_STATUSES,
  DELIVERY_TYPES,
  PRICING_TYPES,
  REVENUE_SHARE_RULES,
  SUPPORTED_LANGUAGES,
  type AgentStatus,
  type DeliveryType,
  type PricingType,
  type SupportedLanguage,
} from "@/lib/marketplace/constants";

type FaqItem = {
  answer: string;
  question: string;
};

type SellerAgentPayload = {
  category_slug?: string;
  changelog_en?: string;
  changelog_zh?: string;
  data_permissions_en?: string;
  data_permissions_zh?: string;
  delivery_type?: DeliveryType;
  demo_enabled?: boolean;
  demo_url?: string;
  description_en?: string;
  description_zh?: string;
  faq_en?: FaqItem[];
  faq_zh?: FaqItem[];
  features_en?: string[];
  features_zh?: string[];
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_type?: PricingType;
  rights_confirmed?: boolean;
  screenshot_urls?: string[];
  seller_email?: string;
  setup_instructions_en?: string;
  setup_instructions_zh?: string;
  status?: AgentStatus;
  short_description_en?: string;
  short_description_zh?: string;
  supported_languages?: SupportedLanguage[];
  tags?: string[];
  title_en?: string;
  title_zh?: string;
  version?: string;
  video_url?: string;
};

type SellerAgentPatchPayload = SellerAgentPayload & {
  id?: string;
  slug?: string;
};

type MockSellerAgent = {
  category_slug: string;
  changelog_en: string | null;
  changelog_zh: string | null;
  creator_revenue_rate: number;
  created_at: string;
  data_permissions_en: string;
  data_permissions_zh: string;
  delivery_type: DeliveryType;
  demo_enabled: boolean;
  demo_url: string | null;
  description_en: string;
  description_zh: string;
  faq_en: FaqItem[];
  faq_zh: FaqItem[];
  features_en: string[];
  features_zh: string[];
  id: string;
  is_featured: false;
  is_verified: false;
  owner_type: "seller";
  platform_commission_rate: number;
  price_cny: number | null;
  price_usd: number | null;
  pricing_type: PricingType;
  revenue_share_type: "third_party_standard";
  screenshot_urls: string[];
  seller_email: string;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  supported_languages: SupportedLanguage[];
  tags: string[];
  title_en: string;
  title_zh: string;
  updated_at: string;
  version: string;
  video_url: string | null;
};

type SupabaseAgentRecord = {
  agent_categories?:
    | { name_en?: string; name_zh?: string; slug?: string }
    | { name_en?: string; name_zh?: string; slug?: string }[]
    | null;
  category_id?: string;
  created_at: string;
  delivery_type: DeliveryType;
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  owner_type: "platform" | "seller";
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_type: PricingType;
  review_feedback?: string | null;
  revenue_share_type?: string | null;
  creator_revenue_rate?: number | string | null;
  platform_commission_rate?: number | string | null;
  seller_profiles?:
    | {
        display_name?: string;
        email?: string;
        team_name?: string | null;
      }
    | {
        display_name?: string;
        email?: string;
        team_name?: string | null;
      }[]
    | null;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  title_en: string;
  title_zh: string;
  updated_at: string;
};

type SupabaseProfileClient = {
  from: (table: "seller_profiles") => {
    insert: (value: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { id?: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        limit: (count: number) => Promise<{
          data: Array<{ id?: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sellerEmail = new URL(request.url).searchParams
    .get("seller_email")
    ?.trim()
    .toLowerCase();

  if (sellerEmail) {
    const sellerAuthorization = await requireSellerAccountForEmail(sellerEmail);

    if (!sellerAuthorization.ok) {
      return sellerAuthorization.response;
    }

    return getSellerAgentsForEmail(sellerEmail);
  }

  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("marketplace_agents")
      .select(
        "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, revenue_share_type, creator_revenue_rate, platform_commission_rate, review_feedback, delivery_type, category_id, created_at, updated_at, agent_categories(slug, name_en, name_zh), seller_profiles(email, display_name, team_name)",
      )
      .eq("owner_type", "seller")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((record) =>
        normalizeSupabaseAgent(record as SupabaseAgentRecord),
      ),
      mode: "supabase",
      ok: true,
    });
  }

  return NextResponse.json({
    data: [...getMockSellerAgentStore()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.sellerUpload);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as SellerAgentPayload;
  const slug = createSlug(payload.title_en || payload.title_zh || "");
  const validationError = validatePayload(payload, slug);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedPayload = normalizePayload(payload, slug);
  const sellerAuthorization = await requireSellerAccountForEmail(
    normalizedPayload.seller_email,
  );

  if (!sellerAuthorization.ok) {
    return sellerAuthorization.response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: existingAgent, error: slugLookupError } = await supabase
      .from("marketplace_agents")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugLookupError) {
      return NextResponse.json(
        { error: slugLookupError.message },
        { status: 500 },
      );
    }

    if (existingAgent?.id) {
      return NextResponse.json(
        { error: "An agent with this slug already exists." },
        { status: 409 },
      );
    }

    const { data: category, error: categoryError } = await supabase
      .from("agent_categories")
      .select("id")
      .eq("slug", normalizedPayload.category_slug)
      .single();

    if (categoryError || !category?.id) {
      return NextResponse.json(
        { error: "Selected category was not found." },
        { status: 400 },
      );
    }

    const sellerIdResult = await getOrCreateSellerProfile(
      supabase as unknown as SupabaseProfileClient,
      normalizedPayload.seller_email,
    );

    if (sellerIdResult.error) {
      return NextResponse.json(
        { error: sellerIdResult.error },
        { status: 500 },
      );
    }

    const { data, error } = await supabase
      .from("marketplace_agents")
      .insert({
        category_id: category.id,
        changelog_en: normalizedPayload.changelog_en,
        changelog_zh: normalizedPayload.changelog_zh,
        creator_revenue_rate: REVENUE_SHARE_RULES.third_party_standard.creatorRate,
        data_permissions_en: normalizedPayload.data_permissions_en,
        data_permissions_zh: normalizedPayload.data_permissions_zh,
        delivery_type: normalizedPayload.delivery_type,
        demo_enabled: normalizedPayload.demo_enabled,
        demo_url: normalizedPayload.demo_url,
        description_en: normalizedPayload.description_en,
        description_zh: normalizedPayload.description_zh,
        faq_en: normalizedPayload.faq_en,
        faq_zh: normalizedPayload.faq_zh,
        features_en: normalizedPayload.features_en,
        features_zh: normalizedPayload.features_zh,
        is_featured: false,
        is_verified: false,
        owner_type: "seller",
        platform_commission_rate: REVENUE_SHARE_RULES.third_party_standard.platformRate,
        price_cny: normalizedPayload.price_cny,
        price_usd: normalizedPayload.price_usd,
        pricing_type: normalizedPayload.pricing_type,
        revenue_share_type: "third_party_standard",
        screenshots: normalizedPayload.screenshot_urls,
        seller_id: sellerIdResult.sellerId,
        setup_instructions_en: normalizedPayload.setup_instructions_en,
        setup_instructions_zh: normalizedPayload.setup_instructions_zh,
        short_description_en: normalizedPayload.short_description_en,
        short_description_zh: normalizedPayload.short_description_zh,
        slug,
        status: normalizedPayload.status,
        supported_languages: normalizedPayload.supported_languages,
        tags: normalizedPayload.tags,
        title_en: normalizedPayload.title_en,
        title_zh: normalizedPayload.title_zh,
        version: normalizedPayload.version,
        video_url: normalizedPayload.video_url,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeRequestAuditLog(request, {
      action: "seller_agent.submit",
      actorId: sellerAuthorization.actor.id,
      actorType: "seller",
      metadata: {
        seller_email: normalizedPayload.seller_email,
        status: normalizedPayload.status,
      },
      resourceId: data.id,
      resourceType: "seller_agent",
    });

    return NextResponse.json(
      { id: data.id, mode: "supabase", ok: true, slug },
      { status: 201 },
    );
  }

  if (getMockSellerAgentStore().some((agent) => agent.slug === slug)) {
    return NextResponse.json(
      { error: "An agent with this slug already exists." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  ensureMockSellerProfile(normalizedPayload.seller_email);
  const mockAgent: MockSellerAgent = {
    ...normalizedPayload,
    creator_revenue_rate: REVENUE_SHARE_RULES.third_party_standard.creatorRate,
    created_at: now,
    id: crypto.randomUUID(),
    is_featured: false,
    is_verified: false,
    owner_type: "seller",
    platform_commission_rate: REVENUE_SHARE_RULES.third_party_standard.platformRate,
    revenue_share_type: "third_party_standard",
    slug,
    status: normalizedPayload.status,
    updated_at: now,
  };

  getMockSellerAgentStore().push(mockAgent);

  await writeRequestAuditLog(request, {
    action: "seller_agent.submit",
    actorId: sellerAuthorization.actor.id,
    actorType: "seller",
    metadata: {
      seller_email: normalizedPayload.seller_email,
      status: normalizedPayload.status,
    },
    resourceId: mockAgent.id,
    resourceType: "seller_agent",
  });

  return NextResponse.json(
    { id: mockAgent.id, mode: "mock", ok: true, slug },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as SellerAgentPatchPayload;
  const sellerEmail = payload.seller_email?.trim().toLowerCase();
  const targetKey = payload.id || payload.slug;

  if (!sellerEmail || !/^\S+@\S+\.\S+$/.test(sellerEmail)) {
    return NextResponse.json(
      { error: "A valid seller email is required." },
      { status: 400 },
    );
  }

  if (!targetKey) {
    return NextResponse.json({ error: "Agent id is required." }, { status: 400 });
  }

  const sellerAuthorization = await requireSellerAccountForEmail(sellerEmail);

  if (!sellerAuthorization.ok) {
    return sellerAuthorization.response;
  }

  if (
    payload.status &&
    (!AGENT_STATUSES.includes(payload.status) ||
      !["draft", "submitted"].includes(payload.status))
  ) {
    return NextResponse.json(
      { error: "Seller agents can only be saved as draft or submitted." },
      { status: 400 },
    );
  }

  if (payload.pricing_type && !PRICING_TYPES.includes(payload.pricing_type)) {
    return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const lookupColumn = isUuid(targetKey) ? "id" : "slug";
    const { data: existingAgent, error: lookupError } = await supabase
      .from("marketplace_agents")
      .select("id, seller_profiles!inner(email)")
      .eq(lookupColumn, targetKey)
      .eq("seller_profiles.email", sellerEmail)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!existingAgent?.id) {
      return NextResponse.json({ error: "Seller agent not found." }, { status: 404 });
    }

    const updates = buildSellerAgentPatchUpdates(payload);

    if (payload.category_slug) {
      const { data: category, error: categoryError } = await supabase
        .from("agent_categories")
        .select("id")
        .eq("slug", payload.category_slug)
        .single();

      if (categoryError || !category?.id) {
        return NextResponse.json(
          { error: "Selected category was not found." },
          { status: 400 },
        );
      }

      updates.category_id = category.id;
    }

    const { data, error } = await supabase
      .from("marketplace_agents")
      .update(updates)
      .eq("id", existingAgent.id)
      .select(
        "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, revenue_share_type, creator_revenue_rate, platform_commission_rate, review_feedback, delivery_type, category_id, created_at, updated_at, agent_categories(slug, name_en, name_zh), seller_profiles(email, display_name, team_name)",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeRequestAuditLog(request, {
      action: "seller_agent.update",
      actorId: sellerAuthorization.actor.id,
      actorType: "seller",
      metadata: {
        seller_email: sellerEmail,
        status: payload.status ?? null,
      },
      resourceId: existingAgent.id,
      resourceType: "seller_agent",
    });

    return NextResponse.json({
      data: normalizeSupabaseAgent(data as SupabaseAgentRecord),
      mode: "supabase",
      ok: true,
    });
  }

  const agent = getMockSellerAgentStore().find(
    (item) =>
      (item.id === targetKey || item.slug === targetKey) &&
      item.seller_email.toLowerCase() === sellerEmail,
  );

  if (!agent) {
    return NextResponse.json({ error: "Seller agent not found." }, { status: 404 });
  }

  Object.assign(agent, buildMockSellerAgentPatchUpdates(payload));
  agent.updated_at = new Date().toISOString();

  await writeRequestAuditLog(request, {
    action: "seller_agent.update",
    actorId: sellerAuthorization.actor.id,
    actorType: "seller",
    metadata: {
      seller_email: sellerEmail,
      status: payload.status ?? null,
    },
    resourceId: agent.id,
    resourceType: "seller_agent",
  });

  return NextResponse.json({ data: agent, mode: "mock", ok: true });
}

async function getSellerAgentsForEmail(sellerEmail: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("marketplace_agents")
      .select(
        "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, price_usd, price_cny, revenue_share_type, creator_revenue_rate, platform_commission_rate, review_feedback, delivery_type, category_id, created_at, updated_at, agent_categories(slug, name_en, name_zh), seller_profiles!inner(email, display_name, team_name)",
      )
      .eq("owner_type", "seller")
      .eq("seller_profiles.email", sellerEmail)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((record) =>
        normalizeSupabaseAgent(record as SupabaseAgentRecord),
      ),
      mode: "supabase",
      ok: true,
    });
  }

  if (supabaseUrl && !serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for seller dashboard data." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: getMockSellerAgentStore()
      .filter((agent) => agent.seller_email.toLowerCase() === sellerEmail)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    mode: "mock",
    ok: true,
  });
}

async function getOrCreateSellerProfile(
  supabase: SupabaseProfileClient,
  sellerEmail: string,
) {
  const { data: existingProfiles, error: lookupError } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("email", sellerEmail)
    .limit(1);

  if (lookupError) {
    return { error: lookupError.message, sellerId: null };
  }

  const existingProfile = existingProfiles?.[0];

  if (existingProfile?.id) {
    return { error: null, sellerId: existingProfile.id as string };
  }

  const { data, error } = await supabase
    .from("seller_profiles")
    .insert({
      display_name: sellerEmail,
      email: sellerEmail,
      offers_custom_services: false,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      error: error?.message ?? "Unable to create seller profile.",
      sellerId: null,
    };
  }

  return { error: null, sellerId: data.id };
}

function normalizePayload(payload: SellerAgentPayload, slug: string) {
  const titleEn = payload.title_en?.trim();
  const titleZh = payload.title_zh?.trim();
  const shortDescriptionEn = payload.short_description_en?.trim();
  const shortDescriptionZh = payload.short_description_zh?.trim();
  const descriptionEn = payload.description_en?.trim();
  const descriptionZh = payload.description_zh?.trim();

  return {
    category_slug: payload.category_slug?.trim() ?? "",
    changelog_en: payload.changelog_en?.trim() || null,
    changelog_zh: payload.changelog_zh?.trim() || null,
    data_permissions_en: payload.data_permissions_en?.trim() ?? "",
    data_permissions_zh: payload.data_permissions_zh?.trim() ?? "",
    delivery_type: payload.delivery_type as DeliveryType,
    demo_enabled: Boolean(payload.demo_enabled),
    demo_url: payload.demo_url?.trim() || null,
    description_en: descriptionEn || descriptionZh || "",
    description_zh: descriptionZh || descriptionEn || "",
    faq_en: sanitizeFaq(payload.faq_en),
    faq_zh: sanitizeFaq(payload.faq_zh),
    features_en: sanitizeStringArray(payload.features_en),
    features_zh: sanitizeStringArray(payload.features_zh),
    price_cny: normalizePrice(payload.price_cny),
    price_usd: normalizePrice(payload.price_usd),
    pricing_type: payload.pricing_type as PricingType,
    screenshot_urls: sanitizeStringArray(payload.screenshot_urls),
    seller_email: payload.seller_email?.trim() ?? "",
    setup_instructions_en: payload.setup_instructions_en?.trim() ?? "",
    setup_instructions_zh: payload.setup_instructions_zh?.trim() ?? "",
    status: (payload.status === "draft" ? "draft" : "submitted") as
      | "draft"
      | "submitted",
    short_description_en: shortDescriptionEn || shortDescriptionZh || "",
    short_description_zh: shortDescriptionZh || shortDescriptionEn || "",
    slug,
    supported_languages: sanitizeSupportedLanguages(payload.supported_languages),
    tags: sanitizeStringArray(payload.tags),
    title_en: titleEn || titleZh || "",
    title_zh: titleZh || titleEn || "",
    version: payload.version?.trim() || "1.0.0",
    video_url: payload.video_url?.trim() || null,
  };
}

function buildSellerAgentPatchUpdates(payload: SellerAgentPatchPayload) {
  const updates: Record<string, unknown> = {};

  if (payload.status) {
    updates.status = payload.status;
  }

  assignTrimmed(updates, "title_en", payload.title_en);
  assignTrimmed(updates, "title_zh", payload.title_zh);
  assignTrimmed(updates, "short_description_en", payload.short_description_en);
  assignTrimmed(updates, "short_description_zh", payload.short_description_zh);
  assignTrimmed(updates, "description_en", payload.description_en);
  assignTrimmed(updates, "description_zh", payload.description_zh);
  assignTrimmed(updates, "setup_instructions_en", payload.setup_instructions_en);
  assignTrimmed(updates, "setup_instructions_zh", payload.setup_instructions_zh);
  assignTrimmed(updates, "data_permissions_en", payload.data_permissions_en);
  assignTrimmed(updates, "data_permissions_zh", payload.data_permissions_zh);
  assignTrimmed(updates, "demo_url", payload.demo_url);
  assignTrimmed(updates, "video_url", payload.video_url);
  assignTrimmed(updates, "version", payload.version);
  assignTrimmed(updates, "changelog_en", payload.changelog_en);
  assignTrimmed(updates, "changelog_zh", payload.changelog_zh);

  if (payload.delivery_type && DELIVERY_TYPES.includes(payload.delivery_type)) {
    updates.delivery_type = payload.delivery_type;
  }

  if (payload.pricing_type && PRICING_TYPES.includes(payload.pricing_type)) {
    updates.pricing_type = payload.pricing_type;
  }

  if (typeof payload.demo_enabled === "boolean") {
    updates.demo_enabled = payload.demo_enabled;
  }

  if (typeof payload.price_usd !== "undefined") {
    updates.price_usd = normalizePrice(payload.price_usd);
  }

  if (typeof payload.price_cny !== "undefined") {
    updates.price_cny = normalizePrice(payload.price_cny);
  }

  if (payload.features_en) {
    updates.features_en = sanitizeStringArray(payload.features_en);
  }

  if (payload.features_zh) {
    updates.features_zh = sanitizeStringArray(payload.features_zh);
  }

  if (payload.faq_en) {
    updates.faq_en = sanitizeFaq(payload.faq_en);
  }

  if (payload.faq_zh) {
    updates.faq_zh = sanitizeFaq(payload.faq_zh);
  }

  if (payload.screenshot_urls) {
    updates.screenshots = sanitizeStringArray(payload.screenshot_urls);
  }

  if (payload.supported_languages) {
    updates.supported_languages = sanitizeSupportedLanguages(payload.supported_languages);
  }

  if (payload.tags) {
    updates.tags = sanitizeStringArray(payload.tags);
  }

  return updates;
}

function buildMockSellerAgentPatchUpdates(payload: SellerAgentPatchPayload) {
  const updates = buildSellerAgentPatchUpdates(payload);
  const screenshots = updates.screenshots;

  delete updates.screenshots;
  delete updates.category_id;

  if (payload.category_slug) {
    updates.category_slug = payload.category_slug;
  }

  if (Array.isArray(screenshots)) {
    updates.screenshot_urls = screenshots;
  }

  return updates;
}

function assignTrimmed(
  target: Record<string, unknown>,
  key: string,
  value: string | undefined,
) {
  if (typeof value === "string") {
    target[key] = value.trim();
  }
}

function validatePayload(payload: SellerAgentPayload, slug: string) {
  if (!payload.seller_email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.seller_email)) {
    return "A valid seller email is required.";
  }

  if (!payload.rights_confirmed) {
    return "Confirm this agent is original or you have the rights to sell it.";
  }

  if (
    payload.status &&
    (!AGENT_STATUSES.includes(payload.status) ||
      !["draft", "submitted"].includes(payload.status))
  ) {
    return "Seller submissions can only be saved as draft or submitted for review.";
  }

  if (!slug) {
    return "Agent title is required.";
  }

  if (demoAgents.some((agent) => agent.slug === slug)) {
    return "An agent with this slug already exists.";
  }

  const hasEnglishVersion = Boolean(
    payload.title_en?.trim() &&
      payload.short_description_en?.trim() &&
      payload.description_en?.trim(),
  );
  const hasChineseVersion = Boolean(
    payload.title_zh?.trim() &&
      payload.short_description_zh?.trim() &&
      payload.description_zh?.trim(),
  );

  if (!hasEnglishVersion && !hasChineseVersion) {
    return "At least one complete language version is required.";
  }

  if (
    !payload.category_slug ||
    !demoCategories.some((category) => category.slug === payload.category_slug)
  ) {
    return "Category is required.";
  }

  if (!payload.delivery_type || !DELIVERY_TYPES.includes(payload.delivery_type)) {
    return "Delivery type is required.";
  }

  if (!payload.pricing_type || !PRICING_TYPES.includes(payload.pricing_type)) {
    return "Pricing type is required.";
  }

  if (
    (payload.pricing_type === "one_time" ||
      payload.pricing_type === "monthly") &&
    normalizePrice(payload.price_usd) === null &&
    normalizePrice(payload.price_cny) === null
  ) {
    return "Price is required for paid agents.";
  }

  if (sanitizeSupportedLanguages(payload.supported_languages).length === 0) {
    return "At least one supported language is required.";
  }

  return null;
}

function createSlug(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  if (normalized) {
    return normalized;
  }

  return value.trim() ? `agent-${hashString(value)}` : "";
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function normalizePrice(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return null;
  }

  return value;
}

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeStringArray(value: string[] | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
}

function sanitizeFaq(value: FaqItem[] | undefined) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          answer: item.answer?.trim() ?? "",
          question: item.question?.trim() ?? "",
        }))
        .filter((item) => item.answer && item.question)
    : [];
}

function sanitizeSupportedLanguages(value: SupportedLanguage[] | undefined) {
  return Array.isArray(value)
    ? value.filter((language) => SUPPORTED_LANGUAGES.includes(language))
    : [];
}

function normalizeSupabaseAgent(record: SupabaseAgentRecord) {
  const category = firstRelation(record.agent_categories);
  const sellerProfile = firstRelation(record.seller_profiles);

  return {
    category_slug: category?.slug ?? record.category_id ?? "",
    created_at: record.created_at,
    delivery_type: record.delivery_type,
    id: record.id,
    is_featured: record.is_featured,
    is_verified: record.is_verified,
    owner_type: record.owner_type,
    price_cny: toNullableNumber(record.price_cny ?? null),
    price_usd: toNullableNumber(record.price_usd ?? null),
    pricing_type: record.pricing_type,
    review_feedback: record.review_feedback ?? null,
    revenue_share_type: record.revenue_share_type ?? null,
    creator_revenue_rate: toNullableNumber(record.creator_revenue_rate ?? null),
    platform_commission_rate: toNullableNumber(record.platform_commission_rate ?? null),
    seller_email: sellerProfile?.email ?? "",
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

function ensureMockSellerProfile(sellerEmail: string) {
  const profiles = getMockSellerProfileStore();
  const existingProfile = profiles.find(
    (profile) => profile.email.toLowerCase() === sellerEmail.toLowerCase(),
  );

  if (existingProfile) {
    return existingProfile.id;
  }

  const now = new Date().toISOString();
  const profile = {
    created_at: now,
    display_name: sellerEmail,
    email: sellerEmail,
    expertise: null,
    id: crypto.randomUUID(),
    offers_custom_services: false,
    payout_preference: null,
    status: "pending" as const,
    team_name: null,
    updated_at: now,
    user_id: null,
    website: null,
  };

  profiles.push(profile);

  return profile.id;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
