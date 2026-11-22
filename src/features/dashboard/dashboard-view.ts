/** Pure view logic for the coordinator dashboard (PC-S1-05). No React, so it is unit-tested directly. */
import type { ApiResult, ComponentType, DashboardStats, ExpiringWarranty, IsoDate, JobListItem, JobStatus, Paginated } from "@/types";

export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export interface SummaryCard {
  key: "upcoming" | "overdue" | "unassigned" | "inProgress" | "completed";
  label: string;
  value: number;
  hint: string;
  tone: Tone;
}

export interface JobRow extends JobListItem {
  overdue: boolean;
}

export interface DashboardData {
  businessDate: IsoDate;
  cards: SummaryCard[];
  jobs: JobRow[];
  totalJobs: number;
  warranties: ExpiringWarranty[];
  /** No jobs and no expiring warranties at all: show the first-run panel. */
  isEmpty: boolean;
}

export type DashboardState =
  | { kind: "loading" }
  | { kind: "ready"; data: DashboardData }
  | { kind: "error"; message: string }
  | { kind: "denied"; message: string }
  | { kind: "signed-out" };

/** Statuses shown in "Upcoming and overdue visits". */
export const OPEN_JOB_STATUSES: JobStatus[] = ["scheduled", "assigned", "in_progress"];
/** Rows rendered on the dashboard; the rest are one click away in dispatch. */
export const MAX_JOB_ROWS = 8;

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  scheduled: "Unassigned",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Blueprint: neutral = unassigned/paused, info = assigned/in progress, success = completed. */
export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  scheduled: "neutral",
  assigned: "info",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
};

export const COMPONENT_TYPE_LABEL: Record<ComponentType, string> = {
  inverter: "Inverter",
  battery: "Battery",
  panel: "Panel",
  other: "Component",
};

export function buildCards(stats: DashboardStats): SummaryCard[] {
  return [
    { key: "upcoming", label: "Upcoming visits", value: stats.upcomingNext7Days, hint: "Next 7 days", tone: "info" },
    { key: "overdue", label: "Overdue", value: stats.overdue, hint: "Past their date, not completed", tone: stats.overdue > 0 ? "danger" : "neutral" },
    { key: "unassigned", label: "Unassigned", value: stats.unassigned, hint: "Need a technician (90 days)", tone: stats.unassigned > 0 ? "warning" : "neutral" },
    { key: "inProgress", label: "In progress", value: stats.inProgress, hint: "Technician on site", tone: "info" },
    { key: "completed", label: "Completed", value: stats.completedLast30Days, hint: "Last 30 days", tone: "success" },
  ];
}

/** Overdue first (oldest first), then upcoming by date. A job dated before the business date and still open is overdue. */
export function toJobRows(jobs: JobListItem[], businessDate: IsoDate): JobRow[] {
  return jobs
    .filter((job) => OPEN_JOB_STATUSES.includes(job.status))
    .map((job) => ({ ...job, overdue: job.scheduledDate < businessDate }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.scheduledDate.localeCompare(b.scheduledDate));
}

/** Maps the two dashboard calls to one screen state. Any failure wins over partial data; stats errors are reported first. */
export function toDashboardState(stats: ApiResult<DashboardStats>, jobs: ApiResult<Paginated<JobListItem>>): DashboardState {
  const failed = !stats.ok ? stats : !jobs.ok ? jobs : null;
  if (failed && !failed.ok) {
    if (failed.error.code === "UNAUTHENTICATED") return { kind: "signed-out" };
    if (failed.error.code === "FORBIDDEN") return { kind: "denied", message: failed.error.message };
    return { kind: "error", message: failed.error.message };
  }
  if (!stats.ok || !jobs.ok) return { kind: "error", message: "Something went wrong. Please try again." };

  const rows = toJobRows(jobs.data.items, stats.data.businessDate);
  return {
    kind: "ready",
    data: {
      businessDate: stats.data.businessDate,
      cards: buildCards(stats.data),
      jobs: rows.slice(0, MAX_JOB_ROWS),
      totalJobs: rows.length,
      warranties: stats.data.expiringWarranties,
      isEmpty: rows.length === 0 && stats.data.expiringWarranties.length === 0 && stats.data.completedLast30Days === 0,
    },
  };
}

const asUtc = (date: IsoDate) => new Date(`${date}T00:00:00Z`);

/** "Sunday 22 November 2026" for the page header. Date-only values are formatted in UTC so they never shift a day. */
export function formatLongDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(asUtc(date));
}

/** "Mon 23 Nov" for table cells. */
export function formatShortDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(asUtc(date));
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((asUtc(to).getTime() - asUtc(from).getTime()) / 86_400_000);
}

/** "Today", "Tomorrow", "In 12 days", "Yesterday", "3 days ago". */
export function relativeDay(date: IsoDate, today: IsoDate): string {
  const days = daysBetween(today, date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}
