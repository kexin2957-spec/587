import Link from "next/link";
import { OrdersTable } from "@/components/admin/orders-table";
import { PageShell } from "@/components/layout/page-shell";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <PageShell
      eyebrow="Admin operations"
      title="Order detail"
      description="Operate a single order, payment state, delivery package, license, notes, and customer configuration."
    >
      <div className="mb-4">
        <Link
          className="text-sm font-semibold text-blue-700 hover:text-blue-600"
          href="/admin/orders"
        >
          Back to all orders
        </Link>
      </div>
      <OrdersTable orderId={orderId} />
    </PageShell>
  );
}
