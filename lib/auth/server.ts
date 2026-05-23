import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isUserRole, type UserProfile } from "@/lib/auth/roles";
import {
  createSupabaseServerClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

export type AuthProfileState = {
  isConfigured: boolean;
  profile: UserProfile | null;
  user: User | null;
};

export function isMockAdminModeEnabled() {
  return (
    !isSupabaseServerConfigured() && process.env.ALLOW_MOCK_ADMIN === "true"
  );
}

export async function getCurrentAuthProfile(): Promise<AuthProfileState> {
  if (!isSupabaseServerConfigured()) {
    return { isConfigured: false, profile: null, user: null };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { isConfigured: false, profile: null, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isConfigured: true, profile: null, user: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, email, display_name, role, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = normalizeProfile(data, user);

  return { isConfigured: true, profile, user };
}

export async function requireAdminForConfiguredSupabase() {
  const authState = await getCurrentAuthProfile();

  if (!authState.isConfigured) {
    if (isMockAdminModeEnabled()) {
      return null;
    }

    return NextResponse.json(
      {
        error:
          "Admin access requires Supabase Auth. Set ALLOW_MOCK_ADMIN=true only for local demo validation.",
      },
      { status: 403 },
    );
  }

  if (!authState.user || authState.profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return null;
}

function normalizeProfile(data: unknown, user: User): UserProfile | null {
  if (!data || typeof data !== "object") {
    return {
      display_name: user.user_metadata?.display_name ?? null,
      email: user.email ?? "",
      id: user.id,
      role: "buyer",
      user_id: user.id,
    };
  }

  const record = data as Record<string, unknown>;
  const role = isUserRole(record.role) ? record.role : "buyer";

  return {
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    display_name:
      typeof record.display_name === "string" ? record.display_name : null,
    email: typeof record.email === "string" ? record.email : user.email ?? "",
    id: typeof record.id === "string" ? record.id : user.id,
    role,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : undefined,
    user_id: typeof record.user_id === "string" ? record.user_id : user.id,
  };
}
