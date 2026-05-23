import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { getMockCustomRequestStore } from "@/lib/server/marketplace-admin-store";
import { notifyAdminNewCustomRequest } from "@/lib/server/notification-service";
import {
  CUSTOM_REQUEST_STATUSES,
  type CustomRequestStatus,
} from "@/lib/marketplace/constants";

type CustomRequestPayload = {
  industry?: string;
  company_name?: string;
  agent_goal?: string;
  existing_website?: string;
  has_documents?: boolean;
  required_integrations?: string;
  budget_range?: string;
  timeline?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  language?: string;
  notes?: string;
  source_page?: string;
};

type MockCustomRequest = Required<
  Pick<
    CustomRequestPayload,
    | "industry"
    | "company_name"
    | "agent_goal"
    | "existing_website"
    | "has_documents"
    | "required_integrations"
    | "budget_range"
    | "timeline"
    | "contact_name"
    | "contact_email"
  >
> & {
  contact_phone: string | null;
  created_at: string;
  id: string;
  language: string | null;
  notes: string | null;
  source_page: string | null;
  status: "new";
  updated_at: string;
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
      .from("custom_requests")
      .select(
        "id, industry, company_name, agent_goal, existing_website, has_documents, required_integrations, budget_range, timeline, contact_name, contact_email, contact_phone, notes, source_page, language, status, admin_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], mode: "supabase", ok: true });
  }

  return NextResponse.json({
    data: [...getMockCustomRequestStore()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CustomRequestPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedPayload = normalizePayload(payload);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("custom_requests")
      .insert(normalizedPayload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyAdminNewCustomRequest({
      company_name: normalizedPayload.company_name,
      contact_email: normalizedPayload.contact_email,
      contact_name: normalizedPayload.contact_name,
      id: data.id,
      language: normalizedPayload.language,
      source_page: normalizedPayload.source_page,
    });

    return NextResponse.json(
      { id: data.id, mode: "supabase", ok: true },
      { status: 201 },
    );
  }

  const now = new Date().toISOString();
  const mockRequest: MockCustomRequest = {
    ...normalizedPayload,
    created_at: now,
    id: crypto.randomUUID(),
    status: "new",
    updated_at: now,
  };

  getMockCustomRequestStore().push(mockRequest);

  await notifyAdminNewCustomRequest({
    company_name: mockRequest.company_name,
    contact_email: mockRequest.contact_email,
    contact_name: mockRequest.contact_name,
    id: mockRequest.id,
    language: mockRequest.language,
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
    status?: CustomRequestStatus;
  };

  if (!payload.id) {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  if (payload.status && !CUSTOM_REQUEST_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const updates: { admin_note?: string | null; status?: CustomRequestStatus } = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (typeof payload.admin_note === "string") {
      updates.admin_note = payload.admin_note.trim() || null;
    }

    const { data, error } = await supabase
      .from("custom_requests")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, industry, company_name, agent_goal, existing_website, has_documents, required_integrations, budget_range, timeline, contact_name, contact_email, contact_phone, notes, source_page, language, status, admin_note, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  const customRequest = getMockCustomRequestStore().find(
    (record) => record.id === payload.id,
  );

  if (!customRequest) {
    return NextResponse.json(
      { error: "Custom request not found." },
      { status: 404 },
    );
  }

  if (payload.status) {
    customRequest.status = payload.status;
  }

  if (typeof payload.admin_note === "string") {
    customRequest.admin_note = payload.admin_note.trim() || null;
  }

  customRequest.updated_at = new Date().toISOString();

  return NextResponse.json({ data: customRequest, mode: "mock", ok: true });
}

function normalizePayload(payload: CustomRequestPayload) {
  return {
    agent_goal: payload.agent_goal?.trim() ?? "",
    budget_range: payload.budget_range?.trim() ?? "",
    company_name: payload.company_name?.trim() ?? "",
    contact_email: payload.contact_email?.trim() ?? "",
    contact_name: payload.contact_name?.trim() ?? "",
    contact_phone: payload.contact_phone?.trim() || null,
    existing_website: payload.existing_website?.trim() ?? "",
    has_documents: Boolean(payload.has_documents),
    industry: payload.industry?.trim() ?? "",
    notes: payload.notes?.trim() || null,
    required_integrations: payload.required_integrations?.trim() ?? "",
    language: payload.language?.trim() || null,
    source_page: payload.source_page?.trim() || null,
    timeline: payload.timeline?.trim() ?? "",
  };
}

function validatePayload(payload: CustomRequestPayload) {
  const requiredFields: Array<keyof CustomRequestPayload> = [
    "industry",
    "company_name",
    "agent_goal",
    "existing_website",
    "required_integrations",
    "budget_range",
    "timeline",
    "contact_name",
    "contact_email",
  ];

  for (const field of requiredFields) {
    if (!payload[field]?.toString().trim()) {
      return "Please complete all required fields.";
    }
  }

  if (typeof payload.has_documents !== "boolean") {
    return "Please confirm whether you have documents.";
  }

  if (
    !payload.contact_email?.trim() ||
    !/^\S+@\S+\.\S+$/.test(payload.contact_email)
  ) {
    return "Please enter a valid email address.";
  }

  return null;
}
