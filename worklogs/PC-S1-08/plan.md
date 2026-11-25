# PC-S1-08: Technician mobile UI, checklist, photo and report mocks

Sprint: S1 | Owner: Tarek | Reviewer: Mahdi
Jira: [KAN-20](https://techtalks-panelcare.atlassian.net/browse/KAN-20) | PR: not opened
Planned start: D5 (Nov 24, 2026) | Review-ready target: D10 (Nov 29, 2026)
Branch: `s1/tarek/pc-s1-08` | Base: `49b91e4`
Plan prepared: Nov 25, 2026 | Owner plan approval: Tarek, Nov 25, 2026
Current implementation authorization: Phase 1 only, once gates are satisfied

## Goal and scope

Build the five-screen Sprint 1 technician journey using the existing typed mock adapters.
Start from [the technician design](../../docs/design/technician.md) and use the
[design blueprint](../../docs/DESIGN_BLUEPRINT.md) for layout, tokens and states.
Use synthetic job data and optional local previews of test photos. Real sign-in,
a backend, file uploads, persistent drafts and offline storage are outside Sprint 1.

## Dependencies and approvals

| Dependency | Evidence on main |
| --- | --- |
| PC-S1-01 — Next.js scaffold and checks | Merge `ae9decd` |
| PC-S1-02 — Design blueprint and tokens | Merge `9ba5934` |
| PC-S1-03 — Frozen contract, mocks and validation | Merge `458c6a4` |
| PC-S1-04 — Technician design and contract follow-up | Merges `2e45956` and `ff40f3c` |
| PC-S1-05 — Existing shell and demo login used by this plan | Merge `060f8ed` |

The lead’s [progress log](../../progress.md) records PC-S1-01 through PC-S1-04 as
Done. Live Jira was unavailable during the preflight. Confirm KAN-20’s assignment,
sprint and readiness in Jira before implementation.

- **Permission to implement:** Tarek reports that Reem gave him permission to
  proceed after the technician design PR merged. The original message and date
  were unavailable for inspection. Git confirms the design and follow-up merges.
- **Visual direction:** Pending verification. The technician design and its
  [worklog](../PC-S1-04/plan.md#handoff) still list this approval as pending.
  The [lead progress log](../../progress.md) requires Reem’s visual-direction
  approval before PC-S1-08 screen work. Record the original message if it also
  approves the technician visual direction, or record Reem’s clarification.
- **Plan approval:** Tarek approved the plan and the task-owned Playwright path
  on Nov 25, 2026. This is routine owner self-approval under
  [D11](../../docs/DECISIONS.md#decisions-approvals-and-material-change-control).
  Authorization to start is limited to Phase 1 after the start gates are met.
  Changes to shared auth, contracts, design tokens or other shared files require
  separate lead approval and coordination with the file owner.
- **PR review:** Mahdi is the assigned non-author reviewer. Record the actual
  review result before closing the issue.
- **Open decisions:** Use the frozen mock’s typed name and acknowledgment checkbox.
  Final acknowledgment wording stays pending under D06. Photo consent and retention
  stay pending under D07 and apply before collecting real photo evidence.

### Phase 1 start gates

| Gate | Status |
| --- | --- |
| Task branch and planned start | Verified. The branch is based on live `main` at `49b91e4`. D5 (Nov 24) has passed. |
| Dependencies | PC-S1-01 through PC-S1-04 are merged on main and recorded as Done in the lead’s progress log. PC-S1-05 is also merged. |
| Owner plan and test path | Approved by Tarek. The task-owned spec is within the repository’s test exception and the user-approved scope. |
| Live Jira | Unavailable. The repository baseline lists the task, assignee, sprint and dependencies. |
| Visual direction | Unverified. Phase 1 is on hold until Reem’s visual approval is confirmed. |

Phase 1 covers the technician layout, My Jobs and Job Details, their loading,
empty, error and permission-denied states, and relevant tests. Later phases
remain planned. The Start Job action and inspection steps belong to Phase 2.

## Allowed paths

- `src/app/technician/`
- `src/features/technician/`
- `src/components/technician/`
- `src/app/(dashboard)/reports/`
- `worklogs/PC-S1-08/`, including screenshot evidence and the review-ready PR text
- `src/app/__e2e__/technician.spec.ts`, the task-owned Playwright spec. The exact
  folder is `__e2e__`. [Testing policy](../../docs/TESTING.md#the-three-layers)
  explicitly allows each task to write its own spec in this shared folder.
  [Harness rule](../../scripts/harness.mjs#L22) matches direct child `*.spec.ts`
  files there, and the [scope check](../../scripts/harness.mjs#L261) allows them.
  The [Playwright config](../../playwright.config.ts#L4) already discovers that path.
  Scope this exception to the technician spec.

Reuse shared code as it stands. The plan leaves fixtures, validation schemas,
adapter implementations, shared layout, auth, tokens and test configuration untouched.

## Implementation plan

### Proposed files

| New file | Purpose |
| --- | --- |
| `src/app/technician/layout.tsx` | Use the shared `AdaptersProvider`, `RequireSession` and `AppShell`. Keep the mock store mounted across technician routes. |
| `src/app/technician/page.tsx` | Open My Jobs. |
| `src/app/technician/jobs/[jobId]/page.tsx` | Open the job and host the checklist, photos and review steps. |
| `src/app/technician/reports/[reportId]/page.tsx` | Open the technician’s report in the same mock store. |
| `src/app/(dashboard)/reports/[reportId]/page.tsx` | Open a known mock report ID in the coordinator shell using the shared report view. |
| `src/features/technician/job-list.tsx` | Load assigned jobs and show the list and recovery states. |
| `src/features/technician/job-inspection.tsx` | Manage job start, step navigation, form values, photo registration and completion. |
| `src/features/technician/inspection-form.ts` | Prepare and validate form values and the repeatable submission request. |
| `src/features/technician/service-report.tsx` | Load the report via the adapter and handle loading, missing, denied and retry states. |
| `src/components/technician/checklist-fields.tsx` | Render labeled checklist controls and field errors. |
| `src/components/technician/photo-evidence.tsx` | Render the picker, local preview, caption, grouped status and actions for each photo. |
| `src/components/technician/report-content.tsx` | Render the read-only snapshot and accessible evidence alternatives. |
| `src/features/technician/__tests__/inspection-form.test.ts` | Test technician form and retry logic at the lowest useful layer. |
| `src/app/__e2e__/technician.spec.ts` | Test the browser journey on desktop and mobile. |
| `worklogs/PC-S1-08/screenshots/` | Store the 375, 768 and 1440 px evidence, for example `technician-375.png`, `technician-768.png` and `technician-1440.png`. |
| `worklogs/PC-S1-08/pr.md` | Write the complete PR description when review-ready. |

### Build phases

1. **Start with the list and job detail.** Reuse the existing demo role selection
   and the shell’s Mock data selector. Use `dispatch.listJobs` and `dispatch.getJob`.
   Show assigned jobs with site, system, date and status. Show loading, empty,
   offline, retry and denied states. Treat missing and out-of-scope jobs alike
   when the adapter returns 404. A signed-out visitor returns to demo login.
   A coordinator opening the technician flow sees a route-level message and a
   link back to the coordinator area.
2. **Start the job and build the checklist.** Send `start` with the current
   `expectedVersion` through `dispatch.updateJob`. Advance after the adapter
   confirms **In progress**. A stale version needs a reload. Render the current
   versioned template returned by `inspections.getChecklistTemplate` with
   labeled required fields, explicit Yes/No choices, visible units, numeric
   bounds and inline errors. Keep valid values when another field fails.
3. **Add photo evidence and notes.** Use the existing MIME, size and count
   constants and photo validation. Accept JPEG, PNG and WebP, up to 5 MB each
   and 10 per job. Captions are optional, up to 200 characters. Preserve
   selections when stepping back and keep caption, status and actions grouped
   under each photo. Remove local selections and release preview URLs when
   they are discarded. Register only metadata through `inspections.registerPhoto`.
   Use **Selected**, **Adding (demo)**, **Added (demo)** or **Failed** as text.
   Keep confirmed registration IDs to avoid adding a photo twice when retrying
   a submission. A failed registration remains visible and can be removed
   locally or retried when safe.
4. **Review and submit.** Show the answers, readings, notes and photos. Use
   the mock typed name and acknowledgment checkbox. Reuse the completion schema,
   map errors to their fields and focus the first invalid field. Disable repeat
   clicks while submitting. For an unknown result, keep the form visible, check
   job status and offer a safe manual recovery. A retry of the same attempt
   reuses its original request and `idempotencyKey`. A stale checklist or job
   shows a reload path. Show completion only after a confirmed mock result.
5. **Open the report.** Use the ID returned by completion or the existing
   `reportId` on a completed job. Load it through `inspections.getReport`
   and render the saved snapshot with job details, readings, notes,
   acknowledgment and a meaningful text description for photo evidence without
   an image URL. Keep the report within the technician provider when opening
   it from a job. The coordinator route can show seeded reports. A newly
   created report stays in the technician store for this demo session.
6. **Review the layouts.** At 375 px, use one column and easy-to-reach actions.
   At 768 px, use up to two cards or photos per row while keeping form fields
   in one reading column. At 1440 px, place supporting details beside the form.
   The proposed sticky checklist context must stay inside its column and
   return to normal flow when space is tight. Use the shared tokens and the
   technician wireframes for all three widths.

## Acceptance criteria

- [ ] Mobile job list/detail, checklist with readings, notes, photo picker and customer confirmation.
- [ ] Submission handles missing mandatory inputs and retry without claiming actual upload.
- [ ] Report screen displays structured mock result and accessible image alternatives.
### Review evidence

- [ ] Playwright shows a simulated technician completion and form errors in the mobile and desktop projects.
- [ ] Capture responsive screenshots and record the manual accessibility review and Impeccable results.

## Tests

Follow [D12](../../docs/TESTING.md). Add tests with each behavior change.

- **Unit:** Check numeric input conversion and preservation of false and zero,
  validation feedback, photo selection limits through the existing rules, and
  reuse of the same request and ID after an uncertain submission. Exercise
  happy, invalid-input and error cases that belong to technician UI logic.
- **Integration:** Reuse the existing adapter tests for template checks,
  job status and scope, photo metadata and one-report retry. Add a focused
  technician-side test if the new submission code needs one to prove that
  successful photo registrations survive a later failure or retry. Shared
  adapter behavior is already covered in its own suite.
- **Playwright:** One technician spec in both projects. Cover demo sign-in,
  opening an assigned job, Start Job, checklist and photo form validation,
  confirmation and the report. Cover empty, slow, error/retry, denied and
  inaccessible job/report behavior. Check first-invalid-field focus and
  text for status and photo alternatives. Use synthetic files. Exercise a
  lost response and same-ID retry at the unit or integration layer if the
  existing browser mock scenario can only simulate a failure before mutation.
- **During edits:** Run `node scripts/harness.mjs test`. Use the existing
  Playwright config. Install its Chromium binary locally if needed and record
  any environment blocker. Run this task’s browser spec directly with
  `npm run e2e -- src/app/__e2e__/technician.spec.ts` for targeted evidence.
- **Before review:** Run `node scripts/harness.mjs check` and
  `node scripts/ci.mjs`. Record Playwright results separately. There are no
  live API, database, authentication or storage checks for this mock UI.

## Responsive, accessibility and critique evidence

At 375, 768 and 1440 px, walk through the built journey and capture screenshots
using synthetic data. Include the checklist, photos, confirmation and report in
the evidence as needed to show responsive states. Check that text reflows
without page-wide horizontal scrolling and that the main action remains easy
to find. Keep screenshots and links in this worklog.

Manually check headings and reading order, keyboard Tab order and visible
focus, return of focus when applicable, persistent labels, required-field
hints, units, errors and status announcements, contrast, zoom/text resizing
and touch targets. Check that the page and desktop side panel leave the
focused control visible. Use text alongside status colors and give each
photo control a distinct accessible name. A screenshot alone does not
verify keyboard or screen-reader behavior.

Run Impeccable using the team’s documented tool setup. Record the command,
version, findings and fixes, or mark the critique Blocked with the reason.
A source-only scan should be labeled as such. Record the browser review
separately.

## Evidence

| Check | Status before implementation |
| --- | --- |
| Scope check | Passed. Only this worklog changed. |
| Affected tests | Not run. The harness found no runtime or test changes. |
| Full CI | Not run |
| Desktop and mobile Playwright | Not run |
| Browser accessibility and responsive review | Not run |
| Screenshots | Not captured |
| Impeccable critique | Not run |

## Risk, security and UX review

The mock role is tab-scoped and supports demo navigation. It does not establish
identity or authorize real data access. Keep inspection data in memory and use
only synthetic inputs and files for demos and evidence. No private image data
or storage paths belong in the repo. Warn before leaving a form with unsent
changes. Reloading can discard edits and mock reports. The same mock store
does not span the coordinator and technician route groups. Real cross-role
persistence belongs to Sprint 2. A rollback removes the task’s routes and
tests without any data migration.

## Developer review guide

### Review these first

- [Proposed files](#proposed-files) for the route layout and allowed scope.
- [Build phases](#build-phases) for Start Job, mock photo registration and the
  same-ID retry.
- [Tests](#tests) and [review evidence](#responsive-accessibility-and-critique-evidence)
  for how the 375, 768 and 1440 px layouts will be checked.

### You need to do or decide

- Share the original message or link if Reem’s go-ahead also approved the
  visual direction. Otherwise, confirm that point with Reem before Phase 1.
- Confirm KAN-20’s current Jira state when access is available.
- Have Mahdi review the eventual PR and record the result.

## Handoff

Status: Plan and Playwright path approved by Tarek. Phase 1 is on hold pending
verification of Reem’s visual approval.
Files changed: `worklogs/PC-S1-08/plan.md`.
Next step: Record the existing visual approval or Reem’s clarification, then
build the technician layout, My Jobs and Job Details with their first tests.
