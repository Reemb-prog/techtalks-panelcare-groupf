import { z } from "zod";
import type { ChecklistAnswers, ChecklistTemplate, FieldErrors } from "../../types";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_JOB, PHOTO_MIME_TYPES } from "../../types";
import { optionalText, requiredText, uuidSchema } from "./common";

export const registerPhotoSchema = z.object({
  jobId: uuidSchema,
  fileName: requiredText(200),
  mimeType: z.enum(PHOTO_MIME_TYPES, { error: "Use a JPEG, PNG or WebP image." }),
  sizeBytes: z
    .number()
    .int()
    .positive({ error: "The file is empty." })
    .max(MAX_PHOTO_BYTES, { error: `Photos must be at most ${MAX_PHOTO_BYTES / (1024 * 1024)} MB.` }),
  caption: optionalText(200),
});

export const completeJobSchema = z.object({
  checklistVersion: z.number().int().min(1),
  answers: z.record(z.string(), z.union([z.boolean(), z.number(), z.string().max(2000)])),
  notes: optionalText(2000),
  photoIds: z.array(uuidSchema).max(MAX_PHOTOS_PER_JOB, { error: `Attach at most ${MAX_PHOTOS_PER_JOB} photos.` }),
  confirmation: z.object({
    typedName: z
      .string()
      .trim()
      .min(2, { error: "Type the customer's full name." })
      .max(120, { error: "Use at most 120 characters." }),
    acknowledged: z.literal(true, { error: "The customer must confirm the visit." }),
  }),
  idempotencyKey: uuidSchema,
});

/**
 * Checks answers against the versioned template: required items present, right kind, numbers in range,
 * choices allowed, no unknown keys. Returns field errors keyed "answers.<itemId>" (empty object = valid).
 */
export function validateAnswersAgainstTemplate(template: ChecklistTemplate, answers: ChecklistAnswers): FieldErrors {
  const errors: FieldErrors = {};
  const add = (itemId: string, message: string) => {
    (errors[`answers.${itemId}`] ??= []).push(message);
  };
  const known = new Set(template.items.map((item) => item.id));
  for (const key of Object.keys(answers)) if (!known.has(key)) add(key, "Unknown checklist item.");

  for (const item of template.items) {
    const value = answers[item.id];
    const blank = value === undefined || (typeof value === "string" && value.trim() === "");
    if (blank) {
      if (item.required) add(item.id, "This item is required.");
      continue;
    }
    switch (item.kind) {
      case "boolean":
        if (typeof value !== "boolean") add(item.id, "Answer yes or no.");
        break;
      case "number":
        if (typeof value !== "number" || !Number.isFinite(value)) add(item.id, "Enter a number.");
        else if (item.min !== undefined && value < item.min) add(item.id, `Must be at least ${item.min}${item.unit ? " " + item.unit : ""}.`);
        else if (item.max !== undefined && value > item.max) add(item.id, `Must be at most ${item.max}${item.unit ? " " + item.unit : ""}.`);
        break;
      case "text":
        if (typeof value !== "string") add(item.id, "Enter text.");
        break;
      case "choice":
        if (typeof value !== "string" || !(item.options ?? []).includes(value)) add(item.id, "Choose one of the listed options.");
        break;
    }
  }
  return errors;
}
