import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="app-container grid min-h-[70vh] place-items-center py-16">
      <section className="premium-card max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page may have moved, or the link may be incomplete. If this is a
          customer dashboard, reopen the secure order link with its access token.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/marketplace">
            Explore agents
          </Link>
          <Link className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900" href="/custom-service">
            Request support
          </Link>
        </div>
      </section>
    </main>
  );
}
