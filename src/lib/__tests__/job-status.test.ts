import { describe, expect, it } from "vitest";
import type { JobAction, JobStatus } from "../../types";
import { JOB_STATUSES } from "../../types";
import { evaluateTransition } from "../validations/job-status";

const coordinator = { role: "coordinator" as const, userId: "coord" };
const tech = { role: "technician" as const, userId: "tech-1" };
const otherTech = { role: "technician" as const, userId: "tech-2" };
const job = (status: JobStatus, technicianId: string | null = "tech-1") => ({ status, technicianId, completedAt: null });

describe("job status machine", () => {
  it("allows the approved happy path", () => {
    expect(evaluateTransition(coordinator, job("scheduled", null), "assign")).toEqual({ ok: true, next: "assigned" });
    expect(evaluateTransition(tech, job("assigned"), "start")).toEqual({ ok: true, next: "in_progress" });
    expect(evaluateTransition(tech, job("in_progress"), "complete")).toEqual({ ok: true, next: "completed" });
  });

  it("keeps status on reassign and reschedule", () => {
    expect(evaluateTransition(coordinator, job("assigned"), "assign")).toEqual({ ok: true, next: "assigned" });
    expect(evaluateTransition(coordinator, job("assigned"), "reschedule", "Customer away")).toEqual({ ok: true, next: "assigned" });
  });

  it("completed jobs are immutable for everyone", () => {
    const actions: JobAction[] = ["assign", "unassign", "reschedule", "start", "complete", "cancel", "reactivate"];
    for (const action of actions) {
      expect(evaluateTransition(coordinator, job("completed"), action, "reason").ok).toBe(false);
      expect(evaluateTransition(tech, job("completed"), action, "reason").ok).toBe(false);
    }
  });

  it("technicians cannot assign, cancel, reschedule or self-assign", () => {
    for (const action of ["assign", "unassign", "reschedule", "cancel", "reactivate"] as JobAction[]) {
      expect(evaluateTransition(tech, job("assigned"), action, "reason")).toMatchObject({ ok: false, code: "FORBIDDEN" });
    }
    expect(evaluateTransition(tech, job("scheduled", "tech-1"), "assign")).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("another technician's job is NOT_FOUND, never FORBIDDEN (no ID probing)", () => {
    expect(evaluateTransition(otherTech, job("assigned"), "start")).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(evaluateTransition(tech, job("scheduled", null), "start")).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("coordinators cannot start or complete on a technician's behalf", () => {
    expect(evaluateTransition(coordinator, job("assigned"), "start")).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(evaluateTransition(coordinator, job("in_progress"), "complete")).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("illegal jumps are CONFLICT", () => {
    expect(evaluateTransition(tech, job("assigned"), "complete")).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(evaluateTransition(coordinator, job("scheduled", null), "unassign")).toMatchObject({ ok: false, code: "CONFLICT" });
    expect(evaluateTransition(coordinator, job("in_progress"), "reschedule", "x y z")).toMatchObject({ ok: false, code: "CONFLICT" });
  });

  it("cancel, reschedule and reactivate need a reason", () => {
    expect(evaluateTransition(coordinator, job("scheduled", null), "cancel")).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(evaluateTransition(coordinator, job("scheduled", null), "cancel", "   ")).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(evaluateTransition(coordinator, job("scheduled", null), "cancel", "Site closed")).toEqual({ ok: true, next: "cancelled" });
  });

  it("only an unassigned, never-completed cancelled job can be reactivated", () => {
    expect(evaluateTransition(coordinator, job("cancelled", null), "reactivate", "Plan changed back")).toEqual({ ok: true, next: "scheduled" });
    expect(evaluateTransition(coordinator, job("cancelled", "tech-1"), "reactivate", "Plan changed back")).toMatchObject({ ok: false, code: "CONFLICT" });
  });

  it("covers every status in the machine", () => {
    for (const status of JOB_STATUSES) expect(() => evaluateTransition(coordinator, job(status), "cancel", "reason")).not.toThrow();
  });
});
