"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, formatShortDate, relativeDay } from "@/features/dashboard/dashboard-view";
import { describeRecurrence } from "@/lib/adapters/maintenance/recurrence";
import { businessToday } from "@/lib/validations/dates";
import { DEFAULT_BUSINESS_TIMEZONE, type Adapters, type ApiResult, type JobListItem, type MaintenancePlan, type SystemDetail } from "@/types";
import { GeneratePanel } from "./generate-panel";
import { PlanForm } from "./plan-form";
import { PLAN_STATUS_LABEL, impactSentences, planImpact, previewOccurrences } from "./planner-view";
import { Chip, CoordinatorOnly, Dialog, LoadFailed, LoadingBlock, PageHeader, Panel, Section, SimulatedNotice, buttonPrimary, buttonSecondary, captionClass, linkClass, useLoad } from "./ui";

interface PlanBundle {
  plan: MaintenancePlan;
  system: SystemDetail;
  jobs: JobListItem[];
}

/** Plan, its system context and its visits, as one load (any failure wins). */
async function loadPlanBundle(adapters: Adapters, planId: string): Promise<ApiResult<PlanBundle>> {
  const plan = await adapters.maintenance.getPlan(planId);
  if (!plan.ok) return plan;
  const [system, jobs] = await Promise.all([
    adapters.registry.getSystem(plan.data.systemId),
    adapters.dispatch.listJobs({ planId, pageSize: 100 }),
  ]);
  if (!system.ok) return system;
  if (!jobs.ok) return jobs;
  return { ok: true, status: 200, data: { plan: plan.data, system: system.data, jobs: jobs.data.items } };
}

function usePlanBundle(planId: string) {
  const { adapters } = useAdapters();
  const load = useCallback(() => loadPlanBundle(adapters, planId), [adapters, planId]);
  return useLoad(load);
}

// ---------- /maintenance/new ----------

export function NewPlanScreen() {
  return (
    <CoordinatorOnly>
      <NewPlan />
    </CoordinatorOnly>
  );
}

function NewPlan() {
  const { adapters } = useAdapters();
  const router = useRouter();
  const initialSystemId = useSearchParams().get("systemId") ?? undefined;
  const load = useCallback(() => adapters.registry.listSystems({ pageSize: 100 }), [adapters]);
  const { state, reload } = useLoad(load);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="New maintenance plan"
        subtitle="Choose a system, how often it is serviced and the first visit date."
        actions={
          <Link href="/maintenance" className={buttonSecondary}>
            All plans
          </Link>
        }
      />
      <SimulatedNotice />
      {state.kind === "loading" ? (
        <LoadingBlock label="Loading solar systems" layout="form" />
      ) : state.kind === "failed" ? (
        <LoadFailed status={state.status} error={state.error} what="Systems" onRetry={() => reload()} backHref="/maintenance" backLabel="Back to plans" />
      ) : (
        <PlanForm
          mode={{ kind: "create", systems: [...state.data.items].sort((a, b) => a.customerName.localeCompare(b.customerName)), initialSystemId }}
          cancelHref="/maintenance"
          onSaved={(plan) => router.push(`/maintenance/${plan.id}`)}
        />
      )}
    </div>
  );
}

// ---------- /maintenance/[planId]/edit ----------

export function EditPlanScreen({ planId }: { planId: string }) {
  return (
    <CoordinatorOnly>
      <EditPlan planId={planId} />
    </CoordinatorOnly>
  );
}

function EditPlan({ planId }: { planId: string }) {
  const router = useRouter();
  const { state, reload } = usePlanBundle(planId);
  const detailHref = `/maintenance/${planId}`;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {state.kind === "ready" ? (
        <PageHeader
          title="Edit schedule"
          subtitle={`${state.data.system.customer.displayName} · ${state.data.system.site.label} · ${state.data.system.label}`}
          actions={
            <Link href={detailHref} className={buttonSecondary}>
              Plan details
            </Link>
          }
        />
      ) : (
        <PageHeader title="Edit schedule" />
      )}
      <SimulatedNotice />
      {state.kind === "loading" ? (
        <LoadingBlock label="Loading plan" layout="form" />
      ) : state.kind === "failed" ? (
        <LoadFailed status={state.status} error={state.error} what="Plan" onRetry={() => reload()} backHref="/maintenance" backLabel="Back to plans" />
      ) : (
        <PlanForm
          key={state.data.plan.version}
          mode={{ kind: "edit", plan: state.data.plan, planJobs: state.data.jobs, onReload: () => reload() }}
          cancelHref={detailHref}
          onSaved={() => router.push(detailHref)}
        />
      )}
    </div>
  );
}

// ---------- /maintenance/[planId] ----------

export function PlanDetailScreen({ planId }: { planId: string }) {
  return (
    <CoordinatorOnly>
      <PlanDetail planId={planId} />
    </CoordinatorOnly>
  );
}

function PlanDetail({ planId }: { planId: string }) {
  const { state, reload } = usePlanBundle(planId);
  const [today] = useState(() => businessToday(new Date(), DEFAULT_BUSINESS_TIMEZONE));
  const [confirming, setConfirming] = useState(false);

  if (state.kind === "loading") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader title="Maintenance plan" />
        <LoadingBlock label="Loading plan" />
      </div>
    );
  }
  if (state.kind === "failed") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader title="Maintenance plan" />
        <LoadFailed status={state.status} error={state.error} what="Plan" onRetry={() => reload()} backHref="/maintenance" backLabel="Back to plans" />
      </div>
    );
  }

  const { plan, system, jobs } = state.data;
  const paused = plan.status === "paused";
  const preview = previewOccurrences(plan, today) ?? [];
  const sortedJobs = [...jobs].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const openJobs = jobs.filter((job) => job.status === "scheduled" || job.status === "assigned").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* 1. System context */}
      <PageHeader
        title={system.label}
        subtitle={
          <>
            {system.customer.displayName} · {system.site.label}, {system.site.city} ·{" "}
            <Link href={`/systems/${system.id}`} className={linkClass}>
              System record
            </Link>
          </>
        }
        actions={
          <>
            <Link href={`/maintenance/${plan.id}/edit`} className={buttonPrimary}>
              Edit schedule
            </Link>
            <button type="button" onClick={() => setConfirming(true)} className={buttonSecondary}>
              {paused ? "Resume plan" : "Pause plan"}
            </button>
          </>
        }
      />
      <SimulatedNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 2. Frequency, anchor, timezone */}
        <Section title="Schedule" id="plan-schedule-heading" actions={<Chip tone={paused ? "neutral" : "success"}>{PLAN_STATUS_LABEL[plan.status]}</Chip>}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="font-semibold">Rule</dt>
            <dd>{describeRecurrence(plan)}</dd>
            <dt className="font-semibold">First visit</dt>
            <dd>
              {formatShortDate(plan.anchorDate)} {plan.anchorDate.slice(0, 4)}
            </dd>
            <dt className="font-semibold">Timezone</dt>
            <dd>{plan.timezone}</dd>
            <dt className="font-semibold">Revision</dt>
            <dd>{plan.revision}</dd>
          </dl>
        </Section>

        {/* 3. Next-occurrences preview */}
        <Section title="Upcoming visit dates" id="plan-preview-heading">
          {paused && <p className="mb-3 text-pc-muted">Paused: these dates are not generated until the plan is resumed.</p>}
          <ol className="flex flex-col gap-2">
            {preview.map(({ date, inWindow }) => (
              <li key={date} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-semibold">{formatShortDate(date)}</span> <span className="text-pc-muted">{date.slice(0, 4)} · {relativeDay(date, today)}</span>
                </span>
                {inWindow ? <Chip tone="info">Next 90 days</Chip> : <Chip tone="neutral">Later</Chip>}
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* 5. Job-generation state */}
      <Section title="Generate visits" id="plan-generate-heading">
        {paused ? <p className="text-pc-muted">Resume the plan to generate visits.</p> : <GeneratePanel planId={plan.id} onGenerated={() => reload({ quiet: true })} />}
      </Section>

      <Section title="Visits from this plan" id="plan-visits-heading" actions={<Link href={`/jobs?status=all`} className={linkClass}>Open dispatch</Link>}>
        {sortedJobs.length === 0 ? (
          <p className="text-pc-muted">No visits yet. Generate visits to create the ones due in the next 90 days.</p>
        ) : (
          <ul className="flex flex-col">
            {sortedJobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-pc-border py-2 first:border-t-0">
                <span>
                  <Link href={`/jobs?status=all&job=${job.id}`} className={linkClass}>
                    {formatShortDate(job.scheduledDate)} {job.scheduledDate.slice(0, 4)}
                  </Link>
                  <span className="text-pc-muted"> · {job.technicianName ?? "Not assigned"}</span>
                </span>
                <Chip tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Chip>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {confirming && (
        <PauseDialog
          plan={plan}
          openJobs={openJobs}
          jobs={jobs}
          today={today}
          onClose={() => setConfirming(false)}
          onDone={() => {
            setConfirming(false);
            reload({ quiet: true });
          }}
          onStale={() => {
            setConfirming(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

/** Blueprint section 4: pause/resume impact, confirmed before anything changes. */
function PauseDialog({ plan, openJobs, jobs, today, onClose, onDone, onStale }: {
  plan: MaintenancePlan;
  openJobs: number;
  jobs: JobListItem[];
  today: string;
  onClose: () => void;
  onDone: () => void;
  onStale: () => void;
}) {
  const { adapters } = useAdapters();
  const pausing = plan.status === "active";
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; stale: boolean } | null>(null);
  const resumeImpact = pausing ? null : planImpact({ ...plan, status: "active" }, jobs, today);

  async function confirm() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await adapters.maintenance.updatePlan(plan.id, { expectedVersion: plan.version, status: pausing ? "paused" : "active" });
      if (result.ok) onDone();
      else setError({ text: result.error.message, stale: result.error.code === "CONFLICT" });
    } catch {
      setError({ text: "The mock request failed. Please try again.", stale: false });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog title={pausing ? "Pause this plan?" : "Resume this plan?"} onClose={onClose}>
      {pausing ? (
        <>
          <p>No new visits will be generated while the plan is paused.</p>
          <p>
            {openJobs === 0
              ? "There are no scheduled or assigned visits from this plan."
              : `${openJobs} scheduled or assigned ${openJobs === 1 ? "visit stays" : "visits stay"} as ${openJobs === 1 ? "it is" : "they are"}. Cancel ${openJobs === 1 ? "it" : "them"} in dispatch if ${openJobs === 1 ? "it" : "they"} should not happen.`}
          </p>
        </>
      ) : (
        <>
          <p>Generation starts again from the original schedule ({describeRecurrence(plan)}).</p>
          {resumeImpact && impactSentences(resumeImpact).map((line) => <p key={line}>{line}</p>)}
        </>
      )}
      {error && (
        <Panel tone="danger" title={error.stale ? "This plan changed" : "Nothing was changed"} role="alert">
          <p>{error.text}</p>
          {error.stale && (
            <button type="button" onClick={onStale} className={`${buttonSecondary} w-fit`}>
              Reload plan
            </button>
          )}
        </Panel>
      )}
      <p className={captionClass}>Simulated: the change lives in this browser tab only.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={confirm} disabled={pending} className={buttonPrimary}>
          {pending ? "Saving…" : pausing ? "Pause plan" : "Resume plan"}
        </button>
        <button type="button" onClick={onClose} className={buttonSecondary}>
          Keep it {pausing ? "active" : "paused"}
        </button>
      </div>
    </Dialog>
  );
}
