# Lead session handoff

Updated: 2026-11-22 by Reem (lead) with Claude.
Repository: GitHub Reemb-prog/techtalks-panelcare-groupf (moved from Reemb-prog/PanelCare). Jira: project KAN.
Main: ff40f3c (PC-S1-01 to PC-S1-04 merged). Lead branch: lead/config (governance, docs, config only; never app code under src/).

Active lead task: PC-S1-05 coordinator shell (KAN-17, In Progress in Jira), no branch yet. Earliest start D5 (Nov 24).

Open decisions: D02 provider (Proposed), D06 customer confirmation (Proposed, Tarek, S1 UX signoff), D07 image storage policy (Needs review, before S2), D08 hosting terms (Conditional, before deploy), D10 PR approval policy (Proposed).

Blockers: none. PC-S1-02 and PC-S1-04 merged on Nov 21; PC-S1-05 dependencies are met.

Notes for the next session:
* PC-S1-05 plan should cover: a client-side provider holding one `createMockAdapters()` instance, mock role kept in sessionStorage (in-memory sessions are lost on reload), a visible "mock" label on role selection, dashboard numbers from `adapters.dashboard.getStats()`, and the slow/error/empty/denied mock scenarios for loading, error and empty states.
* Small follow-ups for Rand, not blocking: `simulate()` in src/lib/adapters/mock/runtime.ts passes a possibly-null session as `Session` to signed-out handlers; three files in src/lib (recurrence.ts, job-status.ts, dates.ts) start with a UTF-8 BOM. Rand should also tick the acceptance checkboxes in worklogs/PC-S1-03/plan.md.
* Dependencies (2026-11-22): Next.js and eslint-config-next moved from 15.5.4 to the 15.5.29 security backport, clearing the critical Next.js advisories (incl. RCE) and sharp. Still open, each needing a major upgrade, deliberately deferred: Vitest 3 dev-only advisories (tinypool, @vitest/mocker; test runner only, never shipped) need Vitest 4+; PostCSS 8.4.31 bundled inside Next (build-time, our own CSS only) needs Next 16. Revisit Next 16 before the S2 demo deploy (PC-S3-08).
* Next human action: review and merge the lead PR from lead/config, then start PC-S1-05 from updated main.
