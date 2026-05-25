import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  LICENSE_STATUSES,
  type LicenseStatus,
} from "@/lib/marketplace/constants";
import { demoAgents } from "@/lib/marketplace/demo-data";
import { writeRequestAuditLog } from "@/lib/server/audit-log";
import {
  buildDeliveryUrls,
  canGenerateLicenseForOrder,
  createLicenseFromOrder,
  getOriginFromRequest,
  normalizeAllowedDomains,
  summarizeUsageLogs,
  toLicenseStatus,
} from "@/lib/server/license-service";
import {
  getMockAgentLicenseStore,
  getMockDeliveryPackageStore,
  getMockOrderStore,
  getMockUsageLogStore,
  type MockAgentLicenseRecord,
  type MockOrderRecord,
  type MockUsageLogRecord,
} from "@/lib/server/marketplace-admin-store";

export const dynamic = "force-dynamic";

type LicensePostPayload = {
  allowed_domains?: string[] | string;
  order_id?: string;
  usage_limit_monthly?: number | null;
};

type LicensePatchPayload = {
  allowed_domains?: string[] | string;
  expires_at?: string | null;
  id?: string;
  status?: LicenseStatus;
  usage_limit_monthly?: number | null;
};

type LicenseListRecord = MockAgentLicenseRecord & {
  agent_slug: string;
  agent_title: string;
  order_number: string;
  usage_summary: ReturnType<typeof summarizeUsageLogs>;
};

type SupabaseLicenseRecord = MockAgentLicenseRecord & {
  marketplace_agents?: { slug?: string | null; title_en?: string | null } | null;
  orders?: MockOrderRecord | null;
};

type SupabaseDeliveryPackageClient = {
  from: (table: "delivery_packages") => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => unknown;
    };
  };
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
    const [{ data: licenses, error }, { data: usageLogs, error: logsError }] =
      await Promise.all([
        supabase
          .from("agent_licenses")
          .select("*, orders(*), marketplace_agents(slug, title_en)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("usage_logs").select("*").limit(1000),
      ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (licenses ?? []).map((record) =>
        normalizeSupabaseLicense(
          record as unknown as SupabaseLicenseRecord,
          (usageLogs ?? []) as MockUsageLogRecord[],
        ),
      ),
      mode: "supabase",
      ok: true,
    });
  }

  return NextResponse.json({
    data: getMockLicenseRecords(),
    mode: "mock",
    ok: true,
  });
}

export async function POST(request: Request) {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as LicensePostPayload;

  if (!payload.order_id?.trim()) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }

  const origin = getOriginFromRequest(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", payload.order_id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const normalizedOrder = order as MockOrderRecord | null;

    if (!normalizedOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const validationError = canGenerateLicenseForOrder(normalizedOrder);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: existingLicense, error: existingError } = await supabase
      .from("agent_licenses")
      .select("*")
      .eq("order_id", normalizedOrder.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingLicense) {
      await syncDeliveryPackage({
        allowedDomains: (existingLicense as MockAgentLicenseRecord).allowed_domains,
        licenseKey: (existingLicense as MockAgentLicenseRecord).license_key,
        order: normalizedOrder,
        origin,
        supabase: supabase as unknown as SupabaseDeliveryPackageClient,
      });

      return NextResponse.json({
        data: existingLicense,
        mode: "supabase",
        ok: true,
      });
    }

    const allowedDomains = normalizeAllowedDomains(
      payload.allowed_domains ?? normalizedOrder.website_url,
    );
    const license = createLicenseFromOrder({
      allowedDomains,
      order: normalizedOrder,
    });
    const { data: insertedLicense, error: insertError } = await supabase
      .from("agent_licenses")
      .insert({
        agent_id: normalizedOrder.agent_id,
        allowed_domains: license.allowed_domains,
        customer_email: license.customer_email,
        customer_name: license.customer_name,
        expires_at: license.expires_at,
        license_key: license.license_key,
        order_id: normalizedOrder.id,
        plan_name: license.plan_name,
        status: "active",
        usage_count_monthly: 0,
        usage_limit_monthly: payload.usage_limit_monthly ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await syncDeliveryPackage({
      allowedDomains: license.allowed_domains,
      licenseKey: license.license_key,
      order: normalizedOrder,
      origin,
      supabase: supabase as unknown as SupabaseDeliveryPackageClient,
    });

    await writeRequestAuditLog(request, {
      action: "license.generate",
      metadata: {
        allowed_domains: license.allowed_domains,
        order_id: normalizedOrder.id,
      },
      resourceId: (insertedLicense as MockAgentLicenseRecord).id,
      resourceType: "agent_license",
    });

    return NextResponse.json(
      { data: insertedLicense, mode: "supabase", ok: true },
      { status: 201 },
    );
  }

  const order = getMockOrderStore().find((item) => item.id === payload.order_id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const validationError = canGenerateLicenseForOrder(order);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const existingLicense = getMockAgentLicenseStore().find(
    (license) => license.order_id === order.id,
  );

  if (existingLicense) {
    syncMockDeliveryPackage(existingLicense, order, origin);

    return NextResponse.json({
      data: toLicenseListRecord(existingLicense),
      mode: "mock",
      ok: true,
    });
  }

  const license = createLicenseFromOrder({
    allowedDomains: normalizeAllowedDomains(payload.allowed_domains ?? order.website_url),
    order,
  });
  license.usage_limit_monthly = payload.usage_limit_monthly ?? null;
  getMockAgentLicenseStore().push(license);
  syncMockDeliveryPackage(license, order, origin);

  await writeRequestAuditLog(request, {
    action: "license.generate",
    metadata: {
      allowed_domains: license.allowed_domains,
      order_id: order.id,
    },
    resourceId: license.id,
    resourceType: "agent_license",
  });

  return NextResponse.json(
    { data: toLicenseListRecord(license), mode: "mock", ok: true },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const adminError = await requireAdminForConfiguredSupabase();

  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as LicensePatchPayload;

  if (!payload.id?.trim()) {
    return NextResponse.json({ error: "License id is required." }, { status: 400 });
  }

  if (payload.status && !LICENSE_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid license status." }, { status: 400 });
  }

  const origin = getOriginFromRequest(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const updates: Partial<MockAgentLicenseRecord> = {};

    if (payload.status) {
      updates.status = payload.status;
    }

    if (typeof payload.expires_at !== "undefined") {
      updates.expires_at = payload.expires_at?.trim() || null;
    }

    if (typeof payload.usage_limit_monthly !== "undefined") {
      updates.usage_limit_monthly = payload.usage_limit_monthly;
    }

    if (typeof payload.allowed_domains !== "undefined") {
      updates.allowed_domains = normalizeAllowedDomains(payload.allowed_domains);
    }

    const { data, error } = await supabase
      .from("agent_licenses")
      .update(updates)
      .eq("id", payload.id)
      .select("*, orders(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const license = data as unknown as SupabaseLicenseRecord;
    const order = license.orders;

    if (order) {
      await syncDeliveryPackage({
        allowedDomains: license.allowed_domains,
        licenseKey: license.license_key,
        order,
        origin,
        supabase: supabase as unknown as SupabaseDeliveryPackageClient,
      });
    }

    await writeRequestAuditLog(request, {
      action: "license.update",
      metadata: {
        allowed_domains: payload.allowed_domains ?? null,
        status: payload.status ?? null,
      },
      resourceId: payload.id,
      resourceType: "agent_license",
    });

    return NextResponse.json({ data, mode: "supabase", ok: true });
  }

  const license = getMockAgentLicenseStore().find((item) => item.id === payload.id);

  if (!license) {
    return NextResponse.json({ error: "License not found." }, { status: 404 });
  }

  if (payload.status) {
    license.status = payload.status;
  }

  if (typeof payload.expires_at !== "undefined") {
    license.expires_at = payload.expires_at?.trim() || null;
  }

  if (typeof payload.usage_limit_monthly !== "undefined") {
    license.usage_limit_monthly = payload.usage_limit_monthly;
  }

  if (typeof payload.allowed_domains !== "undefined") {
    license.allowed_domains = normalizeAllowedDomains(payload.allowed_domains);
  }

  license.updated_at = new Date().toISOString();
  const order = getMockOrderStore().find((item) => item.id === license.order_id);

  if (order) {
    syncMockDeliveryPackage(license, order, origin);
  }

  await writeRequestAuditLog(request, {
    action: "license.update",
    metadata: {
      allowed_domains: payload.allowed_domains ?? null,
      status: payload.status ?? null,
    },
    resourceId: license.id,
    resourceType: "agent_license",
  });

  return NextResponse.json({
    data: toLicenseListRecord(license),
    mode: "mock",
    ok: true,
  });
}

function getMockLicenseRecords(): LicenseListRecord[] {
  return [...getMockAgentLicenseStore()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toLicenseListRecord);
}

function toLicenseListRecord(license: MockAgentLicenseRecord): LicenseListRecord {
  const order = getMockOrderStore().find((item) => item.id === license.order_id);
  const agent = demoAgents.find((item) => item.slug === order?.agent_slug);
  const usageLogs = getMockUsageLogStore().filter(
    (log) => log.license_id === license.id,
  );

  return {
    ...license,
    agent_slug: order?.agent_slug ?? license.agent_id,
    agent_title: agent?.titleEn ?? order?.agent_slug ?? license.agent_id,
    order_number: order?.order_number ?? license.order_id,
    status: toLicenseStatus(license.status),
    usage_summary: summarizeUsageLogs(usageLogs),
  };
}

function normalizeSupabaseLicense(
  license: SupabaseLicenseRecord,
  usageLogs: MockUsageLogRecord[],
): LicenseListRecord {
  const order = license.orders;
  const agentSlug = license.marketplace_agents?.slug ?? order?.agent_slug ?? license.agent_id;

  return {
    ...license,
    agent_slug: agentSlug,
    agent_title: license.marketplace_agents?.title_en ?? agentSlug,
    order_number: order?.order_number ?? license.order_id,
    status: toLicenseStatus(license.status),
    usage_summary: summarizeUsageLogs(
      usageLogs.filter((log) => log.license_id === license.id),
    ),
  };
}

function syncMockDeliveryPackage(
  license: MockAgentLicenseRecord,
  order: MockOrderRecord,
  origin: string,
) {
  const deliveryPackage = getMockDeliveryPackageStore().find(
    (item) => item.order_id === order.id,
  );
  const deliveryUrls = buildDeliveryUrls({
    agentSlug: order.agent_slug,
    licenseKey: license.license_key,
    origin,
  });

  if (!deliveryPackage) {
    return;
  }

  Object.assign(deliveryPackage, {
    allowed_domains: license.allowed_domains,
    embed_code: deliveryUrls.embed_code,
    hosted_agent_url: deliveryUrls.hosted_agent_url,
    license_key: license.license_key,
    updated_at: new Date().toISOString(),
  });
}

async function syncDeliveryPackage({
  allowedDomains,
  licenseKey,
  order,
  origin,
  supabase,
}: {
  allowedDomains: string[];
  licenseKey: string;
  order: MockOrderRecord;
  origin: string;
  supabase: SupabaseDeliveryPackageClient;
}) {
  const deliveryUrls = buildDeliveryUrls({
    agentSlug: order.agent_slug,
    licenseKey,
    origin,
  });

  await supabase
    .from("delivery_packages")
    .update({
      allowed_domains: normalizeAllowedDomains(allowedDomains),
      embed_code: deliveryUrls.embed_code,
      hosted_agent_url: deliveryUrls.hosted_agent_url,
      license_key: licenseKey,
    })
    .eq("order_id", order.id);
}
