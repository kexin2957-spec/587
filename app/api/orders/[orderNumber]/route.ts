import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createDefaultFaqItems,
  createDefaultKnowledgeDocuments,
} from "@/lib/marketplace/customer-config";
import {
  getCustomerAccessToken,
  isCustomerAccessAllowed,
} from "@/lib/server/customer-access";
import {
  getMockAgentLicenseStore,
  getMockAgentMessageStore,
  getMockAgentSessionStore,
  getMockCustomerAgentConfigStore,
  getMockCustomerFaqItemStore,
  getMockDeliveryPackageStore,
  getMockKnowledgeDocumentStore,
  getMockLeadStore,
  getMockOrderStore,
  getMockPaymentStore,
  getMockUsageLogStore,
  type MockAgentLicenseRecord,
  type MockAgentMessageRecord,
  type MockAgentSessionRecord,
  type MockCustomerAgentConfigRecord,
  type MockCustomerFaqItemRecord,
  type MockDeliveryPackageRecord,
  type MockKnowledgeDocumentRecord,
  type MockLeadRecord,
  type MockOrderRecord,
  type MockPaymentRecord,
} from "@/lib/server/marketplace-admin-store";
import { summarizeUsageLogs } from "@/lib/server/license-service";

export const dynamic = "force-dynamic";

type SupabaseOrderRecord = MockOrderRecord & {
  delivery_packages?: MockDeliveryPackageRecord[] | MockDeliveryPackageRecord | null;
  payments?: MockPaymentRecord[] | MockPaymentRecord | null;
};

type CustomerConversationRecord = MockAgentSessionRecord & {
  last_intent: string | null;
  last_lead_score: string | null;
  messages: MockAgentMessageRecord[];
  should_handoff: boolean;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const decodedOrderNumber = decodeURIComponent(orderNumber);
  const accessToken = getCustomerAccessToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, delivery_packages(*), payments(*)")
      .eq("order_number", decodedOrderNumber)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const deliveryPackage = firstRelation(
      (order as SupabaseOrderRecord).delivery_packages,
    ) ?? null;

    if (!isCustomerAccessAllowed(deliveryPackage, accessToken)) {
      return NextResponse.json(
        { error: "Invalid or missing customer dashboard access token." },
        { status: 403 },
      );
    }

    const [{ data: config }, { data: leads }, { data: license }] = await Promise.all([
      supabase
        .from("customer_agent_configs")
        .select("*")
        .eq("order_number", decodedOrderNumber)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("*")
        .eq("order_number", decodedOrderNumber)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("agent_licenses")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle(),
    ]);
    const { data: usageLogs } = license?.id
      ? await supabase
          .from("usage_logs")
          .select("*")
          .eq("license_id", license.id)
          .limit(1000)
      : { data: [] };
    const { data: sessions } = await supabase
      .from("agent_sessions")
      .select("*")
      .eq("order_id", order.id)
      .order("last_message_at", { ascending: false })
      .limit(100);
    const sessionIds = (sessions ?? []).map((session) => session.id);
    const { data: messages } = sessionIds.length
      ? await supabase
          .from("agent_messages")
          .select("*")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true })
      : { data: [] };
    const [{ data: faqItems }, { data: knowledgeDocuments }] = config?.id
      ? await Promise.all([
          supabase
            .from("customer_faq_items")
            .select("*")
            .eq("config_id", config.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("knowledge_documents")
            .select("*")
            .eq("config_id", config.id)
            .order("created_at", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }];

    return NextResponse.json({
      data: normalizeOrderResponse(
        order as SupabaseOrderRecord,
        hydrateCustomerConfig(
          config as MockCustomerAgentConfigRecord | null,
          (faqItems ?? []) as MockCustomerFaqItemRecord[],
          (knowledgeDocuments ?? []) as MockKnowledgeDocumentRecord[],
        ),
        (leads ?? []) as MockLeadRecord[],
        license as MockAgentLicenseRecord | null,
        summarizeUsageLogs(usageLogs ?? []),
        normalizeConversationRecords(
          (sessions ?? []) as MockAgentSessionRecord[],
          (messages ?? []) as MockAgentMessageRecord[],
        ),
      ),
      mode: "supabase",
      ok: true,
    });
  }

  const order = getMockOrderStore().find(
    (item) => item.order_number === decodedOrderNumber || item.id === decodedOrderNumber,
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const deliveryPackage =
    getMockDeliveryPackageStore().find((item) => item.order_id === order.id) ?? null;

  if (!isCustomerAccessAllowed(deliveryPackage, accessToken)) {
    return NextResponse.json(
      { error: "Invalid or missing customer dashboard access token." },
      { status: 403 },
    );
  }

  const config =
    getMockCustomerAgentConfigStore().find(
      (item) => item.order_number === order.order_number || item.order_id === order.id,
    ) ?? null;
  const faqItems = config
    ? getMockCustomerFaqItemStore().filter((item) => item.config_id === config.id)
    : [];
  const knowledgeDocuments = config
    ? getMockKnowledgeDocumentStore().filter((item) => item.config_id === config.id)
    : [];
  const leads = getMockLeadStore()
    .filter((lead) => lead.order_number === order.order_number || lead.order_id === order.id)
    .sort((leadA, leadB) => leadB.created_at.localeCompare(leadA.created_at));
  const license =
    getMockAgentLicenseStore().find((item) => item.order_id === order.id) ?? null;
  const usageSummary = summarizeUsageLogs(
    getMockUsageLogStore().filter((log) => log.license_id === license?.id),
  );
  const sessions = getMockAgentSessionStore().filter(
    (session) => session.order_id === order.id,
  );
  const sessionIds = new Set(sessions.map((session) => session.id));
  const messages = getMockAgentMessageStore().filter((message) =>
    sessionIds.has(message.session_id),
  );

  return NextResponse.json({
    data: normalizeOrderResponse(
      order,
      hydrateCustomerConfig(config, faqItems, knowledgeDocuments),
      leads,
      license,
      usageSummary,
      normalizeConversationRecords(sessions, messages),
    ),
    mode: "mock",
    ok: true,
  });
}

function normalizeOrderResponse(
  order: MockOrderRecord | SupabaseOrderRecord,
  customerConfig: (MockCustomerAgentConfigRecord & {
    faq_items?: MockCustomerFaqItemRecord[];
    knowledge_documents?: MockKnowledgeDocumentRecord[];
  }) | null,
  leads: MockLeadRecord[],
  agentLicense: MockAgentLicenseRecord | null,
  usageSummary: ReturnType<typeof summarizeUsageLogs>,
  conversations: CustomerConversationRecord[],
) {
  const supabaseOrder = order as SupabaseOrderRecord;
  const deliveryPackage =
    "delivery_packages" in supabaseOrder
      ? firstRelation(supabaseOrder.delivery_packages) ?? null
      : getMockDeliveryPackageStore().find((item) => item.order_id === order.id) ?? null;

  return {
    order: {
      agent_id: order.agent_id,
      agent_slug: order.agent_slug,
      amount_cny: order.amount_cny,
      amount_usd: order.amount_usd,
      company_name: order.company_name,
      created_at: order.created_at,
      currency: order.currency,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_status: order.delivery_status,
      id: order.id,
      message: order.message,
      order_number: order.order_number,
      order_status: order.order_status,
      payment_method: order.payment_method,
      payment_link_url: order.payment_link_url,
      payment_proof_url: order.payment_proof_url,
      payment_reference: order.payment_reference,
      payment_status: order.payment_status,
      plan_id: order.plan_id,
      plan_name: order.plan_name,
      billing_interval: order.billing_interval,
      cancel_at: order.cancel_at,
      next_billing_date: order.next_billing_date,
      subscription_status: order.subscription_status,
      updated_at: order.updated_at,
      website_url: order.website_url,
    },
    customer_config: customerConfig,
    delivery_package: toCustomerDeliveryPackage(deliveryPackage),
    payments:
      "payments" in supabaseOrder
        ? toArray(supabaseOrder.payments).sort((a, b) =>
            b.created_at.localeCompare(a.created_at),
          )
        : getMockPaymentStore()
            .filter((payment) => payment.order_id === order.id)
            .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    agent_license: agentLicense,
    conversations,
    leads,
    usage_summary: usageSummary,
  };
}

function normalizeConversationRecords(
  sessions: MockAgentSessionRecord[],
  messages: MockAgentMessageRecord[],
): CustomerConversationRecord[] {
  return [...sessions]
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    .map((session) => {
      const sessionMessages = messages.filter(
        (message) => message.session_id === session.id,
      );
      const lastAnalyzedMessage = [...sessionMessages]
        .reverse()
        .find((message) => message.intent || message.lead_score);

      return {
        ...session,
        last_intent: lastAnalyzedMessage?.intent ?? null,
        last_lead_score: lastAnalyzedMessage?.lead_score ?? null,
        messages: sessionMessages,
        should_handoff: sessionMessages.some(
          (message) => message.metadata?.should_handoff === true,
        ),
      };
    });
}

function toCustomerDeliveryPackage(deliveryPackage: MockDeliveryPackageRecord | null) {
  if (!deliveryPackage) {
    return null;
  }

  return {
    agent_id: deliveryPackage.agent_id,
    allowed_domains: deliveryPackage.allowed_domains,
    created_at: deliveryPackage.created_at,
    customer_dashboard_url: deliveryPackage.customer_dashboard_url,
    delivery_notes: deliveryPackage.delivery_notes,
    documentation_url: deliveryPackage.documentation_url,
    embed_code: deliveryPackage.embed_code,
    hosted_agent_url: deliveryPackage.hosted_agent_url,
    id: deliveryPackage.id,
    license_key: deliveryPackage.license_key,
    order_id: deliveryPackage.order_id,
    updated_at: deliveryPackage.updated_at,
  };
}

function hydrateCustomerConfig(
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
