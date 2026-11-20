/** MOCK dispatch adapter: job lists, assignment and status actions. In-memory only. */
import type { DispatchAdapter, TechnicianSummary } from "../../../types";
import { jobListQuerySchema, jobPatchSchema, parseRequest } from "../../validations";
import { canViewJob, evaluateTransition } from "../../validations/job-status";
import { toJobListItem } from "../mock/lookups";
import { COORDINATOR_ONLY, failure, fromError, matchesText, nowIso, paginate, simulate, success, today, type MockContext } from "../mock/runtime";

export function createMockDispatchAdapter(ctx: MockContext): DispatchAdapter {
  return {
    source: "mock",

    // Technicians always get only their own jobs, whatever filters they send.
    listJobs: (query = {}) =>
      simulate(ctx, {}, (session) => {
        const parsed = parseRequest(jobListQuerySchema, query);
        if (!parsed.ok) return fromError(parsed.error);
        const { status, from, to, technicianId, planId, q, sortDirection = "asc", page, pageSize } = parsed.data;
        const items = ctx.store.jobs
          .filter((job) => canViewJob(session, job))
          .filter((job) => !status?.length || status.includes(job.status))
          .filter((job) => (!from || job.scheduledDate >= from) && (!to || job.scheduledDate <= to))
          .filter((job) => !planId || job.planId === planId)
          .filter((job) => !technicianId || (technicianId === "unassigned" ? job.technicianId === null : job.technicianId === technicianId))
          .map((job) => toJobListItem(ctx.store, job))
          .filter((item) => matchesText(q, item.customerName, item.siteLabel, item.systemLabel, item.city))
          .sort((a, b) => (sortDirection === "asc" ? 1 : -1) * a.scheduledDate.localeCompare(b.scheduledDate));
        return success(paginate(items, page, pageSize));
      }),

    getJob: (id) =>
      simulate(ctx, {}, (session) => {
        const job = ctx.store.jobs.find((item) => item.id === id);
        if (!job || !canViewJob(session, job)) return failure("NOT_FOUND", "Job not found.");
        return success(toJobListItem(ctx.store, job));
      }),

    updateJob: (id, request) =>
      simulate(ctx, {}, (session) => {
        const parsed = parseRequest(jobPatchSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const patch = parsed.data;
        const job = ctx.store.jobs.find((item) => item.id === id);
        if (!job || !canViewJob(session, job)) return failure("NOT_FOUND", "Job not found.");

        const reason = "reason" in patch ? patch.reason : undefined;
        const outcome = evaluateTransition(session, job, patch.action, reason);
        if (!outcome.ok) return failure(outcome.code, outcome.message);
        if (job.version !== patch.expectedVersion) {
          return failure("CONFLICT", "This job was changed by someone else. Reload and try again.");
        }

        if (patch.action === "assign") {
          const technician = ctx.store.profiles.find((profile) => profile.id === patch.technicianId);
          if (!technician || technician.role !== "technician" || !technician.active) {
            return failure("VALIDATION_FAILED", "Some fields need attention.", { technicianId: ["Choose an active technician."] });
          }
          job.technicianId = technician.id;
        }
        if (patch.action === "unassign") job.technicianId = null;
        if (patch.action === "reschedule") {
          if (patch.scheduledDate < today(ctx)) {
            return failure("VALIDATION_FAILED", "Some fields need attention.", { scheduledDate: ["Choose today or a later date."] });
          }
          const taken = ctx.store.jobs.some((other) => other.id !== job.id && other.planId === job.planId && other.scheduledDate === patch.scheduledDate);
          if (taken) return failure("CONFLICT", "This plan already has a visit on that date.", { scheduledDate: ["Date already used by this plan."] });
          job.scheduledDate = patch.scheduledDate;
        }
        // Cancelling releases the technician so the occurrence can later be reactivated (only unassigned jobs can be).
        if (patch.action === "cancel") job.technicianId = null;

        job.status = outcome.next;
        job.lastChangeReason = reason ?? job.lastChangeReason;
        job.version += 1;
        job.updatedAt = nowIso(ctx);
        return success(toJobListItem(ctx.store, job));
      }),

    listTechnicians: () =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const technicians: TechnicianSummary[] = ctx.store.profiles
          .filter((profile) => profile.role === "technician")
          .map(({ id, displayName, active }) => ({ id, displayName, active }));
        return success(technicians);
      }),
  };
}
