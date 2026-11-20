# Roadmap, stage gates and PR timing

This is the **approved four-week plan** (D03, CR-01 in [DECISIONS.md](DECISIONS.md), lead-approved 2026-11-20): two sprints of **12 calendar days each, weekends included**, mirroring Jira project KAN (sprint IDs 1 and 2). D1 is the sprint's start date. Day numbers below match \`startDay\`/\`prDay\` in [config/work-items.json](../config/work-items.json), which is authoritative if the two ever disagree. The earlier three-sprint, six-week plan (Nov 23–Jan 3) was not adopted.

## Stage 0, before the sprint clock: baseline and Jira (done 2026-11-20)

**Why:** Prevent four developers from building conflicting abstractions. Jira backlog, sprints, blockers and the harness config were created and reconciled (see [docs/jira/sync-log.md](jira/sync-log.md)).

**Gate before S1 work:** four developers have access, the lead starts Sprint 1 in Jira (automation never does), and D05/D06/D07 owners are known. Stage 0 is planning, not a stealth development sprint.

## Sprint 1, UX and mock frontend: November 20–December 1

**D1–D2:** Reem scaffolds the app and CI (PC-S1-01, **PR D2**), reviewed by Rand and merged early so others branch from updated main. In parallel from D1: Mahdi on design discovery and tokens (PC-S1-02), Rand on typed contracts and mocks (PC-S1-03), Tarek on the technician flow map (PC-S1-04).

**D4 PRs:** design blueprint/tokens, contracts/mocks and technician design docs. Reem performs design and API reviews. No full screen work before these approvals.

**D5–D6:** each developer branches **from updated main** for their UI package. Reem builds the coordinator shell and mock login and wires the PC-S1-02 tokens into \`src/app/globals.css\` (PC-S1-05, **PR D6**, reviewed by Mahdi).

**D5–D10:** registry screens by Mahdi (PC-S1-06), maintenance/dispatch mock by Rand (PC-S1-07), technician mobile UI by Tarek (PC-S1-08). Draft PR within a day of starting; **review-ready PR by D10** with screenshots at 375, 768 and 1440 px, states, keyboard testing and Impeccable critique.

**D11–D12:** integration review and polish. **D12 PR:** Reem posts S1 UX signoff and frozen contracts (PC-S1-09); sprint demo and retrospective. Do not claim backend is built.

**Exit:** complete mock-driven coordinator/technician journeys are navigable, responsive and approved; every user-facing action has a real mocked response; contracts frozen; unresolved business questions recorded.

## Sprint 2, backend, integration and demo: December 2–13

S2 combines the original S2 (backend) and S3 (integration and release) work. Each owner connects real services to **their own** screens (PC-S3-01..04 absorbed into PC-S2-02, 03, 06, 07).

**D1–D5:** Rand builds schema, constraints, RLS and seed (PC-S2-01, **PR D5**) and publishes a **frozen schema list by D2** (\`docs/data/schema-freeze.md\`).

**D3 early starts:** Reem (auth, PC-S2-02), Mahdi (registry, PC-S2-03) and Tarek (inspections/reports, PC-S2-07) build handlers, validation and unit tests against the frozen PC-S1-03 contract and the D2 schema freeze. Database-backed integration tests wait until PC-S2-01 merges.

**PR checkpoints:**

| Day | PR | Owner |
| --- | --- | --- |
| D5 | Schema, RLS, seed (PC-S2-01) | Rand |
| D6 | Auth and live login wiring (PC-S2-02) | Reem |
| D7 | Registry APIs and live screens (PC-S2-03) | Mahdi |
| D7 | Plan APIs, reduced (PC-S2-04) | Reem |
| D9 | Inspections, reports, live technician flow (PC-S2-07) | Tarek |
| D10 | 90-day scheduler with golden-date tests (PC-S2-05) | Rand |
| D10 | Dispatch APIs and live planner wiring on seeded jobs (PC-S2-06) | Mahdi |
| D11 | Cross-role E2E smoke, reduced (PC-S3-07) | Tarek |
| D11 | Vercel/Supabase demo with rollback, reduced (PC-S3-08) | Reem |
| D12 | Backend gate, final acceptance and release signoff (PC-S3-09) | Reem |

**Critical path:** PC-S2-03 → PC-S2-06 (Mahdi) leaves about 2 days of slack. If PC-S2-03 slips past D7, raise it at standup and cut UI polish first. Photo upload in PC-S2-07 is a stretch goal: if it's not review-ready by D10, reports ship without photos by lead decision.

**Deployment:** one noncommercial demo environment, isolated synthetic data only. Reem deploys **only after explicit human authorization** and confirmed secure settings.

**Exit:** reproducible migrations, permission denials, idempotent 90-day recurrence, the core coordinator → technician → report journey passing against the real backend, a deployed demo with documented rollback, and explicit release signoff.

## Deferred past December 13 (backlog, not scheduled)

* PC-S3-05 live dashboard and warranty visibility (the dashboard stays clearly labelled mock).
* PC-S3-06 scheduler stress timing and migration rehearsal (golden-date tests moved into PC-S2-05).
* From reduced items: plan edit-conflict and schedule-revision rules (PC-S2-04); full accessibility/Impeccable audit and user validation (PC-S3-07); separate staging environment (PC-S3-08).
* P1 fault tickets stay frozen until P0 is demonstrably done.

Deferred items cannot be started with \`harness start\` until the lead re-plans them in Jira and config.

## Agile operating rhythm

Daily 15-minute standup: yesterday, today, blocker, PR review requested. Reem updates Jira statuses and dependency links. Mid-sprint (around D6): design/API review and PR integration. Sprint review and retrospective on D12; incomplete tasks return to backlog or get re-estimated, never auto-marked done. S2 is 37 points against roughly 32 points of capacity: re-estimate at S2 planning.

**Pull request checkpoints:** open a **draft** once the first thin vertical slice works, normally within 24 hours of starting; mark review-ready by the task's \`prDay\`; expect review within one day; merge only after checks and at least one non-author human approval. No 500-file end-of-sprint PRs.

## Work item sizing and coupling

The [machine-readable work list](../config/work-items.json) contains stable IDs, Jira keys, owner, reviewer, dependencies, paths, estimates, start day and PR day. \`node scripts/harness.mjs validate\` rejects parallel tasks that own the same files. Planned points are relative team estimates, **not guaranteed hours or equal individual workloads**. Blockers are real: when the backend base is delayed, build only against the frozen contract and schema list, never imaginary tables.
