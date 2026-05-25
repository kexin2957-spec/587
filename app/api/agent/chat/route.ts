import { NextResponse } from "next/server";
import {
  AgentRuntimeError,
  runAgentRuntime,
  type AgentRuntimeRequest,
} from "@/lib/server/agent-runtime";
import { logApiError } from "@/lib/server/monitoring";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.chat);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const payload = (await request.json()) as AgentRuntimeRequest;
    const data = await runAgentRuntime(request, payload);

    return NextResponse.json({
      data,
      ok: true,
    });
  } catch (error) {
    if (error instanceof AgentRuntimeError) {
      return NextResponse.json(
        {
          error: error.message,
          ok: false,
          ...(error.details ?? {}),
        },
        { status: error.status },
      );
    }

    logApiError("chat_runtime_unhandled_error", error, {
      path: new URL(request.url).pathname,
    });

    return NextResponse.json(
      {
        error: "Agent runtime failed.",
        ok: false,
      },
      { status: 500 },
    );
  }
}
