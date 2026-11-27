# PC-S1-07: Maintenance planner and dispatch mock experience

Sprint: S1 | Owner: rand | Reviewer: reem
Jira key: KAN-19 | PR: not opened (assistant writes it when review-ready) | Planned start D5, review-ready day: D10 (2026-11-29)
Plan review: Self-approved (routine task inside its own allowed paths, D11; no contract, recurrence-policy, token or shared-file change) | Approver: Rand | Date: 2026-11-27
Schedule note: started D8 (2026-11-27), three days late; reported to Reem at standup. Target review-ready PR on D10.

## Goal and scope
Two coordinator screens on the S1 mock adapters:
1. **Maintenance planner** (`/maintenance`): list plans, create a plan, view a plan, edit its schedule, pause/resume, preview upcoming dates with plain-English recurrence text, and run a simulated job generation.
2. **Dispatch board** (`/jobs`): filter jobs by status, date range and technician; see assignment state, overdue and double-booked conflicts; open a job to assign, unassign, reschedule, cancel or reactivate it.

Both screens say clearly that scheduling is **simulated until the S2 scheduler is linked**.

Out of scope: any change to the contract, adapters, recurrence policy, tokens, shell/nav (`src/components/layout/`), the dashboard or registry screens; real persistence; technician-side screens (PC-S1-08).

## Dependencies to confirm merged
PC-S1-01, PC-S1-02, PC-S1-03: all merged on main (checked 2026-11-27). PC-S1-05 (shell, `useAdapters`) also merged.

## Allowed paths
* src/app/(dashboard)/maintenance/
* src/app/(dashboard)/jobs/
* src/features/maintenance/
* src/features/dispatch/
* src/app/__e2e__/maintenance.spec.ts, src/app/__e2e__/dispatch.spec.ts (shared E2E folder, own specs only)

## Implementation plan

### Reused, not changed
* Data: `useAdapters()` from the PC-S1-05 shell (`adapters.maintenance`, `adapters.dispatch`, `adapters.registry.listSystems`), re-fetching on `dataVersion`.
* Rules: `describeRecurrence`, `nthOccurrence`, `occurrencesInWindow` (recurrence policy), `evaluateTransition` (status machine), Zod `createPlanSchema` / `updatePlanSchema` / `jobPatchSchema`.
* Look: Tailwind `pc-*` token utilities as in the dashboard; status labels, tones and date formatters imported read-only from `src/features/dashboard/dashboard-view.ts` so all screens say "Unassigned / Assigned / In progress" the same way.

### Files
| File | Purpose |
| --- | --- |
| `src/app/(dashboard)/maintenance/page.tsx`, `new/page.tsx`, `[planId]/page.tsx`, `[planId]/edit/page.tsx` | Thin route files |
| `src/app/(dashboard)/jobs/page.tsx` | Thin route file (Suspense for query params) |
| `src/features/maintenance/planner-view.ts` | Pure logic: interval presets, upcoming-date preview (marks dates inside the 90-day window), edit/pause impact (visits added, cancelled, needing a decision), generation summary text |
| `src/features/maintenance/ui.tsx` | Small shared pieces for both screens: page header, chip, panel, loading/error/denied/empty states, simulated-scheduling notice, `useQuery` helper |
| `src/features/maintenance/plan-list-screen.tsx` | Plans table + status filter + "New plan" + simulated generation panel |
| `src/features/maintenance/plan-form.tsx` | Create/edit form with live preview and impact warning |
| `src/features/maintenance/plan-detail-screen.tsx` | Context, rule, preview, plan's visits, pause/resume (confirm dialog), edit, generate for this plan |
| `src/features/dispatch/dispatch-view.ts` | Pure logic: URL filters parse/serialise, overdue + double-booked annotation, allowed actions per job (from the status machine), technician load on a date, error wording |
| `src/features/dispatch/dispatch-screen.tsx` | Counts + date range, filters, jobs table, pagination |
| `src/features/dispatch/job-drawer.tsx` | Job detail dialog with action forms and conflict messages |

### Sections (DESIGN_BLUEPRINT order)
* **Planner:** 1 system context, 2 frequency / anchor / timezone (Asia/Beirut, read-only), 3 next-occurrences preview with recurrence sentence, 4 pause/edit impact warning, 5 job-generation state and result.
* **Dispatch:** 1 counts and date range, 2 filters (status chips, from/to, technician incl. "Unassigned"), 3 compact jobs table (date + overdue, customer/site/system, technician, status), 4 detail drawer (`<dialog>`), 5 action forms with conflict messages.
* No imagery on either screen (blueprint).
* Filters live in the URL (`/jobs?status=scheduled&technician=unassigned&from=…&to=…&job=<id>`) so the dashboard can later deep-link (Reem's PC-S1-05 note).

### Conflicts shown
* **Overdue:** open job dated before today (danger chip).
* **Double-booked:** same technician, same date, two or more assigned/in-progress jobs (warning chip; also warned in the assign form before saving).
* **Stale edit:** 409 from a stale `expectedVersion` or a taken date. The message is shown with a "Reload job" action; nothing is saved.
* **Generation conflicts:** assigned/in-progress visits a plan edit no longer produces, listed after generation with links to the job in dispatch.

## Edge cases
* Loading skeleton; `error` scenario → message + Try again; `denied` → access panel; `slow` → loading state stays usable; `empty` → "No plans yet" with create action / "No visits match" with clear filters.
* Technician session on either route → denied panel with link to My jobs (UI cue only, not security).
* Invalid form input → field errors from the Zod schemas, focus on first invalid field, nothing saved. Double-submit blocked while saving.
* Invalid URL filters (bad status, bad date, from after to) → ignored or shown as a filter error; never crashes.
* Unknown plan or job id → "not found" panel with a way back.
* Reactivate only offered for unassigned cancelled jobs; completed jobs show no actions.

## Acceptance criteria
* [ ] Plan create/pause/resume/edit with date preview, mock jobs and clear recurrence text
* [ ] Dispatch table filters status/date/technician; assignment state and conflicts visible
* [ ] Demo warns scheduling is simulated until S2 service is linked

## Tests (docs/TESTING.md: lowest layer that catches the bug; happy, misuse and error paths)
Task test hint: Component tests for state changes and accessibility; mocked dispatch journey
* Unit (`src/features/maintenance/__tests__/planner-view.test.ts`, `src/features/dispatch/__tests__/dispatch-view.test.ts`):
  * preview: next dates from the original anchor with month-end clamp, window marking, anchor in the future; paused plan still previews.
  * edit impact: unassigned visits cancelled, assigned ones flagged, new dates added; pause changes nothing.
  * filters: URL round-trip, invalid values dropped, default open statuses.
  * annotations: overdue and double-booked (misuse: different dates/technicians not flagged; completed/cancelled ignored).
  * allowed actions per status match the approved status machine; completed → none.
* Integration: none new. The screens call the existing mock adapters, whose behavior (409s, role denials, generation) is covered by `src/lib/__tests__/mock-adapters.test.ts`.
* E2E (`maintenance.spec.ts`, `dispatch.spec.ts`, desktop + mobile projects): create a plan with preview → appears in list; pause/resume; simulated generation result; dispatch filter by unassigned → assign → status chip changes; reschedule onto a taken date shows the conflict; empty, error and denied scenarios; technician sees denied.
* Component rendering tests (jsdom): not set up in the repo (TESTING.md). UI logic is extracted into the pure view files instead; rendering is covered by E2E.
* Skipped paths: none.

## Evidence (Passed/Failed/Not run/Blocked; never claim an unexecuted check)
2026-11-27, Windows 11, Node 24.21.0:
* Unit, `npx vitest run src/features/maintenance src/features/dispatch`: **Passed**, 28 tests (planner-view 12, dispatch-view 16).
* `node scripts/harness.mjs check`: **Passed** (19 changed paths in scope).
* Full run, `node scripts/ci.mjs`: **Passed** (harness validate, lint, typecheck, 166 unit tests in 16 files, production build).
* E2E, `npx playwright test src/app/__e2e__/maintenance.spec.ts src/app/__e2e__/dispatch.spec.ts`: **Blocked**. All 20 runs failed before opening a page: the Chromium build for the installed Playwright version is not downloaded on this machine (`npx playwright install chromium` needed, developer approval pending). No app assertion ran.
* Manual (built-in browser, `next dev`, desktop width): planner list, simulated generation for all plans ("3 visits added, 4 already existed"), edit with impact warning (3 added / 1 cancelled / 1 needs decision), save (revision 2), generation for the plan matching the warning, conflict link opening the dispatch drawer, reschedule onto a taken date refused with "Nothing was changed" + Reload job. **Passed.**
* Manual 375 px: found and fixed horizontal page scroll on /jobs (screen-reader-only table header escaped the scroll box); after the fix /jobs, /maintenance, /maintenance/new and plan detail have no horizontal scroll. 768 px: not checked separately. Real screenshots for the PR: not captured.
* Impeccable critique: not run (not installed in this environment).

## Risk, security and UX review
* Late start: two days to PR. If short on time, cut polish (not states or tests) and say so in the PR.
* Mock role checks are UX only; real authorization arrives in S2 (PC-S2-04/06).
* Importing labels/formatters from the dashboard feature couples the screens: intended for consistent wording; a change there should be reviewed for these screens too.
* Plan edit conflict rules beyond the simulated generator are deferred (PC-S2-04 deferred scope); the impact warning describes the simulated behavior only.
* Impeccable critique: TO RUN on the finished screens.

## Developer review guide (assistant updates after every run; see CLAUDE.md)
Review next (file:line and what to check):
* `src/features/maintenance/planner-view.ts` `planImpact`: must match what the mock generator does (cancel unassigned, keep assigned as conflicts, paused changes nothing).
* `src/features/dispatch/dispatch-view.ts` `allowedActions`: reuses the approved status machine; check the action list per status in `dispatch-view.test.ts`.
* `src/features/dispatch/job-drawer.tsx` `ActionForm.submit`: always sends `expectedVersion`; on 409 shows "Nothing was changed" + Reload job.
* `src/features/maintenance/plan-form.tsx` edit path: only changed fields are sent; "Nothing changed" when the form is untouched.
* Wording of the "Scheduling is simulated" notice in `src/features/maintenance/ui.tsx` `SimulatedNotice`.
Developer to fill or decide:
* Approve downloading the Playwright Chromium browser (`npx playwright install chromium`, ~150 MB from Microsoft's CDN) so the E2E specs can run.
* Real screenshots of /maintenance and /jobs at 375, 768 and 1440 px for the PR.
* Jira KAN-19: In Progress now; In Review once the PR is open.

## Handoff
Status: Implemented, pushed (3d77d71); PR text written in pr.md; E2E blocked (developer declined the ~150 MB browser download on 2026-11-27 because of a slow connection) | Files changed: route files, features/maintenance, features/dispatch, two E2E specs, this worklog, pr.md | Next step: run E2E when the connection allows (or a reviewer runs them), add screenshots, open the PR by D10 (2026-11-29).
