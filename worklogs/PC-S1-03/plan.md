# PC-S1-03: TypeScript DTOs, REST contract and mock scenarios

Sprint: S1 | Owner: rand | Reviewer: reem
Jira key: KAN-15 | Draft PR: TO CONFIRM | Planned start D1 (2026-11-20), review-ready day: D4 (2026-11-23)
Plan review: Pending (decision-level task per D11: contract + recurrence, human approval required before coding) | Approver: Reem (lead) | Date: TO CONFIRM

## Goal and scope
Freeze the typed data/API contract that every S1 screen builds against and every S2 handler implements:
TypeScript entity and API DTO types, Zod request validation, the error/pagination envelope, the job status
state machine, the recurrence (scheduler date) policy, and pure in-memory mock adapters with selectable
delay / empty / error / permission-denied scenarios.

**Unblocks:** PC-S1-05 (Reem), PC-S1-06 (Mahdi), PC-S1-07 (Rand), PC-S1-08 (Tarek); later PC-S2-01 schema and all S2 handlers.

**Out of scope:** UI, route handlers, database/Supabase, real auth, the S2 scheduler service, mock/real adapter
switching in production (PC-S3-09), fault ticket adapters (P1, type only).

## Dependencies to confirm merged
(none). PC-S1-01 scaffold is already on main (ae9decd), so Vitest/TypeScript are available.

## Allowed paths
* docs/CONTRACTS.md
* src/types/
* src/lib/adapters/
* src/lib/fixtures/
* src/lib/validations/
* src/lib/__tests__/

## Decisions needed from Reem BEFORE coding (please answer in Jira KAN-15 or the PR)

| # | Question | Proposal |
| --- | --- | --- |
| Q1 | **Zod is not installed** and `package.json` / `package-lock.json` belong to PC-S1-01, outside this task's paths. | **Recommended:** Reem adds `zod` (v3, exact version) in a tiny lead PR today. Alt B: Reem extends PC-S1-03 paths in `config/work-items.json` to allow the two files. Alt C: no Zod in S1, hand-written validators with the same error shape (more code, rework in S2). |
| Q2 | **D05 recurrence policy** (Reem + Rand, at contract freeze). | Business timezone `Asia/Beirut`; occurrence k = anchor_date + k × interval_months, always computed from the **original anchor**, day clamped to the month's last day (Jan 31 monthly → Feb 28/29, Mar 31); window is half-open **[today, today + 90 days)** in business timezone; occurrences stored as DATE (no time). |
| Q3 | **Job status machine** (see table below). | Approve as written. |
| Q4 | Technician requests an object outside their scope. | Return **404 NOT_FOUND** (not 403) for single objects so IDs cannot be probed; **403 FORBIDDEN** for whole routes the role may never use (e.g. technician → /api/customers). |
| Q5 | Optimistic concurrency and duplicate submits (contract additions). | Add `version: number` to plans and jobs; PATCH sends `expectedVersion`, mismatch → 409 CONFLICT. Completion request carries an `idempotencyKey`; a repeat returns the same report. |
| Q6 | Where the pure recurrence function lives in S1. | `src/lib/adapters/maintenance/recurrence.ts` (S1 preview + mocks). PC-S2-05 (also Rand) moves it to `src/lib/scheduler/` and the adapter re-imports it, so preview and backend share one implementation. |
| Q7 | D06 customer confirmation shape (Reem + Tarek). | Type the proposal only: `{ typedName, acknowledged: true, confirmedAt }`; no signature claim. Final wording stays with PC-S1-04 / S1 UX signoff. |

## Implementation plan

### 1. Files to create (all new, nothing existing is edited except docs/CONTRACTS.md)

**Types: `src/types/`** (no runtime code, importable by both client and server)
* `common.ts`: `Uuid`, `IsoDate` ("YYYY-MM-DD"), `IsoDateTime` (UTC ISO string), `Role = 'coordinator' | 'technician'`, `Paginated<T> { items, page, pageSize, total }`, `ListQuery { page?, pageSize?, sort?, q? }`.
* `errors.ts`: `ApiErrorCode = 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL'`, `ApiError { error: { code, message, fieldErrors?: Record<string, string[]> } }`, `ApiResult<T> = { ok: true; data: T } | { ok: false; status: number } & ApiError`.
* `registry.ts`: `Profile`, `Customer`, `Site`, `SolarSystem` (capacityKw as number), `Component` (type `inverter|battery|panel|other`, status `active|replaced|retired`, `replacedComponentId`), plus create/update request DTOs and `CustomerSummary` / `SystemDetail` responses.
* `maintenance.ts`: `MaintenancePlan` (`intervalMonths`, `anchorDate`, `timezone`, status `active|paused`, `revision`, `version`), create/patch DTOs, `PlanPreview { occurrences: IsoDate[] }`, `GenerationRunResult { runId, inserted, skipped, conflicts, failed, ranAt }`.
* `dispatch.ts`: `MaintenanceJob` (`scheduledDate`, `technicianId | null`, status `scheduled|assigned|in_progress|completed|cancelled`, `version`), `JobFilter { status?, from?, to?, technicianId? }`, `JobPatchRequest` (assign / reschedule / status change + `expectedVersion` + `reason` for cancel/reschedule).
* `inspections.ts`: `ChecklistTemplate { version, items: { id, label, kind: 'boolean'|'number'|'text'|'choice', unit?, options?, required }[] }`, `Inspection`, `InspectionPhoto` (metadata + private `storagePath`, never a blob), `CustomerConfirmation`, `CompleteJobRequest { checklistVersion, answers, measurements, notes?, photoIds, confirmation, idempotencyKey }`, `ServiceReport { id, jobId, inspectionId, reportSnapshot, generatedAt }`.
* `dashboard.ts`: `DashboardStats` (upcoming / overdue / unassigned counts, expiring warranties). Used by PC-S1-05 mock dashboard only.
* `fault-tickets.ts`: `FaultTicket` type marked **P1, not implemented**.
* `adapters.ts`: the interfaces both mock and real adapters implement: `AuthAdapter`, `RegistryAdapter`, `MaintenanceAdapter`, `DispatchAdapter`, `InspectionsAdapter`, `DashboardAdapter`; each method returns `Promise<ApiResult<T>>`, each adapter has `readonly source: 'mock' | 'api'`.
* `index.ts`: re-exports.

**Validation: `src/lib/validations/`** (Zod, pending Q1)
* `common.ts`: uuid, IsoDate (real calendar date, rejects 2026-02-30), pagination limits (pageSize 1–100, default 20).
* `registry.ts`: customer (name required, valid email), site (customerId required), system (capacityKw > 0, ≤ 3 decimals, installedOn not in the future), component (serial required, trimmed; warrantyExpiresOn ≥ installedOn).
* `maintenance.ts`: plan (intervalMonths positive integer 1–60, anchorDate valid, timezone in an allowed list, initially `['Asia/Beirut']`).
* `dispatch.ts`: job patch, plus `JOB_TRANSITIONS` table and `canTransition(role, from, to)`.
* `inspections.ts`: completion request (required checklist items answered, measurements numeric, confirmation acknowledged, idempotencyKey present).
* `errors.ts`: `toApiError(zodError)` → the `fieldErrors` envelope, so UI and S2 handlers render identical messages.

**Recurrence: `src/lib/adapters/maintenance/recurrence.ts`** (pure, no dependencies)
* `businessToday(now: Date, timeZone): IsoDate` via `Intl.DateTimeFormat('en-CA', { timeZone })`.
* `occurrencesInWindow(plan, today: IsoDate, days = 90): IsoDate[]`: k-th date from the original anchor, clamped; window `[today, today + 90)`; empty for paused plans; skips occurrences before today. Date-only arithmetic on Y/M/D integers, so DST cannot shift a date.

**Mock adapters: `src/lib/adapters/`** (per-domain folders so S2 owners swap only their own)
* `mock/scenario.ts`: `MockScenario = 'ok' | 'empty' | 'slow' | 'error' | 'denied'`, `MockOptions { scenario, delayMs (default 300, slow 2500), session: { userId, role } }`, `simulate()` helper.
* `auth/mock.ts`: demo coordinator + two demo technicians, mock sign-in by role (clearly labelled mock for PC-S1-05).
* `registry/mock.ts`, `maintenance/mock.ts`, `dispatch/mock.ts`, `inspections/mock.ts`, `dashboard/mock.ts`.
* `mock/index.ts`: `createMockAdapters(options)` returns all adapters over a **fresh in-memory copy** of the fixtures; every returned object is a `structuredClone` (UI cannot mutate the store); nothing persists across instances or page reloads.
* Mock role rules mirror the contract: technician gets 403 on registry/plans/dashboard, sees only assigned jobs, 404 on others' jobs/reports; coordinator gets everything. Mock completion is idempotent by `idempotencyKey` and rejects a second report.

**Fixtures: `src/lib/fixtures/`** (synthetic only)
* Deterministic UUIDs and fixed reference date `2026-11-20`; ~5 customers, ~8 sites, ~10 systems, ~30 components (including one replacement chain), 4 plans (one paused, one anchored on the 31st), generated jobs across every status, 1 completed inspection + report, checklist template v1 (placeholder items; content to be aligned with Tarek's PC-S1-04 map).
* Fake names, `@example.com` emails, `+961 00 000 xxx` style phones; no real people, addresses or photos.

**Docs: `docs/CONTRACTS.md`**
* Change status line to "frozen at PC-S1-03 merge, changes via CR".
* Add: DTO field tables (or link to `src/types/`), error codes → HTTP status map, pagination/filter rules, job status machine table, recurrence policy with the golden examples, 404-vs-403 rule, `version` / `idempotencyKey` semantics, mock scenario list.

### 2. Job status machine (Q3)

| From → To | Who | Notes |
| --- | --- | --- |
| scheduled → assigned | coordinator | sets technicianId |
| assigned → assigned | coordinator | reassign to another technician |
| assigned → scheduled | coordinator | unassign |
| assigned → in_progress | assigned technician | |
| in_progress → completed | assigned technician | only via POST /api/jobs/:id/complete, creates exactly one report |
| scheduled / assigned / in_progress → cancelled | coordinator | `reason` required, audited |
| cancelled → scheduled | coordinator / scheduler | reactivation only if unassigned and never completed, audited |
| completed → anything | nobody | immutable |
| any reschedule (date change) | coordinator | only scheduled/assigned; must not collide with an existing (plan, date) |

### 3. HTTP status map
200 read/update · 201 create · 400 VALIDATION_FAILED · 401 UNAUTHENTICATED · 403 FORBIDDEN (route not allowed for role) · 404 NOT_FOUND (missing or out of scope) · 409 CONFLICT (stale version, duplicate plan/date, illegal transition, duplicate serial) · 500 INTERNAL (generic message, never raw DB/RLS details).

### 4. Day plan
* D1 (Nov 20): this plan, Reem's answers to Q1–Q7, `npm ci`.
* D2 (Nov 21): types, validations, status machine, recurrence + their tests.
* D3 (Nov 22): fixtures, mock adapters, scenario tests; **open draft PR** so Mahdi/Tarek/Reem can read the types early.
* D4 (Nov 23): CONTRACTS.md update, full checks, review-ready PR to Reem.

## Edge cases covered
* Validation: negative/zero capacity, missing/blank serial, warranty before install, impossible dates, interval 0 / -1 / 1.5, pageSize > 100.
* Recurrence: Jan 31 monthly (2027 → Feb 28, 2028 → Feb 29, then Mar 31), multi-month interval (3, 6, 12), year boundary (Nov 30 + 3 months), anchor in the future, anchor long in the past, paused plan → none, exact boundary (today included, today + 90 excluded), Beirut midnight (22:30 UTC is already the next business day).
* Status: every illegal transition per role rejected, completed immutable, cancel without reason rejected, stale `expectedVersion` → 409.
* Mocks: empty lists, slow responses, error, denied, technician scope, duplicate completion returns same report, duplicate serial → 409, writes not visible to a fresh adapter instance.

## Acceptance criteria
* [ ] Type all MVP entities and API request/response envelopes
* [ ] Provide pure mock adapters with delay, empty, error and permission-denied variants
* [ ] Specify scheduler recurrence and job status transitions, agreed by lead
* [ ] Contract-level unit tests distinguish mocks from persistence

## Tests and evidence
Intended: npm run test; API contract review

Planned test files in `src/lib/__tests__/`:
* `validations.test.ts`: accept/reject cases above, `fieldErrors` shape.
* `recurrence.test.ts`: golden dates above.
* `job-status.test.ts`: full transition matrix per role.
* `mock-adapters.test.ts`: each scenario per adapter, role denials, idempotent completion, returned objects are copies, fresh instance has no earlier writes, `source === 'mock'` on every mock adapter, mock code imports no network/DB module.
* `fixtures.test.ts`: every fixture parses through its Zod schema (fixtures cannot drift from the contract).
* `contract-types.test.ts`: `expectTypeOf(z.infer<schema>)` equals the DTO type (types and schemas cannot drift).

Commands to run before PR: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `node scripts/harness.mjs check`, `node scripts/ci.mjs`.

Actual commands, date, environment and result (Passed/Failed/Not run/Blocked): NOT RUN
Screenshot/log link: NOT CAPTURED

## Risk, security and UX review
* **Q1 Zod blocker:** if unanswered by D2, start with types, recurrence and the status machine (no Zod needed) and add validations once installed.
* **Late contract changes break three teammates:** draft PR on D3; after merge, changes only through a CR in docs/DECISIONS.md.
* **Mocks are not security:** mock role denials only simulate the UI experience; real authorization is server/RLS in S2 (PC-S2-01/02). Stated in CONTRACTS.md and adapter comments.
* **Recurrence drift between S1 preview and S2 scheduler:** single pure function, moved (not copied) in PC-S2-05.
* **Checklist content** depends on Tarek's PC-S1-04: v1 template is a placeholder shape; Tarek's content replaces it without type changes.
* **Privacy:** synthetic fixtures only; no secrets, env values or images committed.
* **Rollback:** revert the PR; no database, migrations or deployment involved.
* Impeccable: n/a (no UI in this task).

## Handoff
Status: Planned, awaiting Reem's plan approval and answers to Q1–Q7 | Files changed: worklogs/PC-S1-03/plan.md | Next step: Reem reviews plan in Jira KAN-15; Rand runs `npm ci`
