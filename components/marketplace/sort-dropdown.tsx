"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import type { SortOption } from "@/lib/marketplace/browse";

const sortOptions: Array<{ value: SortOption; labelKey: string }> = [
  { value: "featured", labelKey: "marketplace.sortFeatured" },
  { value: "popular", labelKey: "marketplace.sortPopular" },
  { value: "newest", labelKey: "marketplace.sortNewest" },
  { value: "highest_rated", labelKey: "marketplace.sortHighestRated" },
  { value: "price_asc", labelKey: "marketplace.sortPriceLowHigh" },
  { value: "price_desc", labelKey: "marketplace.sortPriceHighLow" },
];

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const { t } = useTranslation();

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{t("marketplace.sortBy")}</span>
      <select
        data-testid="marketplace-sort"
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="polished-input h-12 px-3 text-sm text-slate-950"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
