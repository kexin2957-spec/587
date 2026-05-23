import type {
  DeliveryType,
  PricingType,
  SupportedLanguage,
} from "@/lib/marketplace/constants";
import { getAgentMetadata } from "@/lib/marketplace/agent-metadata";
import type { DemoAgent, DemoCategory } from "@/lib/marketplace/demo-data";

export type PriceFilter = "all" | "free" | "paid" | "custom_quote";
export type DeliveryFilter = "all" | DeliveryType;
export type LanguageFilter = "all" | SupportedLanguage | "both";
export type SortOption =
  | "featured"
  | "popular"
  | "newest"
  | "highest_rated"
  | "price_asc"
  | "price_desc";

export type MarketplaceFilterState = {
  category: string;
  price: PriceFilter;
  deliveryType: DeliveryFilter;
  language: LanguageFilter;
  verifiedOnly: boolean;
  demoOnly: boolean;
};

export const defaultMarketplaceFilters: MarketplaceFilterState = {
  category: "all",
  price: "all",
  deliveryType: "all",
  language: "all",
  verifiedOnly: false,
  demoOnly: false,
};

export function filterAgents({
  agents,
  categories,
  filters,
  query,
}: {
  agents: DemoAgent[];
  categories: DemoCategory[];
  filters: MarketplaceFilterState;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  return agents.filter((agent) => {
    const metadata = getAgentMetadata(agent);

    if (filters.category !== "all" && agent.categorySlug !== filters.category) {
      return false;
    }

    if (!matchesPriceFilter(agent.pricingType, filters.price)) {
      return false;
    }

    if (
      filters.deliveryType !== "all" &&
      agent.deliveryType !== filters.deliveryType
    ) {
      return false;
    }

    if (!matchesLanguageFilter(metadata.supportedLanguages, filters.language)) {
      return false;
    }

    if (filters.verifiedOnly && !agent.isVerified) {
      return false;
    }

    if (filters.demoOnly && !agent.demoEnabled) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const category = categories.find((item) => item.slug === agent.categorySlug);
    const searchableText = [
      agent.titleEn,
      agent.titleZh,
      agent.shortDescriptionEn,
      agent.shortDescriptionZh,
      category?.nameEn,
      category?.nameZh,
      category?.descriptionEn,
      category?.descriptionZh,
      ...metadata.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

export function sortAgents(agents: DemoAgent[], sort: SortOption) {
  return [...agents].sort((agentA, agentB) => {
    const metadataA = getAgentMetadata(agentA);
    const metadataB = getAgentMetadata(agentB);

    switch (sort) {
      case "popular":
        return (
          metadataB.purchaseCount +
          metadataB.installCount -
          (metadataA.purchaseCount + metadataA.installCount)
        );
      case "newest":
        return (
          new Date(metadataB.createdAt).getTime() -
          new Date(metadataA.createdAt).getTime()
        );
      case "highest_rated":
        return metadataB.rating - metadataA.rating;
      case "price_asc":
        return getSortablePrice(agentA) - getSortablePrice(agentB);
      case "price_desc":
        return getSortablePrice(agentB) - getSortablePrice(agentA);
      case "featured":
      default:
        return Number(agentB.isFeatured) - Number(agentA.isFeatured);
    }
  });
}

export function hasActiveFilters(filters: MarketplaceFilterState, query: string) {
  return (
    query.trim().length > 0 ||
    filters.category !== defaultMarketplaceFilters.category ||
    filters.price !== defaultMarketplaceFilters.price ||
    filters.deliveryType !== defaultMarketplaceFilters.deliveryType ||
    filters.language !== defaultMarketplaceFilters.language ||
    filters.verifiedOnly !== defaultMarketplaceFilters.verifiedOnly ||
    filters.demoOnly !== defaultMarketplaceFilters.demoOnly
  );
}

function matchesPriceFilter(pricingType: PricingType, price: PriceFilter) {
  if (price === "all") {
    return true;
  }

  if (price === "paid") {
    return pricingType === "one_time" || pricingType === "monthly";
  }

  return pricingType === price;
}

function matchesLanguageFilter(
  supportedLanguages: SupportedLanguage[],
  language: LanguageFilter,
) {
  if (language === "all") {
    return true;
  }

  if (language === "both") {
    return (
      supportedLanguages.includes("en") && supportedLanguages.includes("zh")
    );
  }

  return supportedLanguages.includes(language);
}

function getSortablePrice(agent: DemoAgent) {
  if (agent.pricingType === "free") {
    return 0;
  }

  if (agent.pricingType === "custom_quote") {
    return Number.MAX_SAFE_INTEGER;
  }

  return agent.priceUsd ?? Number.MAX_SAFE_INTEGER;
}
