"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, formatShortDate, relativeDay } from "@/features/dashboard/dashboard-view";
import { Chip, Dialog, FieldError, LoadFailed, LoadingBlock, Panel, buttonDanger, buttonPrimary, buttonSecondary, captionClass, inputClass, labelClass, linkClass, useLoad } from "@/features/maintenance/ui";
import { toFieldErrors } from "@/lib/validations/errors";
import { jobPatchSchema } from "@/lib/validations/dispatch";
import type { FieldErrors, IsoDate, JobListItem, MaintenanceJob, TechnicianSummary } from "@/types";
import { ACTION_LABEL, allowedActions, describeActionError, technicianLoad, type CoordinatorAction } from "./dispatch-view";

type BusyJob = Pick<MaintenanceJob, "id" | "technicianId" | "scheduledDate" | "status">;

/** Blueprint sections 4–5: job detail drawer with assignment/state actions and conflict messages. */
export function JobDrawer({ jobId, technicians, busyJobs, today, onClose, onChanged }: {
  jobId: string;
  technicians: TechnicianSummary[];
  busyJobs: BusyJob[];
  today: IsoDate;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { adapters } = useAdapters();
  const load = useCallback(() => adapters.dispatch.getJob(jobId), [adapters, jobId]);
  const { state, reload } = useLoad(load);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <Dialog title="Visit details" onClose={onClose} wide>
      <div aria-live="polite">{notice && <Panel tone="success" title={notice} role="status" />}</div>
      {state.kind === "loading" ? (
        <LoadingBlock label="Loading visit" />
      ) : state.kind === "failed" ? (
        <LoadFailed status={state.status} error={state.error} what="Visit" onRetry={() => reload()} backHref="/jobs" backLabel="Back to the board" />
      ) : (
        <JobDetails
          key={state.data.version}
          job={state.data}
          technicians={technicians}
          busyJobs={busyJobs}
          today={today}
          onSaved={(message) => {
            setNotice(message);
            reload({ quiet: true });
            onChanged();
          }}
          onReload={() => {
            setNotice(null);
            reload();
          }}
        />
      )}
    </Dialog>
  );
}

function JobDetails({ job, technicians, busyJobs, today, onSaved, onReload }: {
  job: JobListItem;
  technicians: TechnicianSummary[];
  busyJobs: BusyJob[];
  today: IsoDate;
  onSaved: (message: string) => void;
  onReload: () => void;
}) {
  const actions = allowedActions(job);
  const [action, setAction] = useState<CoordinatorAction | null>(null);
  const overdue = (job.status === "scheduled" || job.status === "assigned" || job.status === "in_progress") && job.scheduledDate < today;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="font-semibold">Date</dt>
        <dd>
          {formatShortDate(job.scheduledDate)} {job.scheduledDate.slice(0, 4)}{" "}
          <span className={overdue ? "font-semibold text-pc-danger-text" : "text-pc-muted"}>· {overdue ? `Overdue, ${relativeDay(job.scheduledDate, today)}` : relativeDay(job.scheduledDate, today)}</span>
        </dd>
        <dt className="font-semibold">Customer</dt>
        <dd>{job.customerName}</dd>
        <dt className="font-semibold">Site</dt>
        <dd>
          {job.siteLabel}, {job.city}
        </dd>
        <dt className="font-semibold">System</dt>
        <dd>
          <Link href={`/systems/${job.systemId}`} className={linkClass}>
            {job.systemLabel}
          </Link>
        </dd>
        <dt className="font-semibold">Technician</dt>
        <dd>{job.technicianName ?? <span className="text-pc-muted">Not assigned</span>}</dd>
        <dt className="font-semibold">Status</dt>
        <dd>
          <Chip tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Chip>
        </dd>
        {job.lastChangeReason && (
          <>
            <dt className="font-semibold">Last change</dt>
            <dd>{job.lastChangeReason}</dd>
          </>
        )}
        <dt className="font-semibold">Plan</dt>
        <dd>
          <Link href={`/maintenance/${job.planId}`} className={linkClass}>
            View maintenance plan
          </Link>
        </dd>
      </dl>

      {job.status === "completed" ? (
        <Panel tone="success" title="This visit is completed">
          <p>Completed visits cannot be changed.</p>
          {job.reportId && (
            <Link href={`/reports/${job.reportId}`} className={linkClass}>
              Open service report
            </Link>
          )}
        </Panel>
      ) : actions.length === 0 ? (
        <p className="text-pc-muted">No changes are possible for this visit. Only an unassigned cancelled visit can be reactivated.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {job.status === "in_progress" && <p className="text-pc-muted">The technician is on site. Only the technician can complete this visit.</p>}
          <div role="group" aria-label="Actions" className="flex flex-wrap gap-2">
            {actions.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={action === value}
                onClick={() => setAction(action === value ? null : value)}
                className={`${buttonSecondary} aria-pressed:border-pc-primary aria-pressed:bg-pc-accent`}
              >
                {ACTION_LABEL[value]}
              </button>
            ))}
          </div>
          {action && <ActionForm key={action} action={action} job={job} technicians={technicians} busyJobs={busyJobs} today={today} onSaved={onSaved} onReload={onReload} />}
        </div>
      )}
    </div>
  );
}

const SUCCESS: Record<CoordinatorAction, string> = {
  assign: "Technician assigned.",
  unassign: "The visit is unassigned.",
  reschedule: "The visit was rescheduled.",
  cancel: "The visit was cancelled.",
  reactivate: "The visit was reactivated.",
};

function ActionForm({ action, job, technicians, busyJobs, today, onSaved, onReload }: {
  action: CoordinatorAction;
  job: JobListItem;
  technicians: TechnicianSummary[];
  busyJobs: BusyJob[];
  today: IsoDate;
  onSaved: (message: string) => void;
  onReload: () => void;
}) {
  const { adapters } = useAdapters();
  const [technicianId, setTechnicianId] = useState(action === "assign" ? (job.technicianId ?? "") : "");
  const [scheduledDate, setScheduledDate] = useState(job.scheduledDate);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<{ message: string; offerReload: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const needsReason = action === "reschedule" || action === "cancel" || action === "reactivate";
  const active = technicians.filter((technician) => technician.active);
  const load = technicianId ? technicianLoad(busyJobs, technicianId, job.scheduledDate, job.id) : 0;
  const chosenName = technicians.find((technician) => technician.id === technicianId)?.displayName;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    setFailure(null);
    setErrors({});
    const body = {
      action,
      expectedVersion: job.version,
      ...(action === "assign" ? { technicianId } : {}),
      ...(action === "reschedule" ? { scheduledDate } : {}),
      ...(needsReason ? { reason } : {}),
    };
    const parsed = jobPatchSchema.safeParse(body);
    if (!parsed.success) {
      const next = toFieldErrors(parsed.error);
      setErrors(next);
      const first = ["technicianId", "scheduledDate", "reason"].find((key) => next[key]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    locked.current = true;
    setPending(true);
    try {
      const result = await adapters.dispatch.updateJob(job.id, parsed.data);
      if (result.ok) {
        onSaved(action === "assign" && chosenName ? `Assigned to ${chosenName}.` : SUCCESS[action]);
        return;
      }
      setFailure(describeActionError(result.error));
      setErrors(result.error.fieldErrors ?? {});
    } catch {
      setFailure({ message: "The mock request failed. Nothing was changed. Try again.", offerReload: false });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className="flex flex-col gap-3 rounded-pc-card border border-pc-border p-4">
      {failure && (
        <Panel tone="danger" title={failure.offerReload ? "Conflict: not saved" : "Not saved"} role="alert">
          <p>{failure.message}</p>
          {failure.offerReload && (
            <button type="button" onClick={onReload} className={`${buttonSecondary} w-fit`}>
              Reload job
            </button>
          )}
        </Panel>
      )}

      {action === "assign" && (
        <div>
          <label htmlFor="assign-technician" className={labelClass}>
            Technician
          </label>
          <select
            id="assign-technician"
            name="technicianId"
            value={technicianId}
            onChange={(event) => setTechnicianId(event.target.value)}
            aria-invalid={!!errors.technicianId}
            aria-describedby={errors.technicianId ? "assign-technician-error" : undefined}
            className={inputClass}
          >
            <option value="">Choose a technician</option>
            {active.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.displayName}
              </option>
            ))}
          </select>
          <FieldError id="assign-technician-error" messages={errors.technicianId} />
          {load > 0 && (
            <p role="note" className="mt-2 rounded-pc-control bg-pc-warning-bg px-3 py-2 text-pc-warning-text">
              {chosenName} already has {load} {load === 1 ? "visit" : "visits"} on {formatShortDate(job.scheduledDate)}. Assigning creates a double booking.
            </p>
          )}
        </div>
      )}

      {action === "unassign" && <p>The visit goes back to Unassigned so someone else can take it.</p>}

      {action === "reschedule" && (
        <div>
          <label htmlFor="reschedule-date" className={labelClass}>
            New date
          </label>
          <input
            id="reschedule-date"
            name="scheduledDate"
            type="date"
            min={today}
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            aria-invalid={!!errors.scheduledDate}
            aria-describedby={errors.scheduledDate ? "reschedule-date-error" : undefined}
            className={inputClass}
          />
          <FieldError id="reschedule-date-error" messages={errors.scheduledDate} />
        </div>
      )}

      {action === "cancel" && <p>The visit will not happen. A coordinator can reactivate it later if it is unassigned.</p>}

      {needsReason && (
        <div>
          <label htmlFor="action-reason" className={labelClass}>
            Reason (kept in the visit history)
          </label>
          <textarea
            id="action-reason"
            name="reason"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "action-reason-error" : undefined}
            className={`${inputClass} py-2`}
          />
          <FieldError id="action-reason-error" messages={errors.reason} />
        </div>
      )}

      <p className={captionClass}>Simulated: changes live in this browser tab only.</p>
      <button type="submit" disabled={pending} className={`${action === "cancel" ? buttonDanger : buttonPrimary} w-fit`}>
        {pending ? "Saving…" : action === "assign" ? "Assign" : ACTION_LABEL[action]}
      </button>
    </form>
  );
}
