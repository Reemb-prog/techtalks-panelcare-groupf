"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { formatShortDate } from "@/features/dashboard/dashboard-view";
import { describeRecurrence } from "@/lib/adapters/maintenance/recurrence";
import type { PlanStatus } from "@/types";
import { GeneratePanel } from "./generate-panel";
import { PLAN_STATUS_LABEL } from "./planner-view";
import { Chip, CoordinatorOnly, LoadFailed, LoadingBlock, PageHeader, Panel, Section, SimulatedNotice, buttonPrimary, buttonSecondary, inputClass, labelClass, linkClass, useLoad } from "./ui";

const PAGE_SIZE = 25;

export function PlanListScreen() {
  return (
    <CoordinatorOnly>
      <PlanList />
    </CoordinatorOnly>
  );
}

function PlanList() {
  const { adapters } = useAdapters();
  const [status, setStatus] = useState<PlanStatus | "">("");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const load = useCallback(
    () => adapters.maintenance.listPlans({ status: status || undefined, q: query || undefined, page, pageSize: PAGE_SIZE }),
    [adapters, status, query, page],
  );
  const { state, reload } = useLoad(load);
  const filtered = status !== "" || query !== "";

  function clear() {
    setStatus("");
    setInput("");
    setQuery("");
    setPage(1);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Maintenance · Mock data"
        title="Maintenance plans"
        subtitle="Recurring service schedules for each solar system."
        actions={
          <Link href="/maintenance/new" className={buttonPrimary}>
            New plan
          </Link>
        }
      />
      <SimulatedNotice />

      <Section title="Generate visits" id="generate-heading">
        <GeneratePanel onGenerated={() => reload({ quiet: true })} />
      </Section>

      <form
        role="search"
        aria-label="Filter plans"
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(input.trim());
          setPage(1);
        }}
      >
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="plan-search" className={labelClass}>
            Search customer, site or system
          </label>
          <input id="plan-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} className={inputClass} />
        </div>
        <div className="basis-40">
          <label htmlFor="plan-status" className={labelClass}>
            Status
          </label>
          <select
            id="plan-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PlanStatus | "");
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All plans</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <button type="submit" className={buttonSecondary}>
          Search
        </button>
      </form>

      {state.kind === "loading" ? (
        <LoadingBlock label="Loading maintenance plans" />
      ) : state.kind === "failed" ? (
        <LoadFailed status={state.status} error={state.error} what="Plans" onRetry={() => reload()} backHref="/dashboard" backLabel="Back to dashboard" />
      ) : state.data.items.length === 0 ? (
        filtered ? (
          <Panel tone="neutral" title="No plans match">
            <p>Try another search or status.</p>
            <button type="button" onClick={clear} className={`${buttonSecondary} w-fit`}>
              Clear filters
            </button>
          </Panel>
        ) : (
          <Panel tone="neutral" title="No maintenance plans yet">
            <p>Create a plan for a registered solar system to start scheduling visits.</p>
            <Link href="/maintenance/new" className={linkClass}>
              Create the first plan
            </Link>
          </Panel>
        )
      ) : (
        <section aria-labelledby="plans-heading" className="rounded-pc-panel border border-pc-border bg-pc-surface shadow-pc-card">
          <h2 id="plans-heading" className="sr-only">
            Plans
          </h2>
          <div role="region" aria-labelledby="plans-heading" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)]">
              <thead className="text-pc-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold sm:px-6">Customer and system</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Schedule</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Next visit</th>
                  <th scope="col" className="px-4 py-2 font-semibold sm:pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((plan) => (
                  <tr key={plan.id} className="border-t border-pc-border">
                    <td className="px-4 py-3 sm:px-6">
                      <Link href={`/maintenance/${plan.id}`} className={linkClass}>
                        {plan.customerName}
                      </Link>
                      <span className="block text-pc-muted">
                        {plan.siteLabel} · {plan.systemLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{describeRecurrence(plan)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {plan.status === "paused" ? <span className="text-pc-muted">Paused</span> : plan.nextOccurrence ? formatShortDate(plan.nextOccurrence) : <span className="text-pc-muted">None in 90 days</span>}
                    </td>
                    <td className="px-4 py-3 sm:pr-6">
                      <Chip tone={plan.status === "active" ? "success" : "neutral"}>{PLAN_STATUS_LABEL[plan.status]}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Plan pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-pc-border px-4 py-3 sm:px-6">
            <button type="button" className={buttonSecondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <p className="text-pc-muted">
              Page {page} · {state.data.total} {state.data.total === 1 ? "plan" : "plans"}
            </p>
            <button type="button" className={buttonSecondary} disabled={page * PAGE_SIZE >= state.data.total} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </nav>
        </section>
      )}
    </div>
  );
}
