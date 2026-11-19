# Decisions, approvals and material change control

| ID | Topic | Status | Owner and gate |
| --- | --- | --- | --- |
| D01 | Next.js App Router, React, TypeScript, npm lockfile, Tailwind, shadcn/ui | Selected | Reem, S1 scaffold |
| D02 | Single Next.js REST backend, Supabase Postgres/Auth/Storage, Vercel | Proposed | Reem, S0 cost and security review |
| D03 | Three two-week sprints, Nov 23–Jan 3 | Proposed, conflicts with older Dec 13 estimate | Reem, before Jira activation |
| D04 | Single-company MVP and two roles | Assumed | Reem, before S1 contract freeze |
| D05 | Asia/Beirut business timezone, month-end clamp, half-open 90-day window | Proposed | Reem and Rand, S1 contract freeze |
| D06 | Typed name, acknowledgment and timestamp as customer confirmation | Proposed | Reem and Tarek, S1 UX signoff |
| D07 | Private image evidence storage; image retention/access policy | Needs review | Reem, before S2 policies |
| D08 | Vercel Hobby only for personal noncommercial demonstration; free tier terms | Conditional | Reem, before deployment |
| D09 | Pinterest for visual discovery; only licensed source images shipped | Approved safety policy | All UI authors |
| D10 | Human PR approval, with GitHub Free private limitations | Proposed team policy | Reem, S0 |

## Critical change process

For any modification affecting a listed decision, schema, REST contract, tenant or permission boundary, recurrence rule, scope, provider, schedule, source image license or spending:

1. Stop the affected task. Record the proposed old/new approach, reason and options here under a new CR ID.
2. Assess what existing code, tests, docs, data migrations, designs, costs, Git branches, Jira items and deployment environments are affected.
3. Specify safe migration, rollback or rework. Obtain lead approval and, if it changes external commitments or cost, product owner approval.
4. Update relevant requirements, contracts, work item dependencies and Jira scope in a small PR **before implementation resumes**.
5. Reopen any previously accepted feature whose verification is invalidated; run regression tests and record evidence.

Do not overwrite history or mark unexecuted tests as passed. For minor copy/UI spacing fixes, a concise PR note is enough.

## Open decision template

ID / date / proposer / impacted work items / old approach / alternatives / recommendation / risks / signoff person / decision date / implementation PR / rollback evidence.
