"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { Badge, type BadgeTone } from "@/components/marketplace/badge";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type TrustBadgeType =
  | "businessReady"
  | "dataPrivacyNotice"
  | "englishChineseSupport"
  | "leadCapture"
  | "leadCaptureReady"
  | "licenseProtected"
  | "liveDemoAvailable"
  | "platformHosted"
  | "platformReviewed"
  | "productFaq"
  | "refundPolicy"
  | "secureCheckout"
  | "setupSupportAvailable"
  | "verifiedAgent"
  | "websiteEmbed"
  | "websiteEmbedReady";

const trustBadgeConfig: Record<
  TrustBadgeType,
  { labelKey: string; tone: BadgeTone }
> = {
  businessReady: { labelKey: "common.businessReady", tone: "amber" },
  dataPrivacyNotice: { labelKey: "common.dataPrivacyNotice", tone: "blue" },
  englishChineseSupport: { labelKey: "common.englishChineseSupport", tone: "slate" },
  leadCapture: { labelKey: "common.leadCapture", tone: "cyan" },
  leadCaptureReady: { labelKey: "common.leadCaptureReady", tone: "cyan" },
  licenseProtected: { labelKey: "common.licenseProtected", tone: "blue" },
  liveDemoAvailable: { labelKey: "common.liveDemoAvailable", tone: "cyan" },
  platformHosted: { labelKey: "common.platformHosted", tone: "emerald" },
  platformReviewed: { labelKey: "common.platformReviewed", tone: "blue" },
  productFaq: { labelKey: "common.productFaq", tone: "emerald" },
  refundPolicy: { labelKey: "common.refundPolicy", tone: "slate" },
  secureCheckout: { labelKey: "common.secureCheckout", tone: "emerald" },
  setupSupportAvailable: {
    labelKey: "common.setupSupportAvailable",
    tone: "emerald",
  },
  verifiedAgent: { labelKey: "common.verifiedAgent", tone: "slate" },
  websiteEmbed: { labelKey: "common.websiteEmbed", tone: "blue" },
  websiteEmbedReady: { labelKey: "common.websiteEmbedReady", tone: "blue" },
};

export const coreTrustBadges: TrustBadgeType[] = [
  "platformHosted",
  "licenseProtected",
  "websiteEmbedReady",
  "leadCaptureReady",
  "setupSupportAvailable",
  "englishChineseSupport",
];

export function getAgentTrustBadgeTypes(agent: DemoAgent): TrustBadgeType[] {
  const launchSpecificBadges: TrustBadgeType[] =
    agent.slug === "ecommerce-product-support-agent"
      ? ["websiteEmbed", "productFaq"]
      : agent.slug === "website-customer-support-agent"
        ? ["websiteEmbed", "leadCapture"]
        : [];

  return [
    ...(agent.isVerified ? (["verifiedAgent"] as const) : []),
    "platformHosted",
    "licenseProtected",
    "platformReviewed",
    "businessReady",
    ...(agent.demoEnabled ? (["liveDemoAvailable"] as const) : []),
    ...launchSpecificBadges,
    "websiteEmbedReady",
    "leadCaptureReady",
    "setupSupportAvailable",
    "englishChineseSupport",
    "dataPrivacyNotice",
    "refundPolicy",
  ];
}

export function TrustBadge({ type }: { type: TrustBadgeType }) {
  const { t } = useTranslation();
  const config = trustBadgeConfig[type];

  return <Badge tone={config.tone}>{t(config.labelKey)}</Badge>;
}

export function TrustBadgeList({
  className = "flex flex-wrap gap-2",
  types,
}: {
  className?: string;
  types: TrustBadgeType[];
}) {
  return (
    <div className={className} data-testid="trust-badge-list">
      {types.map((type) => (
        <TrustBadge key={type} type={type} />
      ))}
    </div>
  );
}
