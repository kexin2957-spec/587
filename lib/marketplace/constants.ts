export const AGENT_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "needs_changes",
  "approved",
  "published",
  "rejected",
  "suspended",
  "archived",
] as const;

export const OWNER_TYPES = ["platform", "seller"] as const;

export const SELLER_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

export const SELLER_APPLICATION_STATUSES = [
  "submitted",
  "in_review",
  "approved",
  "rejected",
  "suspended",
] as const;

export const DELIVERY_TYPES = [
  "prompt_template",
  "workflow_template",
  "hosted_agent",
  "website_chatbot",
  "custom_business_agent",
] as const;

export const PRICING_TYPES = [
  "free",
  "one_time",
  "monthly",
  "custom_quote",
] as const;

export const PURCHASE_REQUEST_TYPES = [
  "buy_agent",
  "setup_service",
  "custom_version",
] as const;

export const PURCHASE_REQUEST_STATUSES = [
  "new",
  "contacted",
  "in_progress",
  "closed",
  "rejected",
] as const;

export const CUSTOM_REQUEST_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "in_progress",
  "completed",
  "rejected",
] as const;

export const ORDER_PLAN_IDS = [
  "agent_only",
  "agent_setup",
  "custom_version",
] as const;

export const PAYMENT_METHODS = [
  "manual",
  "stripe",
  "paypal",
  "wechat",
  "alipay",
  "bank_transfer",
  "other",
] as const;

export const PAYMENT_PROVIDERS = [
  "manual",
  "stripe",
  "paypal",
  "wechat",
  "alipay",
  "bank_transfer",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "manually_approved",
  "failed",
  "refunded",
  "cancelled",
] as const;

export const BILLING_INTERVALS = ["one_time", "monthly", "yearly"] as const;

export const SUBSCRIPTION_STATUSES = [
  "not_required",
  "pending",
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;

export const REVENUE_SHARE_TYPES = [
  "platform_owned",
  "third_party_standard",
  "creator_referral",
  "custom_service_order",
] as const;

export const REVENUE_SHARE_RULES = {
  creator_referral: {
    creatorRate: 0.85,
    labelEn: "Creator referral sale",
    labelZh: "创作者推荐销售",
    platformRate: 0.15,
  },
  custom_service_order: {
    creatorRate: 0.8,
    labelEn: "Custom service order",
    labelZh: "定制服务订单",
    platformRate: 0.2,
  },
  platform_owned: {
    creatorRate: 0,
    labelEn: "Platform-owned agent",
    labelZh: "平台自营 Agent",
    platformRate: 1,
  },
  third_party_standard: {
    creatorRate: 0.7,
    labelEn: "Third-party standard sale",
    labelZh: "第三方标准销售",
    platformRate: 0.3,
  },
} as const;

export const PAYOUT_STATUSES = [
  "pending",
  "eligible",
  "processing",
  "paid",
  "cancelled",
] as const;

export const ORDER_STATUSES = [
  "new",
  "contacted",
  "paid",
  "in_setup",
  "delivered",
  "completed",
  "cancelled",
] as const;

export const DELIVERY_STATUSES = [
  "not_started",
  "preparing",
  "delivered",
] as const;

export const LICENSE_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "expired",
] as const;

export const USAGE_EVENT_TYPES = [
  "widget_load",
  "chat_message",
  "lead_created",
  "blocked_domain",
  "license_error",
] as const;

export const WIDGET_POSITIONS = ["bottom_right", "bottom_left"] as const;

export const CUSTOMER_CONFIG_STATUSES = ["draft", "active", "paused"] as const;

export const KNOWLEDGE_DOCUMENT_TYPES = [
  "company_info",
  "faq",
  "services",
  "products",
  "policy",
  "other",
] as const;

export const LEAD_INTENTS = [
  "service_inquiry",
  "pricing_inquiry",
  "booking_request",
  "support_question",
  "sales_lead",
  "custom_project_request",
  "product_question",
  "product_recommendation",
  "shipping_question",
  "return_refund_question",
  "order_tracking_request",
  "purchase_intent",
  "human_handoff",
  "other",
  "unknown",
] as const;

export const LEAD_SCORES = ["hot", "warm", "cold", "invalid"] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "invalid",
] as const;

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;

export const AGENT_REVIEW_REASON_CODES = [
  "missing_content",
  "demo_not_working",
  "exaggerated_claims",
  "copyright_risk",
  "unsafe_content",
  "unclear_delivery",
  "pricing_issue",
  "poor_cover",
  "other",
] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];
export type OwnerType = (typeof OWNER_TYPES)[number];
export type SellerStatus = (typeof SELLER_STATUSES)[number];
export type SellerApplicationStatus =
  (typeof SELLER_APPLICATION_STATUSES)[number];
export type DeliveryType = (typeof DELIVERY_TYPES)[number];
export type PricingType = (typeof PRICING_TYPES)[number];
export type PurchaseRequestType = (typeof PURCHASE_REQUEST_TYPES)[number];
export type PurchaseRequestStatus =
  (typeof PURCHASE_REQUEST_STATUSES)[number];
export type CustomRequestStatus = (typeof CUSTOM_REQUEST_STATUSES)[number];
export type OrderPlanId = (typeof ORDER_PLAN_IDS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type RevenueShareType = (typeof REVENUE_SHARE_TYPES)[number];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];
export type WidgetPosition = (typeof WIDGET_POSITIONS)[number];
export type CustomerConfigStatus = (typeof CUSTOMER_CONFIG_STATUSES)[number];
export type KnowledgeDocumentType = (typeof KNOWLEDGE_DOCUMENT_TYPES)[number];
export type LeadIntent = (typeof LEAD_INTENTS)[number];
export type LeadScore = (typeof LEAD_SCORES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type AgentReviewReasonCode =
  (typeof AGENT_REVIEW_REASON_CODES)[number];

export const DEFAULT_SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "zh"];
