import type { z } from "zod";
import type { ApiErrorBody, FieldErrors } from "../../types";

/** Key used for errors that belong to the whole form rather than one field. */
export const FORM_ERROR_KEY = "_form";

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export function validationError(fieldErrors: FieldErrors, message = "Some fields need attention."): ApiErrorBody {
  return { code: "VALIDATION_FAILED", message, fieldErrors };
}

export type ParseOutcome<T> = { ok: true; data: T } | { ok: false; error: ApiErrorBody };

/** Parse untrusted input into the contract shape or a VALIDATION_FAILED body. Same call in UI, mocks and S2 handlers. */
export function parseRequest<S extends z.ZodType>(schema: S, input: unknown): ParseOutcome<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: validationError(toFieldErrors(result.error)) };
}
