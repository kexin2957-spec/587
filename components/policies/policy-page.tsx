"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  getPolicyContent,
  type PolicySlug,
} from "@/lib/policies/policy-content";

export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const { language, t } = useLanguage();
  const content = getPolicyContent(slug, language);

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/82">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {t("policies.eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            {content.description}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-4xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        {content.sections.map((section) => (
          <section
            className="premium-card p-5"
            key={section.title}
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {section.title}
            </h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900 shadow-sm">
          <p>{t("policies.reviewNotice")}</p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
            href="/custom-service"
          >
            {t("policies.contactSupport")}
          </Link>
        </div>
      </main>
    </div>
  );
}
