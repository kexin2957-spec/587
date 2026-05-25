"use client";

import { OrdersTable } from "@/components/admin/orders-table";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function AdminOrdersPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("admin.eyebrow")}
      title={t("admin.ordersTitle")}
      description={t("admin.ordersPageDescription")}
    >
      <OrdersTable />
    </PageShell>
  );
}
