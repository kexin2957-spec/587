import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  LEAD_INTENTS,
  LEAD_SCORES,
  LEAD_STATUSES,
  type LeadIntent,
  type LeadScore,
  type LeadStatus,
} from "@/lib/marketplace/constants";
import {
  getCustomerAccessToken,
  isCustomerAccessAllowed,
} from "@/lib/server/customer-access";
import { writeRequestAuditLog } from "@/lib/server/audit-log";
import {
  getMockDeliveryPackageStore,
  getMockCustomerAgentConfigStore,
  getMockLeadStore,
  getMockOrderStore,
  type MockLeadRecord,
} from "@/lib/server/marketplace-admin-store";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";
import {
  eventTypeForWidgetFailure,
  getLicenseErrorResponse,
  recordWidgetUsage,
  validateWidgetLicense,
} from "@/lib/server/widget-license-service";

type LeadPayload = {
  agent_slug?: string;
  conversation_summary?: string;
  customer_config_id?: string;
  inquiry?: string;
  intent?: LeadIntent;
  lead_score?: LeadScore;
  license_key?: string;
  needs_human?: boolean;
  order_number?: string;
  parent_domain?: string;
  transcript?: unknown;
  visitor_company?: string;
  visitor_email?: string;
  visitor_name?: string;
  visitor_phone?: string;
  widget_auth_token?: string;
};

type LeadPatchPayload = {
  admin_note?: string;
  access_token?: string;
  id?: string;
  intent?: LeadIntent;
  lead_score?: LeadScore;
  order_number?: string;
  status?: LeadStatus;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order_number") ?? searchParams.get("order");
  const customerConfigId = searchParams.get("customer_config_id");
  const agentSlug = searchParams.get("agent_slug");
  const leadScore = searchParams.get("lead_score");
  const status = searchParams.get("status");
  const isScopedCustomerRead = Boolean(orderNumber || customerConfigId);

  if (!isScopedCustomerRead) {
    const adminError = await requireAdminForConfiguredSupabase();

    if (adminError) {
      return adminError;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (isScopedCustomerRead) {
      const accessError = await verifySupabaseCustomerLeadRead(supabase, {
        accessToken: getCustomerAccessToken(request),
        customerConfigId,
        orderNumber,
      });

      if (accessError) {
        return accessError;
      }
    }

    let query = supabase.from("leads").select("*");

    if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    }

    if (customerConfigId) {
      query = query.eq("customer_config_id", customerConfigId);
    }

    if (agentSlug) {
      query = query.eq("agent_slug", agentSlug);
    }

    if (leadScore && LEAD_SCORES.includes(leadScore as LeadScore)) {
      query = query.eq("lead_score", leadScore);
    }

    if (status && LEAD_STATUSES.includes(status as LeadStatus)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], mode: "supabase", ok: true });
  }

  if (isScopedCustomerRead) {
    const accessError = verifyMockCustomerLeadRead({
      accessToken: getCustomerAccessToken(request),
      customerConfigId,
      orderNumber,
    });

    if (accessError) {
      return accessError;
    }
  }

  let data = [...getMockLeadStore()];

  if (orderNumber) {
    data = data.filter((lead) => lead.order_number === orderNumber);
  }

  if (customerConfigId) {
    data = data.filter((lead) => lead.customer_config_id === customerConfigId);
  }

  if (agentSlug) {
    data = data.filter((lead) => lead.agent_slug === agentSlug);
  }

  if (leadScore && LEAD_SCORES.includes(leadScore as LeadScore)) {
    data = data.filter((lead) => lead.lead_score === leadScore);
  }

  if (status && LEAD_STATUSES.includes(status as LeadStatus)) {
    data = data.filter((lead) => lead.status === status);
  }

  return NextResponse.json({
    data: data.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.lead);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as LeadPayload;
  const licenseContext = payload.license_key
    ? await validateWidgetLicense(request, {
        agent_id: payload.agent_slug,
        license_key: payload.license_key,
        order_number: payload.order_number,
        parent_domain: payload.parent_domain,
        widget_auth_token: payload.widget_auth_token,
      })
    : null;

  if (licenseContext && !licenseContext.ok) {
    await recordWidgetUsage(licenseContext, eventTypeForWidgetFailure(licenseContext), {
      agent_id: payload.agent_slug,
      reason: licenseContext.errorCode,
    });

    return getLicenseErrorResponse(licenseContext);
  }

  const validationError = validateLeadPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const inferred = inferLead(payload);
  const now = new Date().toISOString();
  const normalizedLead = {
    agent_slug: payload.agent_slug?.trim() ?? "",
    conversation_summary:
      payload.conversation_summary?.trim() ||
      summarizeConversation(payload.inquiry ?? "", inferred.intent, inferred.score),
    customer_config_id: payload.customer_config_id?.trim() || null,
    inquiry: payload.inquiry?.trim() ?? "",
    intent: payload.intent && LEAD_INTENTS.includes(payload.intent)
      ? payload.intent
      : inferred.intent,
    lead_score:
      payload.lead_score && LEAD_SCORES.includes(payload.lead_score)
        ? payload.lead_score
        : inferred.score,
    needs_human: Boolean(payload.needs_human || inferred.needsHuman),
    order_number: payload.order_number?.trim() || null,
    status: "new" as const,
    transcript: Array.isArray(payload.transcript) ? payload.transcript : [],
    visitor_company: payload.visitor_company?.trim() || null,
    visitor_email: payload.visitor_email?.trim() ?? "",
    visitor_name: payload.visitor_name?.trim() ?? "",
    visitor_phone: payload.visitor_phone?.trim() || null,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const [agentLookup, orderLookup] = await Promise.all([
      supabase
        .from("marketplace_agents")
        .select("id")
        .eq("slug", normalizedLead.agent_slug)
        .maybeSingle(),
      normalizedLead.order_number
        ? supabase
            .from("orders")
            .select("id")
            .eq("order_number", normalizedLead.order_number)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (agentLookup.error) {
      return NextResponse.json({ error: agentLookup.error.message }, { status: 500 });
    }

    if (orderLookup.error) {
      return NextResponse.json({ error: orderLookup.error.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...normalizedLead,
        agent_id: agentLookup.data?.id ?? null,
        order_id: orderLookup.data?.id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (licenseContext) {
      await recordWidgetUsage(licenseContext, "lead_created", {
        lead_id: data.id,
        visitor_email: normalizedLead.visitor_email,
      });
    }

    return NextResponse.json({ data, mode: "supabase", ok: true }, { status: 201 });
  }

  const order = normalizedLead.order_number
    ? getMockOrderStore().find(
        (item) => item.order_number === normalizedLead.order_number,
      )
    : null;
  const mockLead: MockLeadRecord = {
    ...normalizedLead,
    admin_note: null,
    agent_id: normalizedLead.agent_slug,
    created_at: now,
    id: crypto.randomUUID(),
    order_id: order?.id ?? null,
    updated_at: now,
  };

  getMockLeadStore().push(mockLead);

  if (licenseContext) {
    await recordWidgetUsage(licenseContext, "lead_created", {
      lead_id: mockLead.id,
      visitor_email: mockLead.visitor_email,
    });
  }

  return NextResponse.json({ data: mockLead, mode: "mock", ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as LeadPatchPayload;
  const accessToken = payload.access_token?.trim() || getCustomerAccessToken(request);
  const isCustomerScopedUpdate = Boolean(payload.order_number && accessToken);
  const adminError = isCustomerScopedUpdate
    ? null
    : await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Lead id is required." }, { status: 400 });
  }

  if (payload.status && !LEAD_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
  }

  if (payload.lead_score && !LEAD_SCORES.includes(payload.lead_score)) {
    return NextResponse.json({ error: "Invalid lead score." }, { status: 400 });
  }

  if (payload.intent && !LEAD_INTENTS.includes(payload.intent)) {
    return NextResponse.json({ error: "Invalid lead intent." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const updates: {
      admin_note?: string | null;
      intent?: LeadIntent;
      lead_score?: LeadScore;
      status?: LeadStatus;
    } = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (payload.lead_score) {
      updates.lead_score = payload.lead_score;
    }

    if (payload.intent) {
      updates.intent = payload.intent;
    }

    if (typeof payload.admin_note === "string") {
      updates.admin_note = payload.admin_note.trim() || null;
    }

    if (isCustomerScopedUpdate) {
      const { data: orderForAccess } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", payload.order_number ?? "")
        .maybeSingle();
      const { data: deliveryPackage } = await supabase
        .from("delivery_packages")
        .select("customer_access_token")
        .eq("order_id", (orderForAccess as { id?: string } | null)?.id ?? "")
        .maybeSingle();

      if (!isCustomerAccessAllowed(deliveryPackage, accessToken)) {
        return NextResponse.json(
          { error: "Invalid or missing customer dashboard access token." },
          { status: 403 },
        );
      }
    }

    let query = supabase
      .from("leads")
      .update(updates)
      .eq("id", payload.id);

    if (isCustomerScopedUpdate && payload.order_number) {
      query = query.eq("order_number", payload.order_number);
    }

    const { data, error } = await query.select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeRequestAuditLog(request, {
      action: isCustomerScopedUpdate ? "lead.customer_update" : "lead.admin_update",
      actorType: isCustomerScopedUpdate ? "customer" : undefined,
      metadata: {
        order_number: payload.order_number ?? null,
        status: payload.status ?? null,
      },
      resourceId: payload.id,
      resourceType: "lead",
    });

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  const lead = getMockLeadStore().find((item) => item.id === payload.id);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (isCustomerScopedUpdate) {
    const order = getMockOrderStore().find(
      (item) => item.order_number === payload.order_number || item.id === payload.order_number,
    );
    const deliveryPackage = order
      ? getMockDeliveryPackageStore().find((item) => item.order_id === order.id)
      : null;

    if (
      !order ||
      lead.order_number !== order.order_number ||
      !isCustomerAccessAllowed(deliveryPackage, accessToken)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing customer dashboard access token." },
        { status: 403 },
      );
    }
  }

  if (payload.status) {
    lead.status = payload.status;
  }

  if (payload.lead_score) {
    lead.lead_score = payload.lead_score;
  }

  if (payload.intent) {
    lead.intent = payload.intent;
  }

  if (typeof payload.admin_note === "string") {
    lead.admin_note = payload.admin_note.trim() || null;
  }

  lead.updated_at = new Date().toISOString();

  await writeRequestAuditLog(request, {
    action: isCustomerScopedUpdate ? "lead.customer_update" : "lead.admin_update",
    actorType: isCustomerScopedUpdate ? "customer" : undefined,
    metadata: {
      order_number: payload.order_number ?? null,
      status: payload.status ?? null,
    },
    resourceId: lead.id,
    resourceType: "lead",
  });

  return NextResponse.json({ data: lead, mode: "mock", ok: true });
}

function validateLeadPayload(payload: LeadPayload) {
  if (!payload.agent_slug?.trim()) {
    return "Agent slug is required.";
  }

  if (!payload.visitor_name?.trim()) {
    return "Visitor name is required.";
  }

  if (!payload.visitor_email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.visitor_email)) {
    return "A valid visitor email is required.";
  }

  if (!payload.inquiry?.trim()) {
    return "Inquiry is required.";
  }

  return "";
}

async function verifySupabaseCustomerLeadRead(
  supabase: SupabaseClient,
  {
    accessToken,
    customerConfigId,
    orderNumber,
  }: {
    accessToken: string;
    customerConfigId: string | null;
    orderNumber: string | null;
  },
) {
  const order = await resolveSupabaseOrderForCustomerScope(supabase, {
    customerConfigId,
    orderNumber,
  });

  if (!order?.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { data: deliveryPackage } = await supabase
    .from("delivery_packages")
    .select("customer_access_token")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!isCustomerAccessAllowed(deliveryPackage, accessToken)) {
    return NextResponse.json(
      { error: "Invalid or missing customer dashboard access token." },
      { status: 403 },
    );
  }

  return null;
}

async function resolveSupabaseOrderForCustomerScope(
  supabase: SupabaseClient,
  {
    customerConfigId,
    orderNumber,
  }: {
    customerConfigId: string | null;
    orderNumber: string | null;
  },
) {
  if (orderNumber) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("order_number", orderNumber)
      .maybeSingle();

    return data as { id?: string; order_number?: string } | null;
  }

  if (!customerConfigId) {
    return null;
  }

  const { data: config } = await supabase
    .from("customer_agent_configs")
    .select("order_id, order_number")
    .eq("id", customerConfigId)
    .maybeSingle();
  const typedConfig = config as { order_id?: string | null; order_number?: string | null } | null;

  if (typedConfig?.order_id) {
    return { id: typedConfig.order_id, order_number: typedConfig.order_number ?? "" };
  }

  if (!typedConfig?.order_number) {
    return null;
  }

  const { data } = await supabase
    .from("orders")
    .select("id, order_number")
    .eq("order_number", typedConfig.order_number)
    .maybeSingle();

  return data as { id?: string; order_number?: string } | null;
}

function verifyMockCustomerLeadRead({
  accessToken,
  customerConfigId,
  orderNumber,
}: {
  accessToken: string;
  customerConfigId: string | null;
  orderNumber: string | null;
}) {
  const order = resolveMockOrderForCustomerScope({ customerConfigId, orderNumber });

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

  return null;
}

function resolveMockOrderForCustomerScope({
  customerConfigId,
  orderNumber,
}: {
  customerConfigId: string | null;
  orderNumber: string | null;
}) {
  if (orderNumber) {
    return (
      getMockOrderStore().find(
        (item) => item.order_number === orderNumber || item.id === orderNumber,
      ) ?? null
    );
  }

  const config = customerConfigId
    ? getMockCustomerAgentConfigStore().find((item) => item.id === customerConfigId)
    : null;

  if (!config) {
    return null;
  }

  return (
    getMockOrderStore().find(
      (item) =>
        item.id === config.order_id ||
        Boolean(config.order_number && item.order_number === config.order_number),
    ) ?? null
  );
}

function inferLead(payload: LeadPayload): {
  intent: LeadIntent;
  needsHuman: boolean;
  score: LeadScore;
} {
  if (payload.agent_slug === "ecommerce-product-support-agent") {
    return inferEcommerceLead(payload);
  }

  const text = `${payload.inquiry ?? ""} ${payload.conversation_summary ?? ""}`.toLowerCase();
  const needsHuman =
    /human|person|call me|complain|angry|contract|exact quote|custom|定制|人工|真人|投诉|合同|精确报价/.test(
      text,
    );
  const intent: LeadIntent = needsHuman
    ? "human_handoff"
    : /price|cost|quote|budget|pricing|多少钱|价格|报价|预算/.test(text)
      ? "pricing_inquiry"
      : /book|schedule|appointment|consultation|预约|咨询/.test(text)
        ? "booking_request"
        : /support|return|refund|shipping|order|售后|退货|物流|订单/.test(text)
          ? "support_question"
          : /lead|buy|purchase|interested|购买|下单|感兴趣/.test(text)
            ? "sales_lead"
            : /service|product|offer|服务|产品|商品/.test(text)
              ? "service_inquiry"
              : "unknown";
  const hasContact = Boolean(payload.visitor_email?.trim());
  const hasCompany = Boolean(payload.visitor_company?.trim());
  const hasPhone = Boolean(payload.visitor_phone?.trim());
  const score: LeadScore =
    needsHuman || (hasContact && hasCompany && /budget|timeline|quote|预算|时间|报价/.test(text))
      ? "hot"
      : hasContact && (hasCompany || hasPhone)
        ? "warm"
        : hasContact
          ? "cold"
          : "invalid";

  return { intent, needsHuman, score };
}

function inferEcommerceLead(payload: LeadPayload): {
  intent: LeadIntent;
  needsHuman: boolean;
  score: LeadScore;
} {
  const text = `${payload.inquiry ?? ""} ${payload.conversation_summary ?? ""}`.toLowerCase();
  const needsHuman =
    /human|person|call me|complain|angry|contract|bulk|discount|exact quote|custom quote|人工|真人|投诉|合同|批量|折扣|精确报价/.test(
      text,
    );
  const intent: LeadIntent = /human|person|call me|人工|真人|投诉/.test(text)
    ? "human_handoff"
    : /track|tracking|order number|where is my order|订单|查订单|订单查询/.test(text)
      ? "order_tracking_request"
      : /return|refund|exchange|warranty|退货|退款|换货|保修/.test(text)
        ? "return_refund_question"
        : /shipping|delivery|ship|free shipping|运费|包邮|配送|发货|物流/.test(text)
          ? "shipping_question"
          : /buy|purchase|checkout|cart|available|availability|in stock|discount|bulk|quote|下单|购买|库存|现货|折扣|批量|报价/.test(text)
            ? "purchase_intent"
            : /recommend|best|choose|gift|for me|which product|推荐|适合|送礼|怎么选/.test(text)
              ? "product_recommendation"
              : /size|sizing|spec|material|compatible|color|product|item|尺码|规格|材质|兼容|颜色|商品|产品/.test(text)
                ? "product_question"
                : "unknown";
  const hasContact = Boolean(payload.visitor_email?.trim());
  const hasCompany = Boolean(payload.visitor_company?.trim());
  const hasPhone = Boolean(payload.visitor_phone?.trim());
  const score: LeadScore =
    !hasContact
      ? "invalid"
      : needsHuman ||
          intent === "purchase_intent" ||
          intent === "order_tracking_request" ||
          /budget|timeline|quantity|bulk|checkout|availability|预算|时间|数量|批量|下单|库存/.test(text)
        ? "hot"
        : hasCompany || hasPhone || intent === "product_recommendation"
          ? "warm"
          : "cold";

  return { intent, needsHuman: needsHuman || intent === "order_tracking_request", score };
}

function summarizeConversation(inquiry: string, intent: LeadIntent, score: LeadScore) {
  return `Visitor submitted a ${score} ${intent.replaceAll("_", " ")} lead: ${inquiry}`;
}
