# PC-S1-07 (KAN-19): Maintenance planner and dispatch mock experience

Local task ID: PC-S1-07
Actual Jira issue key and URL: KAN-19 — https://techtalks-panelcare.atlassian.net/browse/KAN-19
Sprint / member / reviewer: S1 / rand / reem
Target main | Review-ready day: D10 (2026-11-29)

## User outcome and boundary

Coordinators can now plan maintenance and dispatch visits on the S1 mock data.

**Maintenance planner (`/maintenance`)**
- Plans list with search and status filter, next visit and plain-English schedule ("Every month from 31 Jan 2026 (shorter months use their last day)").
- New plan (`/maintenance/new`, optional `?systemId=`): system, interval (presets or 1–60 months), first visit date, Asia/Beirut shown read-only, live preview of the next 6 dates marked "Next 90 days" / "Later".
- Plan detail (`/maintenance/:id`): context, schedule, preview, the plan's visits linking to dispatch, pause/resume behind a confirm dialog that states the effect.
- Edit schedule (`/maintenance/:id/edit`): sends only changed fields with `expectedVersion`; an impact warning before saving says how many visits would be added, cancelled (unassigned) or kept as conflicts (assigned).
- Simulated generation for all plans or one plan, with a result summary and links to conflicting visits.

**Dispatch board (`/jobs`)**
- Counts and date range; filters for status, from/to and technician (including "Not assigned"), all kept in the URL (`?status=…&technician=…&from=…&to=…&job=…`) so other screens can deep-link.
- Jobs table with **Overdue** and **Double-booked** flags (double booking checked against every assigned/in-progress visit, not just the page).
- Visit panel (dialog): details, plan and system links, and only the actions the approved status machine allows: assign (warns before a double booking), unassign, reschedule, cancel, reactivate. Reasons required where the contract requires them. A 409 shows "Nothing was changed" with **Reload job**. Completed visits are read-only and link to their report.

Both screens show a **"Scheduling is simulated"** notice, plus loading, error (Try again), permission-denied and empty states; technicians get a "for coordinators" panel with a link to My jobs.

**Not changed:** contract, adapters, recurrence policy, tokens, shell/nav, dashboard, registry. Status labels and date formatters are imported read-only from `src/features/dashboard/dashboard-view.ts` for consistent wording.

**Acceptance criteria**
- [x] Plan create/pause/resume/edit with date preview, mock jobs and clear recurrence text
- [x] Dispatch table filters status/date/technician; assignment state and conflicts visible
- [x] Demo warns scheduling is simulated until S2 service is linked

## Approved plan and dependencies

Plan: `worklogs/PC-S1-07/plan.md`, self-approved by Rand on 2026-11-27 (routine task inside its own paths, D11).
Dependencies merged: PC-S1-01, PC-S1-02, PC-S1-03 (and PC-S1-05 for the shell and `useAdapters`). No change request.

## Test evidence (do not claim unexecuted checks)

Commands, environment and exact result for lint / TypeScript / tests / build (2026-11-27, Windows 11, Node 24.21.0):
- `node scripts/ci.mjs`: **Passed** (harness validate, lint, typecheck, 166 unit tests in 16 files, production build).
- New unit tests: `src/features/maintenance/__tests__/planner-view.test.ts` (12) and `src/features/dispatch/__tests__/dispatch-view.test.ts` (16): **Passed**. They cover the preview (month-end clamp, window marking, future anchor, incomplete input), edit/pause impact, generation summary, URL filters (round-trip and bad values), overdue/double-booked flags, allowed actions per status, and conflict wording.
- `node scripts/harness.mjs check`: **Passed**.
- E2E `src/app/__e2e__/maintenance.spec.ts` and `src/app/__e2e__/dispatch.spec.ts` (desktop + mobile): **Blocked, not run.** The Playwright Chromium build for the installed Playwright version is not downloaded on the author's machine (slow connection). No assertion has run. **Reviewer: please run `npx playwright test src/app/__e2e__/maintenance.spec.ts src/app/__e2e__/dispatch.spec.ts`**, or the author will run it once the download is possible and update this PR.

Manual desktop/mobile or Impeccable critique output and screenshots for UI:
- Manual walkthrough in the built-in browser (`next dev`, desktop): generation ("3 visits added, 4 already existed"); edit with impact warning "3 added / 1 cancelled / 1 needs decision"; generation then produced exactly that; conflict link opened the visit in dispatch; reschedule onto a taken date refused with "Nothing was changed" and Reload job. **Passed.**
- 375 px: found and fixed a horizontal page scroll on `/jobs` (screen-reader-only table header escaped the scroll box). After the fix, `/jobs`, `/maintenance`, `/maintenance/new` and plan detail have no horizontal scroll. 768 px not checked separately.
- Screenshots: **[FILL: attach screenshots of /maintenance and /jobs at 375, 768 and 1440 px]**
- Impeccable critique: not run (not installed in this environment).

Real API/DB/RLS/storage/scheduler tests for backend, when applicable: N/A in S1. All data is the mock adapter set; role checks on these screens are UI cues only, not security.

Security/privacy review and image manifest entries, if applicable: no images, no secrets, synthetic fixtures only. URL parameters carry only filter values and record IDs, no personal data; bad values are dropped with a visible note.

## Edge cases and rollback

Empty/loading/error/denied/retry/concurrency: every load has loading, error with Try again, denied (scenario or technician) and empty states. Forms block double submit, focus the first invalid field and save nothing on validation failure. Stale `expectedVersion` and taken dates (409) are shown with a reload action; nothing is saved. Bad URL filters never crash the board.

Migration or rollback impact: none. New routes and feature folders only; revert the PR.

## Human reviewer

Reviewer name (must not be author): Reem W. Basho
Result and follow-up: **[FILL: Reem's review result]**

Notes for the reviewer:
- The double-booking flag and assign warning use the mock data only; S2 dispatch (PC-S2-06) should keep the same rule on the server.
- Plan-edit conflict handling beyond the simulated generator stays deferred (PC-S2-04 deferred scope); the warning describes the simulated behavior.
- Reem's dashboard cards can now link to filtered dispatch views, e.g. `/jobs?status=scheduled&technician=unassigned`.

Checklist:

* [x] Plan written before code (human-approved if decision-level, per D11)
* [x] Work within allowed paths and acceptance tests
* [x] Actual checks passed or explicitly marked Blocked
* [x] No secrets/PII/unlicensed imagery
* [ ] Jira linked, reviewer requested, evidence captured
* [ ] Rebase/retest after main changed
