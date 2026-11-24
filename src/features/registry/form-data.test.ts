import { expect, it } from "vitest";
import { createCustomerSchema, createComponentSchema } from "../../lib/validations/registry";
import { toFieldErrors } from "../../lib/validations/errors";
import { inputValues } from "./form-data";

it("preserves required blanks and omits optional blanks", () => {
  const data = new FormData();
  data.set("displayName", "  Cedar  ");
  data.set("contactEmail", " ");
  expect(createCustomerSchema.parse(inputValues(data, ["contactEmail"]))).toEqual({ displayName: "Cedar" });
  data.set("displayName", " ");
  expect(inputValues(data, ["contactEmail"])).toEqual({ displayName: "" });
});

it("keeps nested input names intact for component rows", () => {
  const data = new FormData();
  data.set("components.0.serialNumber", " REG-1 ");
  data.set("components.0.warrantyExpiresOn", "");
  expect(inputValues(data, ["components.0.warrantyExpiresOn"])).toEqual({
    "components.0.serialNumber": "REG-1",
  });
});

it("rejects a warranty date earlier than installation", () => {
  const result = createComponentSchema.safeParse({
    systemId: "00000000-0000-4000-8000-000000000001", type: "panel", manufacturer: "A",
    model: "B", serialNumber: "C", installedOn: "2026-01-01", warrantyExpiresOn: "2025-01-01",
  });
  expect(result.success).toBe(false);
  if (!result.success) expect(toFieldErrors(result.error)).toHaveProperty("warrantyExpiresOn");
});
