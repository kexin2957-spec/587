import { CustomerOrderDashboard } from "@/components/customer/customer-order-dashboard";

export default async function CustomerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ access_token?: string; token?: string }>;
}) {
  const { orderId } = await params;
  const { access_token: accessToken, token } = await searchParams;

  return <CustomerOrderDashboard accessToken={accessToken ?? token ?? ""} orderId={orderId} />;
}
