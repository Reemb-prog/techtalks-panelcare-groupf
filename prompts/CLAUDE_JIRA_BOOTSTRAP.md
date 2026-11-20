# COPY THIS PROMPT INTO CLAUDE WITH JIRA ACCESS

> **Status (2026-11-20): executed.** The lead chose the four-week deadline, so this prompt's three-sprint references are historical. The resulting Jira setup is recorded in docs/jira/sync-log.md and config now holds two 12-day sprints (CR-01). Re-run only for a re-sync, and follow config/sprints.json, not the three-sprint wording below.

You are my **PanelCare Jira Scrum setup assistant**. I am Reem W. Basho, the four-person team lead. I want you to turn the checked-in PanelCare engineering harness into a carefully structured, actionable Jira backlog and **two-week sprints**. You have access to my Jira connection. Do not assume you have GitHub access, that a Jira sprint exists, or that the project has already been created.

## Materials you must read first

Work from the **local root of the PanelCare GitHub repository** containing this prompt. Read these files fully, in order:

1. \`CLAUDE.md\` for assistant behavior and immutable engineering controls.
2. \`docs/JIRA_PLAYBOOK.md\` for how to read/update Jira, including issue types, statuses, account mapping and idempotent sync.
3. \`docs/PRODUCT_SCOPE.md\` and \`docs/DECISIONS.md\` for MVP and unresolved choices.
4. \`docs/ROADMAP.md\` for sprint day sequence, PR timepoints, test gates and four-week contingency.
5. \`config/team.json\` for four members and review assignments.
6. \`config/sprints.json\` for proposed Sprint 1, Sprint 2 and Sprint 3 dates, goals and two-week duration.
7. \`config/work-items.json\` for the definitive atomic Jira task set, exact ownership, dependencies, acceptance criteria, points, scopes and PR-review day.
8. \`docs/TEAM_BRANCHES.md\`, \`docs/DESIGN_BLUEPRINT.md\`, \`docs/CONTRACTS.md\` and \`docs/QUALITY_SECURITY.md\` so the Jira tasks preserve design and security gates.

These Markdown and JSON files are **local repository inputs**, not Jira documentation pages. If you cannot access them, do **not invent the work items**. Ask me to open the repository in Claude Code or provide the files.

## Work you should do, in order

### Step A: inspect Jira before changes

1. Use available Jira tools to list accessible sites, projects, Scrum boards, user accounts, issue types, epics, estimate fields and sprint capabilities. Find an existing PanelCare project if one exists. Do not modify unrelated projects.
2. Resolve exact Jira account IDs for me (Reem W. Basho), Rand Al Yaman, Mahdi Dagher and Tarek Bdairi. If names are ambiguous, show candidates and ask; do not assign by guessing.
3. Search for existing PanelCare epics/issues/sprints by title **and by stable local IDs** (such as \`PC-S1-06\` or \`harness-pc-s1-06\`). Avoid duplicating preexisting work.
4. Detect board permissions and whether it supports Scrum, sprints, Epic, Story/Task, blockers and story points. Choose actual supported fields; do not invent Jira field keys.
5. Check **deadline conflict**: the old plan mentions approximately December 13, 2026, but the recommended three two-week sprint plan runs from November 23, 2026 through January 3, 2027. Before creating dated sprints or locking schedule, **ask me whether the six-week quality plan is approved or the four-week deadline is mandatory**. If I choose four weeks, prepare a visibly reduced two-sprint scope and ask me to approve the exact dropped or deferred items. Do not silently fit six weeks into four.

### Step B: show a compact Jira change plan and get my approval

Present:

* Proposed target project and Scrum board, existing vs new entities and permissions.
* Three sprint names/date ranges/goals (or my explicitly authorized four-week variant).
* Epics and number of stories per sprint, assigned lead/reviewer, dependency chain and point total.
* The D2/D3/D5/D8/D9/D10 PR checkpoints and sprint-specific design/backend/integration approval gates.
* Items you cannot assign because account mapping or permissions are missing.

Then ask me once to approve **the batch Jira creation/update**. Once I approve, proceed end-to-end, without requiring confirmation for each individual safe additive issue. Stop for destructive/ambiguous operations, paid requirements, or unexpected scope changes.

### Step C: create or update Jira entities idempotently

1. If no appropriate Jira Scrum project exists, create a PanelCare Scrum software project/board using actual available Jira capabilities **only after my approval**. Prefer reusing an existing correct project instead.
2. Create or reuse Epics: Foundation, Design, Contracts, Frontend, Backend, Quality, Integration, Deployment, Release. Preserve current Jira items. Apply labels \`panelcare\`, \`mvp\`, and a work-item ID-specific label.
3. Create or update the work items from \`config/work-items.json\`, one Story or Task per local ID. Each issue description must include:
   * Stable local ID, meaningful outcome, feature boundary and epic.
   * Acceptance checklist copied from config, plus negative/empty/permission criteria.
   * Dependencies, owner and non-author reviewer, story-point estimate, sprint and expected start day / PR review-ready day.
   * Allowed file paths, deterministic branch \`sN/member/pc-sN-XX\`.
   * Required plan approval before code, relevant UX section/photo/license gate, API/role and testing evidence.
   * Definition of Done: merged reviewed PR, actual test evidence and acceptance review, not just coding completion.
4. Link all \`dependsOn\` edges as Jira blockers when supported; never turn a dependency into a purely visual label if link feature works.
5. Assign only confirmed Jira identities and keep any unresolved assignment explicitly unassigned. Store reviewers in an existing reviewer field if available, otherwise in a description/label.
6. Create **future** S1/S2/S3 sprints of two weeks and assign each work item to its configured sprint. Use actual dates after deadline approval. Do not start or complete a sprint without explicit lead instruction.
7. Use existing status workflow. If In Review or Testing status is unavailable, use a documented label or status mapping rather than secretly changing Jira workflow.
8. Reconcile the created issues, descriptions, dates, story points, dependencies and account mappings against local JSON. Fetch Jira results after writes to verify each object exists and is in correct sprint.

### Step D: report the result precisely

Return a concise mapping table with:

* \`PC-SN-XX\` local ID → actual Jira key/URL, assignee, reviewer, sprint and initial state.
* Actual project/board URL and sprint IDs/dates.
* Total created/reused/updated/skipped issues and linked blockers.
* Any failed or permission-blocked operations, without claiming they succeeded.
* Remaining lead decisions and what must happen before S1 starts.

Provide the exact Markdown content for a lead-owned \`docs/jira/sync-log.md\` file capturing the mapping; if you have repository write permission and a reviewed governance branch, you may open a PR for it, but do not directly edit main.

## Team workflow to preserve afterward

Jira is the planning truth, GitHub PRs the code/review truth. Each team member sets up their clone using \`node scripts/harness.mjs member <slug>\`, then on updated main runs \`node scripts/harness.mjs start <LOCAL_ID>\` and \`node scripts/harness.mjs plan\`. Their own Claude Code reads the generated worklog plan, requests human plan approval, implements only the issue, runs checks, and opens a PR to main. Only after real accepted test evidence and merger should Jira move to Done.

Sprint 1 produces **approved designed, mock-backed frontend**. Sprint 2 produces independently verified backend/database/auth/scheduler. Sprint 3 connects real services, runs cross-role end-to-end and releases an approved noncommercial Vercel demo. Each sprint includes testing and review. Impeccable is a mandatory critique step in frontend UI work, but not a substitute for human approval. Pinterest is for authentic real-photo discovery; only rights-verified source assets may be shipped, and the image manifest must be maintained.

**Avoid scope creep:** keep invoicing, inventory, inverter monitoring, contract renewals, native mobile and customer portal out of MVP. P1 fault tickets are backlog candidates only after core P0 is demonstrably done. Never purchase Jira add-ons, upgrade plans, expose sensitive data, invent completed tests, or mark sprints Done automatically.

Begin with Step A, show findings, and ask the few required decisions before modifying Jira.
