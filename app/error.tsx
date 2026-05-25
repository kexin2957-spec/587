"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-container grid min-h-[70vh] place-items-center py-16">
      <section className="premium-card max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Server error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The request failed cleanly. Try again, or contact support if this
          happens during checkout, delivery, or dashboard access.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900" href="/custom-service">
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
