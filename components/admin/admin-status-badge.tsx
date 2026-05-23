const toneByStatus: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  contacted: "border-blue-200 bg-blue-50 text-blue-800",
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  in_review: "border-blue-200 bg-blue-50 text-blue-800",
  needs_changes: "border-amber-200 bg-amber-50 text-amber-800",
  new: "border-cyan-200 bg-cyan-50 text-cyan-800",
  quoted: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  submitted: "border-cyan-200 bg-cyan-50 text-cyan-800",
  suspended: "border-red-200 bg-red-50 text-red-800",
};

export function AdminStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        toneByStatus[status] ?? "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
