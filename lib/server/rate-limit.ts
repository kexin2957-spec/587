import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/server/monitoring";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = typeof globalThis & {
  aiAgentMarketplaceRateLimitStore?: Map<string, RateLimitBucket>;
};

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

export function enforceRateLimit(request: Request, rule: RateLimitRule) {
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return null;
  }

  const store = getRateLimitStore();
  const now = Date.now();
  const clientKey = `${rule.key}:${getClientFingerprint(request)}`;
  const current = store.get(clientKey);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + rule.windowMs };

  bucket.count += 1;
  store.set(clientKey, bucket);

  if (bucket.count <= rule.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  logSecurityEvent("rate_limit_exceeded", {
    key: rule.key,
    path: new URL(request.url).pathname,
    retry_after_seconds: retryAfterSeconds,
  });

  return NextResponse.json(
    {
      error: "Too many requests. Please try again shortly.",
      ok: false,
      retry_after_seconds: retryAfterSeconds,
    },
    {
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(rule.limit),
        "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
      },
      status: 429,
    },
  );
}

export const rateLimits = {
  chat: { key: "agent-chat", limit: 60, windowMs: 60_000 },
  customRequest: { key: "custom-request", limit: 8, windowMs: 10 * 60_000 },
  lead: { key: "lead-submit", limit: 20, windowMs: 10 * 60_000 },
  order: { key: "order-submit", limit: 10, windowMs: 10 * 60_000 },
  sellerUpload: { key: "seller-upload", limit: 20, windowMs: 10 * 60_000 },
  widget: { key: "widget", limit: 120, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

function getRateLimitStore() {
  const store = globalThis as RateLimitStore;

  if (!store.aiAgentMarketplaceRateLimitStore) {
    store.aiAgentMarketplaceRateLimitStore = new Map();
  }

  return store.aiAgentMarketplaceRateLimitStore;
}

function getClientFingerprint(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("user-agent") ||
    "unknown"
  );
}
