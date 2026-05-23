"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { DELIVERY_TYPES } from "@/lib/marketplace/constants";
import type { DemoCategory } from "@/lib/marketplace/demo-data";
import type {
  DeliveryFilter,
  LanguageFilter,
  MarketplaceFilterState,
  PriceFilter,
} from "@/lib/marketplace/browse";
import {
  getLocalizedCategory,
  getLocalizedDeliveryType,
} from "@/lib/marketplace/localization";

export function MarketplaceFilters({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: MarketplaceFilterState;
  categories: DemoCategory[];
  onChange: (filters: MarketplaceFilterState) => void;
  onClear: () => void;
}) {
  const { language, t } = useTranslation();

  return (
    <div className="premium-card p-4 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">{t("marketplace.filters")}</h2>
        <button
          data-testid="clear-filters"
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-blue-700 hover:text-blue-600"
        >
          {t("marketplace.clearFilters")}
        </button>
      </div>

      <div className="grid gap-4">
        <FilterSelect
          testId="category-filter"
          label={t("marketplace.category")}
          value={filters.category}
          onChange={(value) => onChange({ ...filters, category: value })}
          options={[
            { label: t("marketplace.allCategories"), value: "all" },
            ...categories.map((category) => ({
              label: getLocalizedCategory(category, language).name,
              value: category.slug,
            })),
          ]}
        />

        <FilterSelect
          testId="price-filter"
          label={t("marketplace.price")}
          value={filters.price}
          onChange={(value) =>
            onChange({ ...filters, price: value as PriceFilter })
          }
          options={[
            { label: t("marketplace.allPrices"), value: "all" },
            { label: t("marketplace.free"), value: "free" },
            { label: t("marketplace.paid"), value: "paid" },
            { label: t("marketplace.customQuote"), value: "custom_quote" },
          ]}
        />

        <FilterSelect
          testId="delivery-filter"
          label={t("marketplace.deliveryType")}
          value={filters.deliveryType}
          onChange={(value) =>
            onChange({ ...filters, deliveryType: value as DeliveryFilter })
          }
          options={[
            { label: t("marketplace.allDeliveryTypes"), value: "all" },
            ...DELIVERY_TYPES.map((deliveryType) => ({
              label: getLocalizedDeliveryType(deliveryType, language),
              value: deliveryType,
            })),
          ]}
        />

        <FilterSelect
          testId="language-filter"
          label={t("marketplace.language")}
          value={filters.language}
          onChange={(value) =>
            onChange({ ...filters, language: value as LanguageFilter })
          }
          options={[
            { label: t("marketplace.allLanguages"), value: "all" },
            { label: t("marketplace.english"), value: "en" },
            { label: t("marketplace.chinese"), value: "zh" },
            { label: t("marketplace.both"), value: "both" },
          ]}
        />

        <FilterCheckbox
          testId="verified-filter"
          label={t("marketplace.verifiedOnly")}
          checked={filters.verifiedOnly}
          onChange={(checked) => onChange({ ...filters, verifiedOnly: checked })}
        />

        <FilterCheckbox
          testId="demo-filter"
          label={t("marketplace.liveDemoAvailable")}
          checked={filters.demoOnly}
          onChange={(checked) => onChange({ ...filters, demoOnly: checked })}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  testId,
  label,
  value,
  options,
  onChange,
}: {
  testId: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="polished-input h-11 px-3 text-sm text-slate-950"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterCheckbox({
  testId,
  label,
  checked,
  onChange,
}: {
  testId: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <input
        data-testid={testId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-700"
      />
      {label}
    </label>
  );
}
