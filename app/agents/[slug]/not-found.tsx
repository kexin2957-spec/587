"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AgentNotFound() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("errors.notFound")}
      title={t("agentDetail.agentNotFoundTitle")}
      description={t("agentDetail.agentNotFoundDescription")}
    >
      <Link
        href="/marketplace"
        className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
      >
        {t("agentDetail.backToMarketplace")}
      </Link>
    </PageShell>
  );
}
