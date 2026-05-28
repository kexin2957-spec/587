"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslation } from "@/components/i18n/language-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const router = useRouter();
  const { isConfigured, refreshAuth } = useAuth();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("auth.validationEmail"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.validationPassword"));
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError(t("auth.supabaseNotConfigured"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          options: {
            data: {
              display_name: displayName.trim() || email.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          await refreshAuth();
          router.push(getSafeNextPath());
          router.refresh();
          return;
        }

        setSuccess(t("auth.emailConfirmationRequired"));
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await refreshAuth();
      router.push(getSafeNextPath());
      router.refresh();
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
        <h2 className="font-semibold text-amber-950">
          {t("auth.supabaseNotConfiguredTitle")}
        </h2>
        <p className="mt-2">{t("auth.supabaseNotConfigured")}</p>
        <p className="mt-2 font-mono text-xs">
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card p-5 sm:p-6">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {isSignUp ? (
          <TextField
            label={t("forms.displayName")}
            onChange={setDisplayName}
            value={displayName}
          />
        ) : null}
        <TextField
          label={t("forms.email")}
          onChange={setEmail}
          required
          type="email"
          value={email}
        />
        <TextField
          label={t("auth.password")}
          onChange={setPassword}
          required
          type="password"
          value={password}
        />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? t("auth.submitting")
            : isSignUp
              ? t("auth.createAccount")
              : t("auth.signIn")}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
        {isSignUp ? (
          <p>
            {t("auth.alreadyHaveAccount")}{" "}
            <Link className="font-semibold text-blue-700 hover:text-blue-600" href="/sign-in">
              {t("auth.signIn")}
            </Link>
          </p>
        ) : (
          <p>
            {t("auth.needAccount")}{" "}
            <Link className="font-semibold text-blue-700 hover:text-blue-600" href="/sign-up">
              {t("auth.signUp")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        className="polished-input mt-2 h-11 w-full px-3 text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function getSafeNextPath() {
  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get("next");

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  return "/marketplace";
}

function getAuthErrorMessage(
  error: unknown,
  t: (key: string) => string,
) {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("email_not_confirmed")
  ) {
    return t("auth.emailNotConfirmed");
  }

  return message || t("auth.authFailed");
}
