import type { OwnerType, SupportedLanguage } from "@/lib/marketplace/constants";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type DemoAgentMetadata = {
  ownerType: OwnerType;
  creatorName: string;
  supportedLanguages: SupportedLanguage[];
  tags: string[];
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  installCount: number;
  createdAt: string;
};

const metadataBySlug: Record<string, DemoAgentMetadata> = {
  "website-customer-support-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: [
      "customer support",
      "sales",
      "website chatbot",
      "lead capture",
      "lead scoring",
      "intent detection",
      "small business",
      "bilingual",
      "website embed",
      "service business",
    ],
    rating: 4.9,
    reviewCount: 32,
    purchaseCount: 68,
    installCount: 180,
    createdAt: "2026-05-24",
  },
  "ecommerce-product-support-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: [
      "ecommerce",
      "product support",
      "product recommendations",
      "shipping",
      "returns",
      "purchase intent",
      "Shopify",
      "WooCommerce",
      "website embed",
      "bilingual",
    ],
    rating: 4.8,
    reviewCount: 21,
    purchaseCount: 44,
    installCount: 96,
    createdAt: "2026-05-24",
  },
  "real-estate-lead-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["real estate", "lead generation", "sales", "qualification"],
    rating: 4.9,
    reviewCount: 21,
    purchaseCount: 31,
    installCount: 64,
    createdAt: "2026-05-18",
  },
  "restaurant-booking-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["restaurant", "booking", "local business", "reservation"],
    rating: 4.5,
    reviewCount: 9,
    purchaseCount: 18,
    installCount: 44,
    createdAt: "2026-05-17",
  },
  "course-enrollment-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["education", "enrollment", "training", "consultation"],
    rating: 4.6,
    reviewCount: 13,
    purchaseCount: 24,
    installCount: 71,
    createdAt: "2026-05-16",
  },
  "medical-beauty-consultation-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["medical beauty", "clinic", "consultation", "appointment"],
    rating: 4.7,
    reviewCount: 11,
    purchaseCount: 12,
    installCount: 29,
    createdAt: "2026-05-15",
  },
  "law-firm-intake-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["legal", "intake", "law firm", "case review"],
    rating: 4.6,
    reviewCount: 8,
    purchaseCount: 16,
    installCount: 33,
    createdAt: "2026-05-14",
  },
  "internal-knowledge-base-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["knowledge base", "documents", "internal support", "SOP"],
    rating: 4.9,
    reviewCount: 27,
    purchaseCount: 19,
    installCount: 58,
    createdAt: "2026-05-13",
  },
  "ai-news-monitoring-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["AI news", "monitoring", "briefing", "research"],
    rating: 4.8,
    reviewCount: 22,
    purchaseCount: 28,
    installCount: 95,
    createdAt: "2026-05-12",
  },
  "youtube-video-summary-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["youtube", "summary", "content", "video"],
    rating: 4.4,
    reviewCount: 7,
    purchaseCount: 33,
    installCount: 140,
    createdAt: "2026-05-11",
  },
  "resume-career-coach-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["resume", "career", "coaching", "interview"],
    rating: 4.6,
    reviewCount: 10,
    purchaseCount: 20,
    installCount: 52,
    createdAt: "2026-05-10",
  },
  "local-service-business-agent": {
    ownerType: "platform",
    creatorName: "Platform",
    supportedLanguages: ["en", "zh"],
    tags: ["local service", "booking", "lead capture", "small business"],
    rating: 4.5,
    reviewCount: 12,
    purchaseCount: 25,
    installCount: 69,
    createdAt: "2026-05-09",
  },
};

export function getAgentMetadata(agent: DemoAgent): DemoAgentMetadata {
  return (
    metadataBySlug[agent.slug] ?? {
      ownerType: agent.ownerType ?? "platform",
      creatorName: agent.creatorName ?? "Platform",
      supportedLanguages: agent.supportedLanguages ?? ["en", "zh"],
      tags: agent.tags ?? [],
      rating: agent.rating ?? 0,
      reviewCount: agent.reviewCount ?? 0,
      purchaseCount: agent.purchaseCount ?? 0,
      installCount: agent.installCount ?? 0,
      createdAt: agent.createdAt ?? "2026-05-01",
    }
  );
}
