/**
 * Recurrence policy (D05, approved 2026-11-20). Pure functions shared by the S1 planner preview and
 * the mock generator. PC-S2-05 moves this file to src/lib/scheduler/ so the real scheduler and the
 * preview keep using one implementation (do not copy it).
 *
 * Rules:
 * - Occurrence k = anchorDate + k * intervalMonths, computed from the ORIGINAL anchor each time.
 * - The day is clamped to the target month's last day: Jan 31 monthly gives Feb 28 (29 in leap years), then Mar 31.
 * - Window is half-open [today, today + 90 days), with "today" taken in the plan's business timezone.
 * - Paused plans produce no occurrences.
 */
import type { IsoDate, MaintenancePlan } from "../../../types";
import { GENERATION_WINDOW_DAYS, MAX_INTERVAL_MONTHS, MIN_INTERVAL_MONTHS } from "../../../types";
import { addDays, addMonthsClamped, isValidIsoDate, monthsBetween } from "../../validations/dates";

export type RecurrenceInput = Pick<MaintenancePlan, "anchorDate" | "intervalMonths" | "status">;

export interface DateWindow {
  start: IsoDate;
  /** Exclusive. */
  end: IsoDate;
}

export function generationWindow(today: IsoDate, days: number = GENERATION_WINDOW_DAYS): DateWindow {
  return { start: today, end: addDays(today, days) };
}

/** The k-th occurrence (k >= 0) of a plan. */
export function nthOccurrence(anchorDate: IsoDate, intervalMonths: number, k: number): IsoDate {
  return addMonthsClamped(anchorDate, k * intervalMonths);
}

function assertValidPlan(plan: RecurrenceInput): void {
  if (!isValidIsoDate(plan.anchorDate)) throw new RangeError(`Invalid anchorDate: ${plan.anchorDate}`);
  if (!Number.isInteger(plan.intervalMonths) || plan.intervalMonths < MIN_INTERVAL_MONTHS || plan.intervalMonths > MAX_INTERVAL_MONTHS) {
    throw new RangeError(`intervalMonths must be an integer from ${MIN_INTERVAL_MONTHS} to ${MAX_INTERVAL_MONTHS}`);
  }
}

/** All occurrences inside [today, today + days), ascending. Empty when the plan is paused. */
export function occurrencesInWindow(plan: RecurrenceInput, today: IsoDate, days: number = GENERATION_WINDOW_DAYS): IsoDate[] {
  assertValidPlan(plan);
  if (!isValidIsoDate(today)) throw new RangeError(`Invalid today: ${today}`);
  if (plan.status === "paused") return [];
  const { start, end } = generationWindow(today, days);
  // Jump close to the window instead of walking from the anchor; one step back covers clamping.
  const elapsed = monthsBetween(plan.anchorDate, start);
  let k = Math.max(0, Math.floor(elapsed / plan.intervalMonths) - 1);
  const result: IsoDate[] = [];
  for (;;) {
    const date = nthOccurrence(plan.anchorDate, plan.intervalMonths, k);
    if (date >= end) break;
    if (date >= start) result.push(date);
    k += 1;
  }
  return result;
}

/** Next occurrence on or after today inside the window, or null. */
export function nextOccurrence(plan: RecurrenceInput, today: IsoDate, days: number = GENERATION_WINDOW_DAYS): IsoDate | null {
  return occurrencesInWindow(plan, today, days)[0] ?? null;
}

/** Plain-English rule for the planner UI, e.g. "Every 3 months from 15 Mar 2026". */
export function describeRecurrence(plan: Pick<MaintenancePlan, "anchorDate" | "intervalMonths">): string {
  const [year, month, day] = plan.anchorDate.split("-").map(Number);
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  const every = plan.intervalMonths === 1 ? "Every month" : `Every ${plan.intervalMonths} months`;
  const clampNote = day > 28 ? " (shorter months use their last day)" : "";
  return `${every} from ${day} ${monthName} ${year}${clampNote}`;
}
