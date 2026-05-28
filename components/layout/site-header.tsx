"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import type { AppLanguage } from "@/lib/i18n/language";

const primaryLinks = [
  { href: "/marketplace", labelKey: "nav.marketplace" },
  { href: "/case-studies", labelEn: "Demo Cases", labelZh: "Demo 案例" },
  { href: "/about", labelEn: "Why Us", labelZh: "为什么选我们" },
  { href: "/pricing", labelKey: "nav.pricing" },
];

export function SiteHeader() {
  const { isLoading, profile, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = profile?.role ?? "buyer";

  if (pathname.startsWith("/embed/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/86 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl">
      <div className="app-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex min-w-0 items-center rounded-md"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              alt={t("nav.brand")}
              className="h-10 w-10 rounded-xl object-contain sm:hidden"
              height={80}
              priority
              src="/brand/gongzhi-ai-logo-mark.png"
              width={80}
            />
            <Image
              alt={t("nav.brand")}
              className="hidden h-11 w-auto object-contain sm:block"
              height={86}
              priority
              src="/brand/gongzhi-ai-logo-wide.png"
              width={310}
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 text-sm text-slate-700 lg:flex">
            {primaryLinks.map((link) => (
              <PrimaryNavLink
                key={link.href}
                href={link.href}
                isActive={isActivePath(pathname, link.href)}
                onClick={() => setMenuOpen(false)}
              >
                {getNavLabel(link, language, t)}
              </PrimaryNavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <AuthActions
              isLoading={isLoading}
              language={language}
              role={role}
              t={t}
              userEmail={user?.email ?? null}
            />
            <LanguageSwitcher
              language={language}
              setLanguage={setLanguage}
              label={t("nav.language")}
              englishLabel={t("nav.english")}
              chineseLabel={t("nav.chinese")}
            />
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            <span className="grid gap-1" aria-hidden="true">
              <span className="h-0.5 w-4 rounded-full bg-slate-950" />
              <span className="h-0.5 w-4 rounded-full bg-slate-950" />
              <span className="h-0.5 w-4 rounded-full bg-slate-950" />
            </span>
            {t("nav.menu")}
          </button>
        </div>

        {menuOpen ? (
          <div
            id="mobile-navigation"
            className="grid gap-4 border-t border-slate-200/80 py-4 lg:hidden"
          >
            <nav className="grid gap-2 text-sm">
              {primaryLinks.map((link) => (
                <PrimaryNavLink
                  key={link.href}
                  href={link.href}
                  isActive={isActivePath(pathname, link.href)}
                  onClick={() => setMenuOpen(false)}
                >
                  {getNavLabel(link, language, t)}
                </PrimaryNavLink>
              ))}
            </nav>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <AuthActions
                isLoading={isLoading}
                language={language}
                role={role}
                t={t}
                userEmail={user?.email ?? null}
              />
              <LanguageSwitcher
                language={language}
                setLanguage={setLanguage}
                label={t("nav.language")}
                englishLabel={t("nav.english")}
                chineseLabel={t("nav.chinese")}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function AuthActions({
  isLoading,
  language,
  role,
  t,
  userEmail,
}: {
  isLoading: boolean;
  language: AppLanguage;
  role: string;
  t: (key: string) => string;
  userEmail: string | null;
}) {
  if (isLoading) {
    return null;
  }

  if (!userEmail) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <HeaderLink href="/sign-in">{t("nav.signIn")}</HeaderLink>
        <HeaderLink href="/sign-up" variant="primary">
          {t("auth.signUp")}
        </HeaderLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="max-w-48 truncate rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
        {userEmail}
      </span>
      <HeaderLink href="/customer/dashboard">
        {language === "zh" ? "个人中心" : "Dashboard"}
      </HeaderLink>
      {role === "admin" ? (
        <HeaderLink href="/admin">{t("nav.admin")}</HeaderLink>
      ) : null}
      {role === "seller" ? (
        <HeaderLink href="/seller">{t("nav.sellerDashboard")}</HeaderLink>
      ) : null}
      <HeaderLink href="/sign-out">{t("auth.signOut")}</HeaderLink>
    </div>
  );
}

function HeaderLink({
  children,
  href,
  variant = "secondary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
      : "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-300 hover:bg-slate-50";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function PrimaryNavLink({
  children,
  href,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        isActive
          ? "rounded-full bg-white px-4 py-2 font-semibold text-slate-950 shadow-sm"
          : "rounded-full px-4 py-2 font-medium text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
      }
    >
      {children}
    </Link>
  );
}

export function LanguageSwitcher({
  language,
  setLanguage,
  label,
  englishLabel,
  chineseLabel,
}: {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  label: string;
  englishLabel: string;
  chineseLabel: string;
}) {
  const pathname = usePathname();

  return (
    <div
      aria-label={label}
      className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm shadow-sm"
    >
      <Image src="/globe.svg" alt="" width={16} height={16} />
      <LanguageButton
        active={language === "en"}
        currentPath={pathname}
        language="en"
        label={englishLabel}
        setLanguage={setLanguage}
      />
      <LanguageButton
        active={language === "zh"}
        currentPath={pathname}
        language="zh"
        label={chineseLabel}
        setLanguage={setLanguage}
      />
    </div>
  );
}

function LanguageButton({
  active,
  currentPath,
  language,
  label,
  setLanguage,
}: {
  active: boolean;
  currentPath: string;
  language: AppLanguage;
  label: string;
  setLanguage: (language: AppLanguage) => void;
}) {
  function selectLanguage(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setLanguage(language);
  }

  return (
    <a
      aria-pressed={active}
      href={`/api/language?lang=${language}&next=${encodeURIComponent(currentPath)}`}
      onClick={selectLanguage}
      role="button"
      className={
        active
          ? "rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-950 shadow-sm"
          : "rounded-lg px-3 py-1.5 text-slate-600 hover:bg-white hover:text-slate-950"
      }
    >
      {label}
    </a>
  );
}

function getNavLabel(
  link: (typeof primaryLinks)[number],
  language: AppLanguage,
  t: (key: string) => string,
) {
  if ("labelKey" in link && link.labelKey) {
    return t(link.labelKey);
  }

  return language === "zh" ? link.labelZh : link.labelEn;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href.startsWith("/#")) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
