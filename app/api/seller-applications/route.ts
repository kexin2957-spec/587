import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { getMockSellerApplicationStore } from "@/lib/server/marketplace-admin-store";
import {
  SELLER_APPLICATION_STATUSES,
  type SellerApplicationStatus,
} from "@/lib/marketplace/constants";

type SellerApplicationPayload = {
  email?: string;
  expertise?: string;
  name?: string;
  notes?: string;
  offers_custom_services?: boolean;
  payout_preference?: string;
  planned_agent_types?: string;
  team_name?: string;
  website?: string;
};

type MockSellerApplication = {
  created_at: string;
  email: string;
  expertise: string;
  id: string;
  name: string;
  notes: string | null;
  offers_custom_services: boolean;
  payout_preference: string | null;
  planned_agent_types: string;
  status: "submitted";
  team_name: string | null;
  updated_at: string;
  website: string | null;
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
      .from("seller_applications")
      .select(
        "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, status, admin_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], mode: "supabase", ok: true });
  }

  return NextResponse.json({
    data: [...getMockSellerApplicationStore()].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SellerApplicationPayload;
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
      .from("seller_applications")
      .insert(normalizedPayload)
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
  const mockApplication: MockSellerApplication = {
    ...normalizedPayload,
    created_at: now,
    id: crypto.randomUUID(),
    status: "submitted",
    updated_at: now,
  };

  getMockSellerApplicationStore().push(mockApplication);

  return NextResponse.json(
    { id: mockApplication.id, mode: "mock", ok: true },
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
    status?: SellerApplicationStatus;
  };

  if (!payload.id) {
    return NextResponse.json({ error: "Application id is required." }, { status: 400 });
  }

  if (
    payload.status &&
    !SELLER_APPLICATION_STATUSES.includes(payload.status)
  ) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const updates: {
      admin_note?: string | null;
      status?: SellerApplicationStatus;
    } = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (typeof payload.admin_note === "string") {
      updates.admin_note = payload.admin_note.trim() || null;
    }

    const { data, error } = await supabase
      .from("seller_applications")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, status, admin_note, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  if (supabaseUrl && !serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for admin updates." },
      { status: 500 },
    );
  }

  const application = getMockSellerApplicationStore().find(
    (record) => record.id === payload.id,
  );

  if (!application) {
    return NextResponse.json(
      { error: "Seller application not found." },
      { status: 404 },
    );
  }

  if (payload.status) {
    application.status = payload.status;
  }

  if (typeof payload.admin_note === "string") {
    application.admin_note = payload.admin_note.trim() || null;
  }

  application.updated_at = new Date().toISOString();

  return NextResponse.json({ data: application, mode: "mock", ok: true });
}

function normalizePayload(payload: SellerApplicationPayload) {
  return {
    email: payload.email?.trim() ?? "",
    expertise: payload.expertise?.trim() ?? "",
    name: payload.name?.trim() ?? "",
    notes: payload.notes?.trim() || null,
    offers_custom_services: Boolean(payload.offers_custom_services),
    payout_preference: payload.payout_preference?.trim() || null,
    planned_agent_types: payload.planned_agent_types?.trim() ?? "",
    team_name: payload.team_name?.trim() || null,
    website: payload.website?.trim() || null,
  };
}

function validatePayload(payload: SellerApplicationPayload) {
  if (!payload.name?.trim()) {
    return "Name is required.";
  }

  if (!payload.email?.trim() || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return "A valid email is required.";
  }

  if (!payload.expertise?.trim()) {
    return "Expertise is required.";
  }

  if (!payload.planned_agent_types?.trim()) {
    return "Planned agent types are required.";
  }

  return null;
}
