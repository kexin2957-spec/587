import { NextResponse } from "next/server";
import type { AppLanguage } from "@/lib/i18n/language";
import {
  buildWidgetReply,
  type WidgetChatMessage,
} from "@/lib/server/widget-agent-engine";
import {
  eventTypeForWidgetFailure,
  getLicenseErrorResponse,
  recordWidgetUsage,
  validateWidgetLicense,
  type WidgetLicensePayload,
} from "@/lib/server/widget-license-service";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type WidgetMessagePayload = WidgetLicensePayload & {
  language?: AppLanguage;
  message?: string;
  messages?: WidgetChatMessage[];
};

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.chat);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const payload = (await request.json()) as WidgetMessagePayload;
  const context = await validateWidgetLicense(request, payload);

  if (!context.ok || !context.config) {
    await recordWidgetUsage(context, eventTypeForWidgetFailure(context), {
      agent_id: payload.agent_id,
      reason: context.errorCode,
    });

    return getLicenseErrorResponse(context);
  }

  const message = payload.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const response = buildWidgetReply({
    agentId: context.agentId,
    config: context.config,
    language: payload.language === "zh" ? "zh" : "en",
    message,
  });

  await recordWidgetUsage(context, "chat_message", {
    intent: response.analysis.intent,
    needs_human: response.analysis.needsHuman,
  });

  return NextResponse.json({
    data: {
      analysis: response.analysis,
      reply: response.reply,
    },
    mode: context.mode,
    ok: true,
  });
}
