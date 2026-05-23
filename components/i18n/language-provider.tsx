"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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
const languageListeners = new Set<() => void>();

function getClientLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_APP_LANGUAGE;
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguage =
    window.navigator.languages?.[0] ?? window.navigator.language;

  return normalizeLanguage(savedLanguage ?? browserLanguage);
}

function getServerLanguage(): AppLanguage {
  return DEFAULT_APP_LANGUAGE;
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function emitLanguageChange() {
  languageListeners.forEach((listener) => listener());
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getClientLanguage,
    getServerLanguage,
  );

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    emitLanguageChange();
  }, []);

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
