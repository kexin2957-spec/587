import type {
  BillingInterval,
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/marketplace/constants";
import type {
  MockOrderRecord,
  MockPaymentRecord,
} from "@/lib/server/marketplace-admin-store";

type PaymentCreationResult = {
  order_updates: Partial<MockOrderRecord>;
  payment: MockPaymentRecord;
};

type StripeCheckoutSession = {
  id?: string;
  payment_intent?: string | null;
  url?: string | null;
};

export function getBillingDefaults(planId: string): {
  billing_interval: BillingInterval;
  cancel_at: string | null;
  next_billing_date: string | null;
  subscription_status: SubscriptionStatus;
} {
  return {
    billing_interval: planId.includes("monthly") ? "monthly" : "one_time",
    cancel_at: null,
    next_billing_date: null,
    subscription_status: "not_required",
  };
}

export async function createPaymentForOrder({
  cancelUrl,
  order,
  origin,
  successUrl,
}: {
  cancelUrl?: string;
  order: MockOrderRecord;
  origin: string;
  successUrl?: string;
}): Promise<PaymentCreationResult> {
  const now = new Date().toISOString();
  const provider = toPaymentProvider(order.payment_method);
  const amount = getOrderPaymentAmount(order);
  const payment: MockPaymentRecord = {
    amount,
    created_at: now,
    currency: order.currency,
    id: crypto.randomUUID(),
    metadata: getPaymentMetadata(order),
    order_id: order.id,
    paid_at: null,
    payment_url: null,
    provider,
    provider_payment_id: null,
    status: "pending",
    updated_at: now,
  };
  const orderUpdates: Partial<MockOrderRecord> = {
    payment_link_url: null,
  };

  if (provider === "stripe") {
    const stripeSession = await tryCreateStripeCheckoutSession({
      cancelUrl,
      order,
      origin,
      successUrl,
    });

    if (stripeSession?.url) {
      payment.payment_url = stripeSession.url;
      payment.provider_payment_id = stripeSession.id ?? null;
      payment.metadata = {
        ...payment.metadata,
        stripe_checkout_session_id: stripeSession.id ?? null,
        stripe_payment_intent_id: stripeSession.payment_intent ?? null,
      };
      orderUpdates.payment_link_url = stripeSession.url;
      orderUpdates.stripe_checkout_session_id = stripeSession.id ?? null;
      orderUpdates.stripe_payment_intent_id = stripeSession.payment_intent ?? null;
    } else {
      payment.metadata = {
        ...payment.metadata,
        fallback_reason: "Stripe is not configured or checkout session creation failed.",
        manual_fallback: true,
      };
    }
  }

  if (provider === "paypal") {
    payment.metadata = {
      ...payment.metadata,
      paypal_manual_confirmation_required: true,
      instructions:
        "PayPal API credentials can be added later. Until then, confirm PayPal payment manually and record the reference.",
    };
  }

  if (provider === "wechat" || provider === "alipay" || provider === "bank_transfer") {
    payment.metadata = {
      ...payment.metadata,
      manual_instructions: getManualPaymentInstructions(provider),
    };
  }

  return {
    order_updates: orderUpdates,
    payment,
  };
}

export function buildManualPaymentUpdate({
  existingPayment,
  note,
  order,
  paymentProofUrl,
  paymentReference,
  paymentStatus,
}: {
  existingPayment?: MockPaymentRecord | null;
  note?: string | null;
  order: MockOrderRecord;
  paymentProofUrl?: string | null;
  paymentReference?: string | null;
  paymentStatus: PaymentStatus;
}): MockPaymentRecord {
  const now = new Date().toISOString();
  const provider = toPaymentProvider(order.payment_method);
  const nextStatus = toPaymentRecordStatus(paymentStatus);
  const payment: MockPaymentRecord =
    existingPayment ??
    {
      amount: getOrderPaymentAmount(order),
      created_at: now,
      currency: order.currency,
      id: crypto.randomUUID(),
      metadata: getPaymentMetadata(order),
      order_id: order.id,
      paid_at: null,
      payment_url: order.payment_link_url,
      provider,
      provider_payment_id: null,
      status: "pending",
      updated_at: now,
    };

  payment.amount = getOrderPaymentAmount(order);
  payment.currency = order.currency;
  payment.provider = provider;
  payment.status = nextStatus;
  payment.updated_at = now;
  payment.paid_at = nextStatus === "paid" ? payment.paid_at ?? now : payment.paid_at;
  payment.payment_url = order.payment_link_url;
  payment.metadata = {
    ...payment.metadata,
    admin_note: note?.trim() || payment.metadata.admin_note || null,
    manual_status_update: true,
    payment_proof_url: paymentProofUrl?.trim() || payment.metadata.payment_proof_url || null,
    payment_reference:
      paymentReference?.trim() || payment.metadata.payment_reference || null,
  };

  return payment;
}

export function getOrderStatusForPaymentStatus(
  paymentStatus: PaymentStatus,
  currentStatus: OrderStatus,
): OrderStatus {
  if (paymentStatus === "paid" || paymentStatus === "manually_approved") {
    return currentStatus === "delivered" || currentStatus === "completed"
      ? currentStatus
      : "paid";
  }

  if (paymentStatus === "cancelled") {
    return "cancelled";
  }

  return currentStatus;
}

export function toPaymentRecordStatus(
  status: PaymentStatus,
): MockPaymentRecord["status"] {
  return status === "manually_approved" ? "paid" : status;
}

export function toPaymentProvider(method: PaymentMethod): PaymentProvider {
  return method === "other" ? "manual" : method;
}

export function getOrderPaymentAmount(order: MockOrderRecord) {
  const amount = order.currency === "CNY" ? order.amount_cny : order.amount_usd;

  return amount ?? 0;
}

export function getManualPaymentInstructions(provider: PaymentProvider) {
  const instructions: Record<PaymentProvider, string> = {
    alipay:
      "Manual Alipay payment: send the customer payment instructions and record the transaction reference after confirmation.",
    bank_transfer:
      "Manual bank transfer: send bank details separately and record the bank reference after funds are confirmed.",
    manual:
      "Manual payment: contact the customer, confirm payment method, and record the reference after payment is verified.",
    paypal:
      "Manual PayPal fallback: confirm PayPal payment externally and record the transaction reference.",
    stripe:
      "Stripe fallback: Stripe is not configured, so use manual payment confirmation.",
    wechat:
      "Manual WeChat Pay: send the customer payment instructions and record the transaction reference after confirmation.",
  };

  return instructions[provider];
}

function getPaymentMetadata(order: MockOrderRecord) {
  return {
    agent_slug: order.agent_slug,
    billing_interval: order.billing_interval,
    customer_email: order.customer_email,
    order_number: order.order_number,
    plan_id: order.plan_id,
    plan_name: order.plan_name,
  };
}

async function tryCreateStripeCheckoutSession({
  cancelUrl,
  order,
  origin,
  successUrl,
}: {
  cancelUrl?: string;
  order: MockOrderRecord;
  origin: string;
  successUrl?: string;
}) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  try {
    const body = new URLSearchParams({
      cancel_url: cancelUrl ?? `${origin}/marketplace`,
      client_reference_id: order.order_number,
      "line_items[0][price_data][currency]": order.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": `${order.plan_name} - ${order.agent_slug}`,
      "line_items[0][price_data][unit_amount]": Math.round(
        getOrderPaymentAmount(order) * 100,
      ).toString(),
      "line_items[0][quantity]": "1",
      "metadata[order_id]": order.id,
      "metadata[order_number]": order.order_number,
      mode: "payment",
      success_url: successUrl ?? `${origin}/marketplace?checkout=success`,
    });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      body,
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as StripeCheckoutSession;
  } catch {
    return null;
  }
}
