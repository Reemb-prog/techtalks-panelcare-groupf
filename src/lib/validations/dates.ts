/**
 * Pure calendar-date helpers on "YYYY-MM-DD" strings. No Date-with-time arithmetic, so DST and the
 * runtime's local timezone can never shift a service date. "YYYY-MM-DD" strings sort chronologically.
 */
import type { IsoDate } from "../../types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateParts {
  year: number;
  /** 1 to 12 */
  month: number;
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses a real calendar date; returns null for malformed or impossible dates (e.g. 2026-02-30). */
export function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2999 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidIsoDate(value: unknown): value is IsoDate {
  return typeof value === "string" && parseIsoDate(value) !== null;
}

function requireParts(value: IsoDate): DateParts {
  const parts = parseIsoDate(value);
  if (!parts) throw new RangeError(`Invalid ISO date: ${value}`);
  return parts;
}

export function formatIsoDate({ year, month, day }: DateParts): IsoDate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const { year, month, day } = requireParts(value);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return formatIsoDate({ year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() });
}

/**
 * Adds whole months and clamps the day to the target month's last day.
 * addMonthsClamped("2026-01-31", 1) === "2026-02-28".
 */
export function addMonthsClamped(value: IsoDate, months: number): IsoDate {
  if (!Number.isInteger(months)) throw new RangeError(`months must be an integer: ${months}`);
  const { year, month, day } = requireParts(value);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  return formatIsoDate({ year: targetYear, month: targetMonth, day: Math.min(day, daysInMonth(targetYear, targetMonth)) });
}

/** Whole calendar months from a to b, ignoring days (2026-01-31 to 2026-03-01 is 2). */
export function monthsBetween(a: IsoDate, b: IsoDate): number {
  const from = requireParts(a);
  const to = requireParts(b);
  return to.year * 12 + to.month - (from.year * 12 + from.month);
}

/** The calendar date in the business timezone at instant `now` (e.g. 22:30Z on Nov 20 is Nov 21 in Beirut). */
export function businessToday(now: Date, timeZone: string): IsoDate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return formatIsoDate({ year: get("year"), month: get("month"), day: get("day") });
}
