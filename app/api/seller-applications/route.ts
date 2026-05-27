import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  getMockSellerApplicationStore,
  getMockSellerProfileStore,
} from "@/lib/server/marketplace-admin-store";
import { writeRequestAuditLog } from "@/lib/server/audit-log";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";
import {
  SELLER_APPLICATION_STATUSES,
  type SellerApplicationStatus,
  type SellerStatus,
} from "@/lib/marketplace/constants";

type SellerApplicationPayload = {
  email?: string;
  expertise?: string;
  name?: string;
  notes?: string;
  offers_custom_services?: boolean;
  originality_confirmed?: boolean;
  payout_preference?: string;
  planned_agent_types?: string;
  seller_terms_agreed?: boolean;
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
  originality_confirmed: boolean;
  payout_preference: string | null;
  planned_agent_types: string;
  seller_terms_agreed: boolean;
  status: SellerApplicationStatus;
  team_name: string | null;
  updated_at: string;
  website: string | null;
};

type SellerApplicationRecord = MockSellerApplication & {
  admin_note?: string | null;
};

type DatabaseError = { message: string } | null;

type SellerProfileSyncClient = {
  from: {
    (table: "profiles"): {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          limit: (count: number) => Promise<{
            data: Array<{ role?: string | null; user_id?: string | null }> | null;
            error: DatabaseError;
          }>;
        };
      };
      update: (value: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{
          error: DatabaseError;
        }>;
      };
    };
    (table: "seller_profiles"): {
      insert: (value: Record<string, unknown>) => Promise<{
        error: DatabaseError;
      }>;
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          limit: (count: number) => Promise<{
            data: Array<{ id?: string }> | null;
            error: DatabaseError;
          }>;
        };
      };
      update: (value: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{
          error: DatabaseError;
        }>;
      };
    };
  };
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
        "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, seller_terms_agreed, originality_confirmed, status, admin_note, created_at, updated_at",
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
  const rateLimitResponse = enforceRateLimit(request, rateLimits.customRequest);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
        "id, name, team_name, email, website, expertise, planned_agent_types, offers_custom_services, payout_preference, notes, seller_terms_agreed, originality_confirmed, status, admin_note, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profileError = await syncSupabaseSellerProfileFromApplication(
      supabase as unknown as SellerProfileSyncClient,
      data as SellerApplicationRecord,
    );

    if (profileError) {
      return NextResponse.json({ error: profileError }, { status: 500 });
    }

    await writeRequestAuditLog(request, {
      action: "seller_application.review",
      metadata: { status: payload.status ?? null },
      resourceId: payload.id,
      resourceType: "seller_application",
    });

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

  syncMockSellerProfileFromApplication(application);
  application.updated_at = new Date().toISOString();

  await writeRequestAuditLog(request, {
    action: "seller_application.review",
    metadata: { status: payload.status ?? null },
    resourceId: application.id,
    resourceType: "seller_application",
  });

  return NextResponse.json({ data: application, mode: "mock", ok: true });
}

async function syncSupabaseSellerProfileFromApplication(
  supabase: SellerProfileSyncClient,
  application: SellerApplicationRecord,
) {
  const sellerStatus = sellerStatusFromApplicationStatus(application.status);

  if (!sellerStatus) {
    return null;
  }

  const { data: authProfiles, error: authProfileError } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("email", application.email)
    .limit(1);

  if (authProfileError) {
    return authProfileError.message;
  }

  const authProfile = authProfiles?.[0] as
    | { role?: string | null; user_id?: string | null }
    | undefined;
  const profilePayload: Record<string, unknown> = {
    display_name: application.name,
    email: application.email,
    expertise: application.expertise,
    offers_custom_services: application.offers_custom_services,
    payout_preference: application.payout_preference,
    status: sellerStatus,
    team_name: application.team_name,
    website: application.website,
  };

  if (authProfile?.user_id) {
    profilePayload.user_id = authProfile.user_id;
  }

  const { data: existingProfiles, error: lookupError } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("email", application.email)
    .limit(1);

  if (lookupError) {
    return lookupError.message;
  }

  const existingProfile = existingProfiles?.[0] as { id?: string } | undefined;

  if (existingProfile?.id) {
    const { error } = await supabase
      .from("seller_profiles")
      .update(profilePayload)
      .eq("id", existingProfile.id);

    if (error) {
      return error.message;
    }

    return updateAuthProfileRoleForApprovedSeller(supabase, application, authProfile);
  }

  const { error } = await supabase.from("seller_profiles").insert(profilePayload);

  if (error) {
    return error.message;
  }

  return updateAuthProfileRoleForApprovedSeller(supabase, application, authProfile);
}

async function updateAuthProfileRoleForApprovedSeller(
  supabase: SellerProfileSyncClient,
  application: SellerApplicationRecord,
  authProfile: { role?: string | null; user_id?: string | null } | undefined,
) {
  if (
    application.status !== "approved" ||
    !authProfile?.user_id ||
    authProfile.role === "admin"
  ) {
    return null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "seller" })
    .eq("user_id", authProfile.user_id);

  return error?.message ?? null;
}

function syncMockSellerProfileFromApplication(application: SellerApplicationRecord) {
  const sellerStatus = sellerStatusFromApplicationStatus(application.status);

  if (!sellerStatus) {
    return;
  }

  const now = new Date().toISOString();
  const profiles = getMockSellerProfileStore();
  const existingProfile = profiles.find(
    (profile) => profile.email.toLowerCase() === application.email.toLowerCase(),
  );

  if (existingProfile) {
    existingProfile.display_name = application.name;
    existingProfile.expertise = application.expertise;
    existingProfile.offers_custom_services = application.offers_custom_services;
    existingProfile.payout_preference = application.payout_preference;
    existingProfile.status = sellerStatus;
    existingProfile.team_name = application.team_name;
    existingProfile.updated_at = now;
    existingProfile.website = application.website;
    return;
  }

  profiles.push({
    created_at: now,
    display_name: application.name,
    email: application.email,
    expertise: application.expertise,
    id: crypto.randomUUID(),
    offers_custom_services: application.offers_custom_services,
    payout_preference: application.payout_preference,
    status: sellerStatus,
    team_name: application.team_name,
    updated_at: now,
    user_id: null,
    website: application.website,
  });
}

function sellerStatusFromApplicationStatus(
  status: SellerApplicationStatus,
): SellerStatus | null {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (status === "suspended") {
    return "suspended";
  }

  return null;
}

function normalizePayload(payload: SellerApplicationPayload) {
  return {
    email: payload.email?.trim() ?? "",
    expertise: payload.expertise?.trim() ?? "",
    name: payload.name?.trim() ?? "",
    notes: payload.notes?.trim() || null,
    offers_custom_services: Boolean(payload.offers_custom_services),
    originality_confirmed: Boolean(payload.originality_confirmed),
    payout_preference: payload.payout_preference?.trim() || null,
    planned_agent_types: payload.planned_agent_types?.trim() ?? "",
    seller_terms_agreed: Boolean(payload.seller_terms_agreed),
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

  if (!payload.seller_terms_agreed) {
    return "Seller terms agreement is required.";
  }

  if (!payload.originality_confirmed) {
    return "Originality and rights confirmation is required.";
  }

  return null;
}
