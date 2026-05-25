import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  createDefaultCustomerConfig,
  createDefaultFaqItems,
  createDefaultKnowledgeDocuments,
} from "@/lib/marketplace/customer-config";
import {
  getMockCustomerAgentConfigStore,
  getMockCustomerFaqItemStore,
  getMockKnowledgeDocumentStore,
  getMockOrderStore,
  type MockCustomerAgentConfigRecord,
  type MockCustomerFaqItemRecord,
  type MockKnowledgeDocumentRecord,
} from "@/lib/server/marketplace-admin-store";

export const dynamic = "force-dynamic";

type HydratedCustomerConfig = MockCustomerAgentConfigRecord & {
  faq_items: MockCustomerFaqItemRecord[];
  knowledge_documents: MockKnowledgeDocumentRecord[];
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
    const { data: configs, error } = await supabase
      .from("customer_agent_configs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const configIds = ((configs ?? []) as MockCustomerAgentConfigRecord[]).map(
      (config) => config.id,
    );
    const [{ data: faqItems, error: faqError }, { data: knowledgeDocs, error: docsError }] =
      configIds.length
        ? await Promise.all([
            supabase
              .from("customer_faq_items")
              .select("*")
              .in("config_id", configIds),
            supabase
              .from("knowledge_documents")
              .select("*")
              .in("config_id", configIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];

    const firstError = faqError ?? docsError;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: hydrateConfigs(
        (configs ?? []) as MockCustomerAgentConfigRecord[],
        (faqItems ?? []) as MockCustomerFaqItemRecord[],
        (knowledgeDocs ?? []) as MockKnowledgeDocumentRecord[],
      ),
      mode: "supabase",
      ok: true,
    });
  }

  const configs = ensureMockConfigsForOrders();

  return NextResponse.json({
    data: hydrateConfigs(
      configs,
      getMockCustomerFaqItemStore(),
      getMockKnowledgeDocumentStore(),
    ),
    mode: "mock",
    ok: true,
  });
}

function ensureMockConfigsForOrders() {
  const configStore = getMockCustomerAgentConfigStore();
  const faqStore = getMockCustomerFaqItemStore();
  const docsStore = getMockKnowledgeDocumentStore();

  for (const order of getMockOrderStore()) {
    const existing = configStore.find((config) => config.order_id === order.id);

    if (existing) {
      continue;
    }

    const config = createDefaultCustomerConfig({
      agentId: order.agent_id,
      agentSlug: order.agent_slug,
      businessName: order.company_name,
      contactEmail: order.customer_email,
      orderId: order.id,
      orderNumber: order.order_number,
      websiteUrl: order.website_url,
    });
    configStore.push(config);
    faqStore.push(
      ...createDefaultFaqItems({
        agentSlug: config.agent_slug,
        configId: config.id,
        faq: config.faq,
      }),
    );
    docsStore.push(...createDefaultKnowledgeDocuments({ config }));
  }

  return [...configStore].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function hydrateConfigs(
  configs: MockCustomerAgentConfigRecord[],
  faqItems: MockCustomerFaqItemRecord[],
  knowledgeDocuments: MockKnowledgeDocumentRecord[],
): HydratedCustomerConfig[] {
  return configs.map((config) => {
    const configFaqItems = faqItems.filter((item) => item.config_id === config.id);
    const configDocs = knowledgeDocuments.filter((item) => item.config_id === config.id);

    return {
      ...normalizeConfigAliases(config),
      faq_items: configFaqItems.length
        ? configFaqItems
        : createDefaultFaqItems({
            agentSlug: config.agent_slug,
            configId: config.id,
            faq: config.faq ?? [],
          }),
      knowledge_documents: configDocs.length
        ? configDocs
        : createDefaultKnowledgeDocuments({ config: normalizeConfigAliases(config) }),
    };
  });
}

function normalizeConfigAliases(config: MockCustomerAgentConfigRecord) {
  const businessDescription =
    config.business_description || config.company_introduction || "";
  const servicesOrProducts =
    config.services_or_products || config.services_products || "";

  return {
    ...config,
    brand_tone:
      config.brand_tone || "Professional, helpful, concise, and safe.",
    business_description: businessDescription,
    business_description_en: config.business_description_en || businessDescription,
    business_description_zh: config.business_description_zh || "",
    company_introduction: config.company_introduction || businessDescription,
    customer_email: config.customer_email || config.contact_email || null,
    pricing_ranges_en: config.pricing_ranges_en || config.pricing_ranges || "",
    pricing_ranges_zh: config.pricing_ranges_zh || "",
    services_or_products: servicesOrProducts,
    services_or_products_en: config.services_or_products_en || servicesOrProducts,
    services_or_products_zh: config.services_or_products_zh || "",
    services_products: config.services_products || servicesOrProducts,
    status: config.status || "draft",
    welcome_message_en: config.welcome_message_en || config.welcome_message || "",
    welcome_message_zh: config.welcome_message_zh || "",
  };
}
