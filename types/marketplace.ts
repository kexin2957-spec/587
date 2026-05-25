import type {
  AgentStatus,
  BillingInterval,
  CustomRequestStatus,
  DeliveryStatus,
  DeliveryType,
  LeadIntent,
  LeadScore,
  LeadStatus,
  OrderPlanId,
  OrderStatus,
  OwnerType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PricingType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReviewStatus,
  SellerApplicationStatus,
  SellerStatus,
  SubscriptionStatus,
  SupportedLanguage,
  WidgetPosition,
} from "@/lib/marketplace/constants";

export type BilingualFaqItem = {
  question: string;
  answer: string;
};

export type AgentCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  icon?: string | null;
  sortOrder: number;
};

export type SellerProfile = {
  id: string;
  userId?: string | null;
  displayName: string;
  teamName?: string | null;
  email: string;
  website?: string | null;
  expertise?: string | null;
  offersCustomServices: boolean;
  payoutPreference?: string | null;
  status: SellerStatus;
};

export type MarketplaceAgent = {
  id: string;
  slug: string;
  ownerType: OwnerType;
  sellerId?: string | null;
  status: AgentStatus;
  isFeatured: boolean;
  isVerified: boolean;
  categoryId: string;
  tags: string[];
  pricingType: PricingType;
  priceUsd?: number | null;
  priceCny?: number | null;
  deliveryType: DeliveryType;
  supportedLanguages: SupportedLanguage[];
  demoUrl?: string | null;
  demoEnabled: boolean;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  installCount: number;
  titleEn: string;
  titleZh: string;
  shortDescriptionEn: string;
  shortDescriptionZh: string;
  descriptionEn: string;
  descriptionZh: string;
  featuresEn: string[];
  featuresZh: string[];
  faqEn: BilingualFaqItem[];
  faqZh: BilingualFaqItem[];
  setupInstructionsEn: string;
  setupInstructionsZh: string;
  dataPermissionsEn: string;
  dataPermissionsZh: string;
  version: string;
  changelogEn?: string | null;
  changelogZh?: string | null;
  screenshots?: unknown;
  videoUrl?: string | null;
};

export type SellerApplication = {
  id: string;
  name: string;
  teamName?: string | null;
  email: string;
  website?: string | null;
  expertise: string;
  plannedAgentTypes: string;
  offersCustomServices: boolean;
  payoutPreference?: string | null;
  notes?: string | null;
  status: SellerApplicationStatus;
};

export type PurchaseRequest = {
  id: string;
  agentId: string;
  requestType: PurchaseRequestType;
  name: string;
  email: string;
  company?: string | null;
  message?: string | null;
  budgetRange?: string | null;
  status: PurchaseRequestStatus;
};

export type CustomRequest = {
  id: string;
  industry: string;
  companyName: string;
  agentGoal: string;
  existingWebsite?: string | null;
  hasDocuments: boolean;
  requiredIntegrations?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  status: CustomRequestStatus;
};

export type Order = {
  id: string;
  orderNumber: string;
  agentId: string;
  planId: OrderPlanId;
  planName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  companyName?: string | null;
  websiteUrl?: string | null;
  message?: string | null;
  amountUsd?: number | null;
  amountCny?: number | null;
  currency: "USD" | "CNY";
  billingInterval: BillingInterval;
  cancelAt?: string | null;
  nextBillingDate?: string | null;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string | null;
  orderStatus: OrderStatus;
  subscriptionStatus: SubscriptionStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerPaymentId?: string | null;
  amount: number;
  currency: "USD" | "CNY";
  status: Exclude<PaymentStatus, "manually_approved">;
  paymentUrl?: string | null;
  paidAt?: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type OrderNote = {
  id: string;
  orderId: string;
  note: string;
  createdAt: string;
};

export type DeliveryPackage = {
  id: string;
  orderId: string;
  agentId: string;
  allowedDomains?: string[];
  customerDashboardUrl?: string | null;
  hostedAgentUrl?: string | null;
  embedCode?: string | null;
  documentationUrl?: string | null;
  deliveryNotes?: string | null;
  licenseKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAgentConfig = {
  id: string;
  orderId?: string | null;
  orderNumber?: string | null;
  agentId: string;
  agentSlug: string;
  businessName: string;
  welcomeMessage: string;
  primaryColor: string;
  widgetPosition: WidgetPosition;
  avatarUrl?: string | null;
  offlineMessage: string;
  contactEmail: string;
  businessHours?: string | null;
  companyIntroduction: string;
  servicesProducts: string;
  faq: BilingualFaqItem[];
  pricingRanges?: string | null;
  contactInformation?: string | null;
  disallowedClaims?: string | null;
  handoffRules?: string | null;
  customInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  agentId: string;
  agentSlug: string;
  orderId?: string | null;
  orderNumber?: string | null;
  customerConfigId?: string | null;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string | null;
  visitorCompany?: string | null;
  inquiry: string;
  intent: LeadIntent;
  leadScore: LeadScore;
  status: LeadStatus;
  conversationSummary: string;
  transcript: unknown;
  needsHuman?: boolean;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentReview = {
  id: string;
  agentId: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  status: ReviewStatus;
};
