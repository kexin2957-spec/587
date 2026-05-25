"use client";

import { LeadsTable } from "@/components/admin/leads-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminLeadsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title="Lead Management"
      description="Review widget leads, intent, score, transcript, and follow-up status."
    >
      <LeadsTable />
    </PageShell>
  );
}
