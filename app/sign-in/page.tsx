"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function SignInPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("nav.signIn")}
      title={t("auth.signInTitle")}
      description={t("auth.signInDescription")}
    >
      <div className="mx-auto max-w-xl">
        <AuthForm mode="sign-in" />
      </div>
    </PageShell>
  );
}
