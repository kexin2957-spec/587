"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";

export default function SignUpPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      eyebrow={t("auth.signUp")}
      title={t("auth.signUpTitle")}
      description={t("auth.signUpDescription")}
    >
      <div className="mx-auto max-w-xl">
        <AuthForm mode="sign-up" />
      </div>
    </PageShell>
  );
}
