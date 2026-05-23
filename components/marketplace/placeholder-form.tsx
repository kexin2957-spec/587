"use client";

import { useTranslation } from "@/components/i18n/language-provider";

type PlaceholderFormProps = {
  title: string;
  fields: string[];
  submitLabel: string;
};

export function PlaceholderForm({
  title,
  fields,
  submitLabel,
}: PlaceholderFormProps) {
  const { t } = useTranslation();

  return (
    <form className="premium-card p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">{field}</span>
            <input
              className="polished-input px-3 py-2 text-slate-950"
              placeholder={field}
            />
          </label>
        ))}
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">{t("forms.message")}</span>
        <textarea
          className="polished-input min-h-28 px-3 py-2 text-slate-950"
          placeholder={t("forms.messagePlaceholder")}
        />
      </label>
      <button
        type="button"
        className="mt-5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
      >
        {submitLabel}
      </button>
    </form>
  );
}
