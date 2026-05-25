import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="app-container grid min-h-[70vh] place-items-center py-16">
      <section className="premium-card max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Unauthorized
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Access is protected
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Admin, seller, and customer delivery areas require the right account
          role or a secure customer access token.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/sign-in">
            Sign in
          </Link>
          <Link className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900" href="/custom-service">
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
