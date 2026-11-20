/**
 * Shared machinery for S1 mock adapters: selectable scenarios, simulated latency, simulated role checks,
 * and copy-on-return so screens can never mutate the in-memory store.
 *
 * MOCKS ARE NOT SECURITY. Role checks here only reproduce the expected UX; real authorization is enforced
 * on the server and by RLS in S2 (PC-S2-01, PC-S2-02).
 */
import type { ApiErrorBody, ApiErrorCode, ApiResult, IsoDate, Paginated, Role, Session } from "../../../types";
import { DEFAULT_BUSINESS_TIMEZONE, DEFAULT_PAGE_SIZE, HTTP_STATUS_BY_ERROR_CODE } from "../../../types";
import { businessToday } from "../../validations/dates";
import type { FixtureData } from "../../fixtures/data";

export const MOCK_SCENARIOS = ["ok", "empty", "slow", "error", "denied"] as const;
/**
 * ok: normal data · empty: no records (people and checklist remain) · slow: long latency ·
 * error: every call fails with 500 · denied: every signed-in call fails with 403.
 */
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const DEFAULT_MOCK_DELAY_MS = 300;
export const SLOW_MOCK_DELAY_MS = 2500;

export interface MockOptions {
  scenario?: MockScenario;
  /** Latency for normal calls. Use 0 in tests. */
  delayMs?: number;
  /** Start signed in (tests, Storybook-like previews). Default: signed out. */
  session?: Session | null;
  /** Clock override for deterministic tests. */
  now?: () => Date;
  /** ID generator override for deterministic tests. */
  newId?: () => string;
}

export interface MockContext {
  store: FixtureData;
  session: Session | null;
  scenario: MockScenario;
  delayMs: number;
  now: () => Date;
  newId: () => string;
}

export function nowIso(ctx: MockContext): string {
  return ctx.now().toISOString();
}

export function today(ctx: MockContext): IsoDate {
  return businessToday(ctx.now(), DEFAULT_BUSINESS_TIMEZONE);
}

export function success<T>(data: T, status = 200): ApiResult<T> {
  return { ok: true, status, data: structuredClone(data) };
}

export function failure<T = never>(code: ApiErrorCode, message: string, fieldErrors?: ApiErrorBody["fieldErrors"]): ApiResult<T> {
  return { ok: false, status: HTTP_STATUS_BY_ERROR_CODE[code], error: fieldErrors ? { code, message, fieldErrors } : { code, message } };
}

export function fromError<T = never>(error: ApiErrorBody): ApiResult<T> {
  return { ok: false, status: HTTP_STATUS_BY_ERROR_CODE[error.code], error };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface CallRules {
  /** Roles allowed to call. Omit for "any signed-in user". */
  roles?: readonly Role[];
  /** false = callable while signed out (sign-in, session lookup). Default true. */
  requireSession?: boolean;
}

/**
 * Runs one simulated request: latency → scenario failure → session/role check → handler.
 * Handlers receive a guaranteed session when requireSession is true.
 */
export async function simulate<T>(
  ctx: MockContext,
  rules: CallRules,
  handler: (session: Session) => ApiResult<T> | Promise<ApiResult<T>>,
): Promise<ApiResult<T>> {
  const delay = ctx.scenario === "slow" ? Math.max(ctx.delayMs, SLOW_MOCK_DELAY_MS) : ctx.delayMs;
  if (delay > 0) await sleep(delay);
  if (ctx.scenario === "error") return failure("INTERNAL", "Something went wrong. Please try again. (simulated)");
  const requireSession = rules.requireSession ?? true;
  if (requireSession) {
    const session = ctx.session;
    if (!session || new Date(session.expiresAt).getTime() <= ctx.now().getTime()) {
      return failure("UNAUTHENTICATED", "Please sign in again.");
    }
    if (ctx.scenario === "denied") return failure("FORBIDDEN", "You do not have permission to do this. (simulated)");
    if (rules.roles && !rules.roles.includes(session.role)) return failure("FORBIDDEN", "You do not have permission to do this.");
    return handler(session);
  }
  return handler(ctx.session as Session);
}

export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export function matchesText(query: string | undefined, ...values: (string | null | undefined)[]): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(needle));
}

export const COORDINATOR_ONLY = ["coordinator"] as const;
export const TECHNICIAN_ONLY = ["technician"] as const;
