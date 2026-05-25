import { CustomerConfigsTable } from "@/components/admin/customer-configs-table";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminCustomerConfigsPage() {
  return (
    <PageShell
      eyebrow="Admin operations"
      title="Customer configurations"
      description="Edit customer business profiles, FAQ, knowledge documents, handoff rules, disallowed claims, and widget branding."
    >
      <CustomerConfigsTable />
    </PageShell>
  );
}
