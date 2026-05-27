import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireSellerAccountForEmail } from "@/lib/auth/server";
import { getMockSellerProfileStore } from "@/lib/server/marketplace-admin-store";

type SellerSettingsPayload = {
  display_name?: string;
  expertise?: string;
  payout_preference?: string;
  seller_email?: string;
  support_contact?: string;
  team_name?: string;
  website?: string;
};

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const payload = (await request.json()) as SellerSettingsPayload;
  const sellerEmail = payload.seller_email?.trim().toLowerCase() ?? "";

  if (!sellerEmail || !/^\S+@\S+\.\S+$/.test(sellerEmail)) {
    return NextResponse.json(
      { error: "A valid seller email is required." },
      { status: 400 },
    );
  }

  const sellerAuthorization = await requireSellerAccountForEmail(sellerEmail);

  if (!sellerAuthorization.ok) {
    return sellerAuthorization.response;
  }

  const updates = normalizeSettingsPayload(payload);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("seller_profiles")
      .update(updates)
      .eq("email", sellerEmail)
      .select(
        "id, display_name, team_name, email, website, expertise, offers_custom_services, payout_preference, support_contact, status, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  if (supabaseUrl && !serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for seller settings." },
      { status: 500 },
    );
  }

  const profile = getMockSellerProfileStore().find(
    (item) => item.email.toLowerCase() === sellerEmail,
  );

  if (!profile) {
    return NextResponse.json(
      { error: "Seller profile not found." },
      { status: 404 },
    );
  }

  Object.assign(profile, updates);
  profile.updated_at = new Date().toISOString();

  return NextResponse.json({ data: profile, mode: "mock", ok: true });
}

function normalizeSettingsPayload(payload: SellerSettingsPayload) {
  return {
    display_name: payload.display_name?.trim() ?? "",
    expertise: payload.expertise?.trim() || null,
    payout_preference: payload.payout_preference?.trim() || null,
    support_contact: payload.support_contact?.trim() || null,
    team_name: payload.team_name?.trim() || null,
    website: payload.website?.trim() || null,
  };
}
