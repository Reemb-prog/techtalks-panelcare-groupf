# Roadmap, stage gates and PR timing

This is a **three-sprint, six-week recommendation** with two-week sprints, ten planned working days each (Monday to Friday in the draft dates). Exact calendar dates are proposals: confirm the official academic deadline, local holidays and team availability before activating Sprint 1. Keep the sprints two weeks each if dates change.

## Stage 0, before the sprint clock: baseline and Jira (November 19–22, proposed)

**Why:** Prevent four developers from building conflicting abstractions. Reem reviews requirements, unresolved business decisions, API DTOs and work-item ownership. Establish GitHub repository, Jira Scrum board and access, no paid provider setup. Confirm design references and delivery date.

**Gate:** four developers have access, business decisions assigned to a human, Jira work items are de-duplicated, product and API outline approved. Only then start S1. Stage 0 is planning, not a stealth fourth development sprint.

## Sprint 1, UX and mock frontend: November 23–December 6

**D1:** Sprint planning and board commitment; Reem starts base scaffold branch; Mahdi collects visual references, IA and wireframes; Rand specifies entity/endpoint contracts; Tarek maps technician flow. **D2 PR:** app skeleton and CI, reviewed by Rand, merged early so others can branch from updated main.

**D3 PRs:** design blueprint/tokens, typed contracts/mocks and technician wireframes; Reem performs design and API reviews. No full screen work before these approvals.

**D4–D5:** each developer branches **from updated main** for assigned UI package. **D5 PR:** shell and simulated login, reviewed by Mahdi. Team checks desktop/mobile navigation.

**D6–D8:** registry by Mahdi, maintenance/dispatch by Rand, technician pages by Tarek. Each raises draft PR by D6, **review-ready PR by D8**. Include screenshots at 375, 768 and 1440 pixels, states, keyboard testing and Impeccable audit.

**D9:** integration review and visual polish, fix accessibility and conflicting behaviors. **D10 PR:** Reem posts S1 UX signoff and frozen contracts; sprint demo and retrospective. Do not claim backend is built.

**Exit:** complete mock-driven coordinator/technician journeys are navigable, responsive, meaningfully designed and approved; all user-facing actions have a real mocked response, no decorative dead buttons. Contract definitions and unresolved business questions recorded.

## Sprint 2, independent backend: December 7–20

**D1–D4:** Rand migrates schema, constraints, RLS and local seed. Others prepare isolated test plans and read-only API contract reviews while blocked. **D4 PR:** schema/policy foundation, reviewed by Reem with negative authorization tests.

**D5–D8:** Reem finishes real auth and then builds plan API, Mahdi builds registry and dispatch API, Tarek builds inspection/report/storage, Rand builds scheduler against approved schema and contract without waiting for the plan API implementation. **D6 PR:** auth. **D7 PR:** registry. **D8 PR:** plan API. Use **draft PRs earlier** and short review cycles to catch contract drift before integration.

**D9 PRs:** transactional scheduler, dispatch and inspection/report services; demonstrate replay and role-denial tests. **D10 PR:** backend gate evidence, database reset/seed reproducibility and updated contract table.

**Exit:** backend independently tested against actual local/isolated Supabase, including concurrency, policies, invalid inputs, migrations and private photo storage. UI is **still on mocks** until S3.

## Sprint 3, full integration and release: December 21–January 3

**D1–D3 PR:** real login, register/session flows, coordinate stable staging environment. **D4 PR:** live registry forms. **D5 PRs:** real scheduler/dispatch and technician/report UI.

**D6–D7:** live dashboard/warranty indicator, complete cross-role test, real phone-size field walkthrough, user feedback; Impeccable critique and repair. Staging deployment uses only approved synthetic fixtures, not production identities.

**D8 PRs:** scheduler stress/concurrency evidence, Playwright workflow, accessibility/visual regression. **D9 PR:** controlled Vercel+Supabase release preparation, migration rehearsal and rollback. Reem deploys production **only after human authorization** and secure settings confirmed.

**D10 PR:** release evidence, final P0 demo, handoff, sprint review, retrospective and Git tag. Fault tickets are not allowed to displace P0 tests.

**Exit:** real end-to-end workflow, two-role permission tests, operational and security checks, deployed noncommercial demo if eligible, rollback plan and explicit signoff.

## Four-week deadline fallback

The earlier PDF estimated November 16–December 13 (roughly four weeks). If that is binding, the three-sprint roadmap is infeasible as written. **Do not move S3 work into S1 without disclosure.** A defensible contingency is two two-week sprints: S1 mock UX + contracts + scaffold; S2 minimum backend, thin integration and acceptance, with more parallelism and much less contingency. Freeze P1 entirely, reduce UI scope to the essential customer → report journey, and treat supplier photo uploads/advanced reports and full visual polish as explicit risk items. Require lead approval of the reduced scope, PR calendar and risk acceptance. Do not silently label the six-week plan a four-week delivery.

## Agile operating rhythm

Daily 15-minute standup: yesterday, today, blocker, PR review requested. Reem updates Jira statuses and dependency links. Wednesday: design/API review and PR integration. Every Friday: working demo, regression test review and short retro. Sprint review and retrospective on D10; incomplete tasks return to backlog or get re-estimated, never auto-marked done.

**Pull request checkpoints:** open a **draft** once the first thin vertical slice works, normally within 24 hours of starting; mark review-ready by the task's \`prDay\`; expect review within one workday; merge only after checks and at least one non-author human approval (enforce technically only if the GitHub plan/repo visibility allows). No 500-file end-of-sprint PRs.

## Work item sizing and coupling

The [machine-readable work list](../config/work-items.json) contains stable IDs, owner, reviewer, dependencies, paths, estimates, first planned day and PR day. Planned points are relative team estimates **not guaranteed hours or equal individual workloads**. Re-estimate in Jira during planning. Blockers are real: when backend base is delayed, do not build against imaginary tables.
