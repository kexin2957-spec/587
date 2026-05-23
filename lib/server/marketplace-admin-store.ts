import type {
  AgentStatus,
  DeliveryType,
  PricingType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  SellerApplicationStatus,
  SupportedLanguage,
} from "@/lib/marketplace/constants";
import { demoAgents, demoCategories, type DemoAgent } from "@/lib/marketplace/demo-data";

export type AdminAgentRecord = {
  admin_note?: string | null;
  category_slug: string;
  created_at: string;
  delivery_type: DeliveryType;
  id: string;
  is_featured: boolean;
  is_verified: boolean;
  owner_type: "platform" | "seller";
  price_cny: number | null;
  price_usd: number | null;
  pricing_type: PricingType;
  review_feedback?: string | null;
  seller_email: string | null;
  short_description_en: string;
  short_description_zh: string;
  slug: string;
  status: AgentStatus;
  title_en: string;
  title_zh: string;
  updated_at: string;
};

export type MockSellerAgentRecord = AdminAgentRecord & {
  changelog_en: string | null;
  changelog_zh: string | null;
  data_permissions_en: string;
  data_permissions_zh: string;
  demo_enabled: boolean;
  demo_url: string | null;
  description_en: string;
  description_zh: string;
  faq_en: Array<{ answer: string; question: string }>;
  faq_zh: Array<{ answer: string; question: string }>;
  features_en: string[];
  features_zh: string[];
  owner_type: "seller";
  screenshot_urls: string[];
  seller_email: string;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  supported_languages: SupportedLanguage[];
  tags: string[];
  version: string;
  video_url: string | null;
};

export type MockSellerApplicationRecord = {
  admin_note?: string | null;
  created_at: string;
  email: string;
  expertise: string;
  id: string;
  name: string;
  notes: string | null;
  offers_custom_services: boolean;
  payout_preference: string | null;
  planned_agent_types: string;
  status: SellerApplicationStatus;
  team_name: string | null;
  updated_at: string;
  website: string | null;
};

export type MockCustomRequestRecord = {
  admin_note?: string | null;
  agent_goal: string;
  budget_range: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string | null;
  created_at: string;
  existing_website: string;
  has_documents: boolean;
  id: string;
  industry: string;
  notes: string | null;
  required_integrations: string;
  language?: string | null;
  source_page?: string | null;
  status: "new" | "contacted" | "quoted" | "in_progress" | "completed" | "rejected";
  timeline: string;
  updated_at: string;
};

export type MockPurchaseRequestRecord = {
  admin_note?: string | null;
  agent_id: string;
  agent_slug: string;
  budget_range: string | null;
  company: string | null;
  created_at: string;
  email: string;
  id: string;
  language: string | null;
  message: string | null;
  name: string;
  preferred_contact_method: string | null;
  request_type: PurchaseRequestType;
  required_integrations: string | null;
  setup_needs: string | null;
  source_page: string | null;
  status: PurchaseRequestStatus;
  timeline: string | null;
  updated_at?: string;
  website_url: string | null;
  what_should_be_customized: string | null;
};

type AgentOverride = {
  admin_note?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
  review_feedback?: string | null;
  status?: AgentStatus;
  updated_at?: string;
};

type MarketplaceGlobalStore = typeof globalThis & {
  agentAdminOverrideStore?: Record<string, AgentOverride>;
  customRequestMockStore?: MockCustomRequestRecord[];
  purchaseRequestMockStore?: MockPurchaseRequestRecord[];
  sellerAgentMockStore?: MockSellerAgentRecord[];
  sellerApplicationMockStore?: MockSellerApplicationRecord[];
};

export function getMockSellerAgentStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.sellerAgentMockStore) {
    store.sellerAgentMockStore = [];
  }

  return store.sellerAgentMockStore;
}

export function getMockSellerApplicationStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.sellerApplicationMockStore) {
    store.sellerApplicationMockStore = [];
  }

  return store.sellerApplicationMockStore;
}

export function getMockCustomRequestStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.customRequestMockStore) {
    store.customRequestMockStore = [];
  }

  return store.customRequestMockStore;
}

export function getMockPurchaseRequestStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.purchaseRequestMockStore) {
    store.purchaseRequestMockStore = [];
  }

  return store.purchaseRequestMockStore;
}

export function getAgentOverrideStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.agentAdminOverrideStore) {
    store.agentAdminOverrideStore = {};
  }

  return store.agentAdminOverrideStore;
}

export function getAdminAgentRecords(): AdminAgentRecord[] {
  return [
    ...getMockSellerAgentStore().map((agent) => ({ ...agent })),
    ...demoAgents.map(getPlatformAdminAgent),
  ].sort((agentA, agentB) => agentB.created_at.localeCompare(agentA.created_at));
}

export function getPublicAgents(): DemoAgent[] {
  const approvedPlatformAgents = demoAgents
    .map((agent) => applyPlatformOverride(agent))
    .filter((agent) => getPlatformStatus(agent.slug) === "approved");
  const approvedSellerAgents = getMockSellerAgentStore()
    .filter((agent) => agent.status === "approved")
    .map(sellerAgentToDemoAgent);

  return [...approvedPlatformAgents, ...approvedSellerAgents];
}

export function getPublicAgentBySlug(slug: string) {
  return getPublicAgents().find((agent) => agent.slug === slug) ?? null;
}

export function sellerAgentToDemoAgent(agent: MockSellerAgentRecord): DemoAgent {
  return {
    categorySlug: agent.category_slug,
    dataPermissionsEn: agent.data_permissions_en,
    dataPermissionsZh: agent.data_permissions_zh,
    demoEnabled: agent.demo_enabled,
    demoUrl: agent.demo_url ?? "",
    deliveryType: agent.delivery_type,
    descriptionEn: agent.description_en,
    descriptionZh: agent.description_zh,
    faqEn: agent.faq_en,
    faqZh: agent.faq_zh,
    featuresEn: agent.features_en,
    featuresZh: agent.features_zh,
    installCount: 0,
    isFeatured: agent.is_featured,
    isVerified: agent.is_verified,
    ownerType: "seller",
    priceCny: agent.price_cny,
    priceUsd: agent.price_usd,
    pricingType: agent.pricing_type,
    purchaseCount: 0,
    rating: 0,
    reviewCount: 0,
    setupInstructionsEn: agent.setup_instructions_en,
    setupInstructionsZh: agent.setup_instructions_zh,
    shortDescriptionEn: agent.short_description_en,
    shortDescriptionZh: agent.short_description_zh,
    slug: agent.slug,
    supportedLanguages: agent.supported_languages,
    tags: agent.tags,
    titleEn: agent.title_en,
    titleZh: agent.title_zh,
    createdAt: agent.created_at,
    creatorName: agent.seller_email,
  };
}

export function getPlatformAdminAgent(agent: DemoAgent): AdminAgentRecord {
  const override = getAgentOverrideStore()[agent.slug] ?? {};

  return {
    admin_note: override.admin_note ?? null,
    category_slug: agent.categorySlug,
    created_at: agent.createdAt ?? "2026-05-01T00:00:00.000Z",
    delivery_type: agent.deliveryType,
    id: agent.slug,
    is_featured: override.is_featured ?? agent.isFeatured,
    is_verified: override.is_verified ?? agent.isVerified,
    owner_type: "platform",
    price_cny: agent.priceCny,
    price_usd: agent.priceUsd,
    pricing_type: agent.pricingType,
    review_feedback: override.review_feedback ?? null,
    seller_email: null,
    short_description_en: agent.shortDescriptionEn,
    short_description_zh: agent.shortDescriptionZh,
    slug: agent.slug,
    status: override.status ?? "approved",
    title_en: agent.titleEn,
    title_zh: agent.titleZh,
    updated_at: override.updated_at ?? "2026-05-01T00:00:00.000Z",
  };
}

export function getCategoryLabel(slug: string) {
  const category = demoCategories.find((item) => item.slug === slug);

  return category?.nameEn ?? slug;
}

function applyPlatformOverride(agent: DemoAgent): DemoAgent {
  const override = getAgentOverrideStore()[agent.slug] ?? {};

  return {
    ...agent,
    isFeatured: override.is_featured ?? agent.isFeatured,
    isVerified: override.is_verified ?? agent.isVerified,
  };
}

function getPlatformStatus(slug: string) {
  return getAgentOverrideStore()[slug]?.status ?? "approved";
}
