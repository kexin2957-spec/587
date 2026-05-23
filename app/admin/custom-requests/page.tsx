"use client";

import { CustomRequestsTable } from "@/components/admin/custom-requests-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminCustomRequestsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.customRequestsTitle")}
      description={t("admin.customRequestsPageDescription")}
    >
      <CustomRequestsTable />
    </PageShell>
  );
}
