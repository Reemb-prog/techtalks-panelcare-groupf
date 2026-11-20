import type { IsoDate, IsoDateTime, ListQuery, Uuid } from "./common";

export const JOB_STATUSES = ["scheduled", "assigned", "in_progress", "completed", "cancelled"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** One maintenance visit. UNIQUE(planId, scheduledDate) regardless of status. */
export interface MaintenanceJob {
  id: Uuid;
  planId: Uuid;
  systemId: Uuid;
  scheduledDate: IsoDate;
  technicianId: Uuid | null;
  status: JobStatus;
  /** Increments on every mutation; send as expectedVersion (409 when stale). */
  version: number;
  /** Required audit reason for the latest cancel/reschedule/reactivate, else null. */
  lastChangeReason: string | null;
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Row shape for dispatch tables and technician job lists. */
export interface JobListItem extends MaintenanceJob {
  systemLabel: string;
  siteLabel: string;
  city: string;
  customerName: string;
  technicianName: string | null;
  /** Set once completed. */
  reportId: Uuid | null;
}

/** GET /api/jobs. Technicians always receive only their assigned jobs regardless of filters. */
export interface JobListQuery extends ListQuery {
  status?: JobStatus[];
  /** Inclusive. */
  from?: IsoDate;
  /** Inclusive. */
  to?: IsoDate;
  technicianId?: Uuid | "unassigned";
  planId?: Uuid;
}

/**
 * PATCH /api/jobs/:id. One explicit action per request (no raw status writes).
 * Completion is NOT here: it uses POST /api/jobs/:id/complete.
 */
export type JobPatchRequest =
  | { action: "assign"; expectedVersion: number; technicianId: Uuid }
  | { action: "unassign"; expectedVersion: number }
  | { action: "reschedule"; expectedVersion: number; scheduledDate: IsoDate; reason: string }
  | { action: "start"; expectedVersion: number }
  | { action: "cancel"; expectedVersion: number; reason: string }
  | { action: "reactivate"; expectedVersion: number; reason: string };

export type JobAction = JobPatchRequest["action"] | "complete";
