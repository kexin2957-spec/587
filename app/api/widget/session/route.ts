import { NextResponse } from "next/server";
import {
  eventTypeForWidgetFailure,
  getLicenseErrorResponse,
  recordWidgetUsage,
  validateWidgetLicense,
  type WidgetLicensePayload,
} from "@/lib/server/widget-license-service";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";
import type { AppLanguage } from "@/lib/i18n/language";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.widget);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as WidgetLicensePayload & {
    language?: AppLanguage;
  };
  const language = payload.language === "zh" ? "zh" : "en";
  const context = await validateWidgetLicense(request, payload);

  if (!context.ok) {
    await recordWidgetUsage(context, eventTypeForWidgetFailure(context), {
      agent_id: payload.agent_id,
      reason: context.errorCode,
    });

    return getLicenseErrorResponse(context);
  }

  await recordWidgetUsage(context, "widget_load", {
    agent_id: payload.agent_id,
    order_number: context.order?.order_number ?? null,
  });

  return NextResponse.json({
    data: {
      config: context.config ? toSafeWidgetConfig(context.config, language) : null,
      license: {
        allowed_domains: context.license?.allowed_domains ?? [],
        expires_at: context.license?.expires_at ?? null,
        license_key: context.license?.license_key ?? "",
        status: context.license?.status ?? "inactive",
        usage_count_monthly: context.license?.usage_count_monthly ?? 0,
        usage_limit_monthly: context.license?.usage_limit_monthly ?? null,
      },
      order_number: context.order?.order_number ?? null,
    },
    mode: context.mode,
    ok: true,
  });
}

function toSafeWidgetConfig(
  config: NonNullable<Awaited<ReturnType<typeof validateWidgetLicense>>["config"]>,
  language: AppLanguage,
) {
  const businessDescription =
    language === "zh"
      ? config.business_description_zh ||
        config.business_description ||
        config.business_description_en ||
        config.company_introduction
      : config.business_description_en ||
        config.business_description ||
        config.company_introduction ||
        config.business_description_zh;
  const servicesOrProducts =
    language === "zh"
      ? config.services_or_products_zh ||
        config.services_or_products ||
        config.services_or_products_en ||
        config.services_products
      : config.services_or_products_en ||
        config.services_or_products ||
        config.services_products ||
        config.services_or_products_zh;
  const welcomeMessage =
    language === "zh"
      ? config.welcome_message_zh ||
        config.welcome_message ||
        config.welcome_message_en
      : config.welcome_message_en ||
        config.welcome_message ||
        config.welcome_message_zh;
  const pricingRanges =
    language === "zh"
      ? config.pricing_ranges_zh || config.pricing_ranges || config.pricing_ranges_en
      : config.pricing_ranges_en || config.pricing_ranges || config.pricing_ranges_zh;

  return {
    agent_slug: config.agent_slug,
    avatar_url: config.avatar_url,
    brand_tone: config.brand_tone,
    business_description: businessDescription,
    business_description_en: config.business_description_en,
    business_description_zh: config.business_description_zh,
    business_hours: config.business_hours,
    business_name: config.business_name,
    company_introduction: config.company_introduction,
    contact_email: config.contact_email,
    contact_information: config.contact_information,
    contact_phone: config.contact_phone,
    faq: config.faq,
    id: config.id,
    offline_message: config.offline_message,
    primary_color: config.primary_color,
    pricing_ranges: pricingRanges,
    pricing_ranges_en: config.pricing_ranges_en,
    pricing_ranges_zh: config.pricing_ranges_zh,
    services_or_products: servicesOrProducts,
    services_or_products_en: config.services_or_products_en,
    services_or_products_zh: config.services_or_products_zh,
    services_products: config.services_products,
    status: config.status,
    welcome_message: welcomeMessage,
    welcome_message_en: config.welcome_message_en,
    welcome_message_zh: config.welcome_message_zh,
    website_url: config.website_url,
    widget_position: config.widget_position,
  };
}
