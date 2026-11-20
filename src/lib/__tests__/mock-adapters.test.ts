import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ApiResult, CompleteJobRequest } from "../../types";
import { createMockAdapters, type MockOptions } from "../adapters";
import { FIXTURE_NOW, TECHNICIAN_1_ID, TECHNICIAN_2_ID, fixtureId } from "../fixtures";

function setup(options: MockOptions = {}) {
  let counter = 0;
  return createMockAdapters({
    delayMs: 0,
    now: () => new Date(FIXTURE_NOW),
    newId: () => `0000ffff-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
    ...options,
  });
}

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new Error(`Expected success, got ${result.status} ${result.error.code}: ${result.error.message}`);
  return result.data;
}

const JOB_ASSIGNED_T1 = fixtureId("job", 2);
const JOB_IN_PROGRESS_T1 = fixtureId("job", 7);
const JOB_ASSIGNED_T2 = fixtureId("job", 5);
const JOB_SCHEDULED = fixtureId("job", 3);
const REPORT_T1 = fixtureId("report", 1);

const completion = (overrides: Partial<CompleteJobRequest> = {}): CompleteJobRequest => ({
  checklistVersion: 1,
  answers: {
    safety_isolation: true,
    panel_condition: "good",
    mounting_secure: true,
    inverter_no_faults: true,
    dc_voltage: 598.2,
    ac_output: 12.4,
    cleaning_done: "partial",
  },
  photoIds: [],
  confirmation: { typedName: "Site Manager (demo)", acknowledged: true },
  idempotencyKey: "0000eeee-0000-4000-8000-000000000001",
  ...overrides,
});

describe("mock adapters are clearly mocks, not persistence", () => {
  it("every adapter reports source 'mock'", () => {
    const { adapters } = setup();
    for (const adapter of Object.values(adapters)) expect(adapter.source).toBe("mock");
  });

  it("writes live only in that instance; a new instance starts from clean fixtures", async () => {
    const first = setup();
    first.controls.signInAs("coordinator");
    unwrap(await first.adapters.registry.createCustomer({ displayName: "Temporary Co" }));
    expect(unwrap(await first.adapters.registry.listCustomers({ q: "Temporary" })).total).toBe(1);

    const second = setup();
    second.controls.signInAs("coordinator");
    expect(unwrap(await second.adapters.registry.listCustomers({ q: "Temporary" })).total).toBe(0);
  });

  it("reset() discards edits", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    unwrap(await adapters.registry.createCustomer({ displayName: "Temporary Co" }));
    controls.reset();
    expect(unwrap(await adapters.registry.listCustomers({ q: "Temporary" })).total).toBe(0);
  });

  it("returned objects are copies: mutating them never changes the store", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const page = unwrap(await adapters.registry.listCustomers());
    page.items[0].displayName = "Tampered";
    const again = unwrap(await adapters.registry.getCustomer(page.items[0].id));
    expect(again.displayName).not.toBe("Tampered");
  });

  it("mock code never imports network, database or server modules", () => {
    const root = join(__dirname, "..", "adapters");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (path.endsWith(".ts")) files.push(path);
      }
    };
    walk(root);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\bfetch\(|@supabase|from "next\/server"|process\.env/);
    }
  });
});

describe("scenarios", () => {
  it("empty: lists are empty but people and checklist remain", async () => {
    const { adapters, controls } = setup({ scenario: "empty" });
    controls.signInAs("coordinator");
    expect(unwrap(await adapters.registry.listCustomers()).items).toEqual([]);
    expect(unwrap(await adapters.dispatch.listJobs()).total).toBe(0);
    expect(unwrap(await adapters.dispatch.listTechnicians()).length).toBeGreaterThan(0);
    expect(unwrap(await adapters.dashboard.getStats())).toMatchObject({ overdue: 0, unassigned: 0, expiringWarranties: [] });
  });

  it("error: calls fail with a safe 500", async () => {
    const { adapters, controls } = setup({ scenario: "error" });
    controls.signInAs("coordinator");
    const result = await adapters.registry.listCustomers();
    expect(result).toMatchObject({ ok: false, status: 500, error: { code: "INTERNAL" } });
  });

  it("denied: signed-in calls fail with 403", async () => {
    const { adapters, controls } = setup({ scenario: "denied" });
    controls.signInAs("coordinator");
    expect(await adapters.maintenance.listPlans()).toMatchObject({ ok: false, status: 403, error: { code: "FORBIDDEN" } });
  });

  it("slow: waits at least the slow delay", async () => {
    const { adapters, controls } = setup({ scenario: "slow" });
    controls.signInAs("coordinator");
    const started = Date.now();
    await adapters.dashboard.getStats();
    expect(Date.now() - started).toBeGreaterThanOrEqual(2400);
  }, 10_000);

  it("switching to and from empty reseeds the data", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    controls.setScenario("empty");
    expect(unwrap(await adapters.registry.listCustomers()).total).toBe(0);
    controls.setScenario("ok");
    expect(unwrap(await adapters.registry.listCustomers()).total).toBe(5);
  });
});

describe("auth (mock)", () => {
  it("signed-out calls are 401", async () => {
    const { adapters } = setup();
    expect(await adapters.dispatch.listJobs()).toMatchObject({ ok: false, status: 401 });
  });

  it("signs in demo accounts and rejects unknown or inactive ones with one generic message", async () => {
    const { adapters } = setup();
    const session = unwrap(await adapters.auth.signIn({ email: "OMAR.technician@example.com", password: "demo" }));
    expect(session).toMatchObject({ userId: TECHNICIAN_1_ID, role: "technician" });
    const unknown = await adapters.auth.signIn({ email: "nobody@example.com", password: "demo" });
    const inactive = await adapters.auth.signIn({ email: "rami.former@example.com", password: "demo" });
    expect(unknown).toMatchObject({ ok: false, status: 401 });
    expect(!inactive.ok && !unknown.ok && inactive.error.message === unknown.error.message).toBe(true);
    unwrap(await adapters.auth.signOut());
    expect(unwrap(await adapters.auth.getSession())).toBeNull();
  });

  it("expired sessions are 401", async () => {
    let now = new Date(FIXTURE_NOW);
    const { adapters, controls } = setup({ now: () => now });
    controls.signInAs("coordinator");
    now = new Date(now.getTime() + 9 * 3600_000);
    expect(await adapters.registry.listCustomers()).toMatchObject({ ok: false, status: 401 });
  });
});

describe("registry (mock)", () => {
  it("technicians are denied registry lists", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("technician");
    expect(await adapters.registry.listCustomers()).toMatchObject({ ok: false, status: 403 });
  });

  it("technicians may read a system only through an assigned job", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    expect((await adapters.registry.getSystem(fixtureId("system", 1))).ok).toBe(true);
    expect(await adapters.registry.getSystem(fixtureId("system", 3))).toMatchObject({ ok: false, status: 404 });
  });

  it("searches, paginates and counts sites/systems", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const page = unwrap(await adapters.registry.listCustomers({ pageSize: 2, page: 1 }));
    expect(page).toMatchObject({ total: 5, page: 1, pageSize: 2 });
    expect(page.items).toHaveLength(2);
    const cedar = unwrap(await adapters.registry.listCustomers({ q: "cedar" })).items[0];
    expect(cedar).toMatchObject({ siteCount: 2, systemCount: 2 });
  });

  it("rejects duplicate serial numbers with 409 and the offending field", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const result = await adapters.registry.createComponent({
      systemId: fixtureId("system", 1),
      type: "battery",
      manufacturer: "VoltCore",
      model: "VC-10",
      serialNumber: "vc10-0001",
      installedOn: "2026-01-01",
    });
    expect(result).toMatchObject({ ok: false, status: 409, error: { fieldErrors: { serialNumber: expect.any(Array) } } });
  });

  it("replacement keeps the old component as history", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const oldId = fixtureId("component", 3);
    const request = {
      systemId: fixtureId("system", 1),
      type: "battery" as const,
      manufacturer: "VoltCore",
      model: "VC-12",
      serialNumber: "VC12-NEW",
      installedOn: "2026-11-20",
      warrantyExpiresOn: "2036-11-20",
      replacesComponentId: oldId,
    };
    const created = unwrap(await adapters.registry.createComponent(request));
    expect(created.replacedComponentId).toBe(oldId);
    const detail = unwrap(await adapters.registry.getSystem(fixtureId("system", 1)));
    expect(detail.components.find((component) => component.id === oldId)?.status).toBe("replaced");
    // The old component cannot be replaced a second time.
    expect(await adapters.registry.createComponent({ ...request, serialNumber: "VC12-SECOND" })).toMatchObject({ status: 409 });
  });

  it("validation failures return 400 with field errors and save nothing", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const result = await adapters.registry.createSystem({ siteId: fixtureId("site", 1), label: "", capacityKw: -1, installedOn: "2026-02-30", components: [] });
    expect(result).toMatchObject({ ok: false, status: 400, error: { code: "VALIDATION_FAILED" } });
    if (!result.ok) expect(Object.keys(result.error.fieldErrors ?? {}).sort()).toEqual(["capacityKw", "installedOn", "label"]);
    expect(unwrap(await adapters.registry.listSystems()).total).toBe(8);
  });
});

describe("maintenance (mock)", () => {
  it("generation inserts missing occurrences once and is idempotent on replay", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const first = unwrap(await adapters.maintenance.generateJobs());
    expect(first).toMatchObject({ businessDate: "2026-11-20", windowEnd: "2027-02-18", inserted: 2, skipped: 6, cancelled: 0, conflicts: [] });
    const second = unwrap(await adapters.maintenance.generateJobs());
    expect(second).toMatchObject({ inserted: 0, skipped: 8 });
    const jobs = unwrap(await adapters.dispatch.listJobs({ pageSize: 100 })).items;
    const keys = jobs.map((job) => `${job.planId}|${job.scheduledDate}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("paused plans generate nothing", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    expect(unwrap(await adapters.maintenance.generateJobs({ planId: fixtureId("plan", 3) }))).toMatchObject({ inserted: 0, skipped: 0 });
  });

  it("editing a plan cancels stale unassigned jobs and reports assigned ones as conflicts", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const planId = fixtureId("plan", 1); // monthly from Jan 31: has assigned 11-30 and scheduled 12-31
    unwrap(await adapters.maintenance.updatePlan(planId, { expectedVersion: 1, anchorDate: "2026-01-15" }));
    const result = unwrap(await adapters.maintenance.generateJobs({ planId }));
    expect(result.cancelled).toBe(1);
    expect(result.conflicts).toEqual([{ jobId: JOB_ASSIGNED_T1, planId, scheduledDate: "2026-11-30", reason: "assigned_job_no_longer_valid" }]);
    expect(result.inserted).toBe(3); // 12-15, 01-15, 02-15
  });

  it("stale expectedVersion is 409 and revision only moves on schedule changes", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const planId = fixtureId("plan", 2);
    const paused = unwrap(await adapters.maintenance.updatePlan(planId, { expectedVersion: 1, status: "paused" }));
    expect(paused).toMatchObject({ status: "paused", version: 2, revision: 1 });
    expect(await adapters.maintenance.updatePlan(planId, { expectedVersion: 1, status: "active" })).toMatchObject({ status: 409 });
    const edited = unwrap(await adapters.maintenance.updatePlan(planId, { expectedVersion: 2, intervalMonths: 6 }));
    expect(edited).toMatchObject({ version: 3, revision: 2 });
  });

  it("technicians cannot see or create plans", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("technician");
    expect(await adapters.maintenance.listPlans()).toMatchObject({ status: 403 });
    expect(await adapters.maintenance.generateJobs()).toMatchObject({ status: 403 });
  });
});

describe("dispatch (mock)", () => {
  it("technicians only ever see their own jobs, whatever the filter", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    const jobs = unwrap(await adapters.dispatch.listJobs({ technicianId: TECHNICIAN_2_ID, pageSize: 100 })).items;
    expect(jobs).toEqual([]);
    const mine = unwrap(await adapters.dispatch.listJobs({ pageSize: 100 })).items;
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((job) => job.technicianId === TECHNICIAN_1_ID)).toBe(true);
    expect(await adapters.dispatch.getJob(JOB_ASSIGNED_T2)).toMatchObject({ ok: false, status: 404 });
  });

  it("filters by status, date range and unassigned", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const unassigned = unwrap(await adapters.dispatch.listJobs({ technicianId: "unassigned", status: ["scheduled"] })).items;
    expect(unassigned.map((job) => job.scheduledDate)).toEqual(["2026-11-25", "2026-12-20", "2026-12-31"]);
    const december = unwrap(await adapters.dispatch.listJobs({ from: "2026-12-01", to: "2026-12-31" })).items;
    expect(december.map((job) => job.scheduledDate)).toEqual(["2026-12-15", "2026-12-20", "2026-12-31"]);
  });

  it("assign → start uses expectedVersion and rejects stale updates", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const assigned = unwrap(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "assign", expectedVersion: 1, technicianId: TECHNICIAN_2_ID }));
    expect(assigned).toMatchObject({ status: "assigned", technicianName: "Hadi Nasr", version: 2 });
    expect(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "unassign", expectedVersion: 1 })).toMatchObject({ status: 409 });
    controls.signInAs(TECHNICIAN_2_ID);
    expect(unwrap(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "start", expectedVersion: 2 })).status).toBe("in_progress");
  });

  it("cannot assign inactive technicians or reschedule onto a taken date", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    expect(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "assign", expectedVersion: 1, technicianId: fixtureId("profile", 4) })).toMatchObject({ status: 400 });
    expect(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "reschedule", expectedVersion: 1, scheduledDate: "2026-11-30", reason: "Swap" })).toMatchObject({ status: 409 });
    expect(await adapters.dispatch.updateJob(JOB_SCHEDULED, { action: "reschedule", expectedVersion: 1, scheduledDate: "2026-11-01", reason: "Past" })).toMatchObject({ status: 400 });
  });

  it("cancel releases the technician so the job can be reactivated", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const cancelled = unwrap(await adapters.dispatch.updateJob(JOB_ASSIGNED_T1, { action: "cancel", expectedVersion: 2, reason: "Customer away" }));
    expect(cancelled).toMatchObject({ status: "cancelled", technicianId: null, lastChangeReason: "Customer away" });
    const reactivated = unwrap(await adapters.dispatch.updateJob(JOB_ASSIGNED_T1, { action: "reactivate", expectedVersion: 3, reason: "Customer back" }));
    expect(reactivated.status).toBe("scheduled");
  });

  it("technicians cannot assign or list technicians", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    expect(await adapters.dispatch.updateJob(JOB_ASSIGNED_T1, { action: "assign", expectedVersion: 2, technicianId: TECHNICIAN_1_ID })).toMatchObject({ status: 403 });
    expect(await adapters.dispatch.listTechnicians()).toMatchObject({ status: 403 });
  });
});

describe("inspections (mock)", () => {
  it("completes an in-progress job once; a retry with the same key returns the same report", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    const first = await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion());
    expect(first).toMatchObject({ ok: true, status: 201 });
    const retry = await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion());
    expect(retry).toMatchObject({ ok: true, status: 200 });
    expect(unwrap(retry).id).toBe(unwrap(first).id);
    const other = await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion({ idempotencyKey: "0000eeee-0000-4000-8000-000000000002" }));
    expect(other).toMatchObject({ ok: false, status: 409 });
    expect(unwrap(await adapters.dispatch.getJob(JOB_IN_PROGRESS_T1))).toMatchObject({ status: "completed", reportId: unwrap(first).id });
  });

  it("the report snapshot carries checklist values with units", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    const report = unwrap(await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion()));
    expect(report.snapshot.checklist.lines.find((line) => line.itemId === "dc_voltage")).toMatchObject({ value: 598.2, unit: "V" });
    expect(report.snapshot.customer.displayName).toBe("Cedar Ridge Apartments");
  });

  it("cannot complete a job that is only assigned, or someone else's job", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    expect(await adapters.inspections.completeJob(JOB_ASSIGNED_T1, completion())).toMatchObject({ status: 409 });
    expect(await adapters.inspections.completeJob(JOB_ASSIGNED_T2, completion())).toMatchObject({ status: 404 });
  });

  it("coordinators cannot complete jobs", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    expect(await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion())).toMatchObject({ status: 403 });
  });

  it("missing checklist answers and foreign photos are rejected without completing the job", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    const missing = await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion({ answers: { safety_isolation: true } }));
    expect(missing).toMatchObject({ status: 400, error: { fieldErrors: { "answers.dc_voltage": expect.any(Array) } } });
    const foreign = await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion({ photoIds: [fixtureId("photo", 1)] }));
    expect(foreign).toMatchObject({ status: 400, error: { fieldErrors: { photoIds: expect.any(Array) } } });
    expect(unwrap(await adapters.dispatch.getJob(JOB_IN_PROGRESS_T1)).status).toBe("in_progress");
  });

  it("photos are registered as metadata only and never expose the storage path", async () => {
    const { adapters, controls } = setup();
    controls.signInAs(TECHNICIAN_1_ID);
    const photo = unwrap(await adapters.inspections.registerPhoto({ jobId: JOB_IN_PROGRESS_T1, fileName: "array.jpg", mimeType: "image/jpeg", sizeBytes: 900_000 }));
    expect(photo.url).toBeNull();
    expect(photo).not.toHaveProperty("storagePath");
    const report = unwrap(await adapters.inspections.completeJob(JOB_IN_PROGRESS_T1, completion({ photoIds: [photo.id] })));
    expect(report.snapshot.photos).toEqual([{ id: photo.id, caption: null }]);
  });

  it("reports are visible to coordinators and the assigned technician only", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    expect((await adapters.inspections.getReport(REPORT_T1)).ok).toBe(true);
    controls.signInAs(TECHNICIAN_1_ID);
    expect((await adapters.inspections.getReport(REPORT_T1)).ok).toBe(true);
    controls.signInAs(TECHNICIAN_2_ID);
    expect(await adapters.inspections.getReport(REPORT_T1)).toMatchObject({ status: 404 });
  });
});

describe("dashboard (mock)", () => {
  it("derives counts from the data and lists expiring warranties soonest first", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("coordinator");
    const stats = unwrap(await adapters.dashboard.getStats());
    expect(stats).toMatchObject({ businessDate: "2026-11-20", upcomingNext7Days: 1, overdue: 1, unassigned: 3, inProgress: 1, completedLast30Days: 1 });
    expect(stats.expiringWarranties.map((item) => item.warrantyExpiresOn)).toEqual(["2026-12-31", "2027-01-15", "2027-02-10"]);
  });

  it("technicians are denied", async () => {
    const { adapters, controls } = setup();
    controls.signInAs("technician");
    expect(await adapters.dashboard.getStats()).toMatchObject({ status: 403 });
  });
});
