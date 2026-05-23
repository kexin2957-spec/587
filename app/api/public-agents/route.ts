import { NextResponse } from "next/server";
import { loadPublicMarketplaceAgents } from "@/lib/server/public-agent-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadPublicMarketplaceAgents();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    data: result.agents,
    mode: result.mode,
    ok: true,
  });
}
