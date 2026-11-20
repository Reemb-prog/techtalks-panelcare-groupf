# Four-member branch and review operating model

## Recommended choice: one branch per issue

Use an **issue branch**, not one long-running branch per member. This reduces integration conflicts and lets one sprint contain several parallel feature branches. Each branch encodes sprint, member and local issue ID:

| Member | Example branch | Role within sprint |
| --- | --- | --- |
| Reem | s1/reem/pc-s1-01 | scaffold; integration approvals |
| Rand | s1/rand/pc-s1-03 | contracts and typed mocks |
| Mahdi | s1/mahdi/pc-s1-06 | registry UI |
| Tarek | s1/tarek/pc-s1-08 | mobile technician UI |

One task is owned by one person and one Claude session at a time. A member may have multiple branches across a sprint but works on one at a time. **Never share a single Git working tree between two simultaneously writing Claude sessions.** Members each use their own clone. If one member needs multiple parallel sessions, use separate Git worktrees and distinct tasks; never two sessions mutating one branch.

## Commands on every machine

One-time: \`node scripts/harness.mjs member <slug>\` writes a gitignored local identity. As a member, select an approved item in Jira, then:

\`\`\`bash
git switch main
git pull --ff-only origin main
node scripts/harness.mjs list S1
node scripts/harness.mjs start PC-S1-06
node scripts/harness.mjs plan
\`\`\`

Claude reads the current worklog plan and completes it. Routine tasks: record the plan as self-approved and implement. Tasks touching contracts, schema/RLS, auth/roles, recurrence, design system, provider, spend, deployment or shared files: get a human plan approval first (tiers in CLAUDE.md, D11). Then:

\`\`\`bash
node scripts/harness.mjs check
node scripts/ci.mjs
git add <only-intended-files>
git commit -m "feat(registry): build customer and system forms"
git push -u origin s1/mahdi/pc-s1-06
\`\`\`

Open a PR targeting **main**, mention both local ID and **actual Jira key**, attach proof, request non-author reviewer, fix feedback, merge, then mark Jira Done once tested. After merging, delete obsolete remote/local task branch if it is safely merged and no one is using it; never force delete teammate work.

## Integration and file ownership

* Branch scope is declared per item in \`config/work-items.json\`. The checker flags files outside these paths. Each task can update its own \`worklogs/ID/\` proof.
* Worklogs are per task and safe to merge independently. Only Reem updates shared \`progress.md\`, \`session-handoff.md\`, work-item ownership, sprint dates and global decisions, normally in dedicated lead PRs.
* Components used by multiple members (tokens, contracts, shared layout, auth, schema) are **first approved in an early foundation PR**. Branches with stale assumptions rebase onto merged main and rerun tests before review.
* Two developers should never modify the same shared component without agreeing which work item owns it. If new common behavior is needed, open a small lead-owned dependency PR rather than making a last-minute cross-branch edit.
* Hard feature dependencies are represented by \`dependsOn\`; they require merged and accepted Jira work, not merely a drafted PR.
* PR review rotation defined per work item; Reem reviews core contracts, security and release but cannot be sole reviewer for her own work.

## Practical workflow

1. Jira To Do → branch start; plan written (and approved by a human when the task needs it, per D11).
2. Jira In Progress → implementation, tests, self-review and a draft PR.
3. Jira In Review → reviewer checks diff, scope, design, negative tests and PR evidence.
4. Jira Testing → merged to main, integration regression and preview validated.
5. Jira Done → acceptance criteria and evidence truly satisfied. A failed check goes back to In Progress, not to Done.

If the Jira board cannot support a custom Testing column, use a workflow status or issue label rather than inventing a Jira transition.

## GitHub Free limitation

On **GitHub Free private repositories**, mandatory protected-branch rules are not available, so the review requirement is a process rule checked by the team. GitHub Actions still runs on PRs, but users can bypass its outcome when manually merging. GitHub Free **public** repos can enforce protected branches; switching a private project to public requires a privacy review and consent, not an automatic workaround. Do not misrepresent a written CODEOWNERS rule as enforced.
