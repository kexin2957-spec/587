import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <div className="app-container py-8 sm:py-10">
      <section className="premium-card mb-8 overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
          {description}
        </p>
        </div>
      </section>
      {children}
    </div>
  );
}
