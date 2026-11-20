# Contract-first data and API blueprint

**Status:** S1 contract delivered in PC-S1-03 (Rand), recurrence policy D05 and job status machine approved by Reem on 2026-11-20. **Frozen at PC-S1-03 merge**: any change to a type, schema, status code, enum or rule below needs a CR in [DECISIONS.md](DECISIONS.md) and lead signoff, because three S1 screens and every S2 handler build on it. Final freeze is confirmed in PC-S1-09. This text defines behavior; it is not a running service.

**Source of truth in code:**

| What | Where |
| --- | --- |
| Entity, request and response types | `src/types/` (import from `@/types`) |
| Request validation (Zod 4) and error helpers | `src/lib/validations/` |
| Job status machine | `src/lib/validations/job-status.ts` |
| Recurrence policy (pure) | `src/lib/adapters/maintenance/recurrence.ts` (moves to `src/lib/scheduler/` in PC-S2-05) |
| Adapter interfaces (mock and real implement the same) | `src/types/adapters.ts` |
| S1 mock adapters and scenarios | `src/lib/adapters/` (`createMockAdapters`) |
| Synthetic fixtures | `src/lib/fixtures/` |

Types and Zod schemas are hand-written separately; `src/lib/__tests__/contract-types.test.ts` fails the typecheck if they drift.

## Entities and relationships

Wire format is camelCase JSON; the database (PC-S2-01) uses snake_case. Dates of service are `IsoDate` ("YYYY-MM-DD", no time); audit fields are `IsoDateTime` (UTC ISO with "Z").

1. `profiles`: Auth UID, display name, email, role coordinator|technician, active.
2. `customers`: UUID, display name, contact email/phone (nullable), created/updated timestamps.
3. `sites`: UUID, customer_id, label, address_line1, address_line2, city, region, postal_code, country (ISO alpha-2), notes.
4. `solar_systems`: UUID, site_id, label, capacity_kw (DECIMAL, > 0, max 3 decimals; JSON number), installed_on (DATE), active status.
5. `components`: UUID, system_id, type inverter|battery|panel|other, manufacturer/model, serial number (unique, case-insensitive), installed_on, warranty_expires_on (nullable, not before installed_on), status active|replaced|retired, replaced_component_id nullable (on the NEW row, pointing to the row it replaced). Never overwrite old component on replacement.
6. `maintenance_plans`: UUID, system_id, interval_months (integer 1–60), anchor_date, timezone, status active|paused, created/updated timestamps, revision (bumps when interval or anchor changes), version (bumps on every change).
7. `maintenance_jobs`: UUID, plan_id, system_id, scheduled_date DATE, technician_id nullable, status scheduled|assigned|in_progress|completed|cancelled, version, last_change_reason, completed_at, created/updated timestamps and mutation audit; UNIQUE(plan_id, scheduled_date) irrespective of status.
8. `inspections`: UUID, job_id unique, checklist_version, answers JSONB validated against the versioned checklist template (measurements are `number` items whose unit comes from the template), notes, confirmation (typed name, acknowledged, confirmed_at), submitted_at, idempotency_key (stored, never returned).
9. `inspection_photos`: UUID, job_id (inspection_id once submitted), private storage_path, mime type, size, caption; blobs live in Supabase Storage, never base64 in SQL. The storage path is never returned to clients; they get a short-lived signed `url` (null in S1 mocks).
10. `service_reports`: UUID, job_id UNIQUE, inspection_id, report_snapshot JSONB and generated_at; the snapshot copies customer/site/system/components/checklist values at completion so later edits never rewrite history.
11. `fault_tickets`: P1 only if accepted, system_id, description, priority, status. Typed in `src/types/fault-tickets.ts` for reference; no adapter or route in the MVP.

MVP single-workspace deployment. If organizations are needed, add `organization_id` plus tested RLS before accepting another company.

## REST API and roles

| Route | Coordinator | Technician | Behavior | Adapter method |
| --- | --- | --- | --- | --- |
| GET/POST /api/customers | read/write | 403 | filter/sort/create | `registry.listCustomers`, `createCustomer` |
| GET /api/customers/:id | read | 403 | customer with sites and systems | `registry.getCustomer` |
| POST /api/sites | write | 403 | site bound to valid customer | `registry.createSite` |
| GET/POST /api/systems | read/write | 403 | list/register with components | `registry.listSystems`, `createSystem` |
| GET /api/systems/:id | read | 404 unless they hold a non-cancelled job on it | detail, warranty, component history, plans | `registry.getSystem` |
| POST /api/components | write | 403 | add or replace (history kept) | `registry.createComponent` |
| GET/POST /api/maintenance-plans | read/write | 403 | list/create | `maintenance.listPlans`, `createPlan` |
| GET/PATCH /api/maintenance-plans/:id | read/write | 403 | edit/pause/resume with expectedVersion | `maintenance.getPlan`, `updatePlan` |
| POST /api/maintenance/generate | authorized manual generation | 403 | server-only job generator; scheduled variant separately secret-protected | `maintenance.generateJobs` |
| GET /api/jobs | all jobs | own assigned jobs only, whatever the filters | filtered list | `dispatch.listJobs` |
| GET /api/jobs/:id | read | own only, else 404 | job with joined labels | `dispatch.getJob` |
| PATCH /api/jobs/:id | assign/unassign/reschedule/cancel/reactivate | start own job only | one action per request, expectedVersion | `dispatch.updateJob` |
| GET /api/technicians | read | 403 | technicians for assignment (**added in PC-S1-03**) | `dispatch.listTechnicians` |
| POST /api/photos | 403 | own open job only | register photo metadata, then upload to private storage (S2) (**added in PC-S1-03**) | `inspections.registerPhoto` |
| POST /api/jobs/:id/complete | 403 | assigned technician only | transactional inspection and report, idempotent | `inspections.completeJob` |
| GET /api/checklist-template | read | read | current checklist template (**added in PC-S1-03**) | `inspections.getChecklistTemplate` |
| GET /api/reports/:id | read | own job only, else 404 | private evidence | `inspections.getReport` |
| GET /api/dashboard/stats | read | 403 | real derived metrics (live version deferred, PC-S3-05) | `dashboard.getStats` |

Use Next.js Route Handlers, `parseRequest(schema, body)` from `src/lib/validations`, and structured error objects `{error:{code,message,fieldErrors?}}`; validate on both sides with server as authority. Do not return raw database/RLS error details to clients. The client never sends its own role: handlers derive the session on the server.

### Error codes and HTTP status

| Code | HTTP | When |
| --- | --- | --- |
| VALIDATION_FAILED | 400 | Input fails a schema or a business rule on a field; `fieldErrors` keys are dot paths such as `components.0.serialNumber`, or `_form` for whole-form errors |
| UNAUTHENTICATED | 401 | No session or expired session; wrong sign-in credentials (one generic message) |
| FORBIDDEN | 403 | The caller's role may never use this route or action |
| NOT_FOUND | 404 | Object missing **or outside the caller's scope** (Q4: technicians cannot probe other jobs/reports/systems) |
| CONFLICT | 409 | Stale `expectedVersion`, duplicate (plan, date), duplicate serial, illegal status transition, job already completed, checklist version changed |
| INTERNAL | 500 | Unexpected failure; generic message only |

Success: 200 for reads, updates and idempotent replays; 201 for creates and first completion.

### Lists

Every list accepts `page` (1-based, default 1), `pageSize` (1–100, default 20), `q` (free text) and `sortDirection` (asc|desc), and returns `{ items, page, pageSize, total }`. Extra filters: customers `sort` displayName|createdAt; systems `customerId`, `siteId`; plans `systemId`, `status`; jobs `status[]`, `from`/`to` (inclusive), `technicianId` (UUID or "unassigned"), `planId`.

### Concurrency and idempotency (Q5)

* Plans and jobs carry `version`. Every PATCH sends `expectedVersion`; a mismatch returns 409 and the UI asks the user to reload.
* `POST /api/jobs/:id/complete` carries a client-generated `idempotencyKey` (UUID, reused on retry). The same key on a completed job returns the same report (200); a different key returns 409. Exactly one report per job.

## Job status machine (Q3, approved)

| Action | Who | From | To | Notes |
| --- | --- | --- | --- | --- |
| assign | coordinator | scheduled, assigned | assigned | active technician only; reassign keeps status |
| unassign | coordinator | assigned | scheduled | |
| reschedule | coordinator | scheduled, assigned | unchanged | reason required; date must be today or later and unused by the same plan |
| start | assigned technician | assigned | in_progress | |
| complete | assigned technician | in_progress | completed | only via POST /api/jobs/:id/complete |
| cancel | coordinator | scheduled, assigned, in_progress | cancelled | reason required; releases the technician |
| reactivate | coordinator | cancelled | scheduled | reason required; only if unassigned and never completed |
| anything | anyone | completed | none | completed jobs are immutable |

Check order: job not visible to the caller → 404; role not allowed → 403; wrong current status → 409; missing reason → 400.

## Recurrence policy (D05, approved)

* Business timezone **Asia/Beirut** (only allowed value in the MVP). "Today" is the calendar date in that timezone (22:30 UTC on Nov 20 is already Nov 21 in Beirut).
* Occurrence k = **anchor date + k × interval months**, always computed from the **original anchor**, with the day clamped to the target month's last day.
* Window is half-open **[today, today + 90 days)**. Occurrences are stored as DATE.
* Paused plans produce no occurrences.

Golden examples (tested in `src/lib/__tests__/recurrence.test.ts`):

| Plan | Today | Occurrences in window |
| --- | --- | --- |
| monthly from 2027-01-31 | 2027-01-31 | 01-31, 02-28, 03-31, 04-30 |
| monthly from 2028-01-31 | 2028-02-01 (30-day window) | 2028-02-29 |
| yearly from 2028-02-29 | 2029-01-01 | 2029-02-28 (and 2032-02-29 in 2032) |
| every 3 months from 2026-11-30 | 2026-11-20 (120-day window) | 2026-11-30, 2027-02-28 |
| every 3 months from 2026-11-18 | 2026-11-20 | none (2027-02-18 is the excluded end) |
| every 3 months from 2026-11-17 | 2026-11-20 | 2027-02-17 |

## Atomic scheduler contract

* Inputs: business date and timezone, active plan records and [today, today+90 days) window, using the recurrence policy above.
* Atomic upsert/insert: database UNIQUE(plan_id, scheduled_date) prevents duplicates; conflict-safe insert in transaction; test two concurrent invocations and process restart.
* Paused plans: no new occurrences. Completed: immutable. Assigned/in_progress jobs the plan no longer produces: retain, report as a conflict (`assigned_job_no_longer_valid` / `in_progress_job_no_longer_valid`), require coordinator decision. Future unassigned scheduled occurrences no longer valid are cancelled with an audit reason.
* A previously canceled occurrence becoming valid again may be reactivated only if unassigned, not completed, with recorded audit. Never create a second row at same plan/date.
* Manual generation: coordinator session with explicit permissions. Scheduled trigger: separate `GET /api/cron/maintenance` route, accepts a secret in Authorization: Bearer header, rejects missing/invalid secret; no browser-accessible secret. Do not expose service-role credentials to public requests.
* Result (`GenerationRunResult`): run ID, business date, window end, counts inserted/skipped/cancelled/failed, conflicts list and timestamp, without customer PII. Retry is safe. If service errors, fail visibly and allow a coordinator to run the protected manual endpoint.

## Example state/negative checks

* Technician cannot access another technician's job, enumerate customer records or change assignment.
* Coordinator cannot silently delete a completed report.
* Missing required serial number, invalid warranty date, negative capacity and unauthorized component replacement receive structured validation or permission failures.
* Completion submitted twice yields the same single report rather than two reports; photo upload failure does not mark job completed without coherent data.
* One-month plan anchored January 31 yields February 28 (or 29), March 31; tests include year boundary and timezone/DST where applicable.

## Checklist, confirmation and photos

* Checklist template shape (`ChecklistTemplate`): version, title, items with id, label, kind boolean|number|text|choice, required, unit, min/max, options. **Content is a placeholder until PC-S1-04 (Tarek)**; changing items or bumping the version needs no type change. Completion against an outdated version returns 409.
* Customer confirmation (D06 proposal, final wording at S1 UX signoff): typed name (2–120 characters), acknowledged = true, confirmedAt set by the server. Not a legal signature.
* Photos: JPEG, PNG or WebP, at most 5 MB each (target about 1 MB), at most 10 per job. Retention and consent policy pending D07.

## Mock boundary

S1 mock adapters implement exactly the same TypeScript interfaces as intended APIs (`source: "mock"`). Scenarios: `ok`, `empty` (no records; people and checklist remain), `slow` (2.5 s), `error` (500 on every call), `denied` (403 on every signed-in call), selectable through `createMockAdapters({ scenario })` or `controls.setScenario()`. Mock role checks only reproduce the expected UX; **they are not authorization**. Each mock instance holds its own copy of synthetic fixtures and persists nothing. They are never silently imported in production after the S2 release signoff (PC-S3-09). In S2 each owner first tests their API directly, then swaps their own screens to real adapters and audits contract drift; the cross-role E2E smoke (PC-S3-07) then runs against the real backend.
