import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  createDefaultCustomerConfig,
  createDefaultFaqItems,
  createDefaultKnowledgeDocuments,
  normalizeConfigUpdate,
  normalizeFaqItems,
  normalizeKnowledgeDocuments,
} from "@/lib/marketplace/customer-config";
import { demoAgents } from "@/lib/marketplace/demo-data";
import {
  getMockCustomerAgentConfigStore,
  getMockCustomerFaqItemStore,
  getMockDeliveryPackageStore,
  getMockKnowledgeDocumentStore,
  getMockOrderStore,
  type MockCustomerAgentConfigRecord,
  type MockCustomerFaqItemRecord,
  type MockKnowledgeDocumentRecord,
} from "@/lib/server/marketplace-admin-store";
import {
  getCustomerAccessToken,
  isCustomerAccessAllowed,
} from "@/lib/server/customer-access";
import { writeRequestAuditLog } from "@/lib/server/audit-log";

export const dynamic = "force-dynamic";

type HydratedCustomerConfig = MockCustomerAgentConfigRecord & {
  faq_items: MockCustomerFaqItemRecord[];
  knowledge_documents: MockKnowledgeDocumentRecord[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const orderId = searchParams.get("order_id");
  const orderNumber = searchParams.get("order_number") ?? searchParams.get("order");
  const agentSlug =
    searchParams.get("agent_slug") ??
    searchParams.get("agent_id") ??
    searchParams.get("agentId");
  const isPublicAgentConfigLookup = Boolean(agentSlug && !id && !orderId && !orderNumber);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    let query = supabase.from("customer_agent_configs").select("*");

    if (id) {
      query = query.eq("id", id);
    } else if (orderId) {
      query = query.eq("order_id", orderId);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else {
      if (agentSlug && isLaunchAgent(agentSlug)) {
        const defaultConfig = hydrateDefaultConfig(
          createDefaultCustomerConfig({ agentSlug }),
        );

        return NextResponse.json({
          data: toSafePublicConfig(defaultConfig),
          mode: "supabase-default",
          ok: true,
        });
      }

      return NextResponse.json(
        { error: "A config id, order id, or order number is required." },
        { status: 400 },
      );
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data) {
      const hydrated = await hydrateSupabaseConfig(
        supabase,
        data as MockCustomerAgentConfigRecord,
      );
      const accessError = isPublicAgentConfigLookup
        ? null
        : await verifySupabaseConfigAccess({
            config: hydrated,
            request,
            supabase,
          });

      if (accessError) {
        return accessError;
      }

      return NextResponse.json({
        data: isPublicAgentConfigLookup ? toSafePublicConfig(hydrated) : hydrated,
        mode: "supabase",
        ok: true,
      });
    }

    if (agentSlug && isLaunchAgent(agentSlug)) {
      const defaultConfig = hydrateDefaultConfig(
        createDefaultCustomerConfig({ agentSlug }),
      );

      return NextResponse.json({
        data: toSafePublicConfig(defaultConfig),
        mode: "supabase-default",
        ok: true,
      });
    }

    return NextResponse.json({ error: "Configuration not found." }, { status: 404 });
  }

  const store = getMockCustomerAgentConfigStore();
  let config =
    (id && store.find((item) => item.id === id)) ||
    (orderId && store.find((item) => item.order_id === orderId)) ||
    (orderNumber && store.find((item) => item.order_number === orderNumber)) ||
    null;

  if (!config && orderNumber) {
    const order = getMockOrderStore().find(
      (item) => item.order_number === orderNumber || item.id === orderNumber,
    );

    if (order) {
      config = createDefaultCustomerConfig({
        agentId: order.agent_id,
        agentSlug: order.agent_slug,
        businessName: order.company_name,
        contactEmail: order.customer_email,
        orderId: order.id,
        orderNumber: order.order_number,
        websiteUrl: order.website_url,
      });
      store.push(config);
    }
  }

  if (!config && agentSlug && isLaunchAgent(agentSlug)) {
    config = createDefaultCustomerConfig({ agentSlug });
  }

  if (!config) {
    return NextResponse.json({ error: "Configuration not found." }, { status: 404 });
  }

  const hydrated = ensureMockConfigRelations(config);
  const accessError = isPublicAgentConfigLookup
    ? null
    : await verifyMockConfigAccess({
        config: hydrated,
        request,
      });

  if (accessError) {
    return accessError;
  }

  return NextResponse.json({
    data: isPublicAgentConfigLookup ? toSafePublicConfig(hydrated) : hydrated,
    mode: "mock",
    ok: true,
  });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const id = typeof payload.id === "string" ? payload.id : "";
  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token : undefined;

  if (!id) {
    return NextResponse.json({ error: "Configuration id is required." }, { status: 400 });
  }

  const updates = normalizeConfigUpdate(payload);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: existingConfig, error: existingError } = await supabase
      .from("customer_agent_configs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found." }, { status: 404 });
    }

    const accessError = await verifySupabaseConfigAccess({
      accessToken,
      config: existingConfig as MockCustomerAgentConfigRecord,
      request,
      supabase,
    });

    if (accessError) {
      return accessError;
    }

    const { data, error } = await supabase
      .from("customer_agent_configs")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (Array.isArray(payload.faq_items) || Array.isArray(payload.faq)) {
      await replaceSupabaseFaqItems(
        supabase,
        id,
        normalizeFaqItems(payload.faq_items ?? payload.faq, id),
      );
    }

    if (Array.isArray(payload.knowledge_documents)) {
      await replaceSupabaseKnowledgeDocuments(
        supabase,
        id,
        normalizeKnowledgeDocuments(payload.knowledge_documents, id),
      );
    }

    await writeRequestAuditLog(request, {
      action: "customer_config.update",
      actorType: accessToken ? "customer" : undefined,
      metadata: {
        fields: Object.keys(updates),
        order_number:
          (existingConfig as MockCustomerAgentConfigRecord).order_number ?? null,
      },
      resourceId: id,
      resourceType: "customer_agent_config",
    });

    return NextResponse.json({
      data: await hydrateSupabaseConfig(supabase, data as MockCustomerAgentConfigRecord),
      mode: "supabase",
      ok: true,
    });
  }

  const config = getMockCustomerAgentConfigStore().find((item) => item.id === id);

  if (!config) {
    return NextResponse.json({ error: "Configuration not found." }, { status: 404 });
  }

  const accessError = await verifyMockConfigAccess({
    accessToken,
    config,
    request,
  });

  if (accessError) {
    return accessError;
  }

  Object.assign(config, updates);

  if (Array.isArray(payload.faq_items) || Array.isArray(payload.faq)) {
    replaceMockFaqItems(id, normalizeFaqItems(payload.faq_items ?? payload.faq, id));
  }

  if (Array.isArray(payload.knowledge_documents)) {
    replaceMockKnowledgeDocuments(
      id,
      normalizeKnowledgeDocuments(payload.knowledge_documents, id),
    );
  }

  await writeRequestAuditLog(request, {
    action: "customer_config.update",
    actorType: accessToken ? "customer" : undefined,
    metadata: {
      fields: Object.keys(updates),
      order_number: config.order_number ?? null,
    },
    resourceId: config.id,
    resourceType: "customer_agent_config",
  });

  return NextResponse.json({
    data: ensureMockConfigRelations(config),
    mode: "mock",
    ok: true,
  });
}

async function hydrateSupabaseConfig(
  supabase: SupabaseClient,
  config: MockCustomerAgentConfigRecord,
): Promise<HydratedCustomerConfig> {
  const [{ data: faqItems }, { data: knowledgeDocuments }] = await Promise.all([
    supabase
      .from("customer_faq_items")
      .select("*")
      .eq("config_id", config.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("knowledge_documents")
      .select("*")
      .eq("config_id", config.id)
      .order("created_at", { ascending: true }),
  ]);
  const normalizedFaqItems = ((faqItems ?? []) as MockCustomerFaqItemRecord[]);
  const normalizedKnowledgeDocuments =
    (knowledgeDocuments ?? []) as MockKnowledgeDocumentRecord[];

  return {
    ...normalizeConfigAliases(config),
    faq: normalizedFaqItems.length
      ? normalizedFaqItems
          .filter((item) => item.is_active)
          .map((item) => ({ answer: item.answer, question: item.question }))
      : config.faq ?? [],
    faq_items: normalizedFaqItems.length
      ? normalizedFaqItems
      : createDefaultFaqItems({
          agentSlug: config.agent_slug,
          configId: config.id,
          faq: config.faq ?? [],
        }),
    knowledge_documents: normalizedKnowledgeDocuments.length
      ? normalizedKnowledgeDocuments
      : createDefaultKnowledgeDocuments({ config: normalizeConfigAliases(config) }),
  };
}

async function verifySupabaseConfigAccess({
  accessToken,
  config,
  request,
  supabase,
}: {
  accessToken?: string;
  config: MockCustomerAgentConfigRecord;
  request: Request;
  supabase: SupabaseClient;
}) {
  const providedToken = accessToken?.trim() || getCustomerAccessToken(request);
  const orderId = config.order_id ?? (await getSupabaseOrderIdForConfig(supabase, config));

  if (providedToken && orderId) {
    const { data: deliveryPackage } = await supabase
      .from("delivery_packages")
      .select("customer_access_token")
      .eq("order_id", orderId)
      .maybeSingle();

    if (isCustomerAccessAllowed(deliveryPackage, providedToken)) {
      return null;
    }
  }

  return requireAdminForConfiguredSupabase();
}

async function getSupabaseOrderIdForConfig(
  supabase: SupabaseClient,
  config: MockCustomerAgentConfigRecord,
) {
  if (!config.order_number) {
    return null;
  }

  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("order_number", config.order_number)
    .maybeSingle();

  return (data as { id?: string } | null)?.id ?? null;
}

async function verifyMockConfigAccess({
  accessToken,
  config,
  request,
}: {
  accessToken?: string;
  config: MockCustomerAgentConfigRecord;
  request: Request;
}) {
  const providedToken = accessToken?.trim() || getCustomerAccessToken(request);
  const order =
    getMockOrderStore().find(
      (item) =>
        item.id === config.order_id ||
        Boolean(config.order_number && item.order_number === config.order_number),
    ) ?? null;

  if (providedToken && order) {
    const deliveryPackage =
      getMockDeliveryPackageStore().find((item) => item.order_id === order.id) ?? null;

    if (isCustomerAccessAllowed(deliveryPackage, providedToken)) {
      return null;
    }
  }

  return requireAdminForConfiguredSupabase();
}

function ensureMockConfigRelations(config: MockCustomerAgentConfigRecord) {
  const normalized = normalizeConfigAliases(config);
  const faqStore = getMockCustomerFaqItemStore();
  const docsStore = getMockKnowledgeDocumentStore();
  let faqItems = faqStore.filter((item) => item.config_id === normalized.id);
  let knowledgeDocuments = docsStore.filter((item) => item.config_id === normalized.id);

  if (faqItems.length === 0) {
    faqItems = createDefaultFaqItems({
      agentSlug: normalized.agent_slug,
      configId: normalized.id,
      faq: normalized.faq ?? [],
    });
    faqStore.push(...faqItems);
  }

  if (knowledgeDocuments.length === 0) {
    knowledgeDocuments = createDefaultKnowledgeDocuments({ config: normalized });
    docsStore.push(...knowledgeDocuments);
  }

  normalized.faq = faqItems
    .filter((item) => item.is_active)
    .map((item) => ({ answer: item.answer, question: item.question }));

  return {
    ...normalized,
    faq_items: faqItems,
    knowledge_documents: knowledgeDocuments,
  };
}

function hydrateDefaultConfig(config: MockCustomerAgentConfigRecord): HydratedCustomerConfig {
  const normalized = normalizeConfigAliases(config);

  return {
    ...normalized,
    faq_items: createDefaultFaqItems({
      agentSlug: normalized.agent_slug,
      configId: normalized.id,
      faq: normalized.faq,
    }),
    knowledge_documents: createDefaultKnowledgeDocuments({ config: normalized }),
  };
}

function normalizeConfigAliases(config: MockCustomerAgentConfigRecord) {
  const businessDescription =
    config.business_description || config.company_introduction || "";
  const businessDescriptionEn =
    config.business_description_en || businessDescription;
  const businessDescriptionZh = config.business_description_zh || "";
  const servicesOrProducts =
    config.services_or_products || config.services_products || "";
  const servicesOrProductsEn =
    config.services_or_products_en || servicesOrProducts;
  const servicesOrProductsZh = config.services_or_products_zh || "";

  return {
    ...config,
    brand_tone:
      config.brand_tone || "Professional, helpful, concise, and safe.",
    business_description: businessDescription,
    business_description_en: businessDescriptionEn,
    business_description_zh: businessDescriptionZh,
    company_introduction: config.company_introduction || businessDescription,
    contact_phone: config.contact_phone ?? null,
    customer_email: config.customer_email || config.contact_email || null,
    license_id: config.license_id ?? null,
    pricing_ranges_en: config.pricing_ranges_en || config.pricing_ranges || "",
    pricing_ranges_zh: config.pricing_ranges_zh || "",
    services_or_products: servicesOrProducts,
    services_or_products_en: servicesOrProductsEn,
    services_or_products_zh: servicesOrProductsZh,
    services_products: config.services_products || servicesOrProducts,
    status: config.status || "draft",
    website_url: config.website_url ?? null,
    welcome_message_en: config.welcome_message_en || config.welcome_message || "",
    welcome_message_zh: config.welcome_message_zh || "",
  };
}

async function replaceSupabaseFaqItems(
  supabase: SupabaseClient,
  configId: string,
  faqItems: MockCustomerFaqItemRecord[],
) {
  await supabase.from("customer_faq_items").delete().eq("config_id", configId);

  if (faqItems.length > 0) {
    await supabase.from("customer_faq_items").insert(faqItems);
  }
}

async function replaceSupabaseKnowledgeDocuments(
  supabase: SupabaseClient,
  configId: string,
  documents: MockKnowledgeDocumentRecord[],
) {
  await supabase.from("knowledge_documents").delete().eq("config_id", configId);

  if (documents.length > 0) {
    await supabase.from("knowledge_documents").insert(documents);
  }
}

function replaceMockFaqItems(
  configId: string,
  faqItems: MockCustomerFaqItemRecord[],
) {
  const store = getMockCustomerFaqItemStore();
  const remaining = store.filter((item) => item.config_id !== configId);

  store.splice(0, store.length, ...remaining, ...faqItems);
}

function replaceMockKnowledgeDocuments(
  configId: string,
  documents: MockKnowledgeDocumentRecord[],
) {
  const store = getMockKnowledgeDocumentStore();
  const remaining = store.filter((item) => item.config_id !== configId);

  store.splice(0, store.length, ...remaining, ...documents);
}

function toSafePublicConfig(config: HydratedCustomerConfig) {
  return {
    agent_slug: config.agent_slug,
    avatar_url: config.avatar_url,
    brand_tone: config.brand_tone,
    business_description: config.business_description,
    business_description_en: config.business_description_en,
    business_description_zh: config.business_description_zh,
    business_hours: config.business_hours,
    business_name: config.business_name,
    company_introduction: config.company_introduction,
    contact_email: config.contact_email,
    contact_information: config.contact_information,
    faq: config.faq,
    faq_items: config.faq_items.filter((item) => item.is_active),
    id: config.id,
    offline_message: config.offline_message,
    primary_color: config.primary_color,
    pricing_ranges: config.pricing_ranges,
    pricing_ranges_en: config.pricing_ranges_en,
    pricing_ranges_zh: config.pricing_ranges_zh,
    services_or_products: config.services_or_products,
    services_or_products_en: config.services_or_products_en,
    services_or_products_zh: config.services_or_products_zh,
    services_products: config.services_products,
    status: config.status,
    welcome_message: config.welcome_message,
    welcome_message_en: config.welcome_message_en,
    welcome_message_zh: config.welcome_message_zh,
    website_url: config.website_url,
    widget_position: config.widget_position,
  };
}

function isLaunchAgent(agentSlug: string) {
  return demoAgents.some((agent) => agent.slug === agentSlug);
}
