import { describe, expect, it } from "vitest";
import { describeRecurrence, nextOccurrence, occurrencesInWindow } from "../adapters/maintenance/recurrence";
import { addDays, addMonthsClamped, businessToday, isValidIsoDate } from "../validations/dates";

const monthly = (anchorDate: string, intervalMonths = 1) => ({ anchorDate, intervalMonths, status: "active" as const });

describe("calendar helpers", () => {
  it("rejects impossible or malformed dates", () => {
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-1-01")).toBe(false);
    expect(isValidIsoDate("not a date")).toBe(false);
  });

  it("clamps month-end days instead of rolling over", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsClamped("2026-01-31", 2)).toBe("2026-03-31");
    expect(addMonthsClamped("2026-08-31", 1)).toBe("2026-09-30");
    expect(addMonthsClamped("2026-11-30", 3)).toBe("2027-02-28");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-20", 90)).toBe("2027-02-18");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("takes 'today' in the business timezone, not UTC", () => {
    // Beirut is UTC+2 in winter, UTC+3 in summer.
    expect(businessToday(new Date("2026-11-20T21:59:00Z"), "Asia/Beirut")).toBe("2026-11-20");
    expect(businessToday(new Date("2026-11-20T22:30:00Z"), "Asia/Beirut")).toBe("2026-11-21");
    expect(businessToday(new Date("2026-07-01T21:30:00Z"), "Asia/Beirut")).toBe("2026-07-02");
  });
});

describe("recurrence policy (D05 golden dates)", () => {
  it("one-month plan anchored Jan 31 follows the ORIGINAL anchor: Feb 28, Mar 31, Apr 30", () => {
    expect(occurrencesInWindow(monthly("2027-01-31"), "2027-01-31")).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30"]);
  });

  it("uses Feb 29 in leap years", () => {
    expect(occurrencesInWindow(monthly("2028-01-31"), "2028-02-01", 30)).toEqual(["2028-02-29"]);
  });

  it("yearly plan anchored on Feb 29 uses Feb 28 in common years and returns to Feb 29", () => {
    expect(occurrencesInWindow(monthly("2028-02-29", 12), "2029-01-01")).toEqual(["2029-02-28"]);
    expect(occurrencesInWindow(monthly("2028-02-29", 12), "2032-01-15")).toEqual(["2032-02-29"]);
  });

  it("handles multi-month intervals and year boundaries", () => {
    expect(occurrencesInWindow(monthly("2026-03-15", 3), "2026-11-20")).toEqual(["2026-12-15"]);
    expect(occurrencesInWindow(monthly("2026-11-30", 3), "2026-11-20", 120)).toEqual(["2026-11-30", "2027-02-28"]);
  });

  it("starts at the anchor when the anchor is in the future", () => {
    expect(occurrencesInWindow(monthly("2027-01-10"), "2026-11-20")).toEqual(["2027-01-10", "2027-02-10"]);
  });

  it("works for anchors far in the past", () => {
    expect(occurrencesInWindow(monthly("2000-01-15", 12), "2026-11-20")).toEqual(["2027-01-15"]);
  });

  it("window is half-open: today included, today + 90 excluded", () => {
    expect(occurrencesInWindow(monthly("2026-11-20", 3), "2026-11-20")).toEqual(["2026-11-20"]);
    expect(occurrencesInWindow(monthly("2026-11-18", 3), "2026-11-20")).toEqual([]); // 2027-02-18 is the excluded end
    expect(occurrencesInWindow(monthly("2026-11-17", 3), "2026-11-20")).toEqual(["2027-02-17"]);
  });

  it("paused plans produce nothing", () => {
    expect(occurrencesInWindow({ anchorDate: "2026-01-31", intervalMonths: 1, status: "paused" }, "2026-11-20")).toEqual([]);
  });

  it("rejects zero, negative, fractional and too-large intervals", () => {
    for (const intervalMonths of [0, -1, 1.5, 61]) {
      expect(() => occurrencesInWindow(monthly("2026-01-01", intervalMonths), "2026-11-20")).toThrow(RangeError);
    }
  });

  it("is deterministic: repeated calls give identical results", () => {
    const plan = monthly("2026-01-31");
    expect(occurrencesInWindow(plan, "2026-11-20")).toEqual(occurrencesInWindow(plan, "2026-11-20"));
  });

  it("finds the next occurrence and describes the rule in plain English", () => {
    expect(nextOccurrence(monthly("2026-01-31"), "2026-11-20")).toBe("2026-11-30");
    expect(describeRecurrence(monthly("2026-03-15", 3))).toBe("Every 3 months from 15 Mar 2026");
    expect(describeRecurrence(monthly("2026-01-31"))).toBe("Every month from 31 Jan 2026 (shorter months use their last day)");
  });
});
