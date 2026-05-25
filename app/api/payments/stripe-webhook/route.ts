import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logApiError, logSecurityEvent } from "@/lib/server/monitoring";

export const dynamic = "force-dynamic";

type StripeCheckoutSession = {
  id?: string;
  metadata?: {
    order_id?: string;
    order_number?: string;
  };
  payment_intent?: string | null;
};

type StripeEvent = {
  data?: {
    object?: StripeCheckoutSession;
  };
  type?: string;
};

export async function POST(request: Request) {
  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = request.headers.get("stripe-signature") ?? "";
    const isValid = await verifyStripeSignature({
      body,
      header: signature,
      secret: webhookSecret,
    });

    if (!isValid) {
      logSecurityEvent("stripe_webhook_invalid_signature", {
        path: new URL(request.url).pathname,
      });

      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ignored: true, ok: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({
      message: "Stripe webhook received, but Supabase service role is not configured.",
      ok: true,
    });
  }

  const session = event.data?.object;
  const orderId = session?.metadata?.order_id;

  if (!orderId) {
    logApiError("stripe_webhook_missing_order_metadata", new Error("Missing order id"));

    return NextResponse.json({ error: "Stripe session is missing order metadata." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const paidAt = new Date().toISOString();
  const [{ error: orderError }, { error: paymentError }] = await Promise.all([
    supabase
      .from("orders")
      .update({
        order_status: "paid",
        payment_status: "paid",
        stripe_checkout_session_id: session?.id ?? null,
        stripe_payment_intent_id: session?.payment_intent ?? null,
      })
      .eq("id", orderId),
    supabase
      .from("payments")
      .update({
        paid_at: paidAt,
        provider_payment_id: session?.id ?? null,
        status: "paid",
      })
      .eq("order_id", orderId)
      .eq("provider", "stripe"),
  ]);

  const firstError = orderError ?? paymentError;

  if (firstError) {
    logApiError("stripe_webhook_update_failed", firstError, { order_id: orderId });

    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function verifyStripeSignature({
  body,
  header,
  secret,
}: {
  body: string;
  header: string;
  secret: string;
}) {
  const timestamp = header
    .split(",")
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const expected = header
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!timestamp || !expected) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${body}`),
  );
  const actual = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(actual, expected);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
