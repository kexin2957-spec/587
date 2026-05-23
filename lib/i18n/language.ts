export const SUPPORTED_APP_LANGUAGES = ["en", "zh"] as const;

export type AppLanguage = (typeof SUPPORTED_APP_LANGUAGES)[number];

export const DEFAULT_APP_LANGUAGE: AppLanguage = "en";
export const LANGUAGE_STORAGE_KEY = "ai-agent-marketplace-language";

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (value?.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return "en";
}
