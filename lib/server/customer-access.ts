import { timingSafeEqual } from "node:crypto";
import type { MockDeliveryPackageRecord } from "@/lib/server/marketplace-admin-store";

export const CUSTOMER_ACCESS_TOKEN_PARAM = "access_token";

export function createCustomerAccessToken() {
  return `aam_cust_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function getCustomerAccessToken(request: Request) {
  const url = new URL(request.url);

  return (
    url.searchParams.get(CUSTOMER_ACCESS_TOKEN_PARAM) ||
    url.searchParams.get("token") ||
    request.headers.get("x-customer-access-token") ||
    ""
  ).trim();
}

export function withCustomerAccessToken(url: string | null, token: string | null) {
  if (!url || !token) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set(CUSTOMER_ACCESS_TOKEN_PARAM, token);

    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}${CUSTOMER_ACCESS_TOKEN_PARAM}=${encodeURIComponent(token)}`;
  }
}

export function isCustomerAccessAllowed(
  deliveryPackage: Pick<MockDeliveryPackageRecord, "customer_access_token"> | null | undefined,
  providedToken: string | null | undefined,
) {
  const expectedToken = deliveryPackage?.customer_access_token?.trim() ?? "";
  const actualToken = providedToken?.trim() ?? "";

  if (!expectedToken || !actualToken) {
    return false;
  }

  return safeEqual(expectedToken, actualToken);
}

function safeEqual(firstValue: string, secondValue: string) {
  const first = Buffer.from(firstValue);
  const second = Buffer.from(secondValue);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}
