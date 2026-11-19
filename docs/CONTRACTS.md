# Contract-first data and API blueprint

**Status:** reviewed proposal for S1. Rand authors the exact DTO and Zod schemas in PC-S1-03, with Reem signoff before page teams implement. This text defines behavior; it is not a running service.

## Entities and relationships

1. \`profiles\`: Auth UID, display name, email, role coordinator|technician, active.
2. \`customers\`: UUID, display name, contact email/phone, created/updated timestamps.
3. \`sites\`: UUID, customer_id, label, address fields, notes.
4. \`solar_systems\`: UUID, site_id, label, capacity_kw (DECIMAL), installed_on (DATE), active status.
5. \`components\`: UUID, system_id, type inverter|battery|panel|other, manufacturer/model, serial number, installed_on, warranty_expires_on, status active|replaced|retired, replaced_component_id nullable. Never overwrite old component on replacement.
6. \`maintenance_plans\`: UUID, system_id, interval_months (positive integer), anchor_date, timezone, status active|paused, created/updated timestamps, revision. Recurrence policy requires signoff.
7. \`maintenance_jobs\`: UUID, plan_id, scheduled_date DATE, technician_id nullable, status scheduled|assigned|in_progress|completed|cancelled, created timestamps and mutation audit; UNIQUE(plan_id, scheduled_date) irrespective of status.
8. \`inspections\`: UUID, job_id unique, checklist JSONB validated against an explicit versioned template, measurements numeric with units, notes, acknowledged_by, acknowledged_at, submitted_at.
9. \`inspection_photos\`: UUID, inspection_id, private storage_path, type, size, caption; blobs live in Supabase Storage, never base64 in SQL.
10. \`service_reports\`: UUID, job_id UNIQUE, inspection_id, report_snapshot JSONB and generated_at; no mutable references that rewrite historical context.
11. \`fault_tickets\`: P1 only if accepted, system_id, description, priority, status.

MVP single-workspace deployment. If organizations are needed, add \`organization_id\` plus tested RLS before accepting another company.

## REST API and roles

| Route | Coordinator | Technician | Behavior |
| --- | --- | --- | --- |
| GET/POST /api/customers | read/write | denied | filter/sort/create |
| GET /api/customers/:id | read | denied | customer/site summary |
| POST /api/sites | write | denied | site bound to valid customer |
| GET/POST /api/systems | read/write | denied | list/register and components |
| GET /api/systems/:id | read | assigned-only if required for job | detail and warranty |
| POST /api/components | write | denied | add/replace historical component |
| GET/POST /api/maintenance-plans | read/write | denied | list/create |
| PATCH /api/maintenance-plans/:id | write | denied | edit/pause/resume |
| POST /api/maintenance/generate | authorized manual generation | denied | server-only job generator; scheduled variant separately secret-protected |
| GET /api/jobs | all scoped jobs | assigned only | filtered list |
| PATCH /api/jobs/:id | assign/status | only allowed own transition | rejects stale/conflicting state |
| POST /api/jobs/:id/complete | optional override with audit | assigned technician only | transactional inspection and report |
| GET /api/reports/:id | read | own job only | private evidence |
| GET /api/dashboard/stats | read | denied | real derived metrics |

Use Next.js Route Handlers, Zod parse and structured error objects \`{error:{code,message,fieldErrors?}}\`; validate on both sides with server as authority. Record exact DTO shapes, stable status enums, filters, pagination and HTTP status codes before coding. Do not return raw database/RLS error details to clients.

## Atomic scheduler contract

* Inputs: business date and timezone, active plan records and [today, today+90 days) window. Compute expected occurrences from **anchor date + N × interval months**, clamp day if missing (pending signoff).
* Atomic upsert/insert: database UNIQUE(plan_id, scheduled_date) prevents duplicates; conflict-safe insert in transaction; test two concurrent invocations and process restart.
* Paused plans: no new occurrences. Completed: immutable. Assigned/in_progress: retain, surface conflict, require coordinator decision. Future unassigned scheduled occurrences no longer valid may be canceled and audited.
* A previously canceled occurrence becoming valid again may be reactivated only if unassigned, not completed, with recorded audit. Never create a second row at same plan/date.
* Manual generation: coordinator session with explicit permissions. Scheduled trigger: separate \`GET /api/cron/maintenance\` route, accepts a secret in Authorization: Bearer header, rejects missing/invalid secret; no browser-accessible secret. Do not expose service-role credentials to public requests.
* Recoverability: log run ID, count inserted/skipped/conflicts/failed and timestamp without customer PII. Retry is safe. If service errors, fail visibly and allow a coordinator to run the protected manual endpoint.

## Example state/negative checks

* Technician cannot access another technician's job, enumerate customer records or change assignment.
* Coordinator cannot silently delete a completed report.
* Missing required serial number, invalid warranty date, negative capacity and unauthorized component replacement receive structured validation or permission failures.
* Completion submitted twice yields the same single report rather than two reports; photo upload failure does not mark job completed without coherent data.
* One-month plan anchored January 31 yields February 28 (or 29), March 31; tests include year boundary and timezone/DST where applicable.

## Mock boundary

S1 mock adapters implement exactly the same TypeScript interfaces as intended APIs; latency, errors, permission denial and empty scenarios are selectable. They are never silently imported in production after S3 signoff. S2 tests API directly without a UI. S3 swaps adapters, audits contract drift, then runs real two-role E2E.
