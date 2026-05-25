import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminForConfiguredSupabase } from "@/lib/auth/server";
import {
  getMockAgentMessageStore,
  getMockAgentSessionStore,
  type MockAgentMessageRecord,
  type MockAgentSessionRecord,
} from "@/lib/server/marketplace-admin-store";

export const dynamic = "force-dynamic";

type SessionDebugRecord = MockAgentSessionRecord & {
  last_intent: string | null;
  last_lead_score: string | null;
  messages: MockAgentMessageRecord[];
  should_handoff: boolean;
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
    const { data: sessions, error } = await supabase
      .from("agent_sessions")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sessionIds = (sessions ?? []).map((session) => session.id);
    const { data: messages, error: messageError } = sessionIds.length
      ? await supabase
          .from("agent_messages")
          .select("*")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: normalizeSessionRecords(
        (sessions ?? []) as MockAgentSessionRecord[],
        (messages ?? []) as MockAgentMessageRecord[],
      ),
      mode: "supabase",
      ok: true,
    });
  }

  return NextResponse.json({
    data: normalizeSessionRecords(
      getMockAgentSessionStore(),
      getMockAgentMessageStore(),
    ),
    mode: "mock",
    ok: true,
  });
}

function normalizeSessionRecords(
  sessions: MockAgentSessionRecord[],
  messages: MockAgentMessageRecord[],
): SessionDebugRecord[] {
  return [...sessions]
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    .map((session) => {
      const sessionMessages = messages.filter(
        (message) => message.session_id === session.id,
      );
      const lastAnalyzedMessage = [...sessionMessages]
        .reverse()
        .find((message) => message.intent || message.lead_score);
      const shouldHandoff = sessionMessages.some(
        (message) => message.metadata?.should_handoff === true,
      );

      return {
        ...session,
        last_intent: lastAnalyzedMessage?.intent ?? null,
        last_lead_score: lastAnalyzedMessage?.lead_score ?? null,
        messages: sessionMessages,
        should_handoff: shouldHandoff,
      };
    });
}
