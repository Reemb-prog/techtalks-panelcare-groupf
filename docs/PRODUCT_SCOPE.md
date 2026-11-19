# Product baseline and scope

**PanelCare** helps a single solar maintenance company track installations, warranties and planned service work. Two authenticated roles use one responsive web app: coordinator (records, planning and dispatch) and technician (assigned visits and evidence). Multi-company tenancy is intentionally excluded from the MVP.

## In-scope P0 workflow

1. Coordinator creates a customer with contact details and one or more installation sites.
2. Coordinator registers systems under sites, and inverter, battery or panel component records under systems. Preserve serial numbers, install dates, warranty expiry and component replacement history.
3. Coordinator defines a recurring maintenance plan with anchor date, month frequency, active/paused state, business timezone and scheduling rules.
4. A restricted daily task generates a 90-day rolling window of scheduled jobs idempotently. Coordinator can trigger authorized test generation.
5. Coordinator assigns a generated job to a technician, with scheduled date and visible status.
6. Technician opens only assigned jobs, enters required checklist answers/measurements, optional notes, photo evidence, and customer confirmation.
7. System completes the job once, stores a report linked one-to-one to the job, and coordinator retrieves it.

**P1 if there is spare capacity only:** fault tickets attached to installed systems, warranty alerts and search improvements. Basic warranty visibility and a live dashboard are P0 support for the core journey. **P2 excluded:** inverter telemetry/API, invoicing, payments, warehouse/spares, contract renewals, self-service, native app, drag-and-drop dispatcher and external notifications.

## Critical domain decisions

* One installation/company workspace for MVP. Introduce organizations and tenant policies only through approved change control.
* Date window is the half-open interval [today, today + 90 calendar days), evaluated in the configured business timezone. Persist service occurrence as a DATE and audit timestamps as UTC. Default planning timezone Asia/Beirut is **provisional**, and must be confirmed by product owner before S2.
* Month frequency is based on the original anchor date, not on the previously clamped date. A plan anchored on January 31 has February 28 (or 29) and March 31 for a one-month rule. This **month-end clamp rule needs explicit lead approval** at S1 contract freeze.
* Unique (maintenance_plan_id, scheduled_date) at the database, with conflict-safe insertion. Repeated and concurrent runs cannot create duplicate occurrences.
* Editing a plan can cancel/update only future unassigned generated jobs as governed by explicit rules. Never silently remove completed or assigned/in-progress work. If an earlier canceled date becomes valid again, explicitly reactivate only an eligible unassigned occurrence; preserve audit trail.
* Technician status transitions: assigned → in_progress → completed; cancellation/rescheduling requires coordinator privilege and an auditable explanation. Prevent a second report for completed job.
* Customer confirmation defaults to typed name, acknowledgment checkbox and timestamp; no claim of cryptographic legal signature. Must be confirmed by lead before S1 final UI signoff.
* Photos are private evidence, never embedded in database rows, no publicly shared bucket. Signed retrieval URLs are short-lived.
* First release language: English. Internationalization is a later change request.

## Outcome and validation

Primary objective: 100% expected occurrences across agreed 90-day fixtures, zero duplicate visits under replay and concurrency, and one fully demonstrated registry-to-report journey. Seek feedback from three installers, one observed technician visit and five system owners as project validation goals. Record what was actually accomplished; do not claim interviews that were not performed.

## Assumptions versus unresolved items

Confirmed from supplied proposal: four members, React/Next.js/TypeScript, coordinator and technician UI, P0 workflows, Vercel target, no billing/inverter integration. Proposed: three two-week sprints, single-company data boundary, typed confirmation, Beirut business timezone, monthly clamp, private demo. Unresolved **before production or Jira activation**: real submission deadline, all four Jira/GitHub account mappings, business timezone and recurrence signoff, service photo consent/retention, acceptance of Vercel Hobby noncommercial limits.
