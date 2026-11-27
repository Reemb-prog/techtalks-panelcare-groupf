import { describe, expect, it } from "vitest";
import { generationSummary, impactNeedsAttention, impactSentences, planImpact, previewOccurrences } from "../planner-view";

const TODAY = "2026-11-20"; // 90-day window ends (exclusive) on 2027-02-18

describe("previewOccurrences", () => {
  it("lists dates from the original anchor with month-end clamp and marks the 90-day window", () => {
    expect(previewOccurrences({ anchorDate: "2026-01-31", intervalMonths: 1 }, TODAY)).toEqual([
      { date: "2026-11-30", inWindow: true },
      { date: "2026-12-31", inWindow: true },
      { date: "2027-01-31", inWindow: true },
      { date: "2027-02-28", inWindow: false },
      { date: "2027-03-31", inWindow: false },
      { date: "2027-04-30", inWindow: false },
    ]);
  });

  it("includes today and starts at a future anchor", () => {
    expect(previewOccurrences({ anchorDate: TODAY, intervalMonths: 1 }, TODAY, 1)).toEqual([{ date: TODAY, inWindow: true }]);
    expect(previewOccurrences({ anchorDate: "2027-03-15", intervalMonths: 3 }, TODAY, 2)).toEqual([
      { date: "2027-03-15", inWindow: false },
      { date: "2027-06-15", inWindow: false },
    ]);
  });

  it.each([
    ["missing date", { anchorDate: "", intervalMonths: 1 }],
    ["impossible date", { anchorDate: "2026-02-30", intervalMonths: 1 }],
    ["zero interval", { anchorDate: TODAY, intervalMonths: 0 }],
    ["fractional interval", { anchorDate: TODAY, intervalMonths: 1.5 }],
    ["too long interval", { anchorDate: TODAY, intervalMonths: 61 }],
  ])("returns null for an incomplete rule (%s)", (_name, rule) => {
    expect(previewOccurrences(rule, TODAY)).toBeNull();
  });
});

describe("planImpact", () => {
  // Same shape as fixture plan 1 (monthly from Jan 31).
  const jobs = [
    { id: "done", scheduledDate: "2026-10-31", status: "completed" as const, technicianId: "t1" },
    { id: "assigned", scheduledDate: "2026-11-30", status: "assigned" as const, technicianId: "t1" },
    { id: "open", scheduledDate: "2026-12-31", status: "scheduled" as const, technicianId: null },
  ];

  it("unchanged rule only adds the missing date", () => {
    expect(planImpact({ anchorDate: "2026-01-31", intervalMonths: 1, status: "active" }, jobs, TODAY)).toEqual({
      paused: false,
      added: ["2027-01-31"],
      cancelled: [],
      conflicts: [],
    });
  });

  it("a moved anchor cancels unassigned visits and flags assigned ones, never touching history", () => {
    const impact = planImpact({ anchorDate: "2026-01-15", intervalMonths: 1, status: "active" }, jobs, TODAY)!;
    expect(impact.added).toEqual(["2026-12-15", "2027-01-15", "2027-02-15"]);
    expect(impact.cancelled.map((job) => job.id)).toEqual(["open"]);
    expect(impact.conflicts.map((job) => job.id)).toEqual(["assigned"]);
    expect(impactNeedsAttention(impact)).toBe(true);
    expect(impactSentences(impact)).toEqual([
      "3 new visits will be added in the next 90 days.",
      "1 unassigned visit no longer matches and will be cancelled.",
      "1 assigned visit no longer matches. It is kept and needs your decision in dispatch.",
    ]);
  });

  it("pausing changes nothing that exists", () => {
    const impact = planImpact({ anchorDate: "2026-01-15", intervalMonths: 1, status: "paused" }, jobs, TODAY)!;
    expect(impact).toEqual({ paused: true, added: [], cancelled: [], conflicts: [] });
    expect(impactNeedsAttention(impact)).toBe(false);
    expect(impactSentences(impact)[0]).toBe("No new visits will be generated while the plan is paused.");
  });

  it("says so when nothing changes, and returns null for an incomplete rule", () => {
    const complete = [...jobs, { id: "jan", scheduledDate: "2027-01-31", status: "scheduled" as const, technicianId: null }];
    expect(impactSentences(planImpact({ anchorDate: "2026-01-31", intervalMonths: 1, status: "active" }, complete, TODAY)!)).toEqual([
      "No visits in the next 90 days change.",
    ]);
    expect(planImpact({ anchorDate: "2026-01-31", intervalMonths: 0, status: "active" }, jobs, TODAY)).toBeNull();
  });
});

describe("generationSummary", () => {
  it("reports counts and only mentions problems that happened", () => {
    expect(generationSummary({ inserted: 2, skipped: 6, cancelled: 0, conflicts: [], failed: 0 })).toBe("2 visits added, 6 already existed.");
    expect(
      generationSummary({ inserted: 1, skipped: 0, cancelled: 1, conflicts: [{ jobId: "j", planId: "p", scheduledDate: TODAY, reason: "assigned_job_no_longer_valid" }], failed: 0 }),
    ).toBe("1 visit added, 0 already existed, 1 cancelled, 1 conflict to resolve.");
  });
});
