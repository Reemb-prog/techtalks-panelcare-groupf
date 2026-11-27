# PC-S1-09 Frontend UX signoff and contract freeze

Sprint S1 | Owner Reem W. Basho | Non-author reviewer Tarek Bdairi

[KAN-21](https://techtalks-panelcare.atlassian.net/browse/KAN-21) | Scheduled start November 30, 2026 | Review-ready December 1, 2026

Plan review pending from Tarek in Jira or the PR. Reem directed early planning on November 27.

## Goal and scope

Verify the coordinator and technician mock frontend, record UX signoff and the human-approved API/DTO baseline, and hand off explicitly to S2. All role cues and data mutations in the demo are mock UI behavior. Use synthetic data and verify that transient changes are described accurately.

Allowed paths are `docs/design/s1-signoff.md`, `docs/DECISIONS.md`, and `worklogs/PC-S1-09/`. Use the signoff document for verified evidence and handoff. Update the decisions log only for an explicit human-approved decision, including D06 if resolved. Any implementation changes to screens, API contracts, migrations, design tokens, or other shared files require a separate lead-owned PR.

## Dependency baseline

| Item | Merge on main |
| --- | --- |
| PC-S1-05 | `060f8ed` |
| PC-S1-06 | `49b91e4` |
| PC-S1-07 | `6e56fa7`, with dispatch fixes in [PR #24](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/24), merged as `d058780` |
| PC-S1-08 | `ebcf383` |

Branch base is `d058780`. Live Jira dependency states and approval remain unverified.

## Implementation plan

1. After plan approval, run the existing Playwright coverage for both projects and record results against the exact commit. Link dependency PR evidence and distinguish browser assertions from manual observations.
2. Run the joint demo with Reem, Mahdi, Rand and Tarek. In the same mock tab, work through coordinator sign-in, registry, maintenance, dispatch and assignment. Switch to the mock technician role, work the assigned visit through inspection and confirmation, then inspect the report and note what a reload resets. Record attendees, outcome and any blocked steps.
3. At 375, 768 and 1440 px, inspect both roles for scrolling, touch controls, keyboard focus, labels, Escape and contrast. Capture synthetic screenshots and run Impeccable. Record the tool version and distinguish source checks from rendered observations. Check empty, loading, error, invalid input and permission denial, including recovery and absence of misleading persisted success. Record gaps with severity and ownership. A blocking application defect needs a separate fix PR and a rerun on the merged baseline.
4. Review [the contract](../../docs/CONTRACTS.md), DTOs, validation and adapter boundaries with the team. Record the exact reviewed revision and explicit API/DTO approval. Bring D06 customer confirmation wording to Reem and Tarek. If a decision changes the contract, record the impact and wait for the separately reviewed change before declaring the baseline frozen.
5. Record S2 handoff by owner and prerequisite using the [roadmap](../../docs/ROADMAP.md). Include schema and RLS, server auth and roles, registry, maintenance plans, recurrence, dispatch, inspection/reporting, and the real cross-role integration check. Keep each backend acceptance result pending until verified against real services.
6. Run the harness check and full CI before review. Prepare the PR only when the evidence and signoff are ready. Tarek reviews before merge. Verify integration on main after merge before marking the item Done in Jira.

## Acceptance

- [ ] Run the joint coordinator and technician mock demo with all four members.
- [ ] Record Impeccable critique, screenshots, and responsive and accessibility gaps.
- [ ] Verify empty, loading, error, invalid-input and permission-denied states and transient mock behavior.
- [ ] Record explicit API/DTO approval and S2 handoff.
- [ ] Obtain non-author review, merge, and verify integration on main.

## Tests and evidence

Test exemption: documentation-only scope. Run existing unit and contract suites via CI and existing desktop/mobile mock E2E for signoff. Use manual demo and responsive checks for behaviors outside those assertions. Live API, database, storage and authorization checks belong to S2.

| Check | Outcome |
| --- | --- |
| Verify branch base and dependency merge commits | Passed |
| Harness branch and file scope | Passed |
| Affected tests for the plan-only change | Not run because the harness found no source or E2E changes |
| Existing browser suite and manual state checks for PC-S1-09 | Not run |
| Full CI for PC-S1-09 | Not run |
| Joint demo, screenshots, rendered critique and keyboard review | Not run |
| API/DTO approval, D06 decision and Jira readiness | Blocked pending human review or access |

## Developer review guide

- Review the demo sequence and expected state behavior in the implementation plan. Confirm the same-tab role switch and fixture cover the joint flow.
- Review the API/DTO and D06 approval steps and confirm who will sign the decision.
- Tarek must record plan approval in Jira or the PR before implementation. Reem, Mahdi, Rand, and Tarek must attend the mock demo and record the actual outcome.

## Handoff

Plan prepared in `worklogs/PC-S1-09/plan.md`. Awaiting the human plan gate.
