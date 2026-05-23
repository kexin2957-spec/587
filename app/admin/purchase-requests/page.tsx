"use client";

import { PurchaseRequestsTable } from "@/components/admin/purchase-requests-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminPurchaseRequestsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.purchaseRequestsTitle")}
      description={t("admin.purchaseRequestsPageDescription")}
    >
      <PurchaseRequestsTable />
    </PageShell>
  );
}
