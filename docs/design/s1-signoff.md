# Sprint 1 frontend UX signoff

**Status: individual walkthroughs pending.** This record covers the mock frontend from main at `d058780`. Rand Al Yaman approved the PC-S1-09 plan live on November 27, 2026, as reported by Reem. Reem approved the API/DTO baseline and the individual-review format in chat on November 27. A Jira approval entry was not independently verified.

Merged GitHub evidence includes the [coordinator shell](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/18), [registry](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/20), [planner and dispatch](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/23), [technician flow](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/22) and [dispatch follow-up](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/24). The GitHub review lookup did not show an approved review for those PRs. Attach any separate review evidence during signoff.

## Individual coordinator and technician walkthrough

Reem approved individual walkthroughs in place of the joint demo on November 27. Reem, Mahdi, Rand and Tarek each use the same walkthrough and record their own result. The automated browser evidence below was collected before those reviews.

1. In the coordinator role, review the registry, maintenance plan, dispatch filters and assignment. Use synthetic fixture data throughout.
2. In the technician role, open Omar Saleh's seeded November 30 visit, complete the checklist, review selected photo evidence, enter mock customer confirmation and open the service report.
3. State the limitation before switching roles. A coordinator assigned the December 31 visit to Omar and saw the mock success message. After signing out and signing in as Omar in the same tab, the new assignment was absent from My Jobs. The coordinator and technician route layouts create separate in-memory adapter instances. Use the seeded visit for the technician portion. If the team requires the newly assigned visit to carry through the mock role switch, track that as a separate implementation fix and rerun the demo.
4. Observe empty, loading, error, invalid-input and denied responses. Verify failed writes preserve appropriate form data and avoid success feedback. The mock session may be restored from session storage while business records are reseeded when the adapter remounts.

For each individual review, record the reviewer, date, coordinator outcome, technician outcome, and any gap or blocker. Individual results are pending.

## Responsive and accessibility observations

Synthetic screenshots were captured in Chromium at all three review widths. The dispatch board and technician job list had no whole-page horizontal overflow at any captured width.

| Surface | 375 px | 768 px | 1440 px |
| --- | --- | --- | --- |
| Coordinator dispatch | [Screenshot](../../worklogs/PC-S1-09/screenshots/dispatch-375.png) | [Screenshot](../../worklogs/PC-S1-09/screenshots/dispatch-768.png) | [Screenshot](../../worklogs/PC-S1-09/screenshots/dispatch-1440.png) |
| Technician jobs | [Screenshot](../../worklogs/PC-S1-09/screenshots/technician-jobs-375.png) | [Screenshot](../../worklogs/PC-S1-09/screenshots/technician-jobs-768.png) | [Screenshot](../../worklogs/PC-S1-09/screenshots/technician-jobs-1440.png) |

- At 375 px the dispatch table scrolls within its own region. The first view shows dates and sites, while row actions sit beyond the initial horizontal viewport. The focusable Visits region is covered by the dispatch browser test. Have the team confirm that the lateral scroll and row actions are discoverable by touch. Follow-up owner proposed for live dispatch is Mahdi.
- The technician job cards show their status in text and place the primary action directly beneath each card's details. The mock banner identifies the demo mode in both roles.
- Captures came from the development server and include its indicator. These captures do not establish screen-reader behavior or formal contrast conformance.
- Impeccable 4.10.0 source detection exited successfully with no reported findings across 75 files in `src/app`, `src/components`, `src/features` and `src/styles`. The scan used regex rules. Rendered rules such as contrast and tiny text require a page scan. [Impeccable detector documentation](https://github.com/pbakaus/impeccable#three-ways-to-run-the-detector)
- The rendered `/login` scan reported zero anti-patterns and one advisory: the final word of a paragraph wraps onto a line by itself. This is low priority. Authenticated pages were reviewed using screenshots and browser assertions. Their rendered detector scans remain pending.

## Browser verification

The full desktop and mobile Playwright run recorded 62 passed, 3 skipped by project design and 1 failed. The desktop technician report heading did not appear within its five-second assertion after the inspection completion message. The mobile case passed. All dispatch checks passed. Existing browser coverage exercised loading, empty, error, denied and invalid-input states, including a failed registry submission without success feedback and an invalid technician submission that focused the affected fields. These results apply to the typed mock UI.

The desktop technician report case passed on an isolated rerun with the same five-second assertion. The initial timing failure did not reproduce in isolation.

## API/DTO approval and S2 handoff

Reem approved [CONTRACTS.md](../CONTRACTS.md), `src/types/`, validation schemas and adapter interfaces at `d058780` as the S2 API/DTO baseline on November 27. Preserve camelCase JSON, date formats, structured errors including field errors, and server-derived identity and authorization. S1 role checks and mutations run through typed mocks. Reem approved the D06 proposal as written. Tarek's concurrence remains pending in the [decisions log](../DECISIONS.md).

| S2 item | Owner | Handoff |
| --- | --- | --- |
| PC-S2-01 | Rand | Publish the D2 schema baseline. Add isolated seed, constraints, and real coordinator and technician RLS checks. |
| PC-S2-02 | Reem | Wire live sign-in and server sessions. Derive authorization from the session. |
| PC-S2-03 | Mahdi | Implement and test registry APIs and wire the registry screens. |
| PC-S2-04 | Reem | Implement and wire the reduced maintenance plan API against the frozen DTOs. |
| PC-S2-05 | Rand | Verify the 90-day recurrence rules and prove idempotency with real storage. |
| PC-S2-06 | Mahdi | Wire dispatch after registry, plan and recurrence prerequisites. Verify assignment, reschedule conflicts and cancellation against real APIs. |
| PC-S2-07 | Tarek | Wire the live technician flow, inspection, confirmation and reports. Follow the approved photo scope and storage policy. |
| PC-S3-07, scheduled in S2 | Tarek | Prove a newly assigned visit reaches the technician and the resulting report returns to the coordinator using the real backend. |

See the [roadmap](../ROADMAP.md) for prerequisites and the release gate. Real backend integration, persistence, storage and authorization remain pending for S2.
