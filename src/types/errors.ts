/**
 * Error envelope and result type shared by mock and real adapters.
 * Wire format of every failed response: { error: { code, message, fieldErrors? } }.
 */

export const API_ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * HTTP status for each error code.
 * 403 = the caller's role may never use this route.
 * 404 = the object does not exist OR is outside the caller's scope (prevents ID probing, Q4).
 * 409 = stale expectedVersion, duplicate (plan, date) or serial, or an illegal status transition.
 */
export const HTTP_STATUS_BY_ERROR_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

/** Field path (dot-separated, e.g. "components.0.serialNumber") → human-readable messages. */
export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  code: ApiErrorCode;
  /** Safe for display. Never contains raw database, RLS or stack details. */
  message: string;
  fieldErrors?: FieldErrors;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export type ApiSuccess<T> = { ok: true; status: number; data: T };
export type ApiFailure = { ok: false; status: number; error: ApiErrorBody };

/** What every adapter method resolves to. Adapters never throw for expected failures. */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
