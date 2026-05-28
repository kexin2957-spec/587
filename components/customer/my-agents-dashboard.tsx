"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

type UserAgentStatus = "active" | "expired" | "unused";
type DashboardNav = "agents" | "favorites" | "settings";
type SortMode = "name" | "recent" | "usage";

export type UserAgentRecord = {
  agentName: string;
  agentSlug: string;
  category: string;
  dailyLimit: number;
  description: string;
  iconUrl: string;
  id: string;
  industry: string;
  isFavorite: boolean;
  lastUsedAt: string | null;
  launchUrl: string;
  status: UserAgentStatus;
  tags: string[];
  usageToday: number;
  useCase: string;
};

type StoredPreferences = {
  categories: Record<string, string>;
  favorites: Record<string, boolean>;
  hiddenIds: string[];
};

const emptyPreferences: StoredPreferences = {
  categories: {},
  favorites: {},
  hiddenIds: [],
};

const statusLabels: Record<UserAgentStatus, string> = {
  active: "使用中",
  expired: "已过期",
  unused: "未使用",
};

const statusStyles: Record<UserAgentStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
  unused: "border-slate-200 bg-slate-50 text-slate-600",
};

const agentIconBackgrounds = [
  "linear-gradient(135deg, #2563eb, #7c3aed)",
  "linear-gradient(135deg, #0f172a, #0284c7)",
  "linear-gradient(135deg, #f97316, #f59e0b)",
  "linear-gradient(135deg, #059669, #0ea5e9)",
];

export function MyAgentsDashboard() {
  const { isLoading, profile, user } = useAuth();
  const [agents, setAgents] = useState<UserAgentRecord[]>([]);
  const [activeNav, setActiveNav] = useState<DashboardNav>("agents");
  const [categoryFilter, setCategoryFilter] = useState("全部 Agent");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState("");
  const [isGridView, setIsGridView] = useState(true);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<UserAgentStatus | "all">("all");
  const [toast, setToast] = useState("");
  const storageKey = user ? `customer-dashboard:agent-preferences:${user.id}` : "";

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let active = true;

    async function loadAgents() {
      setIsLoadingAgents(true);
      const response = await fetch(`/api/user_agents?user_id=${encodeURIComponent(userId)}`);
      const payload = (await response.json().catch(() => ({}))) as {
        data?: UserAgentRecord[];
      };
      const preferences = readPreferences(storageKey);
      const nextAgents = applyPreferences(payload.data ?? [], preferences);

      if (active) {
        setAgents(nextAgents);
        setIsLoadingAgents(false);
      }
    }

    void loadAgents().catch(() => {
      if (active) {
        setAgents([]);
        setIsLoadingAgents(false);
      }
    });

    return () => {
      active = false;
    };
  }, [storageKey, user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(
    () => [
      "全部 Agent",
      ...Array.from(new Set([...agents.map((agent) => agent.category || "未分类"), ...customCategories])),
    ],
    [agents, customCategories],
  );
  const industries = useMemo(
    () => ["全部行业", ...Array.from(new Set(agents.map((agent) => agent.industry).filter(Boolean)))],
    [agents],
  );
  const [industryFilter, setIndustryFilter] = useState("全部行业");
  const visibleAgents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = agents.filter((agent) => {
      if (activeNav === "favorites" && !agent.isFavorite) return false;
      if (categoryFilter !== "全部 Agent" && agent.category !== categoryFilter) return false;
      if (industryFilter !== "全部行业" && agent.industry !== industryFilter) return false;
      if (statusFilter !== "all" && agent.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      return [
        agent.agentName,
        agent.category,
        agent.industry,
        agent.useCase,
        agent.description,
        agent.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return filtered.sort((first, second) => {
      if (sortMode === "name") return first.agentName.localeCompare(second.agentName, "zh-Hans-CN");
      if (sortMode === "usage") return second.usageToday - first.usageToday;
      return toTime(second.lastUsedAt) - toTime(first.lastUsedAt);
    });
  }, [activeNav, agents, categoryFilter, industryFilter, searchTerm, sortMode, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = agents.filter((agent) => agent.status === "active").length;
    const totalUsage = agents.reduce((sum, agent) => sum + agent.usageToday, 0);
    const favoriteCount = agents.filter((agent) => agent.isFavorite).length;

    return [
      { label: "总拥有", value: `${agents.length}`, suffix: "个 Agent" },
      { label: "正在使用", value: `${activeCount}`, suffix: "个 Agent" },
      { label: "今日使用", value: `${totalUsage}`, suffix: "次" },
      { label: "收藏夹", value: `${favoriteCount}`, suffix: "个 Agent" },
    ];
  }, [agents]);

  function persist(nextAgents: UserAgentRecord[]) {
    if (!storageKey) return;
    const preferences: StoredPreferences = {
      categories: Object.fromEntries(nextAgents.map((agent) => [agent.id, agent.category])),
      favorites: Object.fromEntries(nextAgents.map((agent) => [agent.id, agent.isFavorite])),
      hiddenIds: readPreferences(storageKey).hiddenIds,
    };
    writePreferences(storageKey, preferences);
  }

  function toggleSelected(agentId: string) {
    setSelectedIds((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId],
    );
  }

  function updateAgentCategory(agentIds: string[], category: string) {
    if (!category.trim() || !agentIds.length) return;
    setAgents((current) => {
      const nextAgents = current.map((agent) =>
        agentIds.includes(agent.id) ? { ...agent, category: category.trim() } : agent,
      );
      persist(nextAgents);
      return nextAgents;
    });
    setSelectedIds([]);
    setToast("分类已更新");
    void fetch("/api/user_agents", {
      body: JSON.stringify({ action: "category", agentIds, category }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
  }

  function toggleFavorite(agentId: string) {
    let nextFavorite = false;
    setAgents((current) => {
      const nextAgents = current.map((agent) => {
        if (agent.id !== agentId) return agent;
        nextFavorite = !agent.isFavorite;
        return { ...agent, isFavorite: nextFavorite };
      });
      persist(nextAgents);
      return nextAgents;
    });
    setToast(nextFavorite ? "已加入收藏" : "已取消收藏");
    void fetch("/api/user_agents", {
      body: JSON.stringify({ action: "favorite", agentIds: [agentId], isFavorite: nextFavorite }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
  }

  function deleteAgents(agentIds: string[]) {
    if (!agentIds.length || !storageKey) return;
    const preferences = readPreferences(storageKey);
    const nextPreferences = {
      ...preferences,
      hiddenIds: Array.from(new Set([...preferences.hiddenIds, ...agentIds])),
    };
    writePreferences(storageKey, nextPreferences);
    setAgents((current) => current.filter((agent) => !agentIds.includes(agent.id)));
    setSelectedIds([]);
    setToast("已从当前列表移除");
    void fetch("/api/user_agents", {
      body: JSON.stringify({ agentIds }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
  }

  if (isLoading) {
    return <DashboardGate title="正在确认登录状态..." />;
  }

  if (!user) {
    return <DashboardGate title="请先登录后查看个人中心。" />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="app-container py-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/[0.06]">
          <div className="grid min-h-[720px] lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
              <Link className="flex items-center gap-3" href="/">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-700 text-sm font-bold text-white">
                  AI
                </span>
                <span>
                  <strong className="block text-sm text-slate-950">AI Agent</strong>
                  <span className="text-xs font-semibold text-slate-500">Marketplace</span>
                </span>
              </Link>

              <nav className="mt-8 grid gap-1 text-sm font-semibold text-slate-600">
                <SideNavButton active={activeNav === "agents"} label="我的 Agent" onClick={() => setActiveNav("agents")} />
                <SideNavButton active={activeNav === "favorites"} label="收藏" onClick={() => setActiveNav("favorites")} />
                <SideNavButton active={activeNav === "settings"} label="设置" onClick={() => setActiveNav("settings")} />
              </nav>

              <div className="mt-8 rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-slate-950">账号</p>
                <p className="mt-2 truncate text-sm text-slate-600">
                  {profile?.display_name || user.email || "已登录用户"}
                </p>
              </div>
            </aside>

            <section className="min-w-0 bg-slate-50/80 p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Personal Dashboard</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">我的 Agent</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    管理已购买 Agent，按分类整理、收藏、搜索，并快速进入使用页。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50" href="/marketplace">
                    浏览 Marketplace
                  </Link>
                  <Link className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600" href="/tools/media-account-diagnosis">
                    打开新媒体 Agent
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item, index) => (
                  <StatCard index={index} key={item.label} {...item} />
                ))}
              </div>

              {activeNav === "settings" ? (
                <SettingsPanel />
              ) : (
                <div className="mt-6 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <CategoryPanel
                    categories={categories}
                    current={categoryFilter}
                    newCategory={newCategory}
                    onAddCategory={() => {
                      const trimmedCategory = newCategory.trim();
                      if (!trimmedCategory) return;
                      if (selectedIds.length) {
                        updateAgentCategory(selectedIds, trimmedCategory);
                      } else {
                        setCustomCategories((current) =>
                          current.includes(trimmedCategory) ? current : [...current, trimmedCategory],
                        );
                        setToast("分类已创建，勾选 Agent 后可批量分配。");
                      }
                      setCategoryFilter(trimmedCategory);
                      setNewCategory("");
                    }}
                    onChange={setCategoryFilter}
                    onNewCategoryChange={setNewCategory}
                    records={agents}
                  />

                  <section className="min-w-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_150px_132px]">
                        <input
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="搜索我的 Agent..."
                          value={searchTerm}
                        />
                        <select
                          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                          onChange={(event) => setIndustryFilter(event.target.value)}
                          value={industryFilter}
                        >
                          {industries.map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                        <select
                          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                          onChange={(event) => setStatusFilter(event.target.value as UserAgentStatus | "all")}
                          value={statusFilter}
                        >
                          <option value="all">全部状态</option>
                          <option value="active">使用中</option>
                          <option value="unused">未使用</option>
                          <option value="expired">已过期</option>
                        </select>
                        <select
                          className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                          onChange={(event) => setSortMode(event.target.value as SortMode)}
                          value={sortMode}
                        >
                          <option value="recent">最近使用</option>
                          <option value="usage">今日使用</option>
                          <option value="name">名称排序</option>
                        </select>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                            disabled={!selectedIds.length}
                            onClick={() => updateAgentCategory(selectedIds, newCategory || "未分类")}
                            type="button"
                          >
                            勾选改分类
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                            disabled={!selectedIds.length}
                            onClick={() => deleteAgents(selectedIds)}
                            type="button"
                          >
                            删除勾选
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${isGridView ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                            onClick={() => setIsGridView(true)}
                            type="button"
                          >
                            卡片
                          </button>
                          <button
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${!isGridView ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                            onClick={() => setIsGridView(false)}
                            type="button"
                          >
                            列表
                          </button>
                        </div>
                      </div>
                    </div>

                    {isLoadingAgents ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                        正在加载我的 Agent...
                      </div>
                    ) : visibleAgents.length ? (
                      <div className={isGridView ? "mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3" : "mt-5 grid gap-3"}>
                        {visibleAgents.map((agent, index) => (
                          <UserAgentCard
                            agent={agent}
                            expanded={expandedId === agent.id}
                            grid={isGridView}
                            iconBackground={agentIconBackgrounds[index % agentIconBackgrounds.length]}
                            key={agent.id}
                            onAssignCategory={(category) => updateAgentCategory([agent.id], category)}
                            onDelete={() => deleteAgents([agent.id])}
                            onExpand={() => setExpandedId((current) => (current === agent.id ? "" : agent.id))}
                            onToggleFavorite={() => toggleFavorite(agent.id)}
                            onToggleSelected={() => toggleSelected(agent.id)}
                            selected={selectedIds.includes(agent.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <h2 className="text-lg font-semibold text-slate-950">没有匹配的 Agent</h2>
                        <p className="mt-2 text-sm text-slate-600">调整搜索、筛选或分类后再试。</p>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <div
        className={`fixed bottom-5 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>
    </main>
  );
}

function DashboardGate({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="app-container py-10">
        <section className="premium-card max-w-xl p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">个人中心</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            登录后可以查看已购买 Agent、分类管理和最近使用记录。
          </p>
          <Link className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/sign-in?next=/customer/dashboard">
            去登录
          </Link>
        </section>
      </div>
    </main>
  );
}

function SideNavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-xl px-3 py-3 text-left transition ${
        active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 hover:text-slate-950"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function StatCard({
  index,
  label,
  suffix,
  value,
}: {
  index: number;
  label: string;
  suffix: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className="grid h-10 w-10 place-items-center rounded-2xl text-sm font-bold text-white"
        style={{ background: agentIconBackgrounds[index % agentIconBackgrounds.length] }}
      >
        {index + 1}
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-950">
        {value} <span className="text-sm font-semibold text-slate-500">{suffix}</span>
      </p>
    </div>
  );
}

function CategoryPanel({
  categories,
  current,
  newCategory,
  onAddCategory,
  onChange,
  onNewCategoryChange,
  records,
}: {
  categories: string[];
  current: string;
  newCategory: string;
  onAddCategory: () => void;
  onChange: (value: string) => void;
  onNewCategoryChange: (value: string) => void;
  records: UserAgentRecord[];
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">我的分类</h2>
        <span className="text-xs font-semibold text-slate-500">{records.length}</span>
      </div>
      <div className="mt-4 grid gap-1">
        {categories.map((category) => (
          <button
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${
              current === category ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
            }`}
            key={category}
            onClick={() => onChange(category)}
            type="button"
          >
            <span>{category}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {category === "全部 Agent" ? records.length : records.filter((item) => item.category === category).length}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="text-sm font-semibold text-slate-700">新增/批量分类</label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          onChange={(event) => onNewCategoryChange(event.target.value)}
          placeholder="输入分类名称"
          value={newCategory}
        />
        <button
          className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          disabled={!newCategory.trim()}
          onClick={onAddCategory}
          type="button"
        >
          保存分类
        </button>
      </div>
    </aside>
  );
}

function UserAgentCard({
  agent,
  expanded,
  grid,
  iconBackground,
  onAssignCategory,
  onDelete,
  onExpand,
  onToggleFavorite,
  onToggleSelected,
  selected,
}: {
  agent: UserAgentRecord;
  expanded: boolean;
  grid: boolean;
  iconBackground: string;
  onAssignCategory: (category: string) => void;
  onDelete: () => void;
  onExpand: () => void;
  onToggleFavorite: () => void;
  onToggleSelected: () => void;
  selected: boolean;
}) {
  const remaining = Math.max(0, agent.dailyLimit - agent.usageToday);

  return (
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/[0.08] ${grid ? "" : "md:grid md:grid-cols-[minmax(0,1fr)_220px] md:items-center md:gap-4"}`}>
      <div>
        {grid && agent.iconUrl ? (
          <div className="relative mb-4 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image
              alt={`${agent.agentName} 商品封面`}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              src={agent.iconUrl}
            />
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <input
            checked={selected}
            className="mt-4 h-4 w-4 rounded border-slate-300"
            onChange={onToggleSelected}
            type="checkbox"
          />
          {agent.iconUrl ? (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <Image
                alt={`${agent.agentName} 缩略图`}
                className="object-cover"
                fill
                sizes="48px"
                src={agent.iconUrl}
              />
            </span>
          ) : (
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white"
              style={{ background: iconBackground }}
            >
              {agent.agentName.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-950">{agent.agentName}</h3>
                <p className="mt-1 text-xs font-semibold text-blue-700">{agent.category}</p>
              </div>
              <button
                aria-label="收藏 Agent"
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${agent.isFavorite ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500"}`}
                onClick={onToggleFavorite}
                type="button"
              >
                {agent.isFavorite ? "已收藏" : "收藏"}
              </button>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{agent.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[agent.status]}`}>
            {statusLabels[agent.status]}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {agent.industry}
          </span>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            剩余 {remaining}/{agent.dailyLimit}
          </span>
        </div>

        {expanded ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-900">用途：</strong>{agent.useCase}</p>
            <p><strong className="text-slate-900">最近使用：</strong>{formatRelativeTime(agent.lastUsedAt)}</p>
            <p><strong className="text-slate-900">标签：</strong>{agent.tags.length ? agent.tags.join("、") : "暂无标签"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["社交媒体运营", "内容创作", "客户服务", "电商运营", "未分类"].map((category) => (
                <button
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                  key={category}
                  onClick={() => onAssignCategory(category)}
                  type="button"
                >
                  分到 {category}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 md:mt-0 md:grid-cols-1">
        <Link
          className="rounded-xl bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-blue-950/20 hover:bg-blue-600"
          href={`/customer/agents/${encodeURIComponent(agent.id)}`}
        >
          进入使用页
        </Link>
        <button
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
          onClick={onExpand}
          type="button"
        >
          {expanded ? "收起详情" : "展开详情"}
        </button>
        <button
          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          onClick={onDelete}
          type="button"
        >
          删除
        </button>
      </div>
    </article>
  );
}

function SettingsPanel() {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">个人中心设置</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SettingCard title="默认视图" description="保留卡片/列表切换能力，后续可保存为账号偏好。" />
        <SettingCard title="分类同步" description="当前前端已支持本地持久化，接入数据库后可迁移到服务端。" />
        <SettingCard title="使用次数" description="每个 Agent 可独立展示每日剩余次数，后端仍是最终限制来源。" />
        <SettingCard title="快捷入口" description="个人中心里的使用页不会显示购买按钮，只保留已购 Agent 的使用能力。" />
      </div>
    </section>
  );
}

function SettingCard({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function readPreferences(storageKey: string): StoredPreferences {
  if (!storageKey || typeof window === "undefined") return emptyPreferences;

  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<StoredPreferences> | null;
    return {
      categories: value?.categories ?? {},
      favorites: value?.favorites ?? {},
      hiddenIds: value?.hiddenIds ?? [],
    };
  } catch {
    return emptyPreferences;
  }
}

function writePreferences(storageKey: string, preferences: StoredPreferences) {
  if (!storageKey || typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}

function applyPreferences(records: UserAgentRecord[], preferences: StoredPreferences) {
  return records
    .filter((record) => !preferences.hiddenIds.includes(record.id))
    .map((record) => ({
      ...record,
      category: preferences.categories[record.id] ?? record.category,
      isFavorite: preferences.favorites[record.id] ?? record.isFavorite,
    }));
}

function toTime(value: string | null) {
  if (!value) return 0;
  return new Date(value).getTime();
}

function formatRelativeTime(value: string | null) {
  if (!value) return "未使用";
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / 1000 / 60 / 60));
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}
