"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CustomerAgentConfigEditor,
  type CustomerAgentConfig,
} from "@/components/customer/customer-agent-config-editor";
import { CustomerAgentTestPanel } from "@/components/customer/customer-agent-test-panel";
import { CUSTOMER_CONFIG_STATUSES, type CustomerConfigStatus } from "@/lib/marketplace/constants";
import { demoAgents } from "@/lib/marketplace/demo-data";

type CustomerConfigsResponse = {
  data?: CustomerAgentConfig[];
  error?: string;
  mode?: "mock" | "supabase";
};

export function CustomerConfigsTable() {
  const [records, setRecords] = useState<CustomerAgentConfig[]>([]);
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<CustomerConfigStatus | "all">("all");
  const [mode, setMode] = useState<"mock" | "supabase" | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadConfigs() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/customer-configs", {
        cache: "no-store",
      });
      const result = (await response.json()) as CustomerConfigsResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load customer configs.");
      }

      setRecords(result.data ?? []);
      setMode(result.mode ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load customer configs.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialConfigs() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/customer-configs", {
          cache: "no-store",
        });
        const result = (await response.json()) as CustomerConfigsResponse;

        if (!response.ok) {
          throw new Error(result.error || "Unable to load customer configs.");
        }

        if (!isActive) {
          return;
        }

        setRecords(result.data ?? []);
        setMode(result.mode ?? null);
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load customer configs.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialConfigs();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleRecords = useMemo(
    () =>
      records.filter((record) => {
        const matchesAgent = agentFilter === "all" || record.agent_slug === agentFilter;
        const matchesStatus =
          statusFilter === "all" || record.status === statusFilter;

        return matchesAgent && matchesStatus;
      }),
    [agentFilter, records, statusFilter],
  );

  const agentOptions = useMemo(
    () =>
      demoAgents.map((agent) => ({
        label: agent.titleEn,
        value: agent.slug,
      })),
    [],
  );

  if (isLoading) {
    return <State>Loading customer configurations...</State>;
  }

  if (error) {
    return <State>{error}</State>;
  }

  return (
    <div className="grid gap-4">
      <div className="premium-card grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {visibleRecords.length} customer configurations
          </p>
          {mode ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              Data source: {mode}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <FilterSelect
            label="Agent"
            value={agentFilter}
            onChange={setAgentFilter}
            options={[
              { label: "All agents", value: "all" },
              ...agentOptions,
            ]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as CustomerConfigStatus | "all")}
            options={[
              { label: "All statuses", value: "all" },
              ...CUSTOMER_CONFIG_STATUSES.map((status) => ({
                label: status,
                value: status,
              })),
            ]}
          />
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
            onClick={() => void loadConfigs()}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {visibleRecords.length === 0 ? (
        <State>Customer configurations appear after orders are created.</State>
      ) : (
        <div className="grid gap-4">
          {visibleRecords.map((record) => {
            const agent = demoAgents.find((item) => item.slug === record.agent_slug);

            return (
              <article className="premium-card p-5" key={record.id}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {record.status} / {record.order_number || "no order"}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {record.business_name || record.customer_email || "Customer config"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {agent?.titleEn ?? record.agent_slug}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {record.customer_email || record.contact_email}
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="Website">{record.website_url || "Not provided"}</Field>
                  <Field label="Contact email">{record.contact_email}</Field>
                  <Field label="Widget color">{record.primary_color}</Field>
                  <Field label="Position">{record.widget_position}</Field>
                </dl>

                <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                    Edit configuration
                  </summary>
                  <div className="mt-4">
                    <CustomerAgentConfigEditor
                      config={record}
                      variant="admin"
                      onSaved={(updatedConfig) =>
                        setRecords((current) =>
                          current.map((item) =>
                            item.id === record.id ? updatedConfig : item,
                          ),
                        )
                      }
                    />
                  </div>
                </details>

                <div className="mt-5">
                  <CustomerAgentTestPanel config={record} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        className="polished-input px-3 py-2 text-sm text-slate-950"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-slate-700">{children}</dd>
    </div>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}
