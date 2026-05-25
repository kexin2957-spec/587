import { UsageDashboard } from "@/components/admin/usage-dashboard";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminUsagePage() {
  return (
    <PageShell
      eyebrow="Admin operations"
      title="Usage dashboard"
      description="Monitor widget loads, chat messages, leads, blocked domain attempts, and license errors across hosted agents."
    >
      <UsageDashboard />
    </PageShell>
  );
}
