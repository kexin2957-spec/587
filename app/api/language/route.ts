import { NextRequest, NextResponse } from "next/server";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from "@/lib/i18n/language";

const LANGUAGE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const language = normalizeLanguage(url.searchParams.get("lang"));
  const nextPath = getSafeNextPath(url.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(nextPath, request.url));

  response.cookies.set(LANGUAGE_STORAGE_KEY, language, {
    maxAge: LANGUAGE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
