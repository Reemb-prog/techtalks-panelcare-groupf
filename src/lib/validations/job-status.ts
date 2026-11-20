/**
 * Job status state machine (Q3, approved 2026-11-20). Mock adapters use it in S1; S2 dispatch and
 * completion handlers must apply the same rules on the server.
 */
import type { ApiErrorCode, JobAction, JobStatus, MaintenanceJob, Role, Session } from "../../types";

export interface TransitionRule {
  action: JobAction;
  role: Role;
  /** Technician rules apply only to jobs assigned to that technician. */
  assignedOnly: boolean;
  from: readonly JobStatus[];
  /** "same" keeps the current status (reassign / reschedule). */
  to: JobStatus | "same";
  reasonRequired: boolean;
}

export const JOB_TRANSITIONS: readonly TransitionRule[] = [
  { action: "assign", role: "coordinator", assignedOnly: false, from: ["scheduled", "assigned"], to: "assigned", reasonRequired: false },
  { action: "unassign", role: "coordinator", assignedOnly: false, from: ["assigned"], to: "scheduled", reasonRequired: false },
  { action: "reschedule", role: "coordinator", assignedOnly: false, from: ["scheduled", "assigned"], to: "same", reasonRequired: true },
  { action: "start", role: "technician", assignedOnly: true, from: ["assigned"], to: "in_progress", reasonRequired: false },
  { action: "complete", role: "technician", assignedOnly: true, from: ["in_progress"], to: "completed", reasonRequired: false },
  { action: "cancel", role: "coordinator", assignedOnly: false, from: ["scheduled", "assigned", "in_progress"], to: "cancelled", reasonRequired: true },
  { action: "reactivate", role: "coordinator", assignedOnly: false, from: ["cancelled"], to: "scheduled", reasonRequired: true },
];

export type TransitionOutcome =
  | { ok: true; next: JobStatus }
  | { ok: false; code: Extract<ApiErrorCode, "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION_FAILED">; message: string };

/** Can this caller see the job at all? Technicians only see jobs assigned to them. */
export function canViewJob(session: Pick<Session, "role" | "userId">, job: Pick<MaintenanceJob, "technicianId">): boolean {
  return session.role === "coordinator" || job.technicianId === session.userId;
}

/**
 * Decide whether `session` may apply `action` to `job`.
 * Order matters: invisible jobs are NOT_FOUND (no probing), wrong role is FORBIDDEN,
 * wrong current status is CONFLICT, missing reason is VALIDATION_FAILED.
 */
export function evaluateTransition(
  session: Pick<Session, "role" | "userId">,
  job: Pick<MaintenanceJob, "status" | "technicianId" | "completedAt">,
  action: JobAction,
  reason?: string,
): TransitionOutcome {
  if (!canViewJob(session, job)) return { ok: false, code: "NOT_FOUND", message: "Job not found." };
  const rule = JOB_TRANSITIONS.find((candidate) => candidate.action === action);
  if (!rule || rule.role !== session.role) {
    return { ok: false, code: "FORBIDDEN", message: `A ${session.role} cannot ${action} a job.` };
  }
  if (rule.assignedOnly && job.technicianId !== session.userId) return { ok: false, code: "NOT_FOUND", message: "Job not found." };
  if (!rule.from.includes(job.status)) {
    return { ok: false, code: "CONFLICT", message: `Cannot ${action} a job that is ${job.status.replace("_", " ")}.` };
  }
  if (action === "reactivate" && (job.technicianId !== null || job.completedAt !== null)) {
    return { ok: false, code: "CONFLICT", message: "Only an unassigned job that was never completed can be reactivated." };
  }
  if (rule.reasonRequired && !reason?.trim()) {
    return { ok: false, code: "VALIDATION_FAILED", message: `A reason is required to ${action} a job.` };
  }
  return { ok: true, next: rule.to === "same" ? job.status : rule.to };
}
