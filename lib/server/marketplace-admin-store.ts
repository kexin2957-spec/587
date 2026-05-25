import type {
  AgentStatus,
  DeliveryStatus,
  DeliveryType,
  OrderPlanId,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PayoutStatus,
  PricingType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  RevenueShareType,
  SellerApplicationStatus,
  SellerStatus,
  SupportedLanguage,
  LeadIntent,
  LeadScore,
  LeadStatus,
  LicenseStatus,
  BillingInterval,
  CustomerConfigStatus,
  KnowledgeDocumentType,
  PaymentProvider,
  UsageEventType,
  SubscriptionStatus,
  WidgetPosition,
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
  creator_revenue_rate: number;
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
  platform_commission_rate: number;
  revenue_share_type: RevenueShareType;
  screenshot_urls: string[];
  seller_email: string;
  setup_instructions_en: string;
  setup_instructions_zh: string;
  supported_languages: SupportedLanguage[];
  tags: string[];
  version: string;
  video_url: string | null;
};

export type MockSellerProfileRecord = {
  created_at: string;
  display_name: string;
  email: string;
  expertise: string | null;
  id: string;
  offers_custom_services: boolean;
  payout_preference: string | null;
  status: SellerStatus;
  team_name: string | null;
  updated_at: string;
  user_id: string | null;
  website: string | null;
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

export type MockSellerPayoutRecord = {
  amount: number;
  created_at: string;
  currency: "USD" | "CNY";
  id: string;
  notes: string | null;
  seller_email: string;
  seller_id: string;
  status: PayoutStatus;
  updated_at: string;
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

export type MockSalesLeadRecord = {
  budget_range: string;
  business_type: string;
  contact_email: string | null;
  contact_method: string;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  customer_type: string | null;
  desired_agent_function: string;
  id: string;
  industry: string;
  interest_level: string | null;
  notes: string | null;
  salesperson_code: string | null;
  source_channel: string | null;
  status: "new" | "contacted" | "qualified" | "closed" | "invalid";
  timeline: string;
  updated_at: string;
  website: string;
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

export type MockOrderRecord = {
  agent_id: string;
  agent_slug: string;
  amount_cny: number | null;
  amount_usd: number | null;
  billing_interval: BillingInterval;
  cancel_at: string | null;
  company_name: string | null;
  created_at: string;
  currency: "USD" | "CNY";
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  delivery_status: DeliveryStatus;
  id: string;
  message: string | null;
  order_number: string;
  order_status: OrderStatus;
  payment_link_url: string | null;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  paypal_order_id: string | null;
  plan_id: OrderPlanId;
  plan_name: string;
  next_billing_date: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  subscription_status: SubscriptionStatus;
  updated_at: string;
  website_url: string | null;
};

export type MockOrderNoteRecord = {
  created_at: string;
  id: string;
  note: string;
  order_id: string;
};

export type MockPaymentRecord = {
  amount: number;
  created_at: string;
  currency: "USD" | "CNY";
  id: string;
  metadata: Record<string, unknown>;
  order_id: string;
  paid_at: string | null;
  payment_url: string | null;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  status: Exclude<PaymentStatus, "manually_approved">;
  updated_at: string;
};

export type MockDeliveryPackageRecord = {
  agent_id: string;
  allowed_domains: string[];
  created_at: string;
  customer_access_token: string | null;
  customer_dashboard_url: string | null;
  delivery_notes: string | null;
  documentation_url: string | null;
  embed_code: string | null;
  hosted_agent_url: string | null;
  id: string;
  license_key: string | null;
  order_id: string;
  updated_at: string;
};

export type MockAgentLicenseRecord = {
  agent_id: string;
  allowed_domains: string[];
  created_at: string;
  customer_email: string;
  customer_name: string;
  expires_at: string | null;
  id: string;
  license_key: string;
  order_id: string;
  plan_name: string;
  status: LicenseStatus;
  updated_at: string;
  usage_count_monthly: number;
  usage_limit_monthly: number | null;
};

export type MockUsageLogRecord = {
  agent_id: string;
  created_at: string;
  domain: string | null;
  event_type: UsageEventType;
  id: string;
  license_id: string | null;
  metadata: Record<string, unknown>;
};

export type MockAgentSessionRecord = {
  agent_id: string;
  id: string;
  language: string;
  last_message_at: string;
  license_id: string | null;
  order_id: string | null;
  source_url: string | null;
  started_at: string;
  visitor_id: string;
};

export type MockAgentMessageRecord = {
  content: string;
  created_at: string;
  id: string;
  intent: string | null;
  lead_score: LeadScore | null;
  metadata: Record<string, unknown>;
  role: "assistant" | "user";
  session_id: string;
};

export type MockAuditLogRecord = {
  action: string;
  actor_id: string | null;
  actor_type: "admin" | "buyer" | "customer" | "seller" | "system";
  created_at: string;
  id: string;
  metadata: Record<string, unknown>;
  resource_id: string | null;
  resource_type: string;
};

export type MockCustomerAgentConfigRecord = {
  agent_id: string | null;
  agent_slug: string;
  avatar_url: string | null;
  brand_tone: string | null;
  business_description: string;
  business_description_en?: string | null;
  business_description_zh?: string | null;
  business_hours: string | null;
  business_name: string;
  company_introduction: string;
  contact_email: string;
  contact_information: string | null;
  contact_phone: string | null;
  created_at: string;
  custom_instructions: string | null;
  customer_email: string | null;
  disallowed_claims: string | null;
  faq: Array<{ answer: string; question: string }>;
  faq_items?: MockCustomerFaqItemRecord[];
  handoff_rules: string | null;
  id: string;
  knowledge_documents?: MockKnowledgeDocumentRecord[];
  license_id: string | null;
  offline_message: string;
  order_id: string | null;
  order_number: string | null;
  pricing_ranges: string | null;
  pricing_ranges_en?: string | null;
  pricing_ranges_zh?: string | null;
  primary_color: string;
  services_or_products: string;
  services_or_products_en?: string | null;
  services_or_products_zh?: string | null;
  services_products: string;
  status: CustomerConfigStatus;
  updated_at: string;
  welcome_message: string;
  welcome_message_en?: string | null;
  welcome_message_zh?: string | null;
  website_url: string | null;
  widget_position: WidgetPosition;
};

export type MockCustomerFaqItemRecord = {
  answer: string;
  config_id: string;
  created_at: string;
  id: string;
  is_active: boolean;
  language: "en" | "zh";
  question: string;
  updated_at: string;
};

export type MockKnowledgeDocumentRecord = {
  config_id: string;
  content: string;
  created_at: string;
  document_type: KnowledgeDocumentType;
  id: string;
  is_active: boolean;
  title: string;
  updated_at: string;
};

export type MockLeadRecord = {
  admin_note?: string | null;
  agent_id: string | null;
  agent_slug: string;
  conversation_summary: string;
  created_at: string;
  customer_config_id: string | null;
  id: string;
  inquiry: string;
  intent: LeadIntent;
  lead_score: LeadScore;
  needs_human: boolean;
  order_id: string | null;
  order_number: string | null;
  status: LeadStatus;
  transcript: unknown;
  updated_at: string;
  visitor_company: string | null;
  visitor_email: string;
  visitor_name: string;
  visitor_phone: string | null;
};

type AgentOverride = {
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
  updated_at?: string;
};

type MarketplaceGlobalStore = typeof globalThis & {
  agentAdminOverrideStore?: Record<string, AgentOverride>;
  auditLogMockStore?: MockAuditLogRecord[];
  customRequestMockStore?: MockCustomRequestRecord[];
  customerAgentConfigMockStore?: MockCustomerAgentConfigRecord[];
  deliveryPackageMockStore?: MockDeliveryPackageRecord[];
  licenseMockStore?: MockAgentLicenseRecord[];
  agentMessageMockStore?: MockAgentMessageRecord[];
  agentSessionMockStore?: MockAgentSessionRecord[];
  customerFaqItemMockStore?: MockCustomerFaqItemRecord[];
  leadMockStore?: MockLeadRecord[];
  knowledgeDocumentMockStore?: MockKnowledgeDocumentRecord[];
  orderMockStore?: MockOrderRecord[];
  orderNoteMockStore?: MockOrderNoteRecord[];
  paymentMockStore?: MockPaymentRecord[];
  purchaseRequestMockStore?: MockPurchaseRequestRecord[];
  salesLeadMockStore?: MockSalesLeadRecord[];
  sellerAgentMockStore?: MockSellerAgentRecord[];
  sellerApplicationMockStore?: MockSellerApplicationRecord[];
  sellerPayoutMockStore?: MockSellerPayoutRecord[];
  sellerProfileMockStore?: MockSellerProfileRecord[];
  usageLogMockStore?: MockUsageLogRecord[];
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

export function getMockSellerProfileStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.sellerProfileMockStore) {
    store.sellerProfileMockStore = [];
  }

  return store.sellerProfileMockStore;
}

export function getMockSellerPayoutStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.sellerPayoutMockStore) {
    store.sellerPayoutMockStore = [];
  }

  return store.sellerPayoutMockStore;
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

export function getMockSalesLeadStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.salesLeadMockStore) {
    store.salesLeadMockStore = [];
  }

  return store.salesLeadMockStore;
}

export function getMockOrderStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.orderMockStore) {
    store.orderMockStore = [];
  }

  return store.orderMockStore;
}

export function getMockOrderNoteStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.orderNoteMockStore) {
    store.orderNoteMockStore = [];
  }

  return store.orderNoteMockStore;
}

export function getMockPaymentStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.paymentMockStore) {
    store.paymentMockStore = [];
  }

  return store.paymentMockStore;
}

export function getMockDeliveryPackageStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.deliveryPackageMockStore) {
    store.deliveryPackageMockStore = [];
  }

  return store.deliveryPackageMockStore;
}

export function getMockAgentLicenseStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.licenseMockStore) {
    store.licenseMockStore = [];
  }

  return store.licenseMockStore;
}

export function getMockUsageLogStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.usageLogMockStore) {
    store.usageLogMockStore = [];
  }

  return store.usageLogMockStore;
}

export function getMockAgentSessionStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.agentSessionMockStore) {
    store.agentSessionMockStore = [];
  }

  return store.agentSessionMockStore;
}

export function getMockAgentMessageStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.agentMessageMockStore) {
    store.agentMessageMockStore = [];
  }

  return store.agentMessageMockStore;
}

export function getMockAuditLogStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.auditLogMockStore) {
    store.auditLogMockStore = [];
  }

  return store.auditLogMockStore;
}

export function getMockCustomerAgentConfigStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.customerAgentConfigMockStore) {
    store.customerAgentConfigMockStore = [];
  }

  return store.customerAgentConfigMockStore;
}

export function getMockCustomerFaqItemStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.customerFaqItemMockStore) {
    store.customerFaqItemMockStore = [];
  }

  return store.customerFaqItemMockStore;
}

export function getMockKnowledgeDocumentStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.knowledgeDocumentMockStore) {
    store.knowledgeDocumentMockStore = [];
  }

  return store.knowledgeDocumentMockStore;
}

export function getMockLeadStore() {
  const store = globalThis as MarketplaceGlobalStore;

  if (!store.leadMockStore) {
    store.leadMockStore = [];
  }

  return store.leadMockStore;
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
    price_cny: override.price_cny ?? agent.priceCny,
    price_usd: override.price_usd ?? agent.priceUsd,
    pricing_type: override.pricing_type ?? agent.pricingType,
    review_feedback: override.review_feedback ?? null,
    seller_email: null,
    short_description_en: override.short_description_en ?? agent.shortDescriptionEn,
    short_description_zh: override.short_description_zh ?? agent.shortDescriptionZh,
    slug: agent.slug,
    status: override.status ?? "approved",
    title_en: override.title_en ?? agent.titleEn,
    title_zh: override.title_zh ?? agent.titleZh,
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
    priceCny: override.price_cny ?? agent.priceCny,
    priceUsd: override.price_usd ?? agent.priceUsd,
    pricingType: override.pricing_type ?? agent.pricingType,
    shortDescriptionEn: override.short_description_en ?? agent.shortDescriptionEn,
    shortDescriptionZh: override.short_description_zh ?? agent.shortDescriptionZh,
    titleEn: override.title_en ?? agent.titleEn,
    titleZh: override.title_zh ?? agent.titleZh,
  };
}

function getPlatformStatus(slug: string) {
  return getAgentOverrideStore()[slug]?.status ?? "approved";
}
