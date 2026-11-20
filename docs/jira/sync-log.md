# Jira sync log (lead-owned)

**Sync date:** 2026-11-20 · **Performed by:** Claude Code on behalf of Reem W. Basho (lead) · **Source:** `config/work-items.json`, `config/sprints.json`, `docs/ROADMAP.md` (four-week fallback)

## Target

| Item | Value |
| --- | --- |
| Site | https://techtalks-panelcare.atlassian.net |
| Project | KAN ("Mashare3 team"), team-managed software project, reused (no new project created) |
| Board | Board 2 "KAN board": https://techtalks-panelcare.atlassian.net/jira/software/projects/KAN/boards/2 |
| Sprints feature | Enabled by the lead on 2026-11-20 (Sprints + Estimation) |
| Story points field | `Story point estimate` (customfield_10016) |
| Start date field | `Start date` (customfield_10015); Due date = review-ready PR day |
| Statuses | To Do → In Progress → In Review → Done (no Testing status: use label `testing` after merge; workflow not modified) |
| Reviewer field | None exists; reviewer recorded in description and label `reviewer-<slug>` |
| Dependencies | Native `Blocks` links ("is blocked by") |

## Lead decisions recorded

* **Deadline (D03):** four-week deadline is mandatory. Plan runs **2026-11-20 → 2026-12-13**, weekends included, as two 12-calendar-day sprints. The six-week three-sprint plan was not adopted.
* **Scope:** reduced two-sprint scope approved, **with a minimal Vercel demo kept** (PC-S3-08 reduced).
* **Accounts:** ReemBasho = Reem W. Basho, AlYamanRO = Rand Al Yaman, DagherMM = Mahdi Dagher, BdairiTF = Tarek Bdairi (confirmed by lead).

## Sprints

| Sprint | Jira ID | Name | Dates (Asia/Beirut) | State | Items / points |
| --- | --- | --- | --- | --- | --- |
| S1 | 1 | PanelCare S1 \| Designed Frontend | 2026-11-20 → 2026-12-01 | future (not started) | 9 / 31 |
| S2 | 2 | PanelCare S2 \| Backend, Integration and Demo | 2026-12-02 → 2026-12-13 | future (not started) | 10 / 37 |
| Backlog | none | deferred items | none | none | 2 / 5 |

Sprint 1 was the empty auto-created "KAN Sprint 1", renamed and dated (reused, not duplicated).

## Epics

| Epic | Key |
| --- | --- |
| Foundation | KAN-4 |
| Design | KAN-5 |
| Contracts | KAN-6 |
| Frontend | KAN-7 |
| Backend | KAN-8 |
| Quality | KAN-9 |
| Integration | KAN-10 |
| Deployment | KAN-11 |
| Release | KAN-12 |

## Work item mapping

All items were created in status **To Do**. Labels on each item: `panelcare`, `mvp`, `harness-<id>`, `reviewer-<slug>` (plus `deferred` where relevant).

| Local ID | Jira | Sprint | Assignee | Reviewer | Pts | Start → PR-ready | Blocked by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PC-S1-01 | [KAN-13](https://techtalks-panelcare.atlassian.net/browse/KAN-13) | S1 | Reem | Rand | 3 | 11-20 → 11-21 | none |
| PC-S1-02 | [KAN-14](https://techtalks-panelcare.atlassian.net/browse/KAN-14) | S1 | Mahdi | Reem | 3 | 11-20 → 11-23 | none |
| PC-S1-03 | [KAN-15](https://techtalks-panelcare.atlassian.net/browse/KAN-15) | S1 | Rand | Reem | 3 | 11-20 → 11-23 | none |
| PC-S1-04 | [KAN-16](https://techtalks-panelcare.atlassian.net/browse/KAN-16) | S1 | Tarek | Mahdi | 2 | 11-20 → 11-23 | none |
| PC-S1-05 | [KAN-17](https://techtalks-panelcare.atlassian.net/browse/KAN-17) | S1 | Reem | Mahdi | 3 | 11-24 → 11-25 | S1-01, S1-02, S1-03 |
| PC-S1-06 | [KAN-18](https://techtalks-panelcare.atlassian.net/browse/KAN-18) | S1 | Mahdi | Tarek | 5 | 11-24 → 11-29 | S1-01, S1-02, S1-03 |
| PC-S1-07 | [KAN-19](https://techtalks-panelcare.atlassian.net/browse/KAN-19) | S1 | Rand | Reem | 5 | 11-24 → 11-29 | S1-01, S1-02, S1-03 |
| PC-S1-08 | [KAN-20](https://techtalks-panelcare.atlassian.net/browse/KAN-20) | S1 | Tarek | Mahdi | 5 | 11-24 → 11-29 | S1-01, S1-02, S1-03, S1-04 |
| PC-S1-09 | [KAN-21](https://techtalks-panelcare.atlassian.net/browse/KAN-21) | S1 | Reem | Tarek | 2 | 11-30 → 12-01 | S1-05, S1-06, S1-07, S1-08 |
| PC-S2-01 | [KAN-22](https://techtalks-panelcare.atlassian.net/browse/KAN-22) | S2 | Rand | Reem | 5 | 12-02 → 12-06 | S1-03, S1-09 |
| PC-S2-02 (+S3-01) | [KAN-23](https://techtalks-panelcare.atlassian.net/browse/KAN-23) | S2 | Reem | Rand | 4 | 12-06 → 12-08 | S2-01 |
| PC-S2-03 (+S3-02) | [KAN-24](https://techtalks-panelcare.atlassian.net/browse/KAN-24) | S2 | Mahdi | Rand | 5 | 12-06 → 12-09 | S2-01 |
| PC-S2-04 (reduced) | [KAN-25](https://techtalks-panelcare.atlassian.net/browse/KAN-25) | S2 | Reem | Rand | 2 | 12-08 → 12-10 | S2-01 |
| PC-S2-05 | [KAN-26](https://techtalks-panelcare.atlassian.net/browse/KAN-26) | S2 | Rand | Reem | 5 | 12-07 → 12-11 | S1-03, S2-01 |
| PC-S2-06 (+S3-03) | [KAN-27](https://techtalks-panelcare.atlassian.net/browse/KAN-27) | S2 | Mahdi | Tarek | 3 | 12-09 → 12-12 | S2-01, S2-03, S2-04, S2-05 |
| PC-S2-07 (+S3-04) | [KAN-28](https://techtalks-panelcare.atlassian.net/browse/KAN-28) | S2 | Tarek | Rand | 6 | 12-07 → 12-11 | S2-01 |
| PC-S3-07 (reduced) | [KAN-29](https://techtalks-panelcare.atlassian.net/browse/KAN-29) | S2 | Tarek | Mahdi | 2 | 12-11 → 12-12 | S2-02, S2-03, S2-06, S2-07 |
| PC-S3-08 (reduced) | [KAN-30](https://techtalks-panelcare.atlassian.net/browse/KAN-30) | S2 | Reem | Rand | 3 | 12-09 → 12-12 | S2-02, S2-03, S2-06, S2-07 |
| PC-S3-09 (+S2-08) | [KAN-31](https://techtalks-panelcare.atlassian.net/browse/KAN-31) | S2 | Reem | Mahdi | 2 | 12-12 → 12-13 | S2-02..S2-07, S3-07, S3-08 |
| PC-S3-05 (deferred) | [KAN-32](https://techtalks-panelcare.atlassian.net/browse/KAN-32) | Backlog | Mahdi | Reem | 2 | none | S2-03, S2-06 |
| PC-S3-06 (deferred) | [KAN-33](https://techtalks-panelcare.atlassian.net/browse/KAN-33) | Backlog | Rand | Tarek | 3 | none | S2-06 |

**Not created as separate issues (absorbed):** PC-S3-01 → KAN-23, PC-S3-02 → KAN-24, PC-S3-03 → KAN-27, PC-S3-04 → KAN-28, PC-S2-08 → KAN-31.

**Partially deferred (listed in the owning issue under "Deferred from this item"):** plan edit-conflict/schedule-revision rules (PC-S2-04); accessibility/Impeccable audit and user validation (PC-S3-07); separate staging environment (PC-S3-08). Private photo upload in PC-S2-07 is a stretch goal: if it's not review-ready by 12-11, it's deferred.

## Totals

* Epics: 9 created, 0 reused.
* Stories: 21 created, 0 reused, 0 updated, 5 original IDs absorbed (not created).
* Sprints: 1 reused (renamed and dated), 1 created; none started.
* Blocker links: 48 created and verified.
* Untouched existing issues: KAN-1, KAN-2, KAN-3 (sample items), project SAM1.
* Failed or permission-blocked operations: none.

Verification on 2026-11-20 re-read all 30 PanelCare issues from Jira and compared sprint, story points, assignee and blocked-by links against the local plan: 0 mismatches.

## Open lead actions before S1 work starts

1. **Start Sprint 1** in Jira when the team is ready. Automation never starts it. S1 is dated from today (2026-11-20).
2. **Harness config PR:** update `config/sprints.json` and `config/work-items.json` to the reduced plan (S2 membership for PC-S3-07/08/09, absorbed IDs, new points and days). Until then, `harness start` derives `s3/...` branch names for PC-S3-07/08/09, but Jira shows `s2/...`. Record the change as a CR in `docs/DECISIONS.md` (D03 four-week decision and its impact).
3. Fill `jiraAccountId` in `config/team.json` with the confirmed IDs above.
4. Decide D05 (timezone and month-end clamp) before the PC-S1-03 contract freeze, D06 (customer confirmation) before the S1 signoff, and D07 (photo retention) before PC-S2-07.
5. Re-estimate S2 at sprint planning: 37 points against roughly 32 points of capacity, with Reem carrying 11 points.
