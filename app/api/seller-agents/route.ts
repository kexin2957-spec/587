import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { demoAgents, demoCategories } from "@/lib/marketplace/demo-data";
import { getMockSellerAgentStore } from "@/lib/server/marketplace-admin-store";
import {
  DELIVERY_TYPES,
  PRICING_TYPES,
  SUPPORTED_LANGUAGES,
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
  screenshot_urls?: string[];
  seller_email?: string;
  setup_instructions_en?: string;
  setup_instructions_zh?: string;
  short_description_en?: string;
  short_description_zh?: string;
  supported_languages?: SupportedLanguage[];
  tags?: string[];
  title_en?: string;
  title_zh?: string;
  version?: string;
  video_url?: string;
};

type MockSellerAgent = {
  category_slug: string;
  changelog_en: string | null;
  changelog_zh: string | null;
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
  price_cny: number | null;
  price_usd: number | null;
  pricing_type: PricingType;
  screenshot_urls: string[];
  seller_email: string;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: "submitted";
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
  pricing_type: PricingType;
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
  status: string;
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

export async function GET() {
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
        "id, slug, owner_type, status, is_featured, is_verified, title_en, title_zh, short_description_en, short_description_zh, pricing_type, delivery_type, category_id, created_at, updated_at, agent_categories(slug, name_en, name_zh), seller_profiles(email, display_name, team_name)",
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
  const payload = (await request.json()) as SellerAgentPayload;
  const slug = createSlug(payload.title_en || payload.title_zh || "");
  const validationError = validatePayload(payload, slug);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedPayload = normalizePayload(payload, slug);
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
        price_cny: normalizedPayload.price_cny,
        price_usd: normalizedPayload.price_usd,
        pricing_type: normalizedPayload.pricing_type,
        screenshots: normalizedPayload.screenshot_urls,
        seller_id: sellerIdResult.sellerId,
        setup_instructions_en: normalizedPayload.setup_instructions_en,
        setup_instructions_zh: normalizedPayload.setup_instructions_zh,
        short_description_en: normalizedPayload.short_description_en,
        short_description_zh: normalizedPayload.short_description_zh,
        slug,
        status: "submitted",
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
  const mockAgent: MockSellerAgent = {
    ...normalizedPayload,
    created_at: now,
    id: crypto.randomUUID(),
    is_featured: false,
    is_verified: false,
    owner_type: "seller",
    slug,
    status: "submitted",
    updated_at: now,
  };

  getMockSellerAgentStore().push(mockAgent);

  return NextResponse.json(
    { id: mockAgent.id, mode: "mock", ok: true, slug },
    { status: 201 },
  );
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

function validatePayload(payload: SellerAgentPayload, slug: string) {
  if (!payload.seller_email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.seller_email)) {
    return "A valid seller email is required.";
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
    pricing_type: record.pricing_type,
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
