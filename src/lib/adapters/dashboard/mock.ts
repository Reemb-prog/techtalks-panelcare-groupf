/** MOCK dashboard stats, derived from the mock store (never hard-coded numbers). Live version is deferred (PC-S3-05). */
import type { DashboardAdapter, DashboardStats, ExpiringWarranty } from "../../../types";
import { GENERATION_WINDOW_DAYS } from "../../../types";
import { addDays } from "../../validations/dates";
import { systemContext } from "../mock/lookups";
import { COORDINATOR_ONLY, simulate, success, today, type MockContext } from "../mock/runtime";

export function createMockDashboardAdapter(ctx: MockContext): DashboardAdapter {
  return {
    source: "mock",
    getStats: () =>
      simulate(ctx, { roles: COORDINATOR_ONLY }, () => {
        const businessDate = today(ctx);
        const weekEnd = addDays(businessDate, 7);
        const windowEnd = addDays(businessDate, GENERATION_WINDOW_DAYS);
        const monthAgo = addDays(businessDate, -30);
        const jobs = ctx.store.jobs;
        const open = (status: string) => status === "scheduled" || status === "assigned";

        const expiringWarranties: ExpiringWarranty[] = ctx.store.components
          .filter((c) => c.status === "active" && c.warrantyExpiresOn !== null && c.warrantyExpiresOn >= businessDate && c.warrantyExpiresOn < windowEnd)
          .map((c) => {
            const { system, customer } = systemContext(ctx.store, c.systemId);
            return {
              componentId: c.id,
              systemId: c.systemId,
              systemLabel: system?.label ?? "Unknown system",
              customerName: customer?.displayName ?? "Unknown customer",
              type: c.type,
              serialNumber: c.serialNumber,
              warrantyExpiresOn: c.warrantyExpiresOn as string,
            };
          })
          .sort((a, b) => a.warrantyExpiresOn.localeCompare(b.warrantyExpiresOn));

        const stats: DashboardStats = {
          businessDate,
          upcomingNext7Days: jobs.filter((job) => open(job.status) && job.scheduledDate >= businessDate && job.scheduledDate < weekEnd).length,
          overdue: jobs.filter((job) => (open(job.status) || job.status === "in_progress") && job.scheduledDate < businessDate).length,
          unassigned: jobs.filter((job) => job.status === "scheduled" && job.scheduledDate >= businessDate && job.scheduledDate < windowEnd).length,
          inProgress: jobs.filter((job) => job.status === "in_progress").length,
          completedLast30Days: jobs.filter((job) => job.status === "completed" && job.completedAt !== null && job.completedAt.slice(0, 10) >= monthAgo).length,
          expiringWarranties,
        };
        return success(stats);
      }),
  };
}
