import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import { demoAgents } from "@/lib/marketplace/demo-data";
import { summarizeUsageLogs } from "@/lib/server/license-service";
import {
  getMockAgentLicenseStore,
  getMockOrderStore,
  getMockUsageLogStore,
  type MockAgentLicenseRecord,
  type MockOrderRecord,
  type MockUsageLogRecord,
} from "@/lib/server/marketplace-admin-store";

export const dynamic = "force-dynamic";

type UsageLogListRecord = MockUsageLogRecord & {
  agent_slug: string;
  agent_title: string;
  customer_email: string | null;
  customer_name: string | null;
  license_key: string | null;
  order_number: string | null;
};

export async function GET() {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const [{ data: logs, error: logsError }, { data: licenses, error: licenseError }, { data: orders, error: orderError }] =
      await Promise.all([
        supabase
          .from("usage_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("agent_licenses").select("*").limit(1000),
        supabase
          .from("orders")
          .select("id, order_number, agent_slug, customer_email, customer_name")
          .limit(1000),
      ]);

    const firstError = logsError ?? licenseError ?? orderError;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const records = normalizeUsageLogs(
      (logs ?? []) as MockUsageLogRecord[],
      (licenses ?? []) as MockAgentLicenseRecord[],
      (orders ?? []) as MockOrderRecord[],
    );

    return NextResponse.json({
      data: records,
      mode: "supabase",
      ok: true,
      summary: summarizeUsageLogs(records),
    });
  }

  const records = normalizeUsageLogs(
    getMockUsageLogStore(),
    getMockAgentLicenseStore(),
    getMockOrderStore(),
  );

  return NextResponse.json({
    data: records,
    mode: "mock",
    ok: true,
    summary: summarizeUsageLogs(records),
  });
}

function normalizeUsageLogs(
  logs: MockUsageLogRecord[],
  licenses: MockAgentLicenseRecord[],
  orders: MockOrderRecord[],
): UsageLogListRecord[] {
  const licenseById = new Map(licenses.map((license) => [license.id, license]));
  const orderById = new Map(orders.map((order) => [order.id, order]));

  return [...logs]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((log) => {
      const license = log.license_id ? licenseById.get(log.license_id) : null;
      const order = license ? orderById.get(license.order_id) : null;
      const agentSlug = order?.agent_slug ?? log.agent_id;
      const agent = demoAgents.find((item) => item.slug === agentSlug);

      return {
        ...log,
        agent_slug: agentSlug,
        agent_title: agent?.titleEn ?? agentSlug,
        customer_email: license?.customer_email ?? order?.customer_email ?? null,
        customer_name: license?.customer_name ?? order?.customer_name ?? null,
        license_key: license?.license_key ?? null,
        order_number: order?.order_number ?? null,
      };
    });
}
