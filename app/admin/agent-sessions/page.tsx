import { AgentSessionsTable } from "@/components/admin/agent-sessions-table";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminAgentSessionsPage() {
  return (
    <PageShell
      eyebrow="Runtime Debug"
      title="Agent Runtime Sessions"
      description="Review server-side AI agent sessions, saved messages, detected intent, lead score, handoff flags, and source URLs."
    >
      <AgentSessionsTable />
    </PageShell>
  );
}
