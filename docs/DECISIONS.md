# Decisions, approvals and material change control

| ID | Topic | Status | Owner and gate |
| --- | --- | --- | --- |
| D01 | Next.js App Router, React, TypeScript, npm lockfile, Tailwind, shadcn/ui | Selected | Reem, S1 scaffold |
| D02 | Single Next.js REST backend, Supabase Postgres/Auth/Storage, Vercel | Proposed | Reem, S0 cost and security review |
| D03 | Four-week deadline: two 12-calendar-day sprints, Nov 20–Dec 13, weekends included (replaces three two-week sprints, Nov 23–Jan 3) | Approved 2026-11-20, see CR-01 | Reem |
| D04 | Single-company MVP and two roles | Assumed | Reem, before S1 contract freeze |
| D05 | Asia/Beirut business timezone, month-end clamp, half-open 90-day window | Proposed | Reem and Rand, S1 contract freeze |
| D06 | Typed name, acknowledgment and timestamp as customer confirmation | Proposed | Reem and Tarek, S1 UX signoff |
| D07 | Private image evidence storage; image retention/access policy | Needs review | Reem, before S2 policies |
| D08 | Vercel Hobby only for personal noncommercial demonstration; free tier terms | Conditional | Reem, before deployment |
| D09 | Pinterest for visual discovery; only licensed source images shipped | Approved safety policy | All UI authors |
| D10 | Human PR approval, with GitHub Free private limitations | Proposed team policy | Reem, S0 |
| D11 | Tiered plan approval: routine tasks self-approve their written plan (non-author PR review is the gate); contract, schema/RLS, auth/roles, recurrence, design system, provider, spend, deployment and shared-file tasks need human plan approval before coding | Approved 2026-11-20 | Reem |
| D12 | Testing and review policy: every behavior change ships with tests at the lowest useful layer (unit, integration, E2E) covering happy, misuse and error paths without overtesting; iterate with affected-only tests, full suite once before review; every assistant run ends with a developer review guide (docs/TESTING.md, CLAUDE.md) | Approved 2026-11-21 | Reem |

## Critical change process

For any modification affecting a listed decision, schema, REST contract, tenant or permission boundary, recurrence rule, scope, provider, schedule, source image license or spending:

1. Stop the affected task. Record the proposed old/new approach, reason and options here under a new CR ID.
2. Assess what existing code, tests, docs, data migrations, designs, costs, Git branches, Jira items and deployment environments are affected.
3. Specify safe migration, rollback or rework. Obtain lead approval and, if it changes external commitments or cost, product owner approval.
4. Update relevant requirements, contracts, work item dependencies and Jira scope in a small PR **before implementation resumes**.
5. Reopen any previously accepted feature whose verification is invalidated; run regression tests and record evidence.

Do not overwrite history or mark unexecuted tests as passed. For minor copy/UI spacing fixes, a concise PR note is enough.

## Change requests

### CR-01: Four-week reduced plan (D03)

* **Date / proposer / signoff:** 2026-11-20 / Reem (lead) / Reem. Non-author PR review is still required.
* **Old approach:** three two-week sprints (S1–S3, Nov 23 – Jan 3, 10 working days each), 26 work items.
* **New approach:** S1 Nov 20 – Dec 1 and S2 Dec 2 – Dec 13, 12 calendar days each with weekends included. Mirrors Jira project KAN (sprint IDs 1 and 2).
* **Scope impact:**
  * PC-S3-01..04 are absorbed into PC-S2-02, PC-S2-03, PC-S2-06 and PC-S2-07 (each owner wires their own screens), and PC-S2-08 into PC-S3-09.
  * PC-S2-04, PC-S3-07 and PC-S3-08 are reduced and moved into S2. The minimal Vercel demo is kept; separate staging, the full accessibility audit and user validation are deferred.
  * PC-S3-05 and PC-S3-06 are deferred to the backlog. The golden-date tests move into PC-S2-05.
* **Parallelism fixes:**
  * Token ownership split: PC-S1-01 owns base src/app/globals.css and PC-S1-02 owns src/styles/; PC-S1-05 wires the import.
  * PC-S1-02 excludes the PC-S1-04 technician design docs.
  * PC-S2-01 publishes a D2 schema freeze, so PC-S2-02, PC-S2-03 and PC-S2-07 can start on D3 against the frozen contract.
  * PC-S2-06 develops against seeded jobs and no longer depends on PC-S2-05; it is flagged as critical-path risk.
  * Its absorbed check "repeated generation creates zero duplicates" moves to PC-S3-07 (D10–D11), to be checked once PC-S2-05 (PR D10) has merged.
  * PC-S3-07, PC-S3-08 and PC-S3-09 have narrowed doc paths.
* **Affected:** config/sprints.json, config/work-items.json, scripts/harness.mjs (deferred items, calendar days, Jira keys, excludePaths, parallel path-overlap check), and the Jira descriptions, dates and links of the changed items.
* **Rollback:** revert the implementing PR. Jira state is recorded in docs/jira/sync-log.md.
* **Risks:** S2 is 37 points against roughly 32 of capacity. Photo upload in PC-S2-07 is a stretch goal.

## Open decision template

ID / date / proposer / impacted work items / old approach / alternatives / recommendation / risks / signoff person / decision date / implementation PR / rollback evidence.
