import { createClient } from "@supabase/supabase-js";
import {
  getPublicAgentBySlug,
  getPublicAgents,
} from "@/lib/server/marketplace-admin-store";
import type {
  DeliveryType,
  OwnerType,
  PricingType,
  SupportedLanguage,
} from "@/lib/marketplace/constants";
import { SUPPORTED_LANGUAGES } from "@/lib/marketplace/constants";
import {
  demoAgents,
  type DemoAgent,
  type DemoFaqItem,
} from "@/lib/marketplace/demo-data";

type PublicAgentResult = {
  agents: DemoAgent[];
  error?: string;
  mode: "mock" | "supabase";
};

type SupabasePublicAgentRecord = {
  agent_categories?: { slug?: string | null } | { slug?: string | null }[] | null;
  category_id?: string | null;
  created_at?: string | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_type: DeliveryType;
  demo_enabled?: boolean | null;
  demo_url?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: unknown;
  faq_zh?: unknown;
  features_en?: unknown;
  features_zh?: unknown;
  install_count?: number | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  owner_type?: OwnerType | null;
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_type: PricingType;
  purchase_count?: number | null;
  rating?: number | string | null;
  review_count?: number | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  short_description_en?: string | null;
  short_description_zh?: string | null;
  slug: string;
  supported_languages?: unknown;
  tags?: unknown;
  title_en?: string | null;
  title_zh?: string | null;
};

const publicAgentSelect = [
  "slug",
  "owner_type",
  "is_featured",
  "is_verified",
  "pricing_type",
  "price_usd",
  "price_cny",
  "delivery_type",
  "demo_url",
  "demo_enabled",
  "rating",
  "review_count",
  "purchase_count",
  "install_count",
  "title_en",
  "title_zh",
  "short_description_en",
  "short_description_zh",
  "description_en",
  "description_zh",
  "features_en",
  "features_zh",
  "faq_en",
  "faq_zh",
  "setup_instructions_en",
  "setup_instructions_zh",
  "data_permissions_en",
  "data_permissions_zh",
  "supported_languages",
  "tags",
  "created_at",
  "category_id",
  "agent_categories(slug)",
].join(", ");

export async function loadPublicMarketplaceAgents(): Promise<PublicAgentResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl && !anonKey) {
    return { agents: getPublicAgents(), mode: "mock" };
  }

  if (!supabaseUrl || !anonKey) {
    return {
      agents: [],
      error: "Supabase URL and anon key must both be configured.",
      mode: "supabase",
    };
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase
    .from("marketplace_agents")
    .select(publicAgentSelect)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { agents: [], error: error.message, mode: "supabase" };
  }

  return {
    agents: (data ?? []).map((record) =>
      normalizeSupabasePublicAgent(record as unknown as SupabasePublicAgentRecord),
    ),
    mode: "supabase",
  };
}

export async function loadPublicMarketplaceAgentBySlug(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl && !anonKey) {
    return { agent: getPublicAgentBySlug(slug), error: null, mode: "mock" as const };
  }

  if (!supabaseUrl || !anonKey) {
    return {
      agent: null,
      error: "Supabase URL and anon key must both be configured.",
      mode: "supabase" as const,
    };
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase
    .from("marketplace_agents")
    .select(publicAgentSelect)
    .eq("status", "approved")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { agent: null, error: error.message, mode: "supabase" as const };
  }

  return {
    agent: data
      ? normalizeSupabasePublicAgent(data as unknown as SupabasePublicAgentRecord)
      : null,
    error: null,
    mode: "supabase" as const,
  };
}

function normalizeSupabasePublicAgent(record: SupabasePublicAgentRecord): DemoAgent {
  const category = firstRelation(record.agent_categories);
  const titleEn = record.title_en?.trim() || record.title_zh?.trim() || record.slug;
  const titleZh = record.title_zh?.trim() || titleEn;
  const shortDescriptionEn =
    record.short_description_en?.trim() || record.short_description_zh?.trim() || "";
  const shortDescriptionZh =
    record.short_description_zh?.trim() || shortDescriptionEn;
  const descriptionEn =
    record.description_en?.trim() || record.description_zh?.trim() || "";
  const descriptionZh = record.description_zh?.trim() || descriptionEn;

  const agent: DemoAgent = {
    categorySlug: category?.slug ?? record.category_id ?? "",
    createdAt: record.created_at ?? undefined,
    creatorName: record.owner_type === "seller" ? "Seller" : undefined,
    dataPermissionsEn: record.data_permissions_en?.trim() ?? "",
    dataPermissionsZh: record.data_permissions_zh?.trim() ?? "",
    demoEnabled: Boolean(record.demo_enabled),
    demoUrl: record.demo_url?.trim() || "",
    deliveryType: record.delivery_type,
    descriptionEn,
    descriptionZh,
    faqEn: toFaqItems(record.faq_en),
    faqZh: toFaqItems(record.faq_zh),
    featuresEn: toStringArray(record.features_en),
    featuresZh: toStringArray(record.features_zh),
    installCount: record.install_count ?? 0,
    isFeatured: Boolean(record.is_featured),
    isVerified: Boolean(record.is_verified),
    ownerType: record.owner_type ?? "platform",
    priceCny: toNullableNumber(record.price_cny),
    priceUsd: toNullableNumber(record.price_usd),
    pricingType: record.pricing_type,
    purchaseCount: record.purchase_count ?? 0,
    rating: toNullableNumber(record.rating) ?? 0,
    reviewCount: record.review_count ?? 0,
    setupInstructionsEn: record.setup_instructions_en?.trim() ?? "",
    setupInstructionsZh: record.setup_instructions_zh?.trim() ?? "",
    shortDescriptionEn,
    shortDescriptionZh,
    slug: record.slug,
    supportedLanguages: toSupportedLanguages(record.supported_languages),
    tags: toStringArray(record.tags),
    titleEn,
    titleZh,
  };

  return withStaticProductEnrichment(agent);
}

function withStaticProductEnrichment(agent: DemoAgent): DemoAgent {
  const launchProductSlugs = [
    "website-customer-support-agent",
    "ecommerce-product-support-agent",
  ];

  if (!launchProductSlugs.includes(agent.slug)) {
    return agent;
  }

  const enrichedAgent = demoAgents.find((item) => item.slug === agent.slug);

  if (!enrichedAgent) {
    return agent;
  }

  return {
    ...agent,
    categorySlug: enrichedAgent.categorySlug,
    createdAt: enrichedAgent.createdAt,
    dataPermissionsEn: enrichedAgent.dataPermissionsEn,
    dataPermissionsZh: enrichedAgent.dataPermissionsZh,
    deliveryType: enrichedAgent.deliveryType,
    descriptionEn: enrichedAgent.descriptionEn,
    descriptionZh: enrichedAgent.descriptionZh,
    demoEnabled: enrichedAgent.demoEnabled,
    demoSamplesEn: enrichedAgent.demoSamplesEn,
    demoSamplesZh: enrichedAgent.demoSamplesZh,
    demoUrl: enrichedAgent.demoUrl,
    faqEn: enrichedAgent.faqEn,
    faqZh: enrichedAgent.faqZh,
    featuresEn: enrichedAgent.featuresEn,
    featuresZh: enrichedAgent.featuresZh,
    installCount: enrichedAgent.installCount,
    isFeatured: enrichedAgent.isFeatured,
    isVerified: enrichedAgent.isVerified,
    ownerType: enrichedAgent.ownerType,
    priceCny: enrichedAgent.priceCny,
    priceUsd: enrichedAgent.priceUsd,
    pricingOptionsEn: enrichedAgent.pricingOptionsEn,
    pricingOptionsZh: enrichedAgent.pricingOptionsZh,
    pricingType: enrichedAgent.pricingType,
    purchaseCount: enrichedAgent.purchaseCount,
    rating: enrichedAgent.rating,
    reviewCount: enrichedAgent.reviewCount,
    setupInstructionsEn: enrichedAgent.setupInstructionsEn,
    setupInstructionsZh: enrichedAgent.setupInstructionsZh,
    shortDescriptionEn: enrichedAgent.shortDescriptionEn,
    shortDescriptionZh: enrichedAgent.shortDescriptionZh,
    supportedLanguages: enrichedAgent.supportedLanguages,
    tags: enrichedAgent.tags,
    targetCustomersEn: enrichedAgent.targetCustomersEn,
    targetCustomersZh: enrichedAgent.targetCustomersZh,
    titleEn: enrichedAgent.titleEn,
    titleZh: enrichedAgent.titleZh,
    useCasesEn: enrichedAgent.useCasesEn,
    useCasesZh: enrichedAgent.useCasesZh,
    customUpgradeOptionsEn: enrichedAgent.customUpgradeOptionsEn,
    customUpgradeOptionsZh: enrichedAgent.customUpgradeOptionsZh,
    coverImageStyleEn: enrichedAgent.coverImageStyleEn,
    coverImageStyleZh: enrichedAgent.coverImageStyleZh,
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

function toFaqItems(value: unknown): DemoFaqItem[] {
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
    .filter((item): item is DemoFaqItem => Boolean(item));
}

function toSupportedLanguages(value: unknown): SupportedLanguage[] {
  const languages = toStringArray(value).filter((language): language is SupportedLanguage =>
    SUPPORTED_LANGUAGES.includes(language as SupportedLanguage),
  );

  return languages.length ? languages : ["en", "zh"];
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
