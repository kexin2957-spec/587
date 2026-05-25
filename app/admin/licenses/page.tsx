import { LicensesTable } from "@/components/admin/licenses-table";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminLicensesPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="License usage dashboard"
      description="View hosted agent licenses, allowed domains, widget usage, chat usage, leads, blocked domain events, and license errors."
    >
      <LicensesTable />
    </PageShell>
  );
}

