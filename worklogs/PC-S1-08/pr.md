# feat(technician): add the mock inspection and service report flow (KAN-20)

| Task | Details |
| --- | --- |
| Local task | PC-S1-08 |
| Jira | [KAN-20](https://techtalks-panelcare.atlassian.net/browse/KAN-20) |
| Sprint, owner, reviewer | S1, Tarek, Mahdi |
| Target branch and review date | `main`, D10 (Nov 29, 2026) |

## User outcome and boundary

- A demo technician can open an assigned job, start it, complete the checklist with readings and units, enter notes, select and preview photo evidence, and confirm the visit with a typed customer name and checkbox.
- Required fields and invalid readings show specific errors. Photo selection accepts JPEG, PNG and WebP, up to 5 MB each and 10 per job. The form labels photo previews as local. Completion appears only when the typed mock adapter confirms it. An uncertain submission requires a job-status check before retrying the same attempt. Repeated taps produce one report.
- The read-only service report shows job details, readings, notes, photo captions and image alternatives, and customer acknowledgment. The technician can read the new report in the current mock store. The coordinator can read seeded reports in its own demo store.

This Sprint 1 workflow uses typed mock adapters and synthetic fixtures. Photo registration handles metadata only. Drafts and reports are session-limited, with no offline sync or permanent storage. Real authentication and authorization, photo uploads, and database storage belong to later work.

## Approved plan and dependencies

Tarek approved the plan and the task-owned Playwright path on Nov 25, 2026. Tarek also confirmed Reem's visual direction and permission to implement in the task conversation that day. The direct link to Reem's original approval was unavailable. [Task plan and approval record](plan.md)

The merged dependencies are PC-S1-01 (`ae9decd`), PC-S1-02 (`9ba5934`), PC-S1-03 (`458c6a4`), and PC-S1-04 (`2e45956`, `ff40f3c`). The flow also reuses the PC-S1-05 shell and mock sign-in (`060f8ed`). The branch includes live `main` at `04b091d` as checked on Nov 26. [Approved technician design](../../docs/design/technician.md) · [Frozen contract](../../docs/CONTRACTS.md) · [Project progress](../../progress.md)

## Test evidence

- Six form unit tests passed. They cover valid and invalid checklist and photo inputs and the final form payload. [Form tests](../../src/features/technician/__tests__/inspection-form.test.ts)
- Eleven submission tests against the typed mock passed. They cover final validation, retry after partial photo registration, replay after a lost confirmation response using the same submission ID, and the action offered for each adapter failure (CONFLICT offers Reload job, including a second submission on an already completed job). [Submission tests](../../src/features/technician/__tests__/inspection-submission.test.ts)
- Twenty-one technician browser cases passed across the desktop and mobile profiles. They exercise the complete assigned-job journey, required inputs, reading and photo boundaries, loading and empty states, errors and denied access, keyboard focus, retries, one-report duplicate protection, the browser Back confirmation, and both report roles. [Playwright spec](../../src/app/__e2e__/technician.spec.ts)

| Final check on Nov 26, 2026 | Result |
| --- | --- |
| `node scripts/harness.mjs validate` and `node scripts/harness.mjs check` | Passed. |
| `node scripts/ci.mjs` on Windows with Node 22.22.0 and ICU 77.1 | Exit 1. Harness validation, ESLint and TypeScript passed. Vitest ran 130 tests with 129 passed and one failed. The dashboard date test at line 105 expected no comma, while this environment produced a comma. An isolated archive of live `main` at `04b091d` reproduced the same failure with seven passing dashboard tests and one failing. [Dashboard assertion](../../src/features/dashboard/__tests__/dashboard-view.test.ts#L105) |
| `npm run build` | Passed separately because CI stopped at Vitest. |
| Full Playwright suite | 41 passed, 3 intentional skips, zero failures. The installed Chrome ran the repository desktop and mobile profiles against the production build through an ignored local config. The skips were the desktop run of the mobile menu test and the mobile repeats of the registry and technician three-width tests. |
| Impeccable 4.10.0 | The task-owned source scan returned no findings. |

The visual review covered all six technician views and the seeded coordinator report at 375, 768 and 1440 px. Twenty-one axe scans of the main content returned zero violations and passed the contrast rule. Keyboard checks covered focus, Tab, Enter and Space. Selected controls were at least 44 px high. At 375 px with 200% text, the main content fit and the shared mock banner widened the page to 398 px. Screen-reader audio, browser zoom, other browsers and native picker behavior on a physical device still need verification. [375 px confirmation](screenshots/phase4-confirmation-375.png) · [768 px photo evidence](screenshots/phase4-photo-evidence-768.png) · [1440 px service report](screenshots/phase4-service-report-1440.png) · [Full checks and log paths](plan.md#phase-5-review-scope)

The tests and screenshots use synthetic data and local preview images. Denied and unavailable mock reports hide details. The Sprint 1 scope has no live API, database, row-level security, storage or scheduler tests. Final customer wording (D06) and real-photo consent and retention (D07) are still pending. [Decisions](../../docs/DECISIONS.md)

### Review fixes (Nov 27, 2026, lead-directed)

| Check | Result |
| --- | --- |
| `node scripts/ci.mjs` (Node 23.1.0, ICU 75.1) | Exit 0: harness validation, ESLint, TypeScript, 138 of 138 Vitest tests and the production build passed. |
| Technician Playwright spec (dev server, desktop and mobile) | 21 passed, 1 intentional skip. |
| Dashboard, registry and home Playwright specs, one worker | 22 passed, 2 intentional skips. In a fully parallel run on the dev server some of these timed out and passed on the serial rerun. |
| `node scripts/harness.mjs check` | Not run: this clone's member is `reem` and the check refuses a `tarek` branch. A manual scope diff found one file outside the task paths, the lead-approved dashboard test below. |

- The dashboard long-date assertion now accepts the ICU 76+ weekday comma (lead-approved exception outside the task paths; the formatter is unchanged).
- A completion or photo CONFLICT now offers **Reload job**, which drops the attempt and refetches the job, so a job completed elsewhere shows its report link and a changed checklist sends the technician back to it.
- Registered photos can no longer be removed, which would orphan them on the job. Server field errors stay visible after **Edit inspection**. An unconfirmed photo registration offers **Retry submission**. Browser Back asks before discarding an unsent draft.
- The Reload path could not be exercised in the browser because each page has its own mock store; unit tests cover it against the mock adapter.

## Edge cases and rollback

- Loading, empty, denied and unavailable states keep private report content out of view. When a read fails, the technician or coordinator can retry it. If submission is uncertain, the flow checks job status before permitting a manual retry.
- This change adds no migration or deployment step. Reverting it removes the demo technician screens and mock report views without a data migration.
- The enlarged-text banner needs a shared UI follow-up. After a successful submission, one extra Back press stays on the job page because of the Back-confirmation history entry.

## Where to look first

- [Submission state](../../src/features/technician/use-inspection-submission.ts#L23). Check the status check and same-ID retry.
- [Technician journey](../../src/app/__e2e__/technician.spec.ts#L252). Check the timing of completion and duplicate taps.
- [Report layout](../../src/components/technician/report-content.tsx#L8). Check report reading order, units and photo alternatives.
- [Responsive evidence](plan.md#phase-5-screen-and-accessibility-evidence-nov-26-2026). Review all widths and the shared banner issue.

## Human reviewer

Mahdi is the assigned non-author reviewer. The review request and result are pending. The technician task is ready for human review. Merge readiness depends on completing human review.

- [x] Plan recorded and approved before implementation.
- [x] Changes are in the allowed task paths, except the lead-approved dashboard test fix, and cover the three repository acceptance criteria.
- [x] Technician unit, mock submission and browser tests cover normal, invalid and error cases.
- [x] Actual test results and skips are recorded; CI now passes.
- [x] Screenshots and fixtures use synthetic data.
- [x] Jira issue and review evidence are linked here.
- [x] Live `main` was verified as included in the branch before retesting.
- [ ] Request Mahdi's review and record the outcome once the PR is opened. Live Jira status also needs confirmation.
