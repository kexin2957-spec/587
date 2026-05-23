import type { ReactNode } from "react";

export type BadgeTone = "blue" | "cyan" | "emerald" | "slate" | "amber";

const toneClasses: Record<BadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm shadow-slate-950/[0.02] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
