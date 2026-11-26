import { completeJobSchema, registerPhotoSchema } from "../../lib/validations/inspections";
import { parseRequest } from "../../lib/validations/errors";
import { MAX_PHOTOS_PER_JOB } from "../../types";
import type {
  ApiResult, ChecklistTemplate, CompleteJobRequest, FieldErrors, InspectionsAdapter,
  RegisterPhotoRequest, ServiceReport,
} from "../../types";
import { validateChecklist, type InspectionDraft } from "./inspection-form";

export type PreparedInspection = {
  completion: Omit<CompleteJobRequest, "photoIds">;
  photos: { selectionId: string; metadata: RegisterPhotoRequest }[];
};

export function prepareInspection(jobId: string, template: ChecklistTemplate, draft: InspectionDraft, idempotencyKey: string) {
  const { answers, fieldErrors } = validateChecklist(template, draft.answers);
  if (draft.checklistVersion !== template.version) {
    fieldErrors.checklistVersion = ["The checklist was updated. Return to the checklist and review your answers."];
  }
  if (draft.photos.length > MAX_PHOTOS_PER_JOB) {
    fieldErrors.photoIds = [`Choose no more than ${MAX_PHOTOS_PER_JOB} photos per job.`];
  }

  const photos: PreparedInspection["photos"] = [];
  for (const { id, file, caption } of draft.photos) {
    const parsed = parseRequest(registerPhotoSchema, { jobId, fileName: file.name, mimeType: file.type, sizeBytes: file.size, caption });
    if (!parsed.ok) {
      (fieldErrors.photoIds ??= []).push(`${file.name}: ${Object.values(parsed.error.fieldErrors ?? {}).flat()[0] ?? parsed.error.message}`);
    } else {
      photos.push({ selectionId: id, metadata: parsed.data });
    }
  }

  const payload = parseRequest(completeJobSchema, {
    checklistVersion: template.version,
    answers,
    notes: draft.notes,
    photoIds: [],
    confirmation: { typedName: draft.customerName, acknowledged: draft.acknowledged },
    idempotencyKey,
  });
  if (!payload.ok) {
    return { ok: false as const, errors: { ...payload.error.fieldErrors, ...fieldErrors } };
  }
  if (Object.keys(fieldErrors).length) return { ok: false as const, errors: fieldErrors };

  const { checklistVersion, notes, confirmation } = payload.data;
  return {
    ok: true as const,
    prepared: { completion: { checklistVersion, answers, notes, confirmation, idempotencyKey }, photos },
  };
}

export type SubmissionAttempt = {
  prepared: PreparedInspection;
  request?: CompleteJobRequest;
};

type Progress = { phase: "photo"; selectionId: string } | { phase: "completion" };
export type SubmissionResult = { phase: "completion"; result: ApiResult<ServiceReport> }
  | { phase: "photo"; selectionId: string; result: Extract<ApiResult<never>, { ok: false }> }
  | { phase: "unknown-photo"; selectionId: string }
  | { phase: "unknown-completion" };

export async function submitMockInspection(
  jobId: string,
  inspections: Pick<InspectionsAdapter, "registerPhoto" | "completeJob">,
  attempt: SubmissionAttempt,
  registered: Map<string, string>,
  onProgress: (progress: Progress) => void,
): Promise<SubmissionResult> {
  if (!attempt.request) {
    const photoIds: string[] = [];
    for (const { selectionId, metadata } of attempt.prepared.photos) {
      const priorId = registered.get(selectionId);
      if (priorId) {
        photoIds.push(priorId);
        continue;
      }
      onProgress({ phase: "photo", selectionId });
      try {
        const result = await inspections.registerPhoto(metadata);
        if (!result.ok) return { phase: "photo", selectionId, result };
        registered.set(selectionId, result.data.id);
        photoIds.push(result.data.id);
      } catch {
        return { phase: "unknown-photo", selectionId };
      }
    }
    // Keep the original payload, including its submission ID, for every replay.
    attempt.request = { ...attempt.prepared.completion, photoIds };
  }

  onProgress({ phase: "completion" });
  try {
    return { phase: "completion", result: await inspections.completeJob(jobId, attempt.request) };
  } catch {
    return { phase: "unknown-completion" };
  }
}

export function groupReviewErrors(errors: FieldErrors) {
  const name = errors["confirmation.typedName"]?.[0];
  const acknowledged = errors["confirmation.acknowledged"]?.[0];
  const checklist = Object.keys(errors).some((field) => field === "checklistVersion" || field.startsWith("answers."));
  const evidence = [...(errors.photoIds ?? []), ...(errors.notes ?? [])];
  return { name, acknowledged, checklist, evidence };
}
