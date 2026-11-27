import { describe, expect, it } from "vitest";
import type { ApiResult, DashboardStats, JobListItem, JobStatus, Paginated } from "@/types";
import { MAX_JOB_ROWS, buildCards, formatLongDate, formatShortDate, relativeDay, toDashboardState, toJobRows } from "../dashboard-view";

const TODAY = "2026-11-22";

function job(id: string, scheduledDate: string, status: JobStatus = "assigned"): JobListItem {
  return {
    id,
    planId: "plan",
    systemId: "system",
    scheduledDate,
    technicianId: status === "scheduled" ? null : "tech",
    status,
    version: 1,
    lastChangeReason: null,
    completedAt: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    systemLabel: "Roof array",
    siteLabel: "Main house",
    city: "Byblos",
    customerName: "Sample customer",
    technicianName: status === "scheduled" ? null : "Omar Saleh",
    reportId: null,
  };
}

const stats = (overrides: Partial<DashboardStats> = {}): ApiResult<DashboardStats> => ({
  ok: true,
  status: 200,
  data: {
    businessDate: TODAY,
    upcomingNext7Days: 3,
    overdue: 1,
    unassigned: 2,
    inProgress: 0,
    completedLast30Days: 4,
    expiringWarranties: [],
    ...overrides,
  },
});

const jobs = (items: JobListItem[]): ApiResult<Paginated<JobListItem>> => ({
  ok: true,
  status: 200,
  data: { items, page: 1, pageSize: 100, total: items.length },
});

const fail = (code: "UNAUTHENTICATED" | "FORBIDDEN" | "INTERNAL", status: number) =>
  ({ ok: false, status, error: { code, message: `${code} message` } }) as const;

describe("toDashboardState", () => {
  it("builds the ready view from both calls", () => {
    const state = toDashboardState(stats(), jobs([job("a", "2026-11-23"), job("b", "2026-11-20")]));
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") return;
    expect(state.data.cards.map((card) => card.value)).toEqual([3, 1, 2, 0, 4]);
    expect(state.data.jobs.map((row) => [row.id, row.overdue])).toEqual([
      ["b", true],
      ["a", false],
    ]);
    expect(state.data.isEmpty).toBe(false);
  });

  it("zero records is an empty view, not an error", () => {
    const state = toDashboardState(stats({ upcomingNext7Days: 0, overdue: 0, unassigned: 0, completedLast30Days: 0 }), jobs([]));
    expect(state.kind === "ready" && state.data.isEmpty).toBe(true);
  });

  it("maps failures to signed-out, denied and error, stats first", () => {
    expect(toDashboardState(fail("UNAUTHENTICATED", 401), jobs([])).kind).toBe("signed-out");
    expect(toDashboardState(stats(), fail("FORBIDDEN", 403))).toEqual({ kind: "denied", message: "FORBIDDEN message" });
    expect(toDashboardState(fail("INTERNAL", 500), fail("FORBIDDEN", 403))).toEqual({ kind: "error", message: "INTERNAL message" });
  });

  it("caps the rendered rows but reports the full total", () => {
    const many = Array.from({ length: MAX_JOB_ROWS + 3 }, (_, index) => job(`j${index}`, "2026-11-24"));
    const state = toDashboardState(stats(), jobs(many));
    expect(state.kind === "ready" && [state.data.jobs.length, state.data.totalJobs]).toEqual([MAX_JOB_ROWS, MAX_JOB_ROWS + 3]);
  });
});

describe("toJobRows", () => {
  it("drops closed jobs and orders overdue (oldest first) before upcoming", () => {
    const rows = toJobRows(
      [job("late", "2026-11-21", "in_progress"), job("soon", "2026-11-22", "scheduled"), job("old", "2026-11-10"), job("done", "2026-11-20", "completed")],
      TODAY,
    );
    expect(rows.map((row) => row.id)).toEqual(["old", "late", "soon"]);
    expect(rows.find((row) => row.id === "soon")?.overdue).toBe(false);
  });
});

describe("buildCards tones", () => {
  it("flags overdue and unassigned work only when there is some", () => {
    const tones = (s: ApiResult<DashboardStats>) => (s.ok ? Object.fromEntries(buildCards(s.data).map((c) => [c.key, c.tone])) : {});
    expect(tones(stats())).toMatchObject({ overdue: "danger", unassigned: "warning" });
    expect(tones(stats({ overdue: 0, unassigned: 0 }))).toMatchObject({ overdue: "neutral", unassigned: "neutral" });
  });
});

describe("date formatting", () => {
  it("formats date-only values without shifting the day", () => {
    // ICU 76+ inserts a comma after the weekday; older ICU does not. Both show the same day.
    expect(formatLongDate("2026-11-22")).toMatch(/^Sunday,? 22 November 2026$/);
    expect(formatShortDate("2026-12-01")).toMatch(/^Tue,? 1 Dec$/);
  });

  it("describes days relative to the business date", () => {
    expect(relativeDay(TODAY, TODAY)).toBe("Today");
    expect(relativeDay("2026-11-23", TODAY)).toBe("Tomorrow");
    expect(relativeDay("2026-11-21", TODAY)).toBe("Yesterday");
    expect(relativeDay("2027-01-01", TODAY)).toBe("In 40 days");
    expect(relativeDay("2026-11-12", TODAY)).toBe("10 days ago");
  });
});
