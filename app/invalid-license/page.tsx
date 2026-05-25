import Link from "next/link";

export default function InvalidLicensePage() {
  return (
    <main className="app-container grid min-h-[70vh] place-items-center py-16">
      <section className="premium-card max-w-xl border-red-200 bg-red-50/80 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Invalid license
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          This AI agent is not licensed for this website.
        </h1>
        <p className="mt-3 text-sm font-semibold text-red-800">
          该 AI Agent 未授权在当前网站使用。
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          Check the license key, allowed domains, payment status, or customer
          dashboard delivery package.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/policies/license">
            License policy
          </Link>
          <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900" href="/custom-service">
            Request support
          </Link>
        </div>
      </section>
    </main>
  );
}
