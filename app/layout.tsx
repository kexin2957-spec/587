import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  DEFAULT_APP_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
} from "@/lib/i18n/language";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Buy ready-made AI agents for website sales, lead capture, e-commerce product support, and custom business workflows. Hosted, license-protected, and English/Chinese ready.",
  image: "/social/marketplace-og.svg",
  path: "/",
  title: "Buy Ready-Made AI Agents for Your Business | AI Agent Marketplace",
});

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#0f172a",
  width: "device-width",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = normalizeLanguage(
    cookieStore.get(LANGUAGE_STORAGE_KEY)?.value ?? DEFAULT_APP_LANGUAGE,
  );

  return (
    <html
      lang={initialLanguage === "zh" ? "zh-CN" : "en"}
      className="h-full antialiased"
    >
      <body className="min-h-full text-slate-950">
        <LanguageProvider initialLanguage={initialLanguage}>
          <AuthProvider>
            <SiteHeader />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <SiteFooter />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
