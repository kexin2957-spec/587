"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/i18n/language-provider";
import { PageShell } from "@/components/layout/page-shell";
import { AgentCard } from "@/components/marketplace/agent-card";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { SearchBar } from "@/components/marketplace/search-bar";
import { SortDropdown } from "@/components/marketplace/sort-dropdown";
import {
  demoAgents,
  demoCategories,
  type DemoAgent,
} from "@/lib/marketplace/demo-data";
import {
  defaultMarketplaceFilters,
  filterAgents,
  hasActiveFilters,
  sortAgents,
  type MarketplaceFilterState,
  type SortOption,
} from "@/lib/marketplace/browse";

export function MarketplaceBrowser() {
  const { language, t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const initialCategory = demoCategories.some(
    (category) => category.slug === categoryParam,
  )
    ? categoryParam
    : "all";

  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<DemoAgent[]>(demoAgents);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<MarketplaceFilterState>({
    ...defaultMarketplaceFilters,
    category: initialCategory ?? "all",
  });

  const visibleAgents = useMemo(() => {
    const filteredAgents = filterAgents({
      agents,
      categories: demoCategories,
      filters,
      query,
    });

    return sortAgents(filteredAgents, sort);
  }, [agents, filters, query, sort]);

  useEffect(() => {
    let isActive = true;

    async function loadPublicAgents() {
      const response = await fetch("/api/public-agents", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { data?: DemoAgent[] };

      if (isActive && result.data?.length) {
        setAgents(result.data);
      }
    }

    void loadPublicAgents();

    return () => {
      isActive = false;
    };
  }, []);

  function clearFilters() {
    setQuery("");
    setSort("featured");
    setFilters(defaultMarketplaceFilters);
    router.replace("/marketplace", { scroll: false });
  }

  const activeFilters = hasActiveFilters(filters, query);

  return (
    <PageShell
      eyebrow={t("marketplace.eyebrow")}
      title={t("marketplace.title")}
      description={t("marketplace.description")}
    >
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-200">
            {language === "zh" ? "上线产品目录" : "Launch-ready catalog"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {language === "zh"
              ? "先从两个已标准化的业务 Agent 开始。"
              : "Start with two standardized business agents."}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {language === "zh"
              ? "每个产品都包含在线 Demo、明确价格、交付说明、购买方案和定制升级入口。"
              : "Each product includes a live demo, clear pricing, delivery expectations, purchase plans, and a custom upgrade path."}
          </p>
        </div>
        <Link
          href="/custom-service"
          className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100"
        >
          {t("marketplace.requestCustomAgent")}
        </Link>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white/76 p-3 shadow-sm shadow-slate-950/[0.03] lg:grid-cols-[1fr_220px]">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t("marketplace.searchPlaceholder")}
        />
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
        <p data-testid="result-count" className="text-sm font-semibold text-slate-700">
          {visibleAgents.length} {t("marketplace.results")}
        </p>
        <div className="flex items-center gap-3">
          {activeFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-blue-700 hover:text-blue-600"
            >
              {t("marketplace.clearFilters")}
            </button>
          ) : null}
          <button
            data-testid="mobile-filter-toggle"
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            {filtersOpen
              ? t("marketplace.hideFilters")
              : t("marketplace.showFilters")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={filtersOpen ? "block" : "hidden lg:block"}>
          <MarketplaceFilters
            filters={filters}
            categories={demoCategories}
            onChange={setFilters}
            onClear={clearFilters}
          />
        </aside>

        <section>
          {visibleAgents.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleAgents.map((agent) => (
                <AgentCard key={agent.slug} agent={agent} variant="marketplace" />
              ))}
            </div>
          ) : (
            <div
              data-testid="marketplace-empty-state"
              className="premium-card p-8 text-center"
            >
              <p className="mx-auto max-w-xl text-base leading-7 text-slate-600">
                {t("marketplace.noAgentsFound")}
              </p>
              <Link
                href="/custom-service"
                className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
              >
                {t("marketplace.requestCustomAgent")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
