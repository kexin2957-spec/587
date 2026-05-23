import type {
  AgentStatus,
  CustomRequestStatus,
  DeliveryType,
  OwnerType,
  PricingType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReviewStatus,
  SellerApplicationStatus,
  SellerStatus,
  SupportedLanguage,
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

export type AgentReview = {
  id: string;
  agentId: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  status: ReviewStatus;
};
