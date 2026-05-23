"use client";

import type { DeliveryType } from "@/lib/marketplace/constants";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

type AgentCoverProps = {
  agent: DemoAgent;
  className?: string;
  deliveryLabel: string;
  title: string;
};

type CoverTheme = {
  accent: string;
  background: string;
  border: string;
  panel: string;
  text: string;
};

const coverThemes: Record<string, CoverTheme> = {
  "ai-news-monitoring": {
    accent: "bg-sky-500",
    background: "from-sky-100 via-white to-amber-100",
    border: "border-sky-200",
    panel: "border-sky-200/80 bg-white/78",
    text: "text-sky-900",
  },
  "automation-workflows": {
    accent: "bg-cyan-500",
    background: "from-cyan-100 via-white to-emerald-100",
    border: "border-cyan-200",
    panel: "border-cyan-200/80 bg-white/78",
    text: "text-cyan-950",
  },
  "content-creation": {
    accent: "bg-fuchsia-500",
    background: "from-fuchsia-100 via-white to-amber-100",
    border: "border-fuchsia-200",
    panel: "border-fuchsia-200/80 bg-white/78",
    text: "text-fuchsia-950",
  },
  "customer-support": {
    accent: "bg-blue-500",
    background: "from-blue-100 via-white to-cyan-100",
    border: "border-blue-200",
    panel: "border-blue-200/80 bg-white/78",
    text: "text-blue-950",
  },
  "developer-tools": {
    accent: "bg-emerald-500",
    background: "from-slate-100 via-white to-emerald-100",
    border: "border-emerald-200",
    panel: "border-emerald-200/80 bg-white/78",
    text: "text-emerald-950",
  },
  ecommerce: {
    accent: "bg-emerald-500",
    background: "from-emerald-100 via-white to-teal-100",
    border: "border-emerald-200",
    panel: "border-emerald-200/80 bg-white/78",
    text: "text-emerald-950",
  },
  education: {
    accent: "bg-indigo-500",
    background: "from-indigo-100 via-white to-blue-100",
    border: "border-indigo-200",
    panel: "border-indigo-200/80 bg-white/78",
    text: "text-indigo-950",
  },
  "healthcare-medical-beauty": {
    accent: "bg-rose-500",
    background: "from-rose-100 via-white to-cyan-100",
    border: "border-rose-200",
    panel: "border-rose-200/80 bg-white/78",
    text: "text-rose-950",
  },
  "internal-knowledge-base": {
    accent: "bg-teal-500",
    background: "from-teal-100 via-white to-slate-100",
    border: "border-teal-200",
    panel: "border-teal-200/80 bg-white/78",
    text: "text-teal-950",
  },
  legal: {
    accent: "bg-slate-600",
    background: "from-slate-100 via-white to-blue-100",
    border: "border-slate-200",
    panel: "border-slate-200/90 bg-white/78",
    text: "text-slate-950",
  },
  "real-estate": {
    accent: "bg-sky-500",
    background: "from-sky-100 via-white to-indigo-100",
    border: "border-sky-200",
    panel: "border-sky-200/80 bg-white/78",
    text: "text-sky-950",
  },
  "research-analysis": {
    accent: "bg-violet-500",
    background: "from-violet-100 via-white to-cyan-100",
    border: "border-violet-200",
    panel: "border-violet-200/80 bg-white/78",
    text: "text-violet-950",
  },
  "restaurant-local-business": {
    accent: "bg-amber-500",
    background: "from-amber-100 via-white to-rose-100",
    border: "border-amber-200",
    panel: "border-amber-200/80 bg-white/78",
    text: "text-amber-950",
  },
  "sales-lead-generation": {
    accent: "bg-cyan-500",
    background: "from-cyan-100 via-white to-blue-100",
    border: "border-cyan-200",
    panel: "border-cyan-200/80 bg-white/78",
    text: "text-cyan-950",
  },
};

const defaultTheme: CoverTheme = {
  accent: "bg-blue-500",
  background: "from-slate-100 via-white to-blue-100",
  border: "border-slate-200",
  panel: "border-slate-200 bg-white/78",
  text: "text-slate-950",
};

const deliveryMarkers: Record<DeliveryType, string> = {
  custom_business_agent: "Custom",
  hosted_agent: "Hosted",
  prompt_template: "Prompt",
  website_chatbot: "Chatbot",
  workflow_template: "Workflow",
};

function getInitials(title: string) {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "AI";
  }

  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join("");
}

export function AgentCover({
  agent,
  className = "",
  deliveryLabel,
  title,
}: AgentCoverProps) {
  const theme = coverThemes[agent.categorySlug] ?? defaultTheme;
  const initials = getInitials(title);

  return (
    <div
      aria-label={`${title} cover image`}
      className={`relative aspect-video overflow-hidden rounded-xl border bg-gradient-to-br p-3 shadow-inner shadow-white ${theme.background} ${theme.border} ${className}`}
      data-testid="agent-cover"
      role="img"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex h-full flex-col justify-between rounded-lg border border-white/80 bg-white/58 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="truncate rounded-full border border-white/90 bg-white/74 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 shadow-sm">
            {deliveryMarkers[agent.deliveryType]}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_56px] items-center gap-3">
          <div className={`rounded-lg border p-3 shadow-sm ${theme.panel}`}>
            <div className={`h-2 w-3/4 rounded-full ${theme.accent}`} />
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-200/90" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-200/80" />
              <div className="h-1.5 w-2/3 rounded-full bg-slate-200/70" />
            </div>
          </div>
          <div
            className={`grid aspect-square place-items-center rounded-xl border border-white/90 bg-white/80 text-base font-bold shadow-sm ${theme.text}`}
          >
            {initials}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <span className={`h-2 w-8 rounded-full ${theme.accent}`} />
            <span className="h-2 w-6 rounded-full bg-slate-300/80" />
            <span className="h-2 w-10 rounded-full bg-slate-200/90" />
          </div>
          <span className="min-w-0 truncate rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-white">
            {deliveryLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
