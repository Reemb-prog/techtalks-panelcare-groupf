import { describe, expect, it } from "vitest";
import type { JobListItem, JobStatus } from "../../../types";
import { allowedActions, annotateJobs, countByStatus, describeActionError, filtersToSearch, parseFilters, toJobQuery } from "../dispatch-view";

const TECH = "00000001-0000-4000-8000-000000000002";
const OTHER = "00000001-0000-4000-8000-000000000003";
const JOB = "00000007-0000-4000-8000-000000000003";
const parse = (search: string) => parseFilters(new URLSearchParams(search));

describe("URL filters", () => {
  it("defaults to open visits for everyone, any date", () => {
    expect(parse("")).toEqual({
      filters: { status: ["scheduled", "assigned", "in_progress"], technician: null, from: null, to: null, page: 1 },
      jobId: null,
      problems: [],
    });
  });

  it("reads every filter and round-trips to the same URL", () => {
    const search = `?status=scheduled,cancelled&technician=${TECH}&from=2026-12-01&to=2026-12-31&page=2&job=${JOB}`;
    const parsed = parse(search);
    expect(parsed.filters).toEqual({ status: ["scheduled", "cancelled"], technician: TECH, from: "2026-12-01", to: "2026-12-31", page: 2 });
    expect(parsed.jobId).toBe(JOB);
    expect(filtersToSearch(parsed.filters, parsed.jobId)).toBe(search.replace(",", "%2C"));
    expect(filtersToSearch(parse("status=all").filters)).toBe("?status=all");
    expect(parse("technician=unassigned").filters.technician).toBe("unassigned");
  });

  it.each([
    ["status=bogus", "status"],
    ["technician=not-an-id", "technician"],
    ["from=2026-02-30", '"from"'],
    ["from=2026-12-31&to=2026-12-01", '"to"'],
  ])("drops a bad value with a note (%s)", (search, mentioned) => {
    const { filters, problems } = parse(search);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(mentioned);
    expect(filters.status).toEqual(["scheduled", "assigned", "in_progress"]);
    expect(filters.technician).toBeNull();
    expect(filters.to).toBeNull();
  });

  it("ignores junk page and job values and maps to the adapter query", () => {
    const { filters, jobId } = parse("page=-3&job=../../etc");
    expect(filters.page).toBe(1);
    expect(jobId).toBeNull();
    expect(toJobQuery({ ...filters, technician: "unassigned" })).toMatchObject({ technicianId: "unassigned", page: 1, pageSize: 25, from: undefined });
  });
});

describe("conflict flags", () => {
  const job = (id: string, status: JobStatus, scheduledDate: string, technicianId: string | null) =>
    ({ id, status, scheduledDate, technicianId }) as JobListItem;
  const jobs = [
    job("a", "assigned", "2026-12-01", TECH),
    job("b", "in_progress", "2026-12-01", TECH),
    job("c", "assigned", "2026-12-01", OTHER),
    job("d", "completed", "2026-12-01", OTHER),
    job("e", "scheduled", "2026-11-01", null),
    job("f", "cancelled", "2026-11-01", null),
  ];

  it("flags double-booked technicians and overdue open visits only", () => {
    const rows = annotateJobs(jobs, jobs, "2026-11-20");
    const flags = Object.fromEntries(rows.map((row) => [row.id, [row.overdue, row.doubleBooked]]));
    expect(flags).toEqual({
      a: [false, true],
      b: [false, true],
      c: [false, false], // completed visit on the same day does not count
      d: [false, false],
      e: [true, false],
      f: [false, false], // cancelled is never overdue
    });
  });

  it("counts statuses", () => {
    expect(countByStatus(jobs)).toEqual({ scheduled: 1, assigned: 2, in_progress: 1, completed: 1, cancelled: 1 });
  });
});

describe("allowed coordinator actions follow the status machine", () => {
  it.each([
    ["scheduled", null, ["assign", "reschedule", "cancel"]],
    ["assigned", TECH, ["assign", "unassign", "reschedule", "cancel"]],
    ["in_progress", TECH, ["cancel"]],
    ["completed", TECH, []],
    ["cancelled", null, ["reactivate"]],
    ["cancelled", TECH, []],
  ] as const)("%s (technician %s)", (status, technicianId, expected) => {
    expect(allowedActions({ status, technicianId, completedAt: null })).toEqual(expected);
  });
});

describe("action errors", () => {
  it("offers a reload only for conflicts and says nothing was saved", () => {
    expect(describeActionError({ code: "CONFLICT", message: "This job was changed by someone else." })).toEqual({
      message: "This job was changed by someone else. Nothing was changed.",
      offerReload: true,
    });
    expect(describeActionError({ code: "VALIDATION_FAILED", message: "Some fields need attention." }).offerReload).toBe(false);
    expect(describeActionError({ code: "NOT_FOUND", message: "Job not found." }).message).toContain("no longer exists");
  });
});
