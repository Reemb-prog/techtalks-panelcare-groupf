"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, formatShortDate, relativeDay } from "@/features/dashboard/dashboard-view";
import { Chip, CoordinatorOnly, LoadFailed, LoadingBlock, PageHeader, Panel, SimulatedNotice, buttonSecondary, captionClass, inputClass, labelClass, linkClass, useLoad } from "@/features/maintenance/ui";
import { businessToday } from "@/lib/validations/dates";
import { DEFAULT_BUSINESS_TIMEZONE, JOB_STATUSES, type ApiResult, type JobListItem, type JobStatus, type Paginated, type TechnicianSummary } from "@/types";
import {
  DEFAULT_STATUSES,
  DISPATCH_PAGE_SIZE,
  annotateJobs,
  countByStatus,
  filtersToSearch,
  hasActiveFilters,
  parseFilters,
  toJobQuery,
  type DispatchFilters,
} from "./dispatch-view";
import { JobDrawer } from "./job-drawer";

interface Board {
  page: Paginated<JobListItem>;
  busy: JobListItem[];
  technicians: TechnicianSummary[];
}

export function DispatchScreen() {
  return (
    <CoordinatorOnly>
      <DispatchBoard />
    </CoordinatorOnly>
  );
}

function DispatchBoard() {
  const { adapters } = useAdapters();
  const router = useRouter();
  const search = useSearchParams().toString();
  const { filters, jobId, problems } = useMemo(() => parseFilters(new URLSearchParams(search)), [search]);
  const filterKey = filtersToSearch(filters);
  const [today] = useState(() => businessToday(new Date(), DEFAULT_BUSINESS_TIMEZONE));

  const navigate = useCallback(
    (next: DispatchFilters, nextJob: string | null) => router.replace(`/jobs${filtersToSearch(next, nextJob)}`, { scroll: false }),
    [router],
  );
  const update = (patch: Partial<DispatchFilters>) => navigate({ ...filters, page: 1, ...patch }, null);

  // filterKey (a string) keeps the loader stable while the filters are unchanged.
  const load = useCallback(async (): Promise<ApiResult<Board>> => {
    const current = parseFilters(new URLSearchParams(filterKey)).filters;
    const [page, busy, technicians] = await Promise.all([
      adapters.dispatch.listJobs(toJobQuery(current)),
      // Every assigned/in-progress visit, so double bookings show even when the other visit is filtered out.
      adapters.dispatch.listJobs({ status: ["assigned", "in_progress"], pageSize: 100 }),
      adapters.dispatch.listTechnicians(),
    ]);
    if (!page.ok) return page;
    if (!busy.ok) return busy;
    if (!technicians.ok) return technicians;
    return { ok: true, status: 200, data: { page: page.data, busy: busy.data.items, technicians: technicians.data } };
  }, [adapters, filterKey]);
  const { state, reload } = useLoad(load);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Dispatch · Mock data"
        title="Dispatch board"
        subtitle="Assign technicians and keep visits on schedule."
        actions={
          <Link href="/maintenance" className={buttonSecondary}>
            Maintenance plans
          </Link>
        }
      />
      <SimulatedNotice />

      {/* 2. Filters */}
      <section aria-labelledby="filters-heading" className="rounded-pc-panel border border-pc-border bg-pc-surface p-4 shadow-pc-card sm:p-6">
        <h2 id="filters-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className={labelClass}>Status</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOB_STATUSES.map((status) => {
                const checked = filters.status.includes(status);
                const last = checked && filters.status.length === 1;
                return (
                  <label
                    key={status}
                    className={`inline-flex min-h-[var(--pc-control-min-height)] cursor-pointer items-center gap-2 rounded-pc-pill border px-3 ${checked ? "border-pc-primary bg-pc-accent" : "border-pc-control-border"} ${last ? "cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={last}
                      onChange={() => update({ status: checked ? filters.status.filter((value) => value !== status) : JOB_STATUSES.filter((value) => value === status || filters.status.includes(value)) })}
                      className="size-4 accent-[var(--pc-color-primary)]"
                    />
                    {JOB_STATUS_LABEL[status]}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="filter-from" className={labelClass}>
                From
              </label>
              <input id="filter-from" type="date" value={filters.from ?? ""} onChange={(event) => update({ from: event.target.value || null })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="filter-to" className={labelClass}>
                To
              </label>
              <input id="filter-to" type="date" value={filters.to ?? ""} min={filters.from ?? undefined} onChange={(event) => update({ to: event.target.value || null })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="filter-technician" className={labelClass}>
                Technician
              </label>
              <select id="filter-technician" value={filters.technician ?? ""} onChange={(event) => update({ technician: event.target.value || null })} className={inputClass}>
                <option value="">All technicians</option>
                <option value="unassigned">Not assigned</option>
                {state.kind === "ready" &&
                  state.data.technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.displayName}
                      {technician.active ? "" : " (inactive)"}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {hasActiveFilters(filters) && (
            <button type="button" onClick={() => navigate({ status: [...DEFAULT_STATUSES], technician: null, from: null, to: null, page: 1 }, null)} className={`${buttonSecondary} w-fit`}>
              Reset filters
            </button>
          )}
        </div>
      </section>

      {problems.length > 0 && (
        <Panel tone="warning" title="Some filters in the link were ignored">
          {problems.map((problem) => (
            <p key={problem}>{problem}</p>
          ))}
        </Panel>
      )}

      {state.kind === "loading" ? (
        <LoadingBlock label="Loading visits" />
      ) : state.kind === "failed" ? (
        <LoadFailed status={state.status} error={state.error} what="Dispatch board" onRetry={() => reload()} backHref="/dashboard" backLabel="Back to dashboard" />
      ) : (
        <BoardView board={state.data} filters={filters} today={today} onOpen={(id) => navigate(filters, id)} onPage={(page) => navigate({ ...filters, page }, null)} />
      )}

      {jobId && state.kind === "ready" && (
        <JobDrawer
          key={jobId}
          jobId={jobId}
          technicians={state.data.technicians}
          busyJobs={state.data.busy}
          today={today}
          onClose={() => navigate(filters, null)}
          onChanged={() => reload({ quiet: true })}
        />
      )}
    </div>
  );
}

function rangeText(filters: DispatchFilters): string {
  if (filters.from && filters.to) return `${formatShortDate(filters.from)} ${filters.from.slice(0, 4)} to ${formatShortDate(filters.to)} ${filters.to.slice(0, 4)}`;
  if (filters.from) return `From ${formatShortDate(filters.from)} ${filters.from.slice(0, 4)}`;
  if (filters.to) return `Up to ${formatShortDate(filters.to)} ${filters.to.slice(0, 4)}`;
  return "All dates";
}

function BoardView({ board, filters, today, onOpen, onPage }: {
  board: Board;
  filters: DispatchFilters;
  today: string;
  onOpen: (jobId: string) => void;
  onPage: (page: number) => void;
}) {
  const rows = annotateJobs(board.page.items, board.busy, today);
  const counts = countByStatus(rows);
  const overdue = rows.filter((row) => row.overdue).length;
  const doubleBooked = rows.filter((row) => row.doubleBooked).length;
  const { total, page } = board.page;

  return (
    <>
      {/* 1. Counts and date range */}
      <section aria-labelledby="counts-heading" className="flex flex-col gap-2">
        <h2 id="counts-heading" className="text-[length:var(--pc-type-card)] font-semibold">
          {total} {total === 1 ? "visit matches" : "visits match"} · {rangeText(filters)}
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="Visits on this page by status">
          {filters.status.map((status: JobStatus) => (
            <li key={status}>
              <Chip tone={JOB_STATUS_TONE[status]}>
                {JOB_STATUS_LABEL[status]}: {counts[status]}
              </Chip>
            </li>
          ))}
          {overdue > 0 && (
            <li>
              <Chip tone="danger">Overdue: {overdue}</Chip>
            </li>
          )}
          {doubleBooked > 0 && (
            <li>
              <Chip tone="warning">Double-booked: {doubleBooked}</Chip>
            </li>
          )}
        </ul>
        {total > rows.length && <p className={captionClass}>Counts are for the visits on this page.</p>}
      </section>

      {/* 3. Compact jobs list */}
      {rows.length === 0 ? (
        <Panel tone="neutral" title="No visits match these filters">
          <p>Widen the dates, choose more statuses or another technician. New visits appear after generating them from a maintenance plan.</p>
          <Link href="/maintenance" className={linkClass}>
            Go to maintenance plans
          </Link>
        </Panel>
      ) : (
        <section className="rounded-pc-panel border border-pc-border bg-pc-surface shadow-pc-card">
          <h2 id="visits-heading" className="sr-only">
            Visits
          </h2>
          {/* relative: keeps the screen-reader-only "Actions" header inside the scroll box (it widened the page at 375 px). */}
          <div role="region" aria-labelledby="visits-heading" tabIndex={0} className="relative overflow-x-auto">
            <table aria-labelledby="visits-heading" className="w-full min-w-[40rem] text-left text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)]">
              <thead className="text-pc-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold sm:px-6">Date</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Customer and site</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Technician</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-2 font-semibold sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-pc-border">
                    <td className="px-4 py-3 whitespace-nowrap sm:px-6">
                      <span className="font-semibold">
                        {formatShortDate(row.scheduledDate)} {row.scheduledDate.slice(0, 4)}
                      </span>
                      <span className={`block text-[length:var(--pc-type-caption)] ${row.overdue ? "font-semibold text-pc-danger-text" : "text-pc-muted"}`}>
                        {row.overdue ? `Overdue · ${relativeDay(row.scheduledDate, today)}` : relativeDay(row.scheduledDate, today)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{row.customerName}</span>
                      <span className="block text-pc-muted">
                        {row.siteLabel}, {row.city} · {row.systemLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.technicianName ?? <span className="text-pc-muted">Not assigned</span>}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        <Chip tone={JOB_STATUS_TONE[row.status]}>{JOB_STATUS_LABEL[row.status]}</Chip>
                        {row.overdue && <Chip tone="danger">Overdue</Chip>}
                        {row.doubleBooked && <Chip tone="warning">Double-booked</Chip>}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:pr-6">
                      <button
                        type="button"
                        onClick={() => onOpen(row.id)}
                        aria-label={`Manage visit on ${formatShortDate(row.scheduledDate)} for ${row.customerName}`}
                        className={buttonSecondary}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Visit pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-pc-border px-4 py-3 sm:px-6">
            <button type="button" className={buttonSecondary} disabled={page <= 1} onClick={() => onPage(page - 1)}>
              Previous
            </button>
            <p className="text-pc-muted">
              Page {page} of {Math.max(1, Math.ceil(total / DISPATCH_PAGE_SIZE))}
            </p>
            <button type="button" className={buttonSecondary} disabled={page * DISPATCH_PAGE_SIZE >= total} onClick={() => onPage(page + 1)}>
              Next
            </button>
          </nav>
        </section>
      )}
    </>
  );
}
