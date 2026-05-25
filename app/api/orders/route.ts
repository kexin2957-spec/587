import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  DELIVERY_STATUSES,
  ORDER_PLAN_IDS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type DeliveryStatus,
  type OrderPlanId,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/marketplace/constants";
import {
  createDefaultCustomerConfig,
  createDefaultFaqItems,
  createDefaultKnowledgeDocuments,
} from "@/lib/marketplace/customer-config";
import { demoAgents } from "@/lib/marketplace/demo-data";
import { getAgentOrderPlans, localizeOrderPlan } from "@/lib/marketplace/order-plans";
import { writeRequestAuditLog } from "@/lib/server/audit-log";
import {
  createCustomerAccessToken,
  withCustomerAccessToken,
} from "@/lib/server/customer-access";
import {
  buildManualPaymentUpdate,
  createPaymentForOrder,
  getBillingDefaults,
  getOrderStatusForPaymentStatus,
} from "@/lib/server/payment-service";
import {
  getMockDeliveryPackageStore,
  getMockCustomerAgentConfigStore,
  getMockCustomerFaqItemStore,
  getMockAgentLicenseStore,
  getMockKnowledgeDocumentStore,
  getMockOrderNoteStore,
  getMockOrderStore,
  getMockPaymentStore,
  getPublicAgentBySlug,
  type MockCustomerAgentConfigRecord,
  type MockCustomerFaqItemRecord,
  type MockKnowledgeDocumentRecord,
  type MockDeliveryPackageRecord,
  type MockOrderNoteRecord,
  type MockOrderRecord,
  type MockPaymentRecord,
} from "@/lib/server/marketplace-admin-store";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

type OrderPayload = {
  agent_slug?: string;
  company_name?: string;
  currency?: "USD" | "CNY";
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  message?: string;
  payment_method?: PaymentMethod;
  plan_id?: OrderPlanId;
  source_page?: string;
  website_url?: string;
};

type OrderPatchPayload = {
  delivery_package?: {
    allowed_domains?: string[] | string;
    delivery_notes?: string | null;
    license_key?: string | null;
  };
  delivery_status?: DeliveryStatus;
  id?: string;
  note?: string;
  order_status?: OrderStatus;
  payment_note?: string;
  payment_proof_url?: string | null;
  payment_reference?: string;
  payment_status?: PaymentStatus;
};

type SupabaseOrderRecord = MockOrderRecord & {
  customer_agent_configs?: SupabaseCustomerConfigRecord[] | SupabaseCustomerConfigRecord | null;
  delivery_packages?: MockDeliveryPackageRecord[] | MockDeliveryPackageRecord | null;
  order_notes?: MockOrderNoteRecord[] | MockOrderNoteRecord | null;
  payments?: MockPaymentRecord[] | MockPaymentRecord | null;
};

type SupabaseCustomerConfigRecord = MockCustomerAgentConfigRecord & {
  customer_faq_items?: MockCustomerFaqItemRecord[] | MockCustomerFaqItemRecord | null;
  knowledge_documents?: MockKnowledgeDocumentRecord[] | MockKnowledgeDocumentRecord | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, customer_agent_configs(*, customer_faq_items(*), knowledge_documents(*)), delivery_packages(*), order_notes(*), payments(*)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map(normalizeSupabaseOrder),
      mode: "supabase",
      ok: true,
    });
  }

  return NextResponse.json({
    data: getMockOrdersWithDetails(),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.order);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as OrderPayload;
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(request.url).origin;
  const validationError = validateOrderPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const agentSlug = payload.agent_slug as string;
  const agent = demoAgents.find((item) => item.slug === agentSlug);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const plan = getAgentOrderPlans(agent).find((item) => item.id === payload.plan_id);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 400 });
  }

  const language = payload.currency === "CNY" ? "zh" : "en";
  const localizedPlan = localizeOrderPlan(plan, language);
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  const billingDefaults = getBillingDefaults(plan.id);
  const normalizedOrder = {
    agent_slug: agentSlug,
    amount_cny: plan.amountCny,
    amount_usd: plan.amountUsd,
    ...billingDefaults,
    company_name: normalizeNullable(payload.company_name),
    currency: payload.currency ?? "USD",
    customer_email: payload.customer_email?.trim() ?? "",
    customer_name: payload.customer_name?.trim() ?? "",
    customer_phone: normalizeNullable(payload.customer_phone),
    delivery_status: "not_started" as const,
    message: normalizeNullable(payload.message),
    order_number: orderNumber,
    order_status: "new" as const,
    payment_link_url: null,
    payment_method: payload.payment_method ?? "manual",
    payment_proof_url: null,
    payment_reference: null,
    payment_status: "pending" as const,
    paypal_order_id: null,
    plan_id: plan.id,
    plan_name: localizedPlan.name,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    website_url: normalizeNullable(payload.website_url),
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: agentRecord, error: lookupError } = await supabase
      .from("marketplace_agents")
      .select("id")
      .eq("slug", agentSlug)
      .eq("status", "approved")
      .single();

    if (lookupError || !agentRecord?.id) {
      return NextResponse.json(
        { error: "Agent record not found in Supabase." },
        { status: 404 },
      );
    }

    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...normalizedOrder,
        agent_id: agentRecord.id,
      })
      .select("*")
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const deliveryPackage = createDeliveryPackage({
      agentId: agentRecord.id,
      agentSlug,
      orderId: orderRecord.id,
      orderNumber,
      origin,
      timestamp: now,
      websiteUrl: normalizedOrder.website_url,
    });
    const orderWithPaymentFields = {
      ...normalizedOrder,
      ...orderRecord,
    } as MockOrderRecord;
    const paymentResult = await createPaymentForOrder({
      cancelUrl: withCustomerAccessToken(
        `${origin}/orders/${orderNumber}/success`,
        deliveryPackage.customer_access_token ?? "",
      ) ?? undefined,
      order: orderWithPaymentFields,
      origin,
      successUrl: withCustomerAccessToken(
        `${origin}/orders/${orderNumber}/success?checkout=success`,
        deliveryPackage.customer_access_token ?? "",
      ) ?? undefined,
    });

    if (Object.keys(paymentResult.order_updates).length > 0) {
      const { error: paymentOrderError } = await supabase
        .from("orders")
        .update(paymentResult.order_updates)
        .eq("id", orderRecord.id);

      if (paymentOrderError) {
        return NextResponse.json(
          { error: paymentOrderError.message },
          { status: 500 },
        );
      }

      Object.assign(orderWithPaymentFields, paymentResult.order_updates);
    }

    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentResult.payment)
      .select("*")
      .single();

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    const customerConfig = createDefaultCustomerConfig({
      agentId: agentRecord.id,
      agentSlug,
      businessName: normalizedOrder.company_name,
      contactEmail: normalizedOrder.customer_email,
      orderId: orderRecord.id,
      orderNumber,
      timestamp: now,
      websiteUrl: normalizedOrder.website_url,
    });

    const [{ data: packageRecord, error: packageError }, { data: configRecord, error: configError }] =
      await Promise.all([
        supabase.from("delivery_packages").insert(deliveryPackage).select("*").single(),
        supabase
          .from("customer_agent_configs")
          .insert(customerConfig)
          .select("*")
          .single(),
      ]);

    if (packageError) {
      return NextResponse.json({ error: packageError.message }, { status: 500 });
    }

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    await Promise.all([
      supabase.from("customer_faq_items").insert(
        createDefaultFaqItems({
          agentSlug: customerConfig.agent_slug,
          configId: configRecord.id,
          faq: customerConfig.faq,
          timestamp: now,
        }),
      ),
      supabase.from("knowledge_documents").insert(
        createDefaultKnowledgeDocuments({
          config: configRecord as MockCustomerAgentConfigRecord,
          timestamp: now,
        }),
      ),
    ]);

    return NextResponse.json(
      {
        data: {
          ...orderWithPaymentFields,
          customer_config: configRecord,
          delivery_package: packageRecord,
          notes: [],
          payments: [paymentRecord],
        },
        mode: "supabase",
        ok: true,
      },
      { status: 201 },
    );
  }

  const mockOrder: MockOrderRecord = {
    ...normalizedOrder,
    agent_id: agentSlug,
    created_at: now,
    id: crypto.randomUUID(),
    updated_at: now,
  };
  const mockPackage = createDeliveryPackage({
    agentId: agentSlug,
    agentSlug,
    orderId: mockOrder.id,
    orderNumber,
    origin,
    timestamp: now,
    websiteUrl: normalizedOrder.website_url,
  });
  const mockConfig = createDefaultCustomerConfig({
    agentId: agentSlug,
    agentSlug,
    businessName: normalizedOrder.company_name,
    contactEmail: normalizedOrder.customer_email,
    orderId: mockOrder.id,
    orderNumber,
    timestamp: now,
    websiteUrl: normalizedOrder.website_url,
  });
  const mockPaymentResult = await createPaymentForOrder({
    cancelUrl: withCustomerAccessToken(
      `${origin}/orders/${orderNumber}/success`,
      mockPackage.customer_access_token ?? "",
    ) ?? undefined,
    order: mockOrder,
    origin,
    successUrl: withCustomerAccessToken(
      `${origin}/orders/${orderNumber}/success?checkout=success`,
      mockPackage.customer_access_token ?? "",
    ) ?? undefined,
  });
  Object.assign(mockOrder, mockPaymentResult.order_updates);

  getMockOrderStore().push(mockOrder);
  getMockPaymentStore().push(mockPaymentResult.payment);
  getMockDeliveryPackageStore().push(mockPackage);
  getMockCustomerAgentConfigStore().push(mockConfig);
  getMockCustomerFaqItemStore().push(
    ...createDefaultFaqItems({
      agentSlug: mockConfig.agent_slug,
      configId: mockConfig.id,
      faq: mockConfig.faq,
      timestamp: now,
    }),
  );
  getMockKnowledgeDocumentStore().push(
    ...createDefaultKnowledgeDocuments({ config: mockConfig, timestamp: now }),
  );

  return NextResponse.json(
    {
      data: {
        ...mockOrder,
        customer_config: mockConfig,
        delivery_package: mockPackage,
        notes: [],
        payments: [mockPaymentResult.payment],
      },
      mode: "mock",
      ok: true,
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const adminError = await requireAdminForConfiguredSupabase();
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(request.url).origin;

  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as OrderPatchPayload;

  if (!payload.id) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }

  const statusError = validateOrderPatch(payload);

  if (statusError) {
    return NextResponse.json({ error: statusError }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const now = new Date().toISOString();

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", payload.id)
      .single();

    if (existingOrderError) {
      return NextResponse.json({ error: existingOrderError.message }, { status: 500 });
    }

    const updates: Partial<MockOrderRecord> = {};

    if (payload.payment_status) {
      updates.payment_status = payload.payment_status;
      updates.order_status = getOrderStatusForPaymentStatus(
        payload.payment_status,
        (existingOrder as MockOrderRecord).order_status,
      );
    }

    if (payload.order_status) {
      updates.order_status = payload.order_status;
    }

    if (payload.delivery_status) {
      updates.delivery_status = payload.delivery_status;
    }

    if (typeof payload.payment_reference === "string") {
      updates.payment_reference = payload.payment_reference.trim() || null;
    }

    if (typeof payload.payment_proof_url === "string") {
      updates.payment_proof_url = payload.payment_proof_url.trim() || null;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", payload.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (
      payload.payment_status ||
      typeof payload.payment_reference === "string" ||
      typeof payload.payment_proof_url === "string" ||
      typeof payload.payment_note === "string"
    ) {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", payload.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const paymentRecord = buildManualPaymentUpdate({
        existingPayment: existingPayment as MockPaymentRecord | null,
        note: payload.payment_note,
        order: {
          ...(existingOrder as MockOrderRecord),
          ...updates,
        },
        paymentProofUrl: payload.payment_proof_url,
        paymentReference: payload.payment_reference,
        paymentStatus: payload.payment_status ?? (existingOrder as MockOrderRecord).payment_status,
      });

      if (existingPayment?.id) {
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({
            amount: paymentRecord.amount,
            currency: paymentRecord.currency,
            metadata: paymentRecord.metadata,
            paid_at: paymentRecord.paid_at,
            payment_url: paymentRecord.payment_url,
            provider: paymentRecord.provider,
            provider_payment_id: paymentRecord.provider_payment_id,
            status: paymentRecord.status,
          })
          .eq("id", existingPayment.id);

        if (paymentUpdateError) {
          return NextResponse.json(
            { error: paymentUpdateError.message },
            { status: 500 },
          );
        }
      } else {
        const { error: paymentInsertError } = await supabase
          .from("payments")
          .insert(paymentRecord);

        if (paymentInsertError) {
          return NextResponse.json(
            { error: paymentInsertError.message },
            { status: 500 },
          );
        }
      }
    }

    if (payload.delivery_package) {
      const packageUpdates = normalizeDeliveryPackageUpdate(payload.delivery_package);

      if (Object.keys(packageUpdates).length > 0) {
        const [{ data: orderForPackage }, { data: existingPackage }] =
          await Promise.all([
            supabase
              .from("orders")
              .select("agent_slug, order_number")
              .eq("id", payload.id)
              .single(),
            supabase
              .from("delivery_packages")
              .select("*")
              .eq("order_id", payload.id)
              .single(),
          ]);

        if (orderForPackage && existingPackage) {
          const licenseKey =
            packageUpdates.license_key ??
            (existingPackage as MockDeliveryPackageRecord).license_key;
          const allowedDomains =
            packageUpdates.allowed_domains ??
            (existingPackage as MockDeliveryPackageRecord).allowed_domains ??
            [];

          packageUpdates.allowed_domains = allowedDomains;
          if (licenseKey) {
            packageUpdates.license_key = licenseKey;
            Object.assign(
              packageUpdates,
              buildDeliveryUrls({
                agentSlug: orderForPackage.agent_slug,
                allowedDomains,
                licenseKey,
                orderNumber: orderForPackage.order_number,
                origin,
              }),
            );
          }
        }

        const { error } = await supabase
          .from("delivery_packages")
          .update(packageUpdates)
          .eq("order_id", payload.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const licenseKey = packageUpdates.license_key ??
          (existingPackage as MockDeliveryPackageRecord | null)?.license_key;

        if (licenseKey && packageUpdates.allowed_domains) {
          await supabase
            .from("agent_licenses")
            .update({ allowed_domains: packageUpdates.allowed_domains })
            .eq("license_key", licenseKey);
        }
      }
    }

    const paymentNote = getPaymentNoteForOrder(payload);
    if (payload.note?.trim() || paymentNote) {
      const { error } = await supabase.from("order_notes").insert({
        note: [payload.note?.trim(), paymentNote].filter(Boolean).join("\n"),
        order_id: payload.id,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, customer_agent_configs(*, customer_faq_items(*), knowledge_documents(*)), delivery_packages(*), order_notes(*), payments(*)")
      .eq("id", payload.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeRequestAuditLog(request, {
      action: "order.update",
      metadata: {
        changed_fields: getOrderPatchFields(payload),
        order_number: (existingOrder as MockOrderRecord).order_number,
      },
      resourceId: payload.id,
      resourceType: "order",
    });

    return NextResponse.json({
      data: normalizeSupabaseOrder(data as SupabaseOrderRecord),
      mode: "supabase",
      ok: true,
    });
  }

  const order = getMockOrderStore().find((item) => item.id === payload.id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (payload.payment_status) {
    order.payment_status = payload.payment_status;
    order.order_status = getOrderStatusForPaymentStatus(
      payload.payment_status,
      order.order_status,
    );
  }

  if (payload.order_status) {
    order.order_status = payload.order_status;
  }

  if (payload.delivery_status) {
    order.delivery_status = payload.delivery_status;
  }

  if (typeof payload.payment_reference === "string") {
    order.payment_reference = payload.payment_reference.trim() || null;
  }

  if (typeof payload.payment_proof_url === "string") {
    order.payment_proof_url = payload.payment_proof_url.trim() || null;
  }

  order.updated_at = now;

  if (
    payload.payment_status ||
    typeof payload.payment_reference === "string" ||
    typeof payload.payment_proof_url === "string" ||
    typeof payload.payment_note === "string"
  ) {
    const paymentStore = getMockPaymentStore();
    const existingPayment = paymentStore
      .filter((payment) => payment.order_id === order.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    const paymentRecord = buildManualPaymentUpdate({
      existingPayment,
      note: payload.payment_note,
      order,
      paymentProofUrl: payload.payment_proof_url,
      paymentReference: payload.payment_reference,
      paymentStatus: payload.payment_status ?? order.payment_status,
    });

    if (!existingPayment) {
      paymentStore.push(paymentRecord);
    }
  }

  if (payload.delivery_package) {
    const deliveryPackage = getMockDeliveryPackageStore().find(
      (item) => item.order_id === order.id,
    );

    if (deliveryPackage) {
      Object.assign(
        deliveryPackage,
        normalizeDeliveryPackageUpdate(payload.delivery_package),
        { updated_at: now },
      );
      const license = deliveryPackage.license_key
        ? getMockAgentLicenseStore().find(
            (item) => item.license_key === deliveryPackage.license_key,
          )
        : null;

      if (license) {
        license.allowed_domains = deliveryPackage.allowed_domains ?? [];
        license.updated_at = now;
      }
    }
  }

  const paymentNote = getPaymentNoteForOrder(payload);
  if (payload.note?.trim() || paymentNote) {
    getMockOrderNoteStore().push({
      created_at: now,
      id: crypto.randomUUID(),
      note: [payload.note?.trim(), paymentNote].filter(Boolean).join("\n"),
      order_id: order.id,
    });
  }

  await writeRequestAuditLog(request, {
    action: "order.update",
    metadata: {
      changed_fields: getOrderPatchFields(payload),
      order_number: order.order_number,
    },
    resourceId: order.id,
    resourceType: "order",
  });

  return NextResponse.json({
    data: getMockOrderWithDetails(order),
    mode: "mock",
    ok: true,
  });
}

function validateOrderPayload(payload: OrderPayload) {
  if (!payload.customer_name?.trim()) {
    return "Customer name is required.";
  }

  if (!payload.customer_email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.customer_email)) {
    return "A valid customer email is required.";
  }

  if (!payload.agent_slug?.trim()) {
    return "Agent slug is required.";
  }

  if (!payload.plan_id || !ORDER_PLAN_IDS.includes(payload.plan_id)) {
    return "A valid plan is required.";
  }

  if (payload.payment_method && !PAYMENT_METHODS.includes(payload.payment_method)) {
    return "Invalid payment method.";
  }

  if (payload.currency && !["USD", "CNY"].includes(payload.currency)) {
    return "Invalid currency.";
  }

  if (!getPublicAgentBySlug(payload.agent_slug)) {
    return "This agent is not available for public ordering.";
  }

  return "";
}

function validateOrderPatch(payload: OrderPatchPayload) {
  if (payload.payment_status && !PAYMENT_STATUSES.includes(payload.payment_status)) {
    return "Invalid payment status.";
  }

  if (payload.order_status && !ORDER_STATUSES.includes(payload.order_status)) {
    return "Invalid order status.";
  }

  if (payload.delivery_status && !DELIVERY_STATUSES.includes(payload.delivery_status)) {
    return "Invalid delivery status.";
  }

  return "";
}

function getOrderPatchFields(payload: OrderPatchPayload) {
  return Object.entries(payload)
    .filter(([key, value]) => key !== "id" && typeof value !== "undefined")
    .map(([key]) => key);
}

function normalizeNullable(value?: string) {
  return value?.trim() || null;
}

function generateOrderNumber() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `AAM-${datePart}-${randomPart}`;
}

function createDeliveryPackage({
  agentId,
  agentSlug,
  orderId,
  orderNumber,
  origin,
  timestamp,
  websiteUrl,
}: {
  agentId: string;
  agentSlug: string;
  orderId: string;
  orderNumber: string;
  origin: string;
  timestamp: string;
  websiteUrl: string | null;
}): MockDeliveryPackageRecord {
  const allowedDomains = getAllowedDomains(websiteUrl);
  const customerAccessToken = createCustomerAccessToken();
  const dashboardUrl = withCustomerAccessToken(
    `${origin}/customer/orders/${orderNumber}`,
    customerAccessToken,
  );

  return {
    agent_id: agentId,
    allowed_domains: allowedDomains,
    created_at: timestamp,
    customer_access_token: customerAccessToken,
    customer_dashboard_url: dashboardUrl,
    delivery_notes:
      "Delivery package generated. Confirm payment, review allowed domains, configure the customer dashboard, then send the dashboard link and installation documentation.",
    documentation_url: `${origin}${getAgentDocumentationPath(agentSlug, orderNumber)}`,
    embed_code: null,
    hosted_agent_url: null,
    id: crypto.randomUUID(),
    license_key: null,
    order_id: orderId,
    updated_at: timestamp,
  };
}

function getAgentDocumentationPath(agentSlug: string, orderNumber: string) {
  if (agentSlug === "website-customer-support-agent") {
    return "/docs/install-website-agent";
  }

  if (agentSlug === "ecommerce-product-support-agent") {
    return "/docs/install-ecommerce-agent";
  }

  return `/delivery/${orderNumber}`;
}

function buildDeliveryUrls({
  agentSlug,
  allowedDomains,
  licenseKey,
  orderNumber,
  origin,
}: {
  agentSlug: string;
  allowedDomains: string[];
  licenseKey: string;
  orderNumber: string;
  origin: string;
}): Pick<MockDeliveryPackageRecord, "embed_code" | "hosted_agent_url"> {
  const hostedAgentUrl = `${origin}/embed/agents/${agentSlug}?order=${orderNumber}&license=${licenseKey}`;
  const iframeCode = `<iframe src="${hostedAgentUrl}" width="100%" height="620" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy" title="AI Agent Chat Widget"></iframe>`;
  const scriptCode = `<script src="${origin}/widget.js" data-agent-id="${agentSlug}" data-order-number="${orderNumber}" data-license-key="${licenseKey}" data-allowed-domains="${allowedDomains.join(",")}" async></script>`;

  return {
    embed_code: `${iframeCode}\n\n<!-- Script embed option -->\n${scriptCode}`,
    hosted_agent_url: hostedAgentUrl,
  };
}

function getAllowedDomains(websiteUrl: string | null) {
  if (!websiteUrl) {
    return [];
  }

  try {
    const normalizedUrl = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, "");

    return hostname ? [hostname] : [];
  } catch {
    return [];
  }
}

function normalizeDeliveryPackageUpdate(
  payload: NonNullable<OrderPatchPayload["delivery_package"]>,
): Partial<MockDeliveryPackageRecord> {
  const updates: Partial<MockDeliveryPackageRecord> = {};

  if (typeof payload.license_key === "string") {
    updates.license_key = payload.license_key.trim() || null;
  }

  if (typeof payload.delivery_notes === "string") {
    updates.delivery_notes = payload.delivery_notes.trim() || null;
  }

  if (Array.isArray(payload.allowed_domains)) {
    updates.allowed_domains = normalizeAllowedDomains(payload.allowed_domains);
  } else if (typeof payload.allowed_domains === "string") {
    updates.allowed_domains = normalizeAllowedDomains(
      payload.allowed_domains.split(/[,\n]/),
    );
  }

  return updates;
}

function normalizeAllowedDomains(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase().replace(/^https?:\/\//, ""))
        .map((value) => value.split("/")[0]?.replace(/^www\./, "") ?? "")
        .filter(Boolean),
    ),
  );
}

function getMockOrdersWithDetails() {
  return [...getMockOrderStore()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(getMockOrderWithDetails);
}

function getMockOrderWithDetails(order: MockOrderRecord) {
  const config =
    getMockCustomerAgentConfigStore().find(
      (item) => item.order_id === order.id || item.order_number === order.order_number,
    ) ?? null;

  return {
    ...order,
    customer_config: hydrateOrderConfig(
      config,
      config
        ? getMockCustomerFaqItemStore().filter((item) => item.config_id === config.id)
        : [],
      config
        ? getMockKnowledgeDocumentStore().filter((item) => item.config_id === config.id)
        : [],
    ),
    delivery_package:
      getMockDeliveryPackageStore().find((item) => item.order_id === order.id) ??
      null,
    notes: getMockOrderNoteStore()
      .filter((item) => item.order_id === order.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    payments: getMockPaymentStore()
      .filter((item) => item.order_id === order.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

function normalizeSupabaseOrder(record: unknown) {
  const order = record as SupabaseOrderRecord;

  return {
    ...order,
    customer_config: hydrateSupabaseOrderConfig(firstRelation(order.customer_agent_configs)),
    delivery_package: firstRelation(order.delivery_packages) ?? null,
    notes: toArray(order.order_notes).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    payments: toArray(order.payments).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  };
}

function getPaymentNoteForOrder(payload: OrderPatchPayload) {
  const lines = [];

  if (payload.payment_note?.trim()) {
    lines.push(`Payment note: ${payload.payment_note.trim()}`);
  }

  if (payload.payment_reference?.trim()) {
    lines.push(`Payment reference: ${payload.payment_reference.trim()}`);
  }

  if (payload.payment_proof_url?.trim()) {
    lines.push(`Payment proof: ${payload.payment_proof_url.trim()}`);
  }

  return lines.join("\n");
}

function hydrateSupabaseOrderConfig(config: SupabaseCustomerConfigRecord | null) {
  if (!config) {
    return null;
  }

  return hydrateOrderConfig(
    config,
    toArray(config.customer_faq_items),
    toArray(config.knowledge_documents),
  );
}

function hydrateOrderConfig(
  config: MockCustomerAgentConfigRecord | null,
  faqItems: MockCustomerFaqItemRecord[],
  knowledgeDocuments: MockKnowledgeDocumentRecord[],
) {
  if (!config) {
    return null;
  }

  const normalizedConfig = normalizeCustomerConfigAliases(config);
  const finalFaqItems = faqItems.length
    ? faqItems
    : createDefaultFaqItems({
        agentSlug: normalizedConfig.agent_slug,
        configId: normalizedConfig.id,
        faq: normalizedConfig.faq ?? [],
      });
  const finalKnowledgeDocuments = knowledgeDocuments.length
    ? knowledgeDocuments
    : createDefaultKnowledgeDocuments({ config: normalizedConfig });

  return {
    ...normalizedConfig,
    faq: finalFaqItems
      .filter((item) => item.is_active)
      .map((item) => ({ answer: item.answer, question: item.question })),
    faq_items: finalFaqItems,
    knowledge_documents: finalKnowledgeDocuments,
  };
}

function normalizeCustomerConfigAliases(config: MockCustomerAgentConfigRecord) {
  const businessDescription =
    config.business_description || config.company_introduction || "";
  const servicesOrProducts =
    config.services_or_products || config.services_products || "";

  return {
    ...config,
    business_description: businessDescription,
    business_description_en: config.business_description_en || businessDescription,
    business_description_zh: config.business_description_zh || "",
    company_introduction: config.company_introduction || businessDescription,
    pricing_ranges_en: config.pricing_ranges_en || config.pricing_ranges || "",
    pricing_ranges_zh: config.pricing_ranges_zh || "",
    services_or_products: servicesOrProducts,
    services_or_products_en: config.services_or_products_en || servicesOrProducts,
    services_or_products_zh: config.services_or_products_zh || "",
    services_products: config.services_products || servicesOrProducts,
    welcome_message_en: config.welcome_message_en || config.welcome_message || "",
    welcome_message_zh: config.welcome_message_zh || "",
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
