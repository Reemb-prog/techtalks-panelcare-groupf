import { describe, expect, it } from "vitest";
import { CHECKLIST_TEMPLATE_V1, fixtureId } from "../fixtures";
import {
  completeJobSchema,
  createComponentSchema,
  createCustomerSchema,
  createPlanSchema,
  createSystemSchema,
  customerListQuerySchema,
  jobListQuerySchema,
  jobPatchSchema,
  omitEmptyStrings,
  parseRequest,
  registerPhotoSchema,
  updatePlanSchema,
  validateAnswersAgainstTemplate,
} from "../validations";

const systemId = fixtureId("system", 1);
const component = { type: "inverter", manufacturer: "Helion Power", model: "HP-5K", serialNumber: "SN-1", installedOn: "2025-01-10" };

function fieldErrorsOf(schema: Parameters<typeof parseRequest>[0], input: unknown) {
  const result = parseRequest(schema, input);
  if (result.ok) throw new Error("expected validation to fail");
  expect(result.error.code).toBe("VALIDATION_FAILED");
  return result.error.fieldErrors ?? {};
}

describe("registry validation", () => {
  it("accepts a valid customer and trims text", () => {
    const result = parseRequest(createCustomerSchema, { displayName: "  Demo Co  ", contactEmail: "a@example.com" });
    expect(result).toEqual({ ok: true, data: { displayName: "Demo Co", contactEmail: "a@example.com" } });
  });

  it("rejects blank names and bad emails with field errors", () => {
    const errors = fieldErrorsOf(createCustomerSchema, { displayName: "   ", contactEmail: "nope" });
    expect(Object.keys(errors).sort()).toEqual(["contactEmail", "displayName"]);
  });

  it("omitEmptyStrings lets blank optional form fields pass", () => {
    const form = { displayName: "Demo Co", contactEmail: "", contactPhone: "  " };
    expect(parseRequest(createCustomerSchema, omitEmptyStrings(form)).ok).toBe(true);
  });

  it("rejects zero, negative and over-precise capacity", () => {
    const base = { siteId: fixtureId("site", 1), label: "Array", installedOn: "2025-01-10", components: [] };
    for (const capacityKw of [0, -5, 1.2345]) {
      expect(fieldErrorsOf(createSystemSchema, { ...base, capacityKw })).toHaveProperty("capacityKw");
    }
    expect(parseRequest(createSystemSchema, { ...base, capacityKw: 12.345 }).ok).toBe(true);
  });

  it("defaults components to an empty list", () => {
    const result = parseRequest(createSystemSchema, { siteId: fixtureId("site", 1), label: "Array", capacityKw: 5, installedOn: "2025-01-10" });
    expect(result.ok && result.data.components).toEqual([]);
  });

  it("requires a serial number and flags serials repeated within one form", () => {
    const errors = fieldErrorsOf(createSystemSchema, {
      siteId: fixtureId("site", 1),
      label: "Array",
      capacityKw: 5,
      installedOn: "2025-01-10",
      components: [component, { ...component }, { ...component, serialNumber: " " }],
    });
    expect(errors).toHaveProperty(["components.1.serialNumber"]);
    expect(errors).toHaveProperty(["components.2.serialNumber"]);
  });

  it("rejects warranty ending before install and impossible dates", () => {
    expect(fieldErrorsOf(createComponentSchema, { ...component, systemId, warrantyExpiresOn: "2024-01-01" })).toHaveProperty("warrantyExpiresOn");
    expect(fieldErrorsOf(createComponentSchema, { ...component, systemId, installedOn: "2025-02-30" })).toHaveProperty("installedOn");
  });

  it("caps page size at 100 and coerces numeric query strings", () => {
    expect(fieldErrorsOf(customerListQuerySchema, { pageSize: 101 })).toHaveProperty("pageSize");
    expect(parseRequest(customerListQuerySchema, { page: "2", pageSize: "50" })).toEqual({ ok: true, data: { page: 2, pageSize: 50 } });
  });
});

describe("maintenance and dispatch validation", () => {
  it("requires a whole, positive interval and a supported timezone", () => {
    const base = { systemId, anchorDate: "2026-01-31", timezone: "Asia/Beirut" };
    for (const intervalMonths of [0, -1, 1.5, 61]) {
      expect(fieldErrorsOf(createPlanSchema, { ...base, intervalMonths })).toHaveProperty("intervalMonths");
    }
    expect(fieldErrorsOf(createPlanSchema, { ...base, intervalMonths: 1, timezone: "Europe/Paris" })).toHaveProperty("timezone");
    expect(parseRequest(createPlanSchema, { ...base, intervalMonths: 1 }).ok).toBe(true);
  });

  it("plan updates must change something and carry expectedVersion", () => {
    expect(fieldErrorsOf(updatePlanSchema, { expectedVersion: 1 })).toHaveProperty("_form");
    expect(fieldErrorsOf(updatePlanSchema, { status: "paused" })).toHaveProperty("expectedVersion");
  });

  it("job actions are a closed set and reasons are required where needed", () => {
    expect(parseRequest(jobPatchSchema, { action: "complete", expectedVersion: 1 }).ok).toBe(false);
    expect(fieldErrorsOf(jobPatchSchema, { action: "cancel", expectedVersion: 1 })).toHaveProperty("reason");
    expect(parseRequest(jobPatchSchema, { action: "start", expectedVersion: 3 }).ok).toBe(true);
  });

  it("date filters must be ordered", () => {
    expect(fieldErrorsOf(jobListQuerySchema, { from: "2026-12-01", to: "2026-11-01" })).toHaveProperty("to");
  });
});

describe("inspection validation", () => {
  const validAnswers = {
    safety_isolation: true,
    panel_condition: "good",
    mounting_secure: true,
    inverter_no_faults: true,
    dc_voltage: 600,
    ac_output: 10,
    cleaning_done: "none",
  };

  it("accepts a complete checklist and ignores missing optional items", () => {
    expect(validateAnswersAgainstTemplate(CHECKLIST_TEMPLATE_V1, validAnswers)).toEqual({});
  });

  it("flags missing required items, wrong kinds, out-of-range numbers, bad choices and unknown keys", () => {
    const errors = validateAnswersAgainstTemplate(CHECKLIST_TEMPLATE_V1, {
      ...validAnswers,
      safety_isolation: "yes",
      dc_voltage: -1,
      battery_soc: 140,
      panel_condition: "excellent",
      mystery: 1,
      mounting_secure: undefined as unknown as boolean,
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["answers.battery_soc", "answers.dc_voltage", "answers.mounting_secure", "answers.mystery", "answers.panel_condition", "answers.safety_isolation"].sort(),
    );
  });

  it("customer confirmation must be acknowledged with a typed name", () => {
    const base = { checklistVersion: 1, answers: validAnswers, photoIds: [], idempotencyKey: fixtureId("job", 99) };
    expect(fieldErrorsOf(completeJobSchema, { ...base, confirmation: { typedName: "A", acknowledged: false } })).toMatchObject({
      "confirmation.typedName": expect.any(Array),
      "confirmation.acknowledged": expect.any(Array),
    });
  });

  it("rejects unsupported and oversized photos", () => {
    const base = { jobId: fixtureId("job", 1), fileName: "a.jpg", mimeType: "image/jpeg", sizeBytes: 1000 };
    expect(fieldErrorsOf(registerPhotoSchema, { ...base, mimeType: "image/gif" })).toHaveProperty("mimeType");
    expect(fieldErrorsOf(registerPhotoSchema, { ...base, sizeBytes: 6 * 1024 * 1024 })).toHaveProperty("sizeBytes");
    expect(fieldErrorsOf(registerPhotoSchema, { ...base, sizeBytes: 0 })).toHaveProperty("sizeBytes");
  });
});
