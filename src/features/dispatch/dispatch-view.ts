/**
 * Pure view logic for the dispatch board (PC-S1-07). No React, so it is unit-tested directly.
 * Relative imports: vitest.config.ts has no "@/" alias.
 */
import type { ApiErrorBody, IsoDate, JobListItem, JobListQuery, JobStatus, MaintenanceJob } from "../../types";
import { JOB_STATUSES } from "../../types";
import { isValidIsoDate } from "../../lib/validations/dates";
import { evaluateTransition } from "../../lib/validations/job-status";

export const DISPATCH_PAGE_SIZE = 25;
/** Default view: work that still needs dispatching or is under way. */
export const DEFAULT_STATUSES: readonly JobStatus[] = ["scheduled", "assigned", "in_progress"];
const OPEN: readonly JobStatus[] = ["scheduled", "assigned", "in_progress"];
const BUSY: readonly JobStatus[] = ["assigned", "in_progress"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DispatchFilters {
  status: JobStatus[];
  /** A technician id, "unassigned", or null for everyone. */
  technician: string | null;
  from: IsoDate | null;
  to: IsoDate | null;
  page: number;
}

export interface ParsedFilters {
  filters: DispatchFilters;
  /** The job whose drawer is open (?job=). */
  jobId: string | null;
  /** Human-readable notes about URL values that were ignored. */
  problems: string[];
}

type ParamsLike = Pick<URLSearchParams, "get">;

/** Reads filters from the URL. Bad values are dropped (with a note), never thrown. */
export function parseFilters(params: ParamsLike): ParsedFilters {
  const problems: string[] = [];

  const rawStatus = params.get("status");
  let status = [...DEFAULT_STATUSES];
  if (rawStatus === "all") status = [...JOB_STATUSES];
  else if (rawStatus !== null) {
    const valid = JOB_STATUSES.filter((value) => rawStatus.split(",").includes(value));
    if (valid.length) status = valid;
    else problems.push("The status filter was not recognised, so open visits are shown.");
  }

  const rawTechnician = params.get("technician");
  let technician: string | null = null;
  if (rawTechnician === "unassigned" || (rawTechnician && UUID.test(rawTechnician))) technician = rawTechnician;
  else if (rawTechnician) problems.push("The technician filter was not recognised and was ignored.");

  const date = (name: "from" | "to") => {
    const raw = params.get(name);
    if (raw === null || raw === "") return null;
    if (isValidIsoDate(raw)) return raw;
    problems.push(`The "${name}" date was not a real date and was ignored.`);
    return null;
  };
  const from = date("from");
  let to = date("to");
  if (from && to && to < from) {
    problems.push('The "to" date was before the "from" date and was ignored.');
    to = null;
  }

  const page = Number(params.get("page"));
  const rawJob = params.get("job");
  return {
    filters: { status, technician, from, to, page: Number.isInteger(page) && page > 1 ? page : 1 },
    jobId: rawJob && UUID.test(rawJob) ? rawJob : null,
    problems,
  };
}

/** Builds the query string for the URL, leaving out defaults so links stay short. */
export function filtersToSearch(filters: DispatchFilters, jobId: string | null = null): string {
  const params = new URLSearchParams();
  const sameAsDefault = filters.status.length === DEFAULT_STATUSES.length && DEFAULT_STATUSES.every((value) => filters.status.includes(value));
  if (!sameAsDefault) params.set("status", filters.status.length === JOB_STATUSES.length ? "all" : JOB_STATUSES.filter((value) => filters.status.includes(value)).join(","));
  if (filters.technician) params.set("technician", filters.technician);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (jobId) params.set("job", jobId);
  const search = params.toString();
  return search ? "?" + search : "";
}

export function toJobQuery(filters: DispatchFilters): JobListQuery {
  return {
    status: filters.status,
    technicianId: filters.technician ?? undefined,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    page: filters.page,
    pageSize: DISPATCH_PAGE_SIZE,
  };
}

export function hasActiveFilters(filters: DispatchFilters): boolean {
  return filtersToSearch({ ...filters, page: 1 }) !== "";
}

type BusyJob = Pick<MaintenanceJob, "id" | "technicianId" | "scheduledDate" | "status">;

export interface DispatchRow extends JobListItem {
  /** Open and dated before today. */
  overdue: boolean;
  /** Its technician has another assigned or in-progress visit on the same date. */
  doubleBooked: boolean;
}

/** Visits a technician already holds on a date (assigned or in progress), excluding one job. */
export function technicianLoad(busyJobs: readonly BusyJob[], technicianId: string, date: IsoDate, excludeJobId?: string): number {
  return busyJobs.filter((job) => job.id !== excludeJobId && BUSY.includes(job.status) && job.technicianId === technicianId && job.scheduledDate === date).length;
}

/** Adds conflict flags. `busyJobs` should be every assigned/in-progress job, not just the current page. */
export function annotateJobs(jobs: readonly JobListItem[], busyJobs: readonly BusyJob[], today: IsoDate): DispatchRow[] {
  return jobs.map((job) => ({
    ...job,
    overdue: OPEN.includes(job.status) && job.scheduledDate < today,
    doubleBooked: BUSY.includes(job.status) && job.technicianId !== null && technicianLoad(busyJobs, job.technicianId, job.scheduledDate, job.id) > 0,
  }));
}

export function countByStatus(rows: readonly Pick<JobListItem, "status">[]): Record<JobStatus, number> {
  const counts = Object.fromEntries(JOB_STATUSES.map((status) => [status, 0])) as Record<JobStatus, number>;
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

export type CoordinatorAction = "assign" | "unassign" | "reschedule" | "cancel" | "reactivate";
const COORDINATOR_ACTIONS: readonly CoordinatorAction[] = ["assign", "unassign", "reschedule", "cancel", "reactivate"];

export const ACTION_LABEL: Record<CoordinatorAction, string> = {
  assign: "Assign technician",
  unassign: "Unassign",
  reschedule: "Reschedule",
  cancel: "Cancel visit",
  reactivate: "Reactivate",
};

/** Actions a coordinator may take on this job, straight from the approved status machine. */
export function allowedActions(job: Pick<MaintenanceJob, "status" | "technicianId" | "completedAt">): CoordinatorAction[] {
  const coordinator = { role: "coordinator" as const, userId: "coordinator" };
  return COORDINATOR_ACTIONS.filter((action) => evaluateTransition(coordinator, job, action, "reason").ok);
}

/** How the drawer explains a failed action. A conflict always offers a reload, because nothing was saved. */
export function describeActionError(error: ApiErrorBody): { message: string; offerReload: boolean } {
  if (error.code === "CONFLICT") return { message: `${error.message} Nothing was changed.`, offerReload: true };
  if (error.code === "NOT_FOUND") return { message: "This visit no longer exists. Close this panel and refresh the board.", offerReload: false };
  return { message: error.message, offerReload: false };
}
