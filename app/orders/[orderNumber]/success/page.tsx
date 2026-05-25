import { OrderSuccessPage } from "@/components/customer/order-success-page";

export default async function OrderSuccessRoute({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ access_token?: string; token?: string }>;
}) {
  const { orderNumber } = await params;
  const { access_token: accessToken, token } = await searchParams;

  return <OrderSuccessPage accessToken={accessToken ?? token ?? ""} orderNumber={orderNumber} />;
}
