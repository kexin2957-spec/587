import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isUserRole, type UserProfile, type UserRole } from "@/lib/auth/roles";
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

export function isMockSellerModeEnabled() {
  return (
    !isSupabaseServerConfigured() &&
    (process.env.ALLOW_MOCK_SELLER === "true" ||
      process.env.ALLOW_MOCK_ADMIN === "true")
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
  const authorization = await requireRoleForConfiguredSupabase(["admin"], {
    allowMock: isMockAdminModeEnabled(),
    mockRole: "admin",
  });

  return authorization.ok ? null : authorization.response;
}

export type AuthorizedActor = {
  email: string | null;
  id: string | null;
  isMock: boolean;
  role: UserRole;
};

export type RoleAuthorizationResult =
  | {
      actor: AuthorizedActor;
      authState: AuthProfileState;
      ok: true;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireRoleForConfiguredSupabase(
  allowedRoles: UserRole[],
  {
    allowMock = false,
    mockRole = allowedRoles[0] ?? "buyer",
  }: {
    allowMock?: boolean;
    mockRole?: UserRole;
  } = {},
): Promise<RoleAuthorizationResult> {
  const authState = await getCurrentAuthProfile();

  if (!authState.isConfigured) {
    if (allowMock) {
      return {
        actor: {
          email: null,
          id: `mock-${mockRole}`,
          isMock: true,
          role: mockRole,
        },
        authState,
        ok: true,
      };
    }

    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "This route requires Supabase Auth. Use mock access only for local validation.",
        },
        { status: 403 },
      ),
    };
  }

  const role = authState.profile?.role ?? "buyer";

  if (!authState.user || !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${allowedRoles.join(" or ")} access required.` },
        { status: 403 },
      ),
    };
  }

  return {
    actor: {
      email: authState.profile?.email ?? authState.user.email ?? null,
      id: authState.profile?.id ?? authState.user.id,
      isMock: false,
      role,
    },
    authState,
    ok: true,
  };
}

export async function requireSellerAccountForEmail(
  sellerEmail: string | null | undefined,
) {
  const normalizedSellerEmail = sellerEmail?.trim().toLowerCase() ?? "";
  const authorization = await requireRoleForConfiguredSupabase(["seller", "admin"], {
    allowMock: isMockSellerModeEnabled(),
    mockRole: "seller",
  });

  if (!authorization.ok) {
    return authorization;
  }

  if (
    !authorization.actor.isMock &&
    authorization.actor.role !== "admin" &&
    normalizedSellerEmail &&
    authorization.actor.email?.toLowerCase() !== normalizedSellerEmail
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Seller access is limited to your own seller account." },
        { status: 403 },
      ),
    };
  }

  return authorization;
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
