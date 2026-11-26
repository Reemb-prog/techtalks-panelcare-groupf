import { registerPhotoSchema, validateAnswersAgainstTemplate } from "../../lib/validations/inspections";
import { MAX_PHOTOS_PER_JOB } from "../../types";
import type { ChecklistAnswers, ChecklistTemplate } from "../../types";

export type SelectedPhoto = {
  id: string;
  file: File;
  caption: string;
};

export type InspectionDraft = {
  answers: Record<string, string>;
  notes: string;
  photos: SelectedPhoto[];
  step: "checklist" | "photos";
};

export function validateChecklist(template: ChecklistTemplate, values: InspectionDraft["answers"]) {
  const answers: ChecklistAnswers = {};
  for (const item of template.items) {
    const value = values[item.id]?.trim();
    if (!value) continue;
    switch (item.kind) {
      case "number":
        answers[item.id] = Number(value);
        break;
      case "boolean":
        answers[item.id] = value === "true" || value === "false" ? value === "true" : value;
        break;
      default:
        answers[item.id] = value;
    }
  }
  return { answers, fieldErrors: validateAnswersAgainstTemplate(template, answers) };
}

export function validatePhotoSelection<T extends Pick<File, "name" | "type" | "size">>(
  jobId: string,
  files: readonly T[],
  selectedCount: number,
) {
  const accepted: T[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = registerPhotoSchema.safeParse({
      jobId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!result.success) {
      errors.push(`${file.name}: ${result.error.issues[0].message}`);
      continue;
    }
    if (selectedCount + accepted.length >= MAX_PHOTOS_PER_JOB) {
      errors.push(`${file.name}: Choose no more than ${MAX_PHOTOS_PER_JOB} photos per job.`);
      continue;
    }
    accepted.push(file);
  }

  return { accepted, errors };
}
