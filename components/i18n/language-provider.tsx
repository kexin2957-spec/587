"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionaries } from "@/lib/i18n/dictionaries";
import {
  DEFAULT_APP_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
  normalizeLanguage,
} from "@/lib/i18n/language";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getCookieLanguage() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${LANGUAGE_STORAGE_KEY}=`));

  return cookie?.split("=")[1] ?? null;
}

function getClientLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_APP_LANGUAGE;
  }

  const savedCookieLanguage = getCookieLanguage();
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguage =
    window.navigator.languages?.[0] ?? window.navigator.language;

  return normalizeLanguage(savedCookieLanguage ?? savedLanguage ?? browserLanguage);
}

function getNestedValue(source: unknown, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);

  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_APP_LANGUAGE,
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);

  useEffect(() => {
    const languageSync = window.setTimeout(() => {
      setLanguageState(getClientLanguage());
    }, 0);

    function handleStorage(event: StorageEvent) {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguageState(getClientLanguage());
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(languageSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${nextLanguage}; path=/; max-age=${LANGUAGE_MAX_AGE_SECONDS}; SameSite=Lax`;
    setLanguageState(nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const t = useCallback(
    (key: string) => {
      const translated = getNestedValue(dictionaries[language], key);

      if (translated) {
        return translated;
      }

      return getNestedValue(dictionaries[DEFAULT_APP_LANGUAGE], key) ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();

  return { t, language };
}
