export const AGENT_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "needs_changes",
  "approved",
  "rejected",
  "suspended",
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

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;

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
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "zh"];
