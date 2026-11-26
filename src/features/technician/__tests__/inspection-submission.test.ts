import { describe, expect, it, vi } from "vitest";
import { createMockAdapters } from "../../../lib/adapters";
import { CHECKLIST_TEMPLATE_V1, FIXTURE_NOW, fixtureId } from "../../../lib/fixtures";
import type { ApiResult, InspectionPhoto } from "../../../types";
import type { InspectionDraft } from "../inspection-form";
import { prepareInspection, submitMockInspection, type SubmissionAttempt } from "../inspection-submission";

const jobId = fixtureId("job", 7);
const submissionId = "0000eeee-0000-4000-8000-000000000001";
const draft: InspectionDraft = {
  checklistVersion: 1,
  answers: {
    safety_isolation: "true",
    panel_condition: "good",
    mounting_secure: "true",
    inverter_no_faults: "false",
    dc_voltage: "0",
    ac_output: "0",
    cleaning_done: "none",
  },
  customerName: "  Demo Site Manager  ",
  acknowledged: true,
  notes: "Demo notes",
  photos: [
    { id: "one", file: new File(["demo"], "one.png", { type: "image/png" }), caption: "Array A" },
    { id: "two", file: new File(["demo"], "two.png", { type: "image/png" }), caption: "Array B" },
  ],
  step: "review",
};

function setup() {
  const { adapters, controls } = createMockAdapters({ delayMs: 0, now: () => new Date(FIXTURE_NOW) });
  controls.signInAs("technician");
  const result = prepareInspection(jobId, CHECKLIST_TEMPLATE_V1, draft, submissionId);
  if (!result.ok) throw new Error("Expected the demo inspection to pass validation.");
  const attempt: SubmissionAttempt = { prepared: result.prepared };
  return { adapters, attempt, registered: new Map<string, string>() };
}

describe("inspection submission", () => {
  it("revalidates checklist version, required readings, photo metadata and confirmation on review", () => {
    const result = prepareInspection(jobId, CHECKLIST_TEMPLATE_V1, {
      ...draft,
      checklistVersion: 0,
      answers: { ...draft.answers, ac_output: "" },
      customerName: " ",
      acknowledged: false,
      photos: [{ id: "bad", file: new File(["demo"], "bad.txt", { type: "text/plain" }), caption: "" }],
    }, submissionId);
    expect(result).toMatchObject({
      ok: false,
      errors: {
        checklistVersion: expect.any(Array),
        "answers.ac_output": expect.any(Array),
        photoIds: expect.any(Array),
        "confirmation.typedName": expect.any(Array),
        "confirmation.acknowledged": expect.any(Array),
      },
    });
  });

  it("keeps successful registrations across a partial failure and writes one report", async () => {
    const { adapters, attempt, registered } = setup();
    const registerPhoto = vi.fn(adapters.inspections.registerPhoto);
    registerPhoto.mockImplementationOnce(adapters.inspections.registerPhoto).mockResolvedValueOnce({
      ok: false, status: 500, error: { code: "INTERNAL", message: "Simulated failure." },
    } satisfies ApiResult<InspectionPhoto>);
    const completeJob = vi.fn(adapters.inspections.completeJob);
    const operations = { registerPhoto, completeJob };

    const failed = await submitMockInspection(jobId, operations, attempt, registered, () => {});
    expect(failed).toMatchObject({ phase: "photo", selectionId: "two" });
    expect(completeJob).not.toHaveBeenCalled();
    expect([...registered.keys()]).toEqual(["one"]);
    const success = await submitMockInspection(jobId, operations, attempt, registered, () => {});
    expect(success).toMatchObject({
      phase: "completion",
      result: { ok: true, data: { snapshot: { photos: [{ caption: "Array A" }, { caption: "Array B" }] } } },
    });
    expect(registerPhoto.mock.calls.map(([metadata]) => metadata.fileName)).toEqual(["one.png", "two.png", "two.png"]);
    expect(registerPhoto.mock.calls[0][0]).not.toHaveProperty("file");
    expect(completeJob).toHaveBeenCalledTimes(1);
    expect(completeJob.mock.calls[0][1].confirmation.typedName).toBe("Demo Site Manager");
  });

  it("replays the same request and report after the completion response is lost", async () => {
    const { adapters, attempt, registered } = setup();
    const registerPhoto = vi.fn(adapters.inspections.registerPhoto);
    let firstReportId: string | undefined;
    const completeJob = vi.fn(adapters.inspections.completeJob).mockImplementationOnce(async (id, request) => {
      const result = await adapters.inspections.completeJob(id, request);
      if (result.ok) firstReportId = result.data.id;
      throw new Error("Lost response");
    });
    const operations = { registerPhoto, completeJob };

    expect(await submitMockInspection(jobId, operations, attempt, registered, () => {})).toEqual({ phase: "unknown-completion" });
    expect(await adapters.dispatch.getJob(jobId)).toMatchObject({ ok: true, data: { status: "completed", reportId: firstReportId } });
    const recovered = await submitMockInspection(jobId, operations, attempt, registered, () => {});
    expect(recovered).toMatchObject({ phase: "completion", result: { ok: true, status: 200, data: { id: firstReportId } } });
    expect(firstReportId).toBeDefined();
    expect(registerPhoto).toHaveBeenCalledTimes(2);
    expect(completeJob.mock.calls[1][1]).toBe(completeJob.mock.calls[0][1]);
    expect(completeJob.mock.calls[1][1].idempotencyKey).toBe(submissionId);
  });
});
