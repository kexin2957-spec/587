"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { Badge, type BadgeTone } from "@/components/marketplace/badge";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type TrustBadgeType =
  | "businessReady"
  | "dataPrivacyNotice"
  | "liveDemoAvailable"
  | "platformReviewed"
  | "refundPolicy"
  | "secureCheckout"
  | "setupSupportAvailable"
  | "verifiedAgent";

const trustBadgeConfig: Record<
  TrustBadgeType,
  { labelKey: string; tone: BadgeTone }
> = {
  businessReady: { labelKey: "common.businessReady", tone: "amber" },
  dataPrivacyNotice: { labelKey: "common.dataPrivacyNotice", tone: "blue" },
  liveDemoAvailable: { labelKey: "common.liveDemoAvailable", tone: "cyan" },
  platformReviewed: { labelKey: "common.platformReviewed", tone: "blue" },
  refundPolicy: { labelKey: "common.refundPolicy", tone: "slate" },
  secureCheckout: { labelKey: "common.secureCheckout", tone: "emerald" },
  setupSupportAvailable: {
    labelKey: "common.setupSupportAvailable",
    tone: "emerald",
  },
  verifiedAgent: { labelKey: "common.verifiedAgent", tone: "slate" },
};

export const coreTrustBadges: TrustBadgeType[] = [
  "verifiedAgent",
  "platformReviewed",
  "businessReady",
  "liveDemoAvailable",
  "setupSupportAvailable",
  "dataPrivacyNotice",
  "secureCheckout",
  "refundPolicy",
];

export function getAgentTrustBadgeTypes(agent: DemoAgent): TrustBadgeType[] {
  return [
    ...(agent.isVerified ? (["verifiedAgent"] as const) : []),
    "platformReviewed",
    "businessReady",
    ...(agent.demoEnabled ? (["liveDemoAvailable"] as const) : []),
    "setupSupportAvailable",
    "dataPrivacyNotice",
    "secureCheckout",
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
