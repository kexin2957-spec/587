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
import { evaluateAgentQuality } from "@/lib/marketplace/agent-quality";
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

type PricingPlanPayload = {
  cta_label_en?: string;
  cta_label_zh?: string;
  delivery_time_en?: string;
  delivery_time_zh?: string;
  included_items_en?: string[];
  included_items_zh?: string[];
  limitations_en?: string;
  limitations_zh?: string;
  plan_id?: string;
  price_cny?: number | null;
  price_usd?: number | null;
  title_en?: string;
  title_zh?: string;
};

type SellerAgentPayload = {
  agent_rights_confirmed?: boolean;
  category_slug?: string;
  changelog_en?: string;
  changelog_zh?: string;
  content_safety_confirmed?: boolean;
  cover_image_url?: string;
  custom_upgrade_options_en?: string;
  custom_upgrade_options_zh?: string;
  data_permissions_en?: string;
  data_permissions_zh?: string;
  delivery_settings?: Record<string, unknown>;
  delivery_type?: DeliveryType;
  demo_answers?: string[];
  demo_enabled?: boolean;
  demo_questions?: string[];
  demo_url?: string;
  description_en?: string;
  description_zh?: string;
  faq_en?: FaqItem[];
  faq_zh?: FaqItem[];
  features_en?: string[];
  features_zh?: string[];
  full_description_en?: string;
  full_description_zh?: string;
  limitations_en?: string;
  limitations_zh?: string;
  price_cny?: number | null;
  price_usd?: number | null;
  pricing_plans?: PricingPlanPayload[];
  pricing_type?: PricingType;
  review_policy_confirmed?: boolean;
  rights_confirmed?: boolean;
  sample_conversation?: string;
  screenshot_urls?: string[];
  seller_email?: string;
  sensitive_disclaimer_confirmed?: boolean;
  setup_instructions_en?: string;
  setup_instructions_zh?: string;
  status?: AgentStatus;
  short_description_en?: string;
  short_description_zh?: string;
  supported_languages?: SupportedLanguage[];
  suspension_policy_confirmed?: boolean;
  tags?: string[];
  title_en?: string;
  title_zh?: string;
  use_cases_en?: string[];
  use_cases_zh?: string[];
  version?: string;
  video_url?: string;
  what_customer_receives_en?: string;
  what_customer_receives_zh?: string;
  who_it_is_for_en?: string;
  who_it_is_for_zh?: string;
};

type SellerAgentPatchPayload = SellerAgentPayload & {
  id?: string;
  slug?: string;
};

type MockSellerAgent = {
  agent_rights_confirmed: boolean;
  category_slug: string;
  changelog_en: string | null;
  changelog_zh: string | null;
  content_safety_confirmed: boolean;
  cover_image_url: string | null;
  creator_revenue_rate: number;
  created_at: string;
  data_permissions_en: string;
  data_permissions_zh: string;
  delivery_settings: Record<string, unknown>;
  delivery_type: DeliveryType;
  demo_answers: string[];
  demo_enabled: boolean;
  demo_questions: string[];
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
  pricing_plans: PricingPlanPayload[];
  pricing_type: PricingType;
  revenue_share_type: "third_party_standard";
  review_policy_confirmed: boolean;
  sample_conversation: string;
  screenshot_urls: string[];
  seller_email: string;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  sensitive_disclaimer_confirmed: boolean;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  supported_languages: SupportedLanguage[];
  suspension_policy_confirmed: boolean;
  tags: string[];
  title_en: string;
  title_zh: string;
  updated_at: string;
  use_cases_en: string[];
  use_cases_zh: string[];
  version: string;
  video_url: string | null;
  what_customer_receives_en: string;
  what_customer_receives_zh: string;
  who_it_is_for_en: string;
  who_it_is_for_zh: string;
  limitations_en: string;
  limitations_zh: string;
  custom_upgrade_options_en: string;
  custom_upgrade_options_zh: string;
};

type SupabaseAgentRecord = {
  agent_rights_confirmed?: boolean | null;
  agent_categories?:
    | { name_en?: string; name_zh?: string; slug?: string }
    | { name_en?: string; name_zh?: string; slug?: string }[]
    | null;
  category_id?: string;
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
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_plans?: unknown;
  pricing_type: PricingType;
  review_feedback?: string | null;
  review_policy_confirmed?: boolean | null;
  review_reason_code?: string | null;
  revenue_share_type?: string | null;
  creator_revenue_rate?: number | string | null;
  platform_commission_rate?: number | string | null;
  sample_conversation?: string | null;
  screenshots?: unknown;
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

type SupabaseProfileClient = {
  from: (table: "seller_profiles") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        limit: (count: number) => Promise<{
          data: Array<{ id?: string; status?: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export const dynamic = "force-dynamic";

const DEFAULT_DRAFT_CATEGORY_SLUG = "customer-support";
const SELLER_PATCHABLE_STATUSES = ["draft", "submitted", "archived"] as const;
const sellerAgentSelect = [
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
  "revenue_share_type",
  "creator_revenue_rate",
  "platform_commission_rate",
  "review_feedback",
  "review_reason_code",
  "delivery_type",
  "category_id",
  "tags",
  "supported_languages",
  "cover_image_url",
  "screenshots",
  "video_url",
  "demo_url",
  "demo_enabled",
  "demo_questions",
  "demo_answers",
  "sample_conversation",
  "features_en",
  "features_zh",
  "faq_en",
  "faq_zh",
  "setup_instructions_en",
  "setup_instructions_zh",
  "data_permissions_en",
  "data_permissions_zh",
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
  "pricing_plans",
  "delivery_settings",
  "agent_rights_confirmed",
  "content_safety_confirmed",
  "review_policy_confirmed",
  "suspension_policy_confirmed",
  "sensitive_disclaimer_confirmed",
  "created_at",
  "updated_at",
  "agent_categories(slug, name_en, name_zh)",
  "seller_profiles(email, display_name, team_name)",
].join(", ");

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
      .select(sellerAgentSelect)
      .eq("owner_type", "seller")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((record) =>
        normalizeSupabaseAgent(record as unknown as SupabaseAgentRecord),
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
  const requestedStatus = payload.status === "draft" ? "draft" : "submitted";
  const slug = createSlug(
    payload.title_en ||
      payload.title_zh ||
      (requestedStatus === "draft"
        ? `draft-${payload.seller_email ?? "seller"}-${crypto.randomUUID()}`
        : ""),
  );
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

    const sellerProfileResult = await getApprovedSellerProfile(
      supabase as unknown as SupabaseProfileClient,
      normalizedPayload.seller_email,
    );

    if (sellerProfileResult.error) {
      return NextResponse.json(
        { error: sellerProfileResult.error },
        { status: sellerProfileResult.status },
      );
    }

    const { data, error } = await supabase
      .from("marketplace_agents")
      .insert({
        category_id: category.id,
        agent_rights_confirmed: normalizedPayload.agent_rights_confirmed,
        changelog_en: normalizedPayload.changelog_en,
        changelog_zh: normalizedPayload.changelog_zh,
        content_safety_confirmed: normalizedPayload.content_safety_confirmed,
        cover_image_url: normalizedPayload.cover_image_url,
        creator_revenue_rate: REVENUE_SHARE_RULES.third_party_standard.creatorRate,
        data_permissions_en: normalizedPayload.data_permissions_en,
        data_permissions_zh: normalizedPayload.data_permissions_zh,
        delivery_settings: normalizedPayload.delivery_settings,
        delivery_type: normalizedPayload.delivery_type,
        demo_answers: normalizedPayload.demo_answers,
        demo_enabled: normalizedPayload.demo_enabled,
        demo_questions: normalizedPayload.demo_questions,
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
        pricing_plans: normalizedPayload.pricing_plans,
        pricing_type: normalizedPayload.pricing_type,
        revenue_share_type: "third_party_standard",
        review_policy_confirmed: normalizedPayload.review_policy_confirmed,
        sample_conversation: normalizedPayload.sample_conversation,
        screenshots: normalizedPayload.screenshot_urls,
        seller_id: sellerProfileResult.sellerId,
        setup_instructions_en: normalizedPayload.setup_instructions_en,
        setup_instructions_zh: normalizedPayload.setup_instructions_zh,
        sensitive_disclaimer_confirmed:
          normalizedPayload.sensitive_disclaimer_confirmed,
        short_description_en: normalizedPayload.short_description_en,
        short_description_zh: normalizedPayload.short_description_zh,
        slug,
        status: normalizedPayload.status,
        supported_languages: normalizedPayload.supported_languages,
        suspension_policy_confirmed: normalizedPayload.suspension_policy_confirmed,
        tags: normalizedPayload.tags,
        title_en: normalizedPayload.title_en,
        title_zh: normalizedPayload.title_zh,
        use_cases_en: normalizedPayload.use_cases_en,
        use_cases_zh: normalizedPayload.use_cases_zh,
        version: normalizedPayload.version,
        video_url: normalizedPayload.video_url,
        what_customer_receives_en: normalizedPayload.what_customer_receives_en,
        what_customer_receives_zh: normalizedPayload.what_customer_receives_zh,
        who_it_is_for_en: normalizedPayload.who_it_is_for_en,
        who_it_is_for_zh: normalizedPayload.who_it_is_for_zh,
        limitations_en: normalizedPayload.limitations_en,
        limitations_zh: normalizedPayload.limitations_zh,
        custom_upgrade_options_en:
          normalizedPayload.custom_upgrade_options_en,
        custom_upgrade_options_zh:
          normalizedPayload.custom_upgrade_options_zh,
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

  if (!getApprovedMockSellerProfileId(normalizedPayload.seller_email)) {
    return NextResponse.json(
      { error: "Seller profile must be approved before uploading agents." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
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
      !SELLER_PATCHABLE_STATUSES.includes(payload.status as (typeof SELLER_PATCHABLE_STATUSES)[number]))
  ) {
    return NextResponse.json(
      { error: "Seller agents can only be saved as draft, submitted, or archived." },
      { status: 400 },
    );
  }

  if (payload.pricing_type && !PRICING_TYPES.includes(payload.pricing_type)) {
    return NextResponse.json({ error: "Invalid pricing type." }, { status: 400 });
  }

  if (payload.status === "submitted") {
    const validationSlug = createSlug(payload.title_en || payload.title_zh || targetKey);
    const validationError = validatePayload(
      { ...payload, seller_email: sellerEmail },
      validationSlug,
    );

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const sellerProfileResult = await getApprovedSellerProfile(
      supabase as unknown as SupabaseProfileClient,
      sellerEmail,
    );

    if (sellerProfileResult.error) {
      return NextResponse.json(
        { error: sellerProfileResult.error },
        { status: sellerProfileResult.status },
      );
    }

    const lookupColumn = isUuid(targetKey) ? "id" : "slug";
    const { data: existingAgent, error: lookupError } = await supabase
      .from("marketplace_agents")
      .select("id, slug, status, seller_profiles!inner(email)")
      .eq(lookupColumn, targetKey)
      .eq("seller_profiles.email", sellerEmail)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!existingAgent?.id) {
      return NextResponse.json({ error: "Seller agent not found." }, { status: 404 });
    }

    if (isLockedSellerEdit(existingAgent.status, payload.status)) {
      return NextResponse.json(
        {
          error:
            "Published or approved agents cannot be edited directly. Archive it or contact admin for an update submission.",
        },
        { status: 409 },
      );
    }

    const updates = buildSellerAgentPatchUpdates(payload);
    const nextSubmittedSlug = getSubmittedSlugFromDraft(
      existingAgent.slug,
      payload,
    );

    if (nextSubmittedSlug && nextSubmittedSlug !== existingAgent.slug) {
      const { data: slugOwner, error: slugLookupError } = await supabase
        .from("marketplace_agents")
        .select("id")
        .eq("slug", nextSubmittedSlug)
        .maybeSingle();

      if (slugLookupError) {
        return NextResponse.json(
          { error: slugLookupError.message },
          { status: 500 },
        );
      }

      if (slugOwner?.id && slugOwner.id !== existingAgent.id) {
        return NextResponse.json(
          { error: "An agent with this slug already exists." },
          { status: 409 },
        );
      }

      updates.slug = nextSubmittedSlug;
    }

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
      .select(sellerAgentSelect)
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
      data: normalizeSupabaseAgent(data as unknown as SupabaseAgentRecord),
      mode: "supabase",
      ok: true,
    });
  }

  if (!getApprovedMockSellerProfileId(sellerEmail)) {
    return NextResponse.json(
      { error: "Seller profile must be approved before updating agents." },
      { status: 403 },
    );
  }

  const agent = getMockSellerAgentStore().find(
    (item) =>
      (item.id === targetKey || item.slug === targetKey) &&
      item.seller_email.toLowerCase() === sellerEmail,
  );

  if (!agent) {
    return NextResponse.json({ error: "Seller agent not found." }, { status: 404 });
  }

  if (isLockedSellerEdit(agent.status, payload.status)) {
    return NextResponse.json(
      {
        error:
          "Published or approved agents cannot be edited directly. Archive it or contact admin for an update submission.",
      },
      { status: 409 },
    );
  }

  const updates = buildMockSellerAgentPatchUpdates(payload);
  const nextSubmittedSlug = getSubmittedSlugFromDraft(agent.slug, payload);

  if (nextSubmittedSlug && nextSubmittedSlug !== agent.slug) {
    const slugTaken =
      demoAgents.some((item) => item.slug === nextSubmittedSlug) ||
      getMockSellerAgentStore().some(
        (item) => item.id !== agent.id && item.slug === nextSubmittedSlug,
      );

    if (slugTaken) {
      return NextResponse.json(
        { error: "An agent with this slug already exists." },
        { status: 409 },
      );
    }

    updates.slug = nextSubmittedSlug;
  }

  Object.assign(agent, updates);
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
      .select(sellerAgentSelect.replace("seller_profiles(", "seller_profiles!inner("))
      .eq("owner_type", "seller")
      .eq("seller_profiles.email", sellerEmail)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((record) =>
        normalizeSupabaseAgent(record as unknown as SupabaseAgentRecord),
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

async function getApprovedSellerProfile(
  supabase: SupabaseProfileClient,
  sellerEmail: string,
) {
  const { data: existingProfiles, error: lookupError } = await supabase
    .from("seller_profiles")
    .select("id, status")
    .eq("email", sellerEmail)
    .limit(1);

  if (lookupError) {
    return { error: lookupError.message, sellerId: null, status: 500 };
  }

  const existingProfile = existingProfiles?.[0] as
    | { id?: string; status?: string }
    | undefined;

  if (!existingProfile?.id) {
    return {
      error: "Seller profile must be approved before uploading agents.",
      sellerId: null,
      status: 403,
    };
  }

  if (existingProfile.status !== "approved") {
    return {
      error: "Seller profile must be approved before uploading agents.",
      sellerId: null,
      status: 403,
    };
  }

  return { error: null, sellerId: existingProfile.id, status: 200 };
}

function normalizePayload(payload: SellerAgentPayload, slug: string) {
  const status: Extract<AgentStatus, "draft" | "submitted"> =
    payload.status === "draft" ? "draft" : "submitted";
  const titleEn = payload.title_en?.trim();
  const titleZh = payload.title_zh?.trim();
  const shortDescriptionEn = payload.short_description_en?.trim();
  const shortDescriptionZh = payload.short_description_zh?.trim();
  const descriptionEn =
    payload.full_description_en?.trim() || payload.description_en?.trim();
  const descriptionZh =
    payload.full_description_zh?.trim() || payload.description_zh?.trim();
  const fallbackTitleEn = status === "draft" ? "Untitled draft" : "";
  const fallbackTitleZh = status === "draft" ? "未命名草稿" : "";
  const deliveryType = normalizeDeliveryType(payload.delivery_type);
  const pricingType = normalizePricingType(payload.pricing_type);
  const supportedLanguages = sanitizeSupportedLanguages(
    payload.supported_languages,
  );

  return {
    agent_rights_confirmed: Boolean(
      payload.agent_rights_confirmed || payload.rights_confirmed,
    ),
    category_slug: payload.category_slug?.trim() || DEFAULT_DRAFT_CATEGORY_SLUG,
    changelog_en: payload.changelog_en?.trim() || null,
    changelog_zh: payload.changelog_zh?.trim() || null,
    content_safety_confirmed: Boolean(payload.content_safety_confirmed),
    cover_image_url: payload.cover_image_url?.trim() || null,
    data_permissions_en: payload.data_permissions_en?.trim() ?? "",
    data_permissions_zh: payload.data_permissions_zh?.trim() ?? "",
    delivery_settings: sanitizeDeliverySettings(payload.delivery_settings),
    delivery_type: deliveryType,
    demo_answers: sanitizeStringArray(payload.demo_answers),
    demo_enabled: Boolean(payload.demo_enabled),
    demo_questions: sanitizeStringArray(payload.demo_questions),
    demo_url: payload.demo_url?.trim() || null,
    description_en: descriptionEn || descriptionZh || "",
    description_zh: descriptionZh || descriptionEn || "",
    faq_en: sanitizeFaq(payload.faq_en),
    faq_zh: sanitizeFaq(payload.faq_zh),
    features_en: sanitizeStringArray(payload.features_en),
    features_zh: sanitizeStringArray(payload.features_zh),
    limitations_en: payload.limitations_en?.trim() ?? "",
    limitations_zh: payload.limitations_zh?.trim() ?? "",
    price_cny: normalizePrice(payload.price_cny),
    price_usd: normalizePrice(payload.price_usd),
    pricing_plans: sanitizePricingPlans(payload.pricing_plans),
    pricing_type: pricingType,
    review_policy_confirmed: Boolean(payload.review_policy_confirmed),
    sample_conversation: payload.sample_conversation?.trim() ?? "",
    screenshot_urls: sanitizeStringArray(payload.screenshot_urls),
    seller_email: payload.seller_email?.trim() ?? "",
    setup_instructions_en: payload.setup_instructions_en?.trim() ?? "",
    setup_instructions_zh: payload.setup_instructions_zh?.trim() ?? "",
    sensitive_disclaimer_confirmed: Boolean(
      payload.sensitive_disclaimer_confirmed,
    ),
    status,
    short_description_en: shortDescriptionEn || shortDescriptionZh || "",
    short_description_zh: shortDescriptionZh || shortDescriptionEn || "",
    slug,
    supported_languages:
      supportedLanguages.length > 0
        ? supportedLanguages
        : (["en", "zh"] as SupportedLanguage[]),
    suspension_policy_confirmed: Boolean(payload.suspension_policy_confirmed),
    tags: sanitizeStringArray(payload.tags),
    title_en: titleEn || titleZh || fallbackTitleEn,
    title_zh: titleZh || titleEn || fallbackTitleZh,
    use_cases_en: sanitizeStringArray(payload.use_cases_en),
    use_cases_zh: sanitizeStringArray(payload.use_cases_zh),
    version: payload.version?.trim() || "1.0.0",
    video_url: payload.video_url?.trim() || null,
    what_customer_receives_en: payload.what_customer_receives_en?.trim() ?? "",
    what_customer_receives_zh: payload.what_customer_receives_zh?.trim() ?? "",
    who_it_is_for_en: payload.who_it_is_for_en?.trim() ?? "",
    who_it_is_for_zh: payload.who_it_is_for_zh?.trim() ?? "",
    custom_upgrade_options_en:
      payload.custom_upgrade_options_en?.trim() ?? "",
    custom_upgrade_options_zh:
      payload.custom_upgrade_options_zh?.trim() ?? "",
  };
}

function buildSellerAgentPatchUpdates(payload: SellerAgentPatchPayload) {
  const updates: Record<string, unknown> = {};

  if (payload.status) {
    updates.status = payload.status;
  }

  if (payload.status === "submitted") {
    updates.review_feedback = null;
    updates.review_reason_code = null;
  }

  assignTrimmed(updates, "title_en", payload.title_en);
  assignTrimmed(updates, "title_zh", payload.title_zh);
  assignTrimmed(updates, "short_description_en", payload.short_description_en);
  assignTrimmed(updates, "short_description_zh", payload.short_description_zh);
  assignTrimmed(
    updates,
    "description_en",
    payload.full_description_en ?? payload.description_en,
  );
  assignTrimmed(
    updates,
    "description_zh",
    payload.full_description_zh ?? payload.description_zh,
  );
  assignTrimmed(updates, "setup_instructions_en", payload.setup_instructions_en);
  assignTrimmed(updates, "setup_instructions_zh", payload.setup_instructions_zh);
  assignTrimmed(updates, "data_permissions_en", payload.data_permissions_en);
  assignTrimmed(updates, "data_permissions_zh", payload.data_permissions_zh);
  assignTrimmed(updates, "cover_image_url", payload.cover_image_url);
  assignTrimmed(updates, "demo_url", payload.demo_url);
  assignTrimmed(updates, "video_url", payload.video_url);
  assignTrimmed(updates, "version", payload.version);
  assignTrimmed(updates, "changelog_en", payload.changelog_en);
  assignTrimmed(updates, "changelog_zh", payload.changelog_zh);
  assignTrimmed(updates, "sample_conversation", payload.sample_conversation);
  assignTrimmed(updates, "who_it_is_for_en", payload.who_it_is_for_en);
  assignTrimmed(updates, "who_it_is_for_zh", payload.who_it_is_for_zh);
  assignTrimmed(
    updates,
    "what_customer_receives_en",
    payload.what_customer_receives_en,
  );
  assignTrimmed(
    updates,
    "what_customer_receives_zh",
    payload.what_customer_receives_zh,
  );
  assignTrimmed(updates, "limitations_en", payload.limitations_en);
  assignTrimmed(updates, "limitations_zh", payload.limitations_zh);
  assignTrimmed(
    updates,
    "custom_upgrade_options_en",
    payload.custom_upgrade_options_en,
  );
  assignTrimmed(
    updates,
    "custom_upgrade_options_zh",
    payload.custom_upgrade_options_zh,
  );

  if (payload.delivery_type && DELIVERY_TYPES.includes(payload.delivery_type)) {
    updates.delivery_type = payload.delivery_type;
  }

  if (payload.pricing_type && PRICING_TYPES.includes(payload.pricing_type)) {
    updates.pricing_type = payload.pricing_type;
  }

  if (
    typeof payload.agent_rights_confirmed === "boolean" ||
    typeof payload.rights_confirmed === "boolean"
  ) {
    updates.agent_rights_confirmed = Boolean(
      payload.agent_rights_confirmed || payload.rights_confirmed,
    );
  }

  assignBoolean(updates, "content_safety_confirmed", payload.content_safety_confirmed);
  assignBoolean(updates, "review_policy_confirmed", payload.review_policy_confirmed);
  assignBoolean(
    updates,
    "suspension_policy_confirmed",
    payload.suspension_policy_confirmed,
  );
  assignBoolean(
    updates,
    "sensitive_disclaimer_confirmed",
    payload.sensitive_disclaimer_confirmed,
  );

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

  if (payload.use_cases_en) {
    updates.use_cases_en = sanitizeStringArray(payload.use_cases_en);
  }

  if (payload.use_cases_zh) {
    updates.use_cases_zh = sanitizeStringArray(payload.use_cases_zh);
  }

  if (payload.demo_questions) {
    updates.demo_questions = sanitizeStringArray(payload.demo_questions);
  }

  if (payload.demo_answers) {
    updates.demo_answers = sanitizeStringArray(payload.demo_answers);
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

  if (payload.pricing_plans) {
    updates.pricing_plans = sanitizePricingPlans(payload.pricing_plans);
  }

  if (payload.delivery_settings) {
    updates.delivery_settings = sanitizeDeliverySettings(payload.delivery_settings);
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

function isLockedSellerEdit(
  currentStatus: string | null | undefined,
  requestedStatus: AgentStatus | undefined,
) {
  return (
    (currentStatus === "approved" || currentStatus === "published") &&
    requestedStatus !== "archived"
  );
}

function getSubmittedSlugFromDraft(
  currentSlug: string | null | undefined,
  payload: SellerAgentPatchPayload,
) {
  if (payload.status !== "submitted" || !currentSlug?.startsWith("draft-")) {
    return null;
  }

  return createSlug(payload.title_en || payload.title_zh || "");
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

function assignBoolean(
  target: Record<string, unknown>,
  key: string,
  value: boolean | undefined,
) {
  if (typeof value === "boolean") {
    target[key] = value;
  }
}

function validatePayload(payload: SellerAgentPayload, slug: string) {
  if (!payload.seller_email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.seller_email)) {
    return "A valid seller email is required.";
  }

  if (
    payload.status &&
    (!AGENT_STATUSES.includes(payload.status) ||
      !["draft", "submitted"].includes(payload.status))
  ) {
    return "Seller submissions can only be saved as draft or submitted for review.";
  }

  if (payload.status === "draft") {
    if (
      payload.category_slug &&
      !demoCategories.some((category) => category.slug === payload.category_slug)
    ) {
      return "Selected category was not found.";
    }

    if (payload.delivery_type && !DELIVERY_TYPES.includes(payload.delivery_type)) {
      return "Invalid delivery type.";
    }

    if (payload.pricing_type && !PRICING_TYPES.includes(payload.pricing_type)) {
      return "Invalid pricing type.";
    }

    return null;
  }

  if (!slug) {
    return "Agent title is required.";
  }

  if (demoAgents.some((agent) => agent.slug === slug)) {
    return "An agent with this slug already exists.";
  }

  if (
    !payload.agent_rights_confirmed &&
    !payload.rights_confirmed
  ) {
    return "Confirm this agent is original or you have the rights to sell it.";
  }

  if (!payload.content_safety_confirmed) {
    return "Confirm this agent does not contain illegal, unsafe, or infringing content.";
  }

  if (!payload.review_policy_confirmed) {
    return "Agree to platform review before public listing.";
  }

  if (!payload.suspension_policy_confirmed) {
    return "Acknowledge that violating agents may be rejected or suspended.";
  }

  if (
    !payload.title_en?.trim() ||
    !payload.title_zh?.trim() ||
    !payload.short_description_en?.trim() ||
    !payload.short_description_zh?.trim() ||
    !getFullDescription(payload, "en") ||
    !getFullDescription(payload, "zh")
  ) {
    return "English and Chinese title, short description, and full description are required.";
  }

  if (
    !payload.category_slug ||
    !demoCategories.some((category) => category.slug === payload.category_slug)
  ) {
    return "Category is required.";
  }

  if (
    isSensitiveCategory(payload.category_slug) &&
    !payload.sensitive_disclaimer_confirmed
  ) {
    return "Sensitive categories must include the professional-advice disclaimer.";
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

  const quality = evaluateAgentQuality(payload);

  if (quality.submissionGateFailures.length > 0) {
    return quality.submissionGateFailures[0];
  }

  if (sanitizeSupportedLanguages(payload.supported_languages).length === 0) {
    return "At least one supported language is required.";
  }

  if (sanitizeStringArray(payload.demo_questions).length < 5) {
    return "At least 5 demo questions are required.";
  }

  if (sanitizeStringArray(payload.demo_answers).length < 5) {
    return "At least 5 demo answers are required.";
  }

  if (!payload.sample_conversation?.trim()) {
    return "A sample conversation is required.";
  }

  if (sanitizePricingPlans(payload.pricing_plans).length === 0) {
    return "At least one pricing plan is required.";
  }

  return validateDeliverySettings(payload);
}

function getFullDescription(payload: SellerAgentPayload, language: "en" | "zh") {
  if (language === "en") {
    return (
      payload.full_description_en?.trim() ||
      payload.description_en?.trim() ||
      ""
    );
  }

  return (
    payload.full_description_zh?.trim() ||
    payload.description_zh?.trim() ||
    ""
  );
}

function validateDeliverySettings(payload: SellerAgentPayload) {
  const settings = sanitizeDeliverySettings(payload.delivery_settings);

  if (payload.delivery_type === "prompt_template") {
    return requireDeliveryFields(settings, [
      "prompt_content",
      "usage_guide",
      "example_inputs_outputs",
    ]);
  }

  if (payload.delivery_type === "workflow_template") {
    return requireDeliveryFields(settings, [
      "workflow_platform_type",
      "import_instructions",
      "required_external_tools",
      "setup_guide",
    ]);
  }

  if (payload.delivery_type === "hosted_agent") {
    return requireDeliveryFields(settings, [
      "hosted_behavior",
      "configuration_fields",
    ]);
  }

  if (payload.delivery_type === "website_chatbot") {
    return requireDeliveryFields(settings, ["embed_documentation"]);
  }

  if (payload.delivery_type === "custom_business_agent") {
    return requireDeliveryFields(settings, ["custom_workflow_description"]);
  }

  return null;
}

function requireDeliveryFields(
  settings: Record<string, unknown>,
  keys: string[],
) {
  const missingKey = keys.find((key) => {
    const value = settings[key];

    return typeof value !== "string" || value.trim().length === 0;
  });

  return missingKey
    ? `Delivery setting is required: ${missingKey.replaceAll("_", " ")}.`
    : null;
}

function isSensitiveCategory(categorySlug?: string) {
  const normalized = categorySlug?.toLowerCase() ?? "";

  return (
    normalized === "legal" ||
    normalized.includes("medical") ||
    normalized.includes("healthcare") ||
    normalized.includes("financial") ||
    normalized.includes("finance")
  );
}

function normalizeDeliveryType(value: DeliveryType | undefined): DeliveryType {
  return value && DELIVERY_TYPES.includes(value) ? value : "prompt_template";
}

function normalizePricingType(value: PricingType | undefined): PricingType {
  return value && PRICING_TYPES.includes(value) ? value : "custom_quote";
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

function sanitizePricingPlans(value: PricingPlanPayload[] | undefined) {
  return Array.isArray(value)
    ? value
        .map((plan, index) => ({
          cta_label_en: plan.cta_label_en?.trim() ?? "",
          cta_label_zh: plan.cta_label_zh?.trim() ?? "",
          delivery_time_en: plan.delivery_time_en?.trim() ?? "",
          delivery_time_zh: plan.delivery_time_zh?.trim() ?? "",
          included_items_en: sanitizeStringArray(plan.included_items_en),
          included_items_zh: sanitizeStringArray(plan.included_items_zh),
          limitations_en: plan.limitations_en?.trim() ?? "",
          limitations_zh: plan.limitations_zh?.trim() ?? "",
          plan_id: plan.plan_id?.trim() || `plan-${index + 1}`,
          price_cny: normalizePrice(plan.price_cny),
          price_usd: normalizePrice(plan.price_usd),
          title_en: plan.title_en?.trim() ?? "",
          title_zh: plan.title_zh?.trim() ?? "",
        }))
        .filter((plan) => plan.title_en || plan.title_zh)
    : [];
}

function sanitizeDeliverySettings(value: Record<string, unknown> | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries: Array<[string, unknown]> = [];

  Object.entries(value).forEach(([key, item]) => {
    if (typeof item === "string") {
      entries.push([key, item.trim()]);
      return;
    }

    if (typeof item === "boolean" || typeof item === "number") {
      entries.push([key, item]);
      return;
    }

    if (Array.isArray(item)) {
      entries.push([key, sanitizeUnknownStringArray(item)]);
    }
  });

  return Object.fromEntries(entries);
}

function sanitizeUnknownStringArray(value: unknown[]) {
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
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
    price_cny: toNullableNumber(record.price_cny ?? null),
    price_usd: toNullableNumber(record.price_usd ?? null),
    pricing_plans: toRecordArray(record.pricing_plans),
    pricing_type: record.pricing_type,
    review_feedback: record.review_feedback ?? null,
    review_policy_confirmed: Boolean(record.review_policy_confirmed),
    review_reason_code: record.review_reason_code ?? null,
    revenue_share_type: record.revenue_share_type ?? null,
    creator_revenue_rate: toNullableNumber(record.creator_revenue_rate ?? null),
    platform_commission_rate: toNullableNumber(record.platform_commission_rate ?? null),
    sample_conversation: record.sample_conversation ?? "",
    screenshot_urls: toStringArray(record.screenshots),
    seller_email: sellerProfile?.email ?? "",
    setup_instructions_en: record.setup_instructions_en ?? "",
    setup_instructions_zh: record.setup_instructions_zh ?? "",
    sensitive_disclaimer_confirmed: Boolean(
      record.sensitive_disclaimer_confirmed,
    ),
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

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  const languages = toStringArray(value).filter((language): language is SupportedLanguage =>
    SUPPORTED_LANGUAGES.includes(language as SupportedLanguage),
  );

  return languages.length ? languages : ["en", "zh"];
}

function getApprovedMockSellerProfileId(sellerEmail: string) {
  const profile = getMockSellerProfileStore().find(
    (item) => item.email.toLowerCase() === sellerEmail.toLowerCase(),
  );

  return profile?.status === "approved" ? profile.id : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
