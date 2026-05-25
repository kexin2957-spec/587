import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth/roles";
import { getCurrentAuthProfile } from "@/lib/auth/server";
import {
  getMockAuditLogStore,
  type MockAuditLogRecord,
} from "@/lib/server/marketplace-admin-store";
import { logApiError } from "@/lib/server/monitoring";

export type AuditActorType = "admin" | "buyer" | "customer" | "seller" | "system";

export type AuditLogInput = {
  action: string;
  actorId?: string | null;
  actorType: AuditActorType;
  metadata?: Record<string, unknown>;
  resourceId?: string | null;
  resourceType: string;
};

export async function writeAuditLog(input: AuditLogInput) {
  const record = {
    action: input.action,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType,
    created_at: new Date().toISOString(),
    id: crypto.randomUUID(),
    metadata: input.metadata ?? {},
    resource_id: input.resourceId ?? null,
    resource_type: input.resourceType,
  } satisfies MockAuditLogRecord;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { error } = await supabase.from("audit_logs").insert({
        action: record.action,
        actor_id: record.actor_id,
        actor_type: record.actor_type,
        metadata: record.metadata,
        resource_id: record.resource_id,
        resource_type: record.resource_type,
      });

      if (error) {
        throw new Error(error.message);
      }

      return;
    } catch (error) {
      logApiError("audit_log_write_failed", error, {
        action: record.action,
        resource_id: record.resource_id,
        resource_type: record.resource_type,
      });
    }
  }

  getMockAuditLogStore().push(record);
}

export async function writeRequestAuditLog(
  request: Request,
  input: Omit<AuditLogInput, "actorId" | "actorType"> & {
    actorId?: string | null;
    actorType?: AuditActorType;
  },
) {
  const auth = await getCurrentAuthProfile();
  const role = auth.profile?.role;
  const url = new URL(request.url);

  await writeAuditLog({
    action: input.action,
    actorId: input.actorId ?? auth.profile?.id ?? auth.user?.id ?? null,
    actorType: input.actorType ?? roleToActorType(role),
    metadata: {
      ...input.metadata,
      path: url.pathname,
    },
    resourceId: input.resourceId,
    resourceType: input.resourceType,
  });
}

function roleToActorType(role: UserRole | null | undefined): AuditActorType {
  if (role === "admin" || role === "seller" || role === "buyer") {
    return role;
  }

  return "system";
}
