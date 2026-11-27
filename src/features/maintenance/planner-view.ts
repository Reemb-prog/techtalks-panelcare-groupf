/**
 * Pure view logic for the maintenance planner (PC-S1-07). No React, so it is unit-tested directly.
 * Relative imports: vitest.config.ts has no "@/" alias.
 *
 * The impact rules mirror the simulated generator in src/lib/adapters/maintenance/mock.ts, so the warning shown
 * before saving matches what "Generate visits" then does. Both use the approved recurrence policy (D05).
 */
import type { GenerationRunResult, IsoDate, MaintenanceJob, MaintenancePlan, PlanStatus } from "../../types";
import { MAX_INTERVAL_MONTHS, MIN_INTERVAL_MONTHS } from "../../types";
import { generationWindow, nthOccurrence, occurrencesInWindow } from "../../lib/adapters/maintenance/recurrence";
import { isValidIsoDate, monthsBetween } from "../../lib/validations/dates";

export type PlanRule = Pick<MaintenancePlan, "anchorDate" | "intervalMonths">;

export const INTERVAL_PRESETS: readonly { months: number; label: string }[] = [
  { months: 1, label: "Every month" },
  { months: 3, label: "Every 3 months" },
  { months: 6, label: "Every 6 months" },
  { months: 12, label: "Every year" },
];

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = { active: "Active", paused: "Paused" };

export const PREVIEW_COUNT = 6;

export interface PreviewDate {
  date: IsoDate;
  /** Inside [today, today + 90 days): a generation run creates this visit now. */
  inWindow: boolean;
}

export function isValidRule(rule: { anchorDate: string; intervalMonths: number }): rule is PlanRule {
  return (
    isValidIsoDate(rule.anchorDate) &&
    Number.isInteger(rule.intervalMonths) &&
    rule.intervalMonths >= MIN_INTERVAL_MONTHS &&
    rule.intervalMonths <= MAX_INTERVAL_MONTHS
  );
}

/**
 * The next `count` visit dates on or after today, from the ORIGINAL anchor (month-end clamp included).
 * Shown for paused plans too, so the coordinator sees what resuming would bring back. Null for an incomplete rule.
 */
export function previewOccurrences(rule: { anchorDate: string; intervalMonths: number }, today: IsoDate, count = PREVIEW_COUNT): PreviewDate[] | null {
  if (!isValidRule(rule)) return null;
  const { end } = generationWindow(today);
  let k = Math.max(0, Math.floor(monthsBetween(rule.anchorDate, today) / rule.intervalMonths) - 1);
  const result: PreviewDate[] = [];
  while (result.length < count) {
    const date = nthOccurrence(rule.anchorDate, rule.intervalMonths, k);
    if (date >= today) result.push({ date, inWindow: date < end });
    k += 1;
  }
  return result;
}

type JobLike = Pick<MaintenanceJob, "id" | "scheduledDate" | "status" | "technicianId">;

export interface PlanImpact<J extends JobLike = JobLike> {
  /** The draft pauses the plan: nothing is generated or cancelled. */
  paused: boolean;
  /** New visit dates a generation run would create. */
  added: IsoDate[];
  /** Unassigned scheduled visits that no longer match and would be cancelled with an audit reason. */
  cancelled: J[];
  /** Assigned or in-progress visits that no longer match: kept, and a coordinator must decide. */
  conflicts: J[];
}

/** What saving `draft` and then generating would do to this plan's visits in the 90-day window. */
export function planImpact<J extends JobLike>(
  draft: { anchorDate: string; intervalMonths: number; status: PlanStatus },
  planJobs: readonly J[],
  today: IsoDate,
): PlanImpact<J> | null {
  if (draft.status === "paused") return { paused: true, added: [], cancelled: [], conflicts: [] };
  if (!isValidRule(draft)) return null;
  const valid = new Set(occurrencesInWindow({ ...draft, status: "active" }, today));
  const { start, end } = generationWindow(today);
  const existing = new Set(planJobs.map((job) => job.scheduledDate));
  const inWindowStale = planJobs.filter((job) => job.scheduledDate >= start && job.scheduledDate < end && !valid.has(job.scheduledDate));
  return {
    paused: false,
    added: [...valid].filter((date) => !existing.has(date)),
    cancelled: inWindowStale.filter((job) => job.status === "scheduled" && job.technicianId === null),
    conflicts: inWindowStale.filter((job) => job.status === "assigned" || job.status === "in_progress"),
  };
}

const plural = (count: number, one: string, many = one + "s") => `${count} ${count === 1 ? one : many}`;

/** Plain sentences for the impact warning. */
export function impactSentences(impact: PlanImpact): string[] {
  if (impact.paused) {
    return ["No new visits will be generated while the plan is paused.", "Visits already scheduled stay as they are. Cancel them in dispatch if they should not happen."];
  }
  const lines: string[] = [];
  if (impact.added.length) lines.push(`${plural(impact.added.length, "new visit")} will be added in the next 90 days.`);
  if (impact.cancelled.length) lines.push(`${plural(impact.cancelled.length, "unassigned visit")} no longer ${impact.cancelled.length === 1 ? "matches" : "match"} and will be cancelled.`);
  if (impact.conflicts.length) {
    const one = impact.conflicts.length === 1;
    lines.push(`${plural(impact.conflicts.length, "assigned visit")} no longer ${one ? "matches" : "match"}. ${one ? "It is kept and needs" : "They are kept and need"} your decision in dispatch.`);
  }
  return lines.length ? lines : ["No visits in the next 90 days change."];
}

/** True when the warning needs attention (something is cancelled or needs a decision). */
export function impactNeedsAttention(impact: PlanImpact): boolean {
  return impact.cancelled.length > 0 || impact.conflicts.length > 0;
}

/** One-line result of a simulated generation run. */
export function generationSummary(result: Pick<GenerationRunResult, "inserted" | "skipped" | "cancelled" | "conflicts" | "failed">): string {
  const parts = [
    `${plural(result.inserted, "visit")} added`,
    `${result.skipped} already existed`,
  ];
  if (result.cancelled) parts.push(`${result.cancelled} cancelled`);
  if (result.conflicts.length) parts.push(`${plural(result.conflicts.length, "conflict")} to resolve`);
  if (result.failed) parts.push(`${result.failed} failed`);
  return parts.join(", ") + ".";
}
