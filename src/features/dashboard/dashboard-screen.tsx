"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LoadingSkeleton, skeletonFill } from "@/components/layout/loading-skeleton";
import { useAdapters } from "@/components/layout/adapters-provider";
import { roleHome } from "@/components/layout/nav-items";
import { addDays, businessToday } from "@/lib/validations/dates";
import { DEFAULT_BUSINESS_TIMEZONE, type ExpiringWarranty } from "@/types";
import {
  COMPONENT_TYPE_LABEL,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  OPEN_JOB_STATUSES,
  formatLongDate,
  formatShortDate,
  relativeDay,
  toDashboardState,
  type DashboardData,
  type DashboardState,
  type JobRow,
  type SummaryCard,
  type Tone,
} from "./dashboard-view";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-pc-neutral-bg text-pc-neutral-text",
  info: "bg-pc-info-bg text-pc-info-text",
  warning: "bg-pc-warning-bg text-pc-warning-text",
  success: "bg-pc-success-bg text-pc-success-text",
  danger: "bg-pc-danger-bg text-pc-danger-text",
};

const DOT_CLASS: Record<Tone, string> = {
  neutral: "bg-pc-neutral-text",
  info: "bg-pc-primary",
  warning: "bg-pc-warning-text",
  success: "bg-pc-success-text",
  danger: "bg-pc-danger-text",
};

export function DashboardScreen() {
  const { adapters, auth, dataVersion, signOut } = useAdapters();
  const role = auth.status === "signed-in" ? auth.session.role : null;
  const [state, setState] = useState<DashboardState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (role !== "coordinator") return;
    let cancelled = false;
    setState({ kind: "loading" });
    const today = businessToday(new Date(), DEFAULT_BUSINESS_TIMEZONE);
    Promise.all([
      adapters.dashboard.getStats(),
      adapters.dispatch.listJobs({ status: OPEN_JOB_STATUSES, to: addDays(today, 6), pageSize: 100 }),
    ]).then(([stats, jobs]) => {
      if (!cancelled) setState(toDashboardState(stats, jobs));
    });
    return () => {
      cancelled = true;
    };
  }, [adapters, role, dataVersion, attempt]);

  // An expired session ends the demo session; the layout then redirects to sign-in.
  useEffect(() => {
    if (state.kind === "signed-out") signOut();
  }, [state, signOut]);

  const today = state.kind === "ready" ? state.data.businessDate : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* 1. Today header and primary action */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold">Dashboard</h1>
          <p className="mt-1 text-pc-muted">{today ? `${formatLongDate(today)} · Beirut time` : "Today's maintenance at a glance"}</p>
        </div>
        {role === "coordinator" && (
          <Link
            href="/jobs"
            className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover"
          >
            Open dispatch board
          </Link>
        )}
      </div>

      {role === "technician" ? (
        <DeniedPanel message="The dashboard is for coordinators. Your assigned visits are in My jobs." homeHref={roleHome("technician")} homeLabel="Go to My jobs" />
      ) : state.kind === "loading" || state.kind === "signed-out" ? (
        <LoadingView />
      ) : state.kind === "error" ? (
        <ErrorPanel message={state.message} onRetry={() => setAttempt((value) => value + 1)} />
      ) : state.kind === "denied" ? (
        <DeniedPanel message={`${state.message} In this demo, pick "Normal data" in the mock banner to restore access.`} />
      ) : (
        <ReadyView data={state.data} />
      )}
    </div>
  );
}

function ReadyView({ data }: { data: DashboardData }) {
  return (
    <>
      {/* 2. Visit summary cards */}
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-[length:var(--pc-type-card)] font-semibold">
          Visit summary
        </h2>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-pc-card border border-pc-border bg-pc-border sm:grid-cols-3 lg:grid-cols-5">
          {data.cards.map((card) => (
            <SummaryCardView key={card.key} card={card} />
          ))}
        </ul>
      </section>

      {data.isEmpty && (
        <Panel tone="neutral" title="No maintenance activity yet">
          <p>Register a customer and their solar system, then add a maintenance plan to start scheduling visits.</p>
          <Link href="/customers" className="mt-3 inline-flex font-semibold text-pc-primary underline underline-offset-2">
            Add a customer
          </Link>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* 3. Upcoming and overdue jobs */}
        <JobsSection jobs={data.jobs} total={data.totalJobs} today={data.businessDate} />
        {/* 4. Expiring warranties */}
        <WarrantiesSection warranties={data.warranties} today={data.businessDate} />
      </div>
    </>
  );
}

function SummaryCardView({ card }: { card: SummaryCard }) {
  return (
    <li className="min-w-0 bg-pc-surface p-4 last:col-span-2 lg:last:col-span-1">
      <p className="flex items-center gap-2 text-[length:var(--pc-type-control)] font-semibold text-pc-muted">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-pc-pill ${DOT_CLASS[card.tone]}`} />
        {card.label}
      </p>
      <p className="mt-1 text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold tracking-tight tabular-nums">{card.value}</p>
      <p className="text-[length:var(--pc-type-caption)] leading-[var(--pc-line-caption)] text-pc-muted">{card.hint}</p>
    </li>
  );
}

function JobsSection({ jobs, total, today }: { jobs: JobRow[]; total: number; today: string }) {
  return (
    <section aria-labelledby="jobs-heading" className="rounded-pc-panel border border-pc-border bg-pc-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-pc-border px-4 py-3 sm:px-6">
        <h2 id="jobs-heading" className="text-[length:var(--pc-type-card)] font-semibold">
          Upcoming and overdue visits
        </h2>
        <Link href="/jobs" className="text-[length:var(--pc-type-control)] font-semibold text-pc-primary underline underline-offset-2">
          {total > jobs.length ? `View all ${total} in dispatch` : "Open dispatch"}
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="px-4 py-6 text-pc-muted sm:px-6">No visits are due in the next 7 days and nothing is overdue.</p>
      ) : (
        <div role="region" aria-labelledby="jobs-heading" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left sm:min-w-[36rem] text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)]">
            <thead className="bg-pc-canvas text-pc-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold sm:px-6">Date</th>
                <th scope="col" className="px-4 py-2 font-semibold">Customer and site</th>
                <th scope="col" className="px-4 py-2 font-semibold">Technician</th>
                <th scope="col" className="hidden px-4 py-2 font-semibold sm:table-cell sm:pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-pc-border hover:bg-pc-canvas/65">
                  <td className="px-4 py-3 whitespace-nowrap sm:px-6">
                    <span className="font-semibold">{formatShortDate(job.scheduledDate)}</span>
                    <span className={`block text-[length:var(--pc-type-caption)] ${job.overdue ? "font-semibold text-pc-danger-text" : "text-pc-muted"}`}>
                      {job.overdue ? `Overdue · ${relativeDay(job.scheduledDate, today)}` : relativeDay(job.scheduledDate, today)}
                    </span>
                    {/* Phones: the Status column is hidden, so the chip sits under the date. */}
                    <span className="mt-1 block sm:hidden">
                      <Chip tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Chip>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{job.customerName}</span>
                    <span className="block text-pc-muted">
                      {job.siteLabel}, {job.city} · {job.systemLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.technicianName ?? <span className="text-pc-muted">Not assigned</span>}</td>
                  <td className="hidden px-4 py-3 sm:table-cell sm:pr-6">
                    <Chip tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WarrantiesSection({ warranties, today }: { warranties: ExpiringWarranty[]; today: string }) {
  const shown = warranties.slice(0, 5);
  return (
    <section aria-labelledby="warranties-heading" className="rounded-pc-panel border border-pc-border bg-pc-surface">
      <div className="border-b border-pc-border px-4 py-3 sm:px-6">
        <h2 id="warranties-heading" className="text-[length:var(--pc-type-card)] font-semibold">
          Expiring warranties
        </h2>
        <p className="text-[length:var(--pc-type-caption)] leading-[var(--pc-line-caption)] text-pc-muted">Active components, next 90 days</p>
      </div>
      {shown.length === 0 ? (
        <p className="px-4 py-6 text-pc-muted sm:px-6">No warranties expire in the next 90 days.</p>
      ) : (
        <ul>
          {shown.map((warranty) => (
            <li key={warranty.componentId} className="flex items-start justify-between gap-3 border-t border-pc-border px-4 py-3 first:border-t-0 sm:px-6">
              <div className="min-w-0 text-[length:var(--pc-type-control)] leading-[var(--pc-line-control)]">
                <p className="font-semibold">
                  {COMPONENT_TYPE_LABEL[warranty.type]} <span className="font-normal text-pc-muted">· {warranty.serialNumber}</span>
                </p>
                <p className="truncate text-pc-muted">
                  {warranty.customerName} · {warranty.systemLabel}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Chip tone="warning">{relativeDay(warranty.warrantyExpiresOn, today)}</Chip>
                <p className="mt-1 text-[length:var(--pc-type-caption)] text-pc-muted">{formatShortDate(warranty.warrantyExpiresOn)}</p>
              </div>
            </li>
          ))}
          {warranties.length > shown.length && (
            <li className="border-t border-pc-border px-4 py-3 text-[length:var(--pc-type-control)] text-pc-muted sm:px-6">
              +{warranties.length - shown.length} more expiring
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-pc-pill px-2 text-[length:var(--pc-type-caption)] leading-[var(--pc-line-caption)] font-semibold whitespace-nowrap ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

/* 5. Loading, error and denied states */

function LoadingView() {
  return (
    <LoadingSkeleton label="Loading dashboard">
      <div className="space-y-6">
        <div>
          <div className={`${skeletonFill} mb-3 h-7 w-28`} />
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-pc-card border border-pc-border bg-pc-border sm:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((card) => (
              <div key={card} className="min-h-28 space-y-3 bg-pc-surface p-4 last:col-span-2 lg:last:col-span-1">
                <div className={`${skeletonFill} h-3 w-3/4 max-w-32`} />
                <div className={`${skeletonFill} h-8 w-12`} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {[0, 1].map((panel) => (
            <div key={panel} className="space-y-5 rounded-pc-panel border border-pc-border bg-pc-surface p-5">
              <div className={`${skeletonFill} h-5 w-1/3`} />
              {[0, 1, 2, 3].map((row) => <div key={row} className={`${skeletonFill} h-4 w-3/4`} />)}
            </div>
          ))}
        </div>
      </div>
    </LoadingSkeleton>
  );
}

function Panel({ tone, title, role, children }: { tone: Tone; title: string; role?: "alert"; children: ReactNode }) {
  return (
    <section role={role} aria-label={role ? undefined : title} className={`rounded-pc-panel border border-pc-border p-4 sm:p-6 ${TONE_CLASS[tone]}`}>
      <h2 className="text-[length:var(--pc-type-card)] font-semibold">{title}</h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Panel tone="danger" title="The dashboard could not load" role="alert">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-[var(--pc-control-min-height)] rounded-pc-control bg-pc-surface px-4 font-semibold text-pc-text ring-1 ring-pc-control-border hover:bg-pc-canvas"
      >
        Try again
      </button>
    </Panel>
  );
}

function DeniedPanel({ message, homeHref, homeLabel }: { message: string; homeHref?: string; homeLabel?: string }) {
  return (
    <Panel tone="neutral" title="You don't have access to this page">
      <p>{message}</p>
      {homeHref && (
        <Link href={homeHref} className="mt-3 inline-flex font-semibold text-pc-primary underline underline-offset-2">
          {homeLabel}
        </Link>
      )}
    </Panel>
  );
}
