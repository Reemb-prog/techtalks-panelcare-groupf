import type { IsoDate, Uuid } from "./common";
import type { ComponentType } from "./registry";

export interface ExpiringWarranty {
  componentId: Uuid;
  systemId: Uuid;
  systemLabel: string;
  customerName: string;
  type: ComponentType;
  serialNumber: string;
  warrantyExpiresOn: IsoDate;
}

/** GET /api/dashboard/stats (coordinator). All counts derive from job/component records, never placeholders. */
export interface DashboardStats {
  businessDate: IsoDate;
  /** Scheduled/assigned jobs dated today..today+6. */
  upcomingNext7Days: number;
  /** Not completed/cancelled and dated before today. */
  overdue: number;
  /** Status "scheduled" (no technician) inside the 90-day window. */
  unassigned: number;
  inProgress: number;
  completedLast30Days: number;
  /** Active components whose warranty ends within 90 days, soonest first. */
  expiringWarranties: ExpiringWarranty[];
}
