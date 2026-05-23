"use client";

import { AdminAgentsTable } from "@/components/admin/admin-agents-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminAgentsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.reviewAgentsTitle")}
      description={t("admin.reviewAgentsDescription")}
    >
      <AdminAgentsTable />
    </PageShell>
  );
}
