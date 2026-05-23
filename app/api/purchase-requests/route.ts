import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getMockPurchaseRequestStore,
  getPublicAgentBySlug,
  type MockPurchaseRequestRecord,
} from "@/lib/server/marketplace-admin-store";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { notifyAdminNewPurchaseRequest } from "@/lib/server/notification-service";
import {
  PURCHASE_REQUEST_STATUSES,
  type PurchaseRequestStatus,
  type PurchaseRequestType,
} from "@/lib/marketplace/constants";

type PurchaseRequestPayload = {
  agent_id?: string;
  agent_slug?: string;
  budget_range?: string;
  company?: string;
  email?: string;
  language?: string;
  message?: string;
  name?: string;
  preferred_contact_method?: string;
  request_type?: PurchaseRequestType;
  required_integrations?: string;
  setup_needs?: string;
  source_page?: string;
  timeline?: string;
  website_url?: string;
  what_should_be_customized?: string;
};

const validRequestTypes: PurchaseRequestType[] = [
  "buy_agent",
  "custom_version",
  "setup_service",
];

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
      .from("purchase_requests")
      .select(
        "id, agent_id, agent_slug, request_type, name, email, company, message, budget_range, preferred_contact_method, website_url, setup_needs, timeline, what_should_be_customized, required_integrations, source_page, language, status, admin_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], mode: "supabase", ok: true });
  }

  return NextResponse.json({
    data: [...getMockPurchaseRequestStore()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as PurchaseRequestPayload;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const validationError = validatePayload(payload, {
    validateMockAgent: !(supabaseUrl && serviceRoleKey),
  });

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedPayload = normalizePayload(payload);

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: agentRecord, error: lookupError } = await supabase
      .from("marketplace_agents")
      .select("id")
      .eq("slug", normalizedPayload.agent_slug)
      .eq("status", "approved")
      .single();

    if (lookupError || !agentRecord?.id) {
      return NextResponse.json(
        { error: "Agent record not found in Supabase." },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("purchase_requests")
      .insert({
        ...normalizedPayload,
        agent_id: agentRecord.id,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyAdminNewPurchaseRequest({
      agent_slug: normalizedPayload.agent_slug,
      email: normalizedPayload.email,
      id: data.id,
      language: normalizedPayload.language,
      name: normalizedPayload.name,
      request_type: normalizedPayload.request_type,
      source_page: normalizedPayload.source_page,
    });

    return NextResponse.json(
      { id: data.id, mode: "supabase", ok: true },
      { status: 201 },
    );
  }

  const now = new Date().toISOString();
  const mockRequest: MockPurchaseRequestRecord = {
    ...normalizedPayload,
    created_at: now,
    id: crypto.randomUUID(),
    status: "new",
    updated_at: now,
  };

  getMockPurchaseRequestStore().push(mockRequest);

  await notifyAdminNewPurchaseRequest({
    agent_slug: mockRequest.agent_slug,
    email: mockRequest.email,
    id: mockRequest.id,
    language: mockRequest.language,
    name: mockRequest.name,
    request_type: mockRequest.request_type,
    source_page: mockRequest.source_page,
  });

  return NextResponse.json(
    { id: mockRequest.id, mode: "mock", ok: true },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as {
    admin_note?: string;
    id?: string;
    status?: PurchaseRequestStatus;
  };

  if (!payload.id) {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  if (payload.status && !PURCHASE_REQUEST_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const updates: { admin_note?: string | null; status?: PurchaseRequestStatus } = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (typeof payload.admin_note === "string") {
      updates.admin_note = payload.admin_note.trim() || null;
    }

    const { data, error } = await supabase
      .from("purchase_requests")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, agent_id, agent_slug, request_type, name, email, company, message, budget_range, preferred_contact_method, website_url, setup_needs, timeline, what_should_be_customized, required_integrations, source_page, language, status, admin_note, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  const purchaseRequest = getMockPurchaseRequestStore().find(
    (record) => record.id === payload.id,
  );

  if (!purchaseRequest) {
    return NextResponse.json(
      { error: "Purchase request not found." },
      { status: 404 },
    );
  }

  if (payload.status) {
    purchaseRequest.status = payload.status;
  }

  if (typeof payload.admin_note === "string") {
    purchaseRequest.admin_note = payload.admin_note.trim() || null;
  }

  purchaseRequest.updated_at = new Date().toISOString();

  return NextResponse.json({ data: purchaseRequest, mode: "mock", ok: true });
}

function normalizePayload(payload: PurchaseRequestPayload) {
  const agentSlug = payload.agent_slug?.trim() ?? "";

  return {
    agent_id: payload.agent_id?.trim() || agentSlug,
    agent_slug: agentSlug,
    budget_range: normalizeOptionalText(payload.budget_range),
    company: normalizeOptionalText(payload.company),
    email: payload.email?.trim() ?? "",
    language: normalizeOptionalText(payload.language),
    message: normalizeOptionalText(payload.message),
    name: payload.name?.trim() ?? "",
    preferred_contact_method: normalizeOptionalText(
      payload.preferred_contact_method,
    ),
    request_type: payload.request_type as PurchaseRequestType,
    required_integrations: normalizeOptionalText(payload.required_integrations),
    setup_needs: normalizeOptionalText(payload.setup_needs),
    source_page: normalizeOptionalText(payload.source_page),
    timeline: normalizeOptionalText(payload.timeline),
    website_url: normalizeOptionalText(payload.website_url),
    what_should_be_customized: normalizeOptionalText(
      payload.what_should_be_customized,
    ),
  };
}

function normalizeOptionalText(value?: string) {
  return value?.trim() || null;
}

function validatePayload(
  payload: PurchaseRequestPayload,
  { validateMockAgent }: { validateMockAgent: boolean },
) {
  if (
    validateMockAgent &&
    (!payload.agent_slug || !getPublicAgentBySlug(payload.agent_slug.trim()))
  ) {
    return "Invalid agent.";
  }

  if (
    !payload.request_type ||
    !validRequestTypes.includes(payload.request_type)
  ) {
    return "Invalid request type.";
  }

  if (!payload.name?.trim()) {
    return "Name is required.";
  }

  if (!payload.email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return "A valid email is required.";
  }

  if (payload.request_type === "buy_agent") {
    return null;
  }

  if (!payload.company?.trim()) {
    return "Company is required.";
  }

  if (payload.request_type === "setup_service") {
    if (!payload.setup_needs?.trim()) {
      return "Setup needs are required.";
    }

    if (!payload.timeline?.trim()) {
      return "Timeline is required.";
    }

    return null;
  }

  if (!payload.what_should_be_customized?.trim()) {
    return "Customization details are required.";
  }

  if (!payload.required_integrations?.trim()) {
    return "Required integrations are required.";
  }

  if (!payload.budget_range?.trim()) {
    return "Budget range is required for custom version requests.";
  }

  if (!payload.timeline?.trim()) {
    return "Timeline is required.";
  }

  return null;
}
