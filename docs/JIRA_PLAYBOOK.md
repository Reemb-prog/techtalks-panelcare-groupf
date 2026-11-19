# Jira operating manual for Claude and the team lead

**This Markdown file tells Jira-connected Claude how to translate the repository plan into Jira safely.** Do not guess project keys, field IDs, account IDs, sprint IDs, board IDs or existing issue state.

## Source-of-truth order

* Product scope and approved decisions: \`docs/PRODUCT_SCOPE.md\`, \`docs/DECISIONS.md\`.
* Sprint dates and goals: \`config/sprints.json\` plus \`docs/ROADMAP.md\`.
* Atomic issues, ownership, acceptance criteria, point estimates, dependencies and PR checkpoints: \`config/work-items.json\`.
* Jira itself: live statuses, actual issue/sprint IDs, resolved users, comments, links and committed work. Do not overwrite existing team changes on synchronization.
* GitHub: evidence PR, merged state, test outcomes. Jira Done requires real evidence.

## One-time Jira discovery

1. Use your connected Jira tools to list accessible sites, projects/spaces, current Scrum boards and configured issue types. Verify the exact target; do not silently create a duplicate project or new board.
2. Determine the project key, board ID, Scrum sprint permission, whether Epics/Stories/Tasks/Subtasks exist, estimation field, allowed custom fields and status transitions. Query actual user accounts for Reem, Rand, Mahdi and Tarek. Names in \`config/team.json\` are **not** Jira account IDs.
3. Inspect existing PanelCare epics, issues, labels, sprint names and links. Deduplicate based on stable local ID in issue description/label, not fuzzy title only.
4. **Resolve the deadline conflict:** previously estimated December 13 versus proposed January 3 finish. Ask Reem which deadline is binding if not already confirmed. Do not create dated active sprints until she confirms the delivery shape. You may draft a backlog safely if she permits.
5. Show a concise impact report: existing vs to-create vs to-update, blocked identities/fields, sprint dates and any permissions issues. Request confirmation before bulk Jira writes.

## Create/update structure after approval

* Use a Scrum board (not a Kanban-only board) and three planned two-week sprints S1/S2/S3 as in config, **or** the explicitly approved four-week fallback. Create all as *future* sprints, and **start only S1** when the lead says begin. For a free plan, avoid cross-project or automation-heavy requirements.
* Create Epics for Foundation, Design, Contracts, Frontend, Backend, Quality, Integration, Deployment and Release (or reuse existing equivalents).
* Each \`config/work-items.json\` item becomes one Jira Story or Task; use stable \`[PC-S1-01]\` in title/description and label \`harness-pc-s1-01\`. Fields: title, user outcome, acceptance, test proof, sprint, epic, owner, reviewer, points, first working day, PR-ready day, touch paths and local branch name.
* Preserve existing useful Jira descriptions/comments. Update fields with an explicit diff. Never downgrade or close existing issues automatically.
* Dependencies become \`blocks / is blocked by\` links where supported. If the board lacks link permissions, preserve an explicit dependency list in text and report limitation.
* Assign only when exact account IDs are confirmed; otherwise leave unassigned and flag a mapping task. Reviewers are collaborators/checklist metadata unless a dedicated Reviewer field exists. No fake account mappings.
* Use Jira backlog states To Do → In Progress → In Review → Testing → Done **only if actual available workflow transitions permit them**. If not, map to real statuses or use labels, never invent custom statuses without the lead's permission.
* Story points are preliminary, to re-estimate as a team during sprint planning. Do not add every technical verification step as a separate Jira story: include acceptance and test evidence in the owning issue.

## Suggested issue description shape

Local ID: PC-S1-06
Sprint: S1, relative start day D4, review-ready PR D8
Owner: Mahdi, reviewer Tarek (resolve real Jira identity)
Outcome: customer, site, system and components screen group
Depends on: PC-S1-01, PC-S1-02, PC-S1-03
Allowed code areas: from work-items JSON
Acceptance: copy verbatim from work-items config, then format as Jira checkboxes if supported
Tests: actual test intention from work-items config
Branch: s1/mahdi/pc-s1-06
Evidence: actual GitHub PR URL and worklog path once available
Definition of Done: human review + passing test evidence + merged main + integration check

## Daily and sprint maintenance

* Daily: Claude reads Jira actual state; developer selects one ready issue, runs harness CLI for that issue, logs branch and draft PR in Jira.
* Review-ready day: Claude links PR and evidence; reviewer moves/labels In Review, not Done.
* After merge and demonstrated acceptance: reviewer or lead moves through Testing to Done and attaches evidence links.
* Sprint D10: review goal, actual Done items and carryovers; retro documents blockers and one concrete improvement. Do not delete unfinished issues or silently reset story points.
* A sprint is not started/closed by automation without explicit leader instruction. Only one active sprint at a time unless the team's Jira workflow explicitly supports otherwise.

## Jira MD usage within Claude Code

At start of each Jira task, tell Claude to read \`docs/JIRA_PLAYBOOK.md\`, \`config/sprints.json\`, \`config/work-items.json\`, \`docs/DECISIONS.md\` and its own \`CLAUDE.md\`. Claude must **not** assume these files are accessible inside Jira's connector. They exist in the checked-out local repository. Use the Jira app for live Jira reads and edits and the local Markdown/JSON for desired scope. After executing changes, produce a table mapping local IDs to actual Jira keys, sprint IDs/URLs, issue assignment and any skipped item. Save it into a lead-owned \`docs/jira/sync-log.md\` PR, not into each developer's branch.

If a Jira connector cannot create Scrum sprints or link blockers, stop that operation and give exact manual steps using the actual board; do not claim success.
