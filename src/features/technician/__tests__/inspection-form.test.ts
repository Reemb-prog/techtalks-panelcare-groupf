import { describe, expect, it } from "vitest";
import { fixtureId } from "../../../lib/fixtures/ids";
import { MAX_PHOTO_BYTES } from "../../../types";
import type { ChecklistTemplate } from "../../../types";
import { validateChecklist, validatePhotoSelection } from "../inspection-form";

const template: ChecklistTemplate = {
  version: 1,
  title: "Inspection",
  items: [
    { id: "safe", label: "Safe?", kind: "boolean", required: true },
    { id: "meter", label: "Meter", kind: "number", required: true, unit: "V", min: 0, max: 20 },
    { id: "optional", label: "Optional", kind: "text", required: false },
  ],
};

describe("inspection checklist entry", () => {
  it("preserves No and zero as answers while omitting blank optional fields", () => {
    expect(validateChecklist(template, { safe: "false", meter: "0", optional: " " })).toEqual({
      answers: { safe: false, meter: 0 },
      fieldErrors: {},
    });
  });

  it.each([
    [" ", "This item is required."],
    ["abc", "Enter a number."],
    ["21", "Must be at most 20 V."],
  ])("uses the template error for an invalid reading %s", (meter, message) => {
    const result = validateChecklist(template, { safe: "true", meter });
    expect(result.fieldErrors).toEqual({ "answers.meter": [message] });
    expect(result.answers.safe).toBe(true);
  });
});

describe("photo selection", () => {
  it("retains valid files and reports the bad type, empty file, and oversized file", () => {
    const good = { name: "panel.webp", type: "image/webp", size: MAX_PHOTO_BYTES };
    const files = [
      { name: "visit.txt", type: "text/plain", size: 10 },
      { name: "empty.jpg", type: "image/jpeg", size: 0 },
      { name: "large.png", type: "image/png", size: MAX_PHOTO_BYTES + 1 },
      good,
    ];
    const result = validatePhotoSelection(fixtureId("job", 2), files, 0);
    expect(result.accepted).toEqual([good]);
    expect(result.errors).toEqual([
      "visit.txt: Use a JPEG, PNG or WebP image.",
      "empty.jpg: The file is empty.",
      "large.png: Photos must be at most 5 MB.",
    ]);
  });

  it("counts previous selections and each accepted file in the new batch", () => {
    const first = { name: "first.jpg", type: "image/jpeg", size: 100 };
    const second = { ...first, name: "second.jpg" };
    const result = validatePhotoSelection(fixtureId("job", 2), [first, second], 9);
    expect(result.accepted).toEqual([first]);
    expect(result.errors).toEqual(["second.jpg: Choose no more than 10 photos per job."]);
  });
});
