import Link from "next/link";
import { SellerUploadForm } from "@/components/seller/seller-upload-form";

export const dynamic = "force-dynamic";

export default async function SellerAgentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ seller_email?: string }>;
}) {
  const { agentId } = await params;
  const { seller_email: sellerEmail } = await searchParams;

  return (
    <div>
      <section className="border-b border-slate-200/80 bg-white/82">
        <div className="app-container py-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Seller Center
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Edit agent submission
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Update a draft or needs-changes agent, then save it or resubmit it
            for admin review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
              href="/seller/agents"
            >
              Back to my agents
            </Link>
          </div>
        </div>
      </section>

      <main className="app-container grid gap-8 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <aside className="premium-card border-blue-200 bg-blue-50/92 p-5 text-sm leading-6 text-blue-900 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-blue-950">Review flow</h2>
          <p className="mt-3">
            Sellers can edit drafts and listings marked needs_changes. Approved
            or published agents need a separate update request; sellers can only
            archive them from the dashboard for now.
          </p>
        </aside>
        <SellerUploadForm
          agentId={agentId}
          defaultSellerEmail={sellerEmail ?? ""}
          key={`${agentId}-${sellerEmail ?? "seller"}`}
        />
      </main>
    </div>
  );
}
