import { createClient } from "@supabase/supabase-js";
import {
  getPublicAgentBySlug,
  getPublicAgents,
} from "@/lib/server/marketplace-admin-store";
import type {
  DeliveryType,
  OrderPlanId,
  OwnerType,
  PricingType,
  RevenueShareType,
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
  creator_revenue_rate?: number | string | null;
  custom_upgrade_options_en?: string | null;
  custom_upgrade_options_zh?: string | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_type: DeliveryType;
  demo_answers?: unknown;
  demo_enabled?: boolean | null;
  demo_questions?: unknown;
  demo_url?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: unknown;
  faq_zh?: unknown;
  id?: string | null;
  features_en?: unknown;
  features_zh?: unknown;
  install_count?: number | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  limitations_en?: string | null;
  limitations_zh?: string | null;
  owner_type?: OwnerType | null;
  platform_commission_rate?: number | string | null;
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_plans?: unknown;
  pricing_type: PricingType;
  purchase_count?: number | null;
  rating?: number | string | null;
  revenue_share_type?: RevenueShareType | string | null;
  review_count?: number | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  seller_id?: string | null;
  seller_profiles?:
    | {
        display_name?: string | null;
        email?: string | null;
        expertise?: string | null;
        team_name?: string | null;
        website?: string | null;
      }
    | {
        display_name?: string | null;
        email?: string | null;
        expertise?: string | null;
        team_name?: string | null;
        website?: string | null;
      }[]
    | null;
  short_description_en?: string | null;
  short_description_zh?: string | null;
  slug: string;
  supported_languages?: unknown;
  tags?: unknown;
  title_en?: string | null;
  title_zh?: string | null;
  use_cases_en?: unknown;
  use_cases_zh?: unknown;
  what_customer_receives_en?: string | null;
  what_customer_receives_zh?: string | null;
  who_it_is_for_en?: string | null;
  who_it_is_for_zh?: string | null;
};

export const publicAgentSelect = [
  "id",
  "slug",
  "owner_type",
  "seller_id",
  "is_featured",
  "is_verified",
  "pricing_type",
  "price_usd",
  "price_cny",
  "pricing_plans",
  "revenue_share_type",
  "creator_revenue_rate",
  "platform_commission_rate",
  "delivery_type",
  "demo_url",
  "demo_enabled",
  "demo_questions",
  "demo_answers",
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
  "who_it_is_for_en",
  "who_it_is_for_zh",
  "what_customer_receives_en",
  "what_customer_receives_zh",
  "limitations_en",
  "limitations_zh",
  "custom_upgrade_options_en",
  "custom_upgrade_options_zh",
  "use_cases_en",
  "use_cases_zh",
  "supported_languages",
  "tags",
  "created_at",
  "category_id",
  "agent_categories(slug)",
  "seller_profiles(display_name, team_name, email, website, expertise)",
].join(", ");

export async function loadPublicMarketplaceAgents(): Promise<PublicAgentResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = serviceRoleKey || anonKey;

  if (!supabaseUrl && !supabaseKey) {
    return { agents: getPublicAgents(), mode: "mock" };
  }

  if (!supabaseUrl || !supabaseKey) {
    return {
      agents: [],
      error: "Supabase URL and access key must both be configured.",
      mode: "supabase",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("marketplace_agents")
    .select(publicAgentSelect)
    .in("status", ["approved", "published"])
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = serviceRoleKey || anonKey;

  if (!supabaseUrl && !supabaseKey) {
    return { agent: getPublicAgentBySlug(slug), error: null, mode: "mock" as const };
  }

  if (!supabaseUrl || !supabaseKey) {
    return {
      agent: null,
      error: "Supabase URL and access key must both be configured.",
      mode: "supabase" as const,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("marketplace_agents")
    .select(publicAgentSelect)
    .in("status", ["approved", "published"])
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

export function normalizeSupabasePublicAgent(record: SupabasePublicAgentRecord): DemoAgent {
  const category = firstRelation(record.agent_categories);
  const sellerProfile = firstRelation(record.seller_profiles);
  const sellerDisplayName =
    sellerProfile?.team_name ||
    sellerProfile?.display_name ||
    sellerProfile?.email ||
    "Seller";
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
    creatorName: record.owner_type === "seller" ? sellerDisplayName : undefined,
    creatorRevenueRate: toNullableNumber(record.creator_revenue_rate) ?? undefined,
    dataPermissionsEn: record.data_permissions_en?.trim() ?? "",
    dataPermissionsZh: record.data_permissions_zh?.trim() ?? "",
    demoSamplesEn: buildDemoSamples(record.demo_questions, record.demo_answers),
    demoSamplesZh: buildDemoSamples(record.demo_questions, record.demo_answers),
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
    marketplaceAgentId: record.id ?? undefined,
    limitationsEn: splitMultiline(record.limitations_en),
    limitationsZh: splitMultiline(record.limitations_zh),
    ownerType: record.owner_type ?? "platform",
    platformCommissionRate:
      toNullableNumber(record.platform_commission_rate) ?? undefined,
    priceCny: toNullableNumber(record.price_cny),
    priceUsd: toNullableNumber(record.price_usd),
    revenueShareType: isRevenueShareType(record.revenue_share_type)
      ? record.revenue_share_type
      : undefined,
    pricingType: record.pricing_type,
    purchaseCount: record.purchase_count ?? 0,
    rating: toNullableNumber(record.rating) ?? 0,
    reviewCount: record.review_count ?? 0,
    setupInstructionsEn: record.setup_instructions_en?.trim() ?? "",
    setupInstructionsZh: record.setup_instructions_zh?.trim() ?? "",
    sellerEmail: sellerProfile?.email ?? undefined,
    sellerId: record.seller_id ?? null,
    sellerPricingPlans: normalizeSellerPricingPlans(record.pricing_plans),
    sellerProfile:
      record.owner_type === "seller"
        ? {
            displayName: sellerDisplayName,
            email: sellerProfile?.email ?? undefined,
            expertise: sellerProfile?.expertise ?? null,
            teamName: sellerProfile?.team_name ?? null,
            website: sellerProfile?.website ?? null,
          }
        : undefined,
    shortDescriptionEn,
    shortDescriptionZh,
    slug: record.slug,
    supportedLanguages: toSupportedLanguages(record.supported_languages),
    tags: toStringArray(record.tags),
    titleEn,
    titleZh,
    targetCustomersEn: splitMultiline(record.who_it_is_for_en),
    targetCustomersZh: splitMultiline(record.who_it_is_for_zh),
    useCasesEn: toStringArray(record.use_cases_en),
    useCasesZh: toStringArray(record.use_cases_zh),
    whatCustomerReceivesEn: splitMultiline(record.what_customer_receives_en),
    whatCustomerReceivesZh: splitMultiline(record.what_customer_receives_zh),
    customUpgradeOptionsEn: splitMultiline(record.custom_upgrade_options_en),
    customUpgradeOptionsZh: splitMultiline(record.custom_upgrade_options_zh),
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

function buildDemoSamples(questions: unknown, answers: unknown): DemoFaqItem[] {
  const normalizedQuestions = toStringArray(questions);
  const normalizedAnswers = toStringArray(answers);

  return normalizedQuestions
    .map((question, index) => ({
      answer: normalizedAnswers[index] ?? "",
      question,
    }))
    .filter((sample) => sample.question && sample.answer);
}

function normalizeSellerPricingPlans(value: unknown): NonNullable<DemoAgent["sellerPricingPlans"]> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const planId = normalizeOrderPlanId(record.plan_id, index);

      if (!planId) {
        return null;
      }

      return {
        ctaLabelEn: getString(record.cta_label_en),
        ctaLabelZh: getString(record.cta_label_zh),
        deliveryTimeEn: getString(record.delivery_time_en),
        deliveryTimeZh: getString(record.delivery_time_zh),
        includedItemsEn: toStringArray(record.included_items_en),
        includedItemsZh: toStringArray(record.included_items_zh),
        limitationsEn: splitMultiline(getString(record.limitations_en)),
        limitationsZh: splitMultiline(getString(record.limitations_zh)),
        planId,
        priceCny: toNullableNumber(record.price_cny),
        priceUsd: toNullableNumber(record.price_usd),
        titleEn: getString(record.title_en),
        titleZh: getString(record.title_zh),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function normalizeOrderPlanId(value: unknown, index: number): OrderPlanId | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  const fallbackIds: OrderPlanId[] = [
    "agent_only",
    "agent_setup",
    "custom_version",
  ];
  const allowed = new Set<OrderPlanId>(fallbackIds);

  if (allowed.has(normalized as OrderPlanId)) {
    return normalized as OrderPlanId;
  }

  return fallbackIds[index] ?? null;
}

function splitMultiline(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRevenueShareType(value: unknown): value is RevenueShareType {
  return (
    value === "platform_owned" ||
    value === "third_party_standard" ||
    value === "creator_referral" ||
    value === "custom_service_order"
  );
}

function toSupportedLanguages(value: unknown): SupportedLanguage[] {
  const languages = toStringArray(value).filter((language): language is SupportedLanguage =>
    SUPPORTED_LANGUAGES.includes(language as SupportedLanguage),
  );

  return languages.length ? languages : ["en", "zh"];
}

function toNullableNumber(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
