import { DeliveryHub } from "@/components/marketplace/delivery-hub";

export default async function DeliveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ access_token?: string; token?: string }>;
}) {
  const { orderNumber } = await params;
  const { access_token: accessToken, token } = await searchParams;

  return <DeliveryHub accessToken={accessToken ?? token ?? ""} orderNumber={orderNumber} />;
}
