import type { BusinessTimezone, IsoDate, IsoDateTime, ListQuery, Uuid } from "./common";

export const PLAN_STATUSES = ["active", "paused"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const MIN_INTERVAL_MONTHS = 1;
export const MAX_INTERVAL_MONTHS = 60;

/** Rolling generation window: [businessToday, businessToday + 90 days). */
export const GENERATION_WINDOW_DAYS = 90;

/**
 * Recurring maintenance plan for one solar system.
 * Occurrence k = anchorDate + k × intervalMonths, always from the ORIGINAL anchor, with the day clamped
 * to the target month's last day (D05). Example: Jan 31 monthly → Feb 28/29 → Mar 31.
 */
export interface MaintenancePlan {
  id: Uuid;
  systemId: Uuid;
  intervalMonths: number;
  anchorDate: IsoDate;
  timezone: BusinessTimezone;
  status: PlanStatus;
  /** Increments only when the schedule changes (intervalMonths or anchorDate). */
  revision: number;
  /** Increments on every mutation; send as expectedVersion to detect stale edits (409). */
  version: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreatePlanRequest {
  systemId: Uuid;
  intervalMonths: number;
  anchorDate: IsoDate;
  timezone: BusinessTimezone;
}

/** PATCH /api/maintenance-plans/:id: edit schedule and/or pause/resume. */
export interface UpdatePlanRequest {
  expectedVersion: number;
  intervalMonths?: number;
  anchorDate?: IsoDate;
  status?: PlanStatus;
}

export interface PlanListQuery extends ListQuery {
  systemId?: Uuid;
  status?: PlanStatus;
}

export interface PlanListItem extends MaintenancePlan {
  systemLabel: string;
  siteLabel: string;
  customerName: string;
  /** Next occurrence inside the window, or null when paused/none. */
  nextOccurrence: IsoDate | null;
}

/** POST /api/maintenance/generate (coordinator). Omit planId to run all active plans. */
export interface GenerateJobsRequest {
  planId?: Uuid;
}

export const JOB_CONFLICT_REASONS = ["assigned_job_no_longer_valid", "in_progress_job_no_longer_valid"] as const;
export type JobConflictReason = (typeof JOB_CONFLICT_REASONS)[number];

/** An existing job the generator would not touch automatically; a coordinator must decide. */
export interface JobConflict {
  jobId: Uuid;
  planId: Uuid;
  scheduledDate: IsoDate;
  reason: JobConflictReason;
}

export interface GenerationRunResult {
  runId: Uuid;
  businessDate: IsoDate;
  /** Exclusive end of the window. */
  windowEnd: IsoDate;
  inserted: number;
  /** Already existed for (plan, date), any status. */
  skipped: number;
  /** Future unassigned scheduled jobs no longer valid for their plan, cancelled with an audit reason. */
  cancelled: number;
  conflicts: JobConflict[];
  failed: number;
  ranAt: IsoDateTime;
}
