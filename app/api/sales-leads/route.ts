import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  getMockSalesLeadStore,
  type MockSalesLeadRecord,
} from "@/lib/server/marketplace-admin-store";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

type SalesLeadPayload = {
  budget_range?: string;
  business_type?: string;
  contact_email?: string;
  contact_method?: string;
  contact_name?: string;
  contact_phone?: string;
  customer_type?: string;
  desired_agent_function?: string;
  industry?: string;
  interest_level?: string;
  notes?: string;
  salesperson_code?: string;
  source_channel?: string;
  timeline?: string;
  website?: string;
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
      .from("sales_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], mode: "supabase", ok: true });
  }

  return NextResponse.json({
    data: [...getMockSalesLeadStore()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.customRequest);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as SalesLeadPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedLead = normalizePayload(payload);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("sales_leads")
      .insert(normalizedLead)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { id: data.id, mode: "supabase", ok: true },
      { status: 201 },
    );
  }

  const now = new Date().toISOString();
  const mockLead: MockSalesLeadRecord = {
    ...normalizedLead,
    created_at: now,
    id: crypto.randomUUID(),
    status: "new",
    updated_at: now,
  };

  getMockSalesLeadStore().push(mockLead);

  return NextResponse.json(
    { id: mockLead.id, mode: "mock", ok: true },
    { status: 201 },
  );
}

function normalizePayload(payload: SalesLeadPayload) {
  return {
    budget_range: payload.budget_range?.trim() ?? "",
    business_type: payload.business_type?.trim() ?? "",
    contact_email: payload.contact_email?.trim() || null,
    contact_method: payload.contact_method?.trim() ?? "",
    contact_name: payload.contact_name?.trim() || null,
    contact_phone: payload.contact_phone?.trim() || null,
    customer_type: payload.customer_type?.trim() || null,
    desired_agent_function: payload.desired_agent_function?.trim() ?? "",
    industry: payload.industry?.trim() ?? "",
    interest_level: payload.interest_level?.trim() || null,
    notes: payload.notes?.trim() || null,
    salesperson_code: payload.salesperson_code?.trim() || null,
    source_channel: payload.source_channel?.trim() || null,
    timeline: payload.timeline?.trim() ?? "",
    website: payload.website?.trim() ?? "",
  };
}

function validatePayload(payload: SalesLeadPayload) {
  const requiredFields: Array<keyof SalesLeadPayload> = [
    "industry",
    "business_type",
    "website",
    "desired_agent_function",
    "budget_range",
    "timeline",
    "contact_method",
  ];

  for (const field of requiredFields) {
    if (!payload[field]?.trim()) {
      return "Please complete all required sales qualification fields.";
    }
  }

  const hasContact =
    Boolean(payload.contact_email?.trim()) ||
    Boolean(payload.contact_phone?.trim()) ||
    payload.contact_method?.toLowerCase().includes("wechat");

  if (!hasContact) {
    return "Please provide an email, phone number, or WeChat contact method.";
  }

  if (
    payload.contact_email?.trim() &&
    !/^\S+@\S+\.\S+$/.test(payload.contact_email)
  ) {
    return "Please enter a valid email address.";
  }

  return null;
}
