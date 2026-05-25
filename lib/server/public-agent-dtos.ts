import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type PublicAgentCardDto = Pick<
  DemoAgent,
  | "categorySlug"
  | "deliveryType"
  | "demoEnabled"
  | "demoUrl"
  | "installCount"
  | "isFeatured"
  | "isVerified"
  | "ownerType"
  | "priceCny"
  | "priceUsd"
  | "pricingType"
  | "purchaseCount"
  | "rating"
  | "reviewCount"
  | "shortDescriptionEn"
  | "shortDescriptionZh"
  | "slug"
  | "supportedLanguages"
  | "tags"
  | "titleEn"
  | "titleZh"
>;

export type PublicAgentDetailDto = PublicAgentCardDto &
  Pick<
    DemoAgent,
    | "coverImageStyleEn"
    | "coverImageStyleZh"
    | "customUpgradeOptionsEn"
    | "customUpgradeOptionsZh"
    | "dataPermissionsEn"
    | "dataPermissionsZh"
    | "descriptionEn"
    | "descriptionZh"
    | "faqEn"
    | "faqZh"
    | "featuresEn"
    | "featuresZh"
    | "setupInstructionsEn"
    | "setupInstructionsZh"
    | "targetCustomersEn"
    | "targetCustomersZh"
    | "useCasesEn"
    | "useCasesZh"
  >;

export function toPublicAgentCardDto(agent: DemoAgent): PublicAgentCardDto {
  return {
    categorySlug: agent.categorySlug,
    deliveryType: agent.deliveryType,
    demoEnabled: agent.demoEnabled,
    demoUrl: agent.demoUrl,
    installCount: agent.installCount,
    isFeatured: agent.isFeatured,
    isVerified: agent.isVerified,
    ownerType: agent.ownerType,
    priceCny: agent.priceCny,
    priceUsd: agent.priceUsd,
    pricingType: agent.pricingType,
    purchaseCount: agent.purchaseCount,
    rating: agent.rating,
    reviewCount: agent.reviewCount,
    shortDescriptionEn: agent.shortDescriptionEn,
    shortDescriptionZh: agent.shortDescriptionZh,
    slug: agent.slug,
    supportedLanguages: agent.supportedLanguages,
    tags: agent.tags,
    titleEn: agent.titleEn,
    titleZh: agent.titleZh,
  };
}

export function toPublicAgentDetailDto(agent: DemoAgent): PublicAgentDetailDto {
  return {
    ...toPublicAgentCardDto(agent),
    coverImageStyleEn: agent.coverImageStyleEn,
    coverImageStyleZh: agent.coverImageStyleZh,
    customUpgradeOptionsEn: agent.customUpgradeOptionsEn,
    customUpgradeOptionsZh: agent.customUpgradeOptionsZh,
    dataPermissionsEn: agent.dataPermissionsEn,
    dataPermissionsZh: agent.dataPermissionsZh,
    descriptionEn: agent.descriptionEn,
    descriptionZh: agent.descriptionZh,
    faqEn: agent.faqEn,
    faqZh: agent.faqZh,
    featuresEn: agent.featuresEn,
    featuresZh: agent.featuresZh,
    setupInstructionsEn: agent.setupInstructionsEn,
    setupInstructionsZh: agent.setupInstructionsZh,
    targetCustomersEn: agent.targetCustomersEn,
    targetCustomersZh: agent.targetCustomersZh,
    useCasesEn: agent.useCasesEn,
    useCasesZh: agent.useCasesZh,
  };
}

