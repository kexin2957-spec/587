"use client";

import { SellerApplicationsTable } from "@/components/admin/seller-applications-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminSellerApplicationsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.sellerApplicationsTitle")}
      description={t("admin.sellerApplicationsPageDescription")}
    >
      <SellerApplicationsTable />
    </PageShell>
  );
}
