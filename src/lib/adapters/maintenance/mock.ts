/**
 * MOCK maintenance adapter. Scheduling is SIMULATED in memory until the S2 scheduler (PC-S2-05) is linked;
 * screens must say so (PC-S1-07). Generation uses the same pure recurrence rules as the real scheduler.
 */
import type { GenerationRunResult, JobConflict, MaintenanceAdapter, MaintenancePlan, PlanListItem } from "../../../types";
import { createPlanSchema, generateJobsSchema, parseRequest, planListQuerySchema, updatePlanSchema } from "../../validations";
import { systemContext } from "../mock/lookups";
import { COORDINATOR_ONLY, failure, fromError, nowIso, paginate, simulate, success, today, type MockContext } from "../mock/runtime";
import { generationWindow, nextOccurrence, occurrencesInWindow } from "./recurrence";

export function createMockMaintenanceAdapter(ctx: MockContext): MaintenanceAdapter {
  const toListItem = (plan: MaintenancePlan): PlanListItem => {
    const { system, site, customer } = systemContext(ctx.store, plan.systemId);
    return {
      ...plan,
      systemLabel: system?.label ?? "Unknown system",
      siteLabel: site?.label ?? "Unknown site",
      customerName: customer?.displayName ?? "Unknown customer",
      nextOccurrence: nextOccurrence(plan, today(ctx)),
    };
  };

  return {
    source: "mock",

    listPlans: (query = {}) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(planListQuerySchema, query);
        if (!parsed.ok) return fromError(parsed.error);
        const { systemId, status, q, sortDirection = "asc", page, pageSize } = parsed.data;
        const items = ctx.store.plans
          .filter((plan) => (!systemId || plan.systemId === systemId) && (!status || plan.status === status))
          .map(toListItem)
          .filter((item) => !q || `${item.systemLabel} ${item.siteLabel} ${item.customerName}`.toLowerCase().includes(q.toLowerCase()))
          .sort((a, b) => (sortDirection === "asc" ? 1 : -1) * a.customerName.localeCompare(b.customerName));
        return success(paginate(items, page, pageSize));
      }),

    getPlan: (id) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const plan = ctx.store.plans.find((item) => item.id === id);
        return plan ? success(plan) : failure("NOT_FOUND", "Maintenance plan not found.");
      }),

    createPlan: (request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(createPlanSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        if (!ctx.store.systems.some((system) => system.id === parsed.data.systemId)) {
          return failure("VALIDATION_FAILED", "Some fields need attention.", { systemId: ["System not found."] });
        }
        const at = nowIso(ctx);
        const plan: MaintenancePlan = { ...parsed.data, id: ctx.newId(), status: "active", revision: 1, version: 1, createdAt: at, updatedAt: at };
        ctx.store.plans.push(plan);
        return success(plan, 201);
      }),

    updatePlan: (id, request) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(updatePlanSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const plan = ctx.store.plans.find((item) => item.id === id);
        if (!plan) return failure("NOT_FOUND", "Maintenance plan not found.");
        if (plan.version !== parsed.data.expectedVersion) {
          return failure("CONFLICT", "This plan was changed by someone else. Reload and try again.");
        }
        const { intervalMonths, anchorDate, status } = parsed.data;
        const scheduleChanged =
          (intervalMonths !== undefined && intervalMonths !== plan.intervalMonths) || (anchorDate !== undefined && anchorDate !== plan.anchorDate);
        if (intervalMonths !== undefined) plan.intervalMonths = intervalMonths;
        if (anchorDate !== undefined) plan.anchorDate = anchorDate;
        if (status !== undefined) plan.status = status;
        if (scheduleChanged) plan.revision += 1;
        plan.version += 1;
        plan.updatedAt = nowIso(ctx);
        return success(plan);
      }),

    generateJobs: (request = {}) =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const parsed = parseRequest(generateJobsSchema, request);
        if (!parsed.ok) return fromError(parsed.error);
        const businessDate = today(ctx);
        const window = generationWindow(businessDate);
        let plans = ctx.store.plans;
        if (parsed.data.planId) {
          plans = plans.filter((plan) => plan.id === parsed.data.planId);
          if (!plans.length) return failure("NOT_FOUND", "Maintenance plan not found.");
        }
        const at = nowIso(ctx);
        const result: GenerationRunResult = {
          runId: ctx.newId(),
          businessDate,
          windowEnd: window.end,
          inserted: 0,
          skipped: 0,
          cancelled: 0,
          conflicts: [],
          failed: 0,
          ranAt: at,
        };

        for (const plan of plans.filter((item) => item.status === "active")) {
          const valid = new Set(occurrencesInWindow(plan, businessDate));
          const planJobs = ctx.store.jobs.filter((job) => job.planId === plan.id);

          // UNIQUE(plan, date) regardless of status: an existing row is never duplicated.
          for (const date of valid) {
            if (planJobs.some((job) => job.scheduledDate === date)) {
              result.skipped += 1;
              continue;
            }
            ctx.store.jobs.push({
              id: ctx.newId(),
              planId: plan.id,
              systemId: plan.systemId,
              scheduledDate: date,
              technicianId: null,
              status: "scheduled",
              version: 1,
              lastChangeReason: null,
              completedAt: null,
              createdAt: at,
              updatedAt: at,
            });
            result.inserted += 1;
          }

          // Jobs in the window that the (edited) plan no longer produces.
          for (const job of planJobs) {
            if (job.scheduledDate < window.start || job.scheduledDate >= window.end || valid.has(job.scheduledDate)) continue;
            if (job.status === "scheduled" && job.technicianId === null) {
              job.status = "cancelled";
              job.lastChangeReason = `Plan schedule changed (revision ${plan.revision})`;
              job.version += 1;
              job.updatedAt = at;
              result.cancelled += 1;
            } else if (job.status === "assigned" || job.status === "in_progress") {
              const conflict: JobConflict = {
                jobId: job.id,
                planId: plan.id,
                scheduledDate: job.scheduledDate,
                reason: job.status === "assigned" ? "assigned_job_no_longer_valid" : "in_progress_job_no_longer_valid",
              };
              result.conflicts.push(conflict);
            }
          }
        }
        return success(result);
      }),
  };
}
