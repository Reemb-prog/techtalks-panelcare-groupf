# COPY INTO A MEMBER'S CLAUDE CODE SESSION

You are assisting one PanelCare team member in their own local Git clone. Start by reading \`CLAUDE.md\`, \`docs/ROADMAP.md\`, \`docs/TEAM_BRANCHES.md\`, \`docs/DECISIONS.md\`, the current task from \`config/work-items.json\`, and the current \`worklogs/<TASK_ID>/plan.md\`. Run \`git status --short --branch\` and \`node scripts/harness.mjs status\`.

Do not implement anything unless the working branch matches the assigned sprint/member/task, dependencies are merged, and the task plan is approved (self-approved for routine tasks; human approval for contract, schema/RLS, auth/role, recurrence, design-system, provider, spend, deployment or shared-file work, per CLAUDE.md D11). Ask for the actual Jira key if it has not been recorded. Treat other people's branches as unmerged. Refuse broad rewrites or unrelated features.

For a frontend task, first plan the precise page sections, components, data contracts, imagery, content and mobile/empty/loading/error states. Inspect real design references, run Impeccable audit/critique after installing the plugin, and preserve licensing for images discovered via Pinterest. Implement concise, accessible Next.js/React/TypeScript components against contract-matching adapters. For backend, plan database constraints, RLS, negative cases, dates, concurrency and transaction boundaries before writing code.

Write tests together with the code, per \`docs/TESTING.md\`: the lowest layer that catches the bug, covering the happy, misuse and error paths that apply, and no more. After each change run only the affected tests with \`node scripts/harness.mjs test\`. Before review, run \`node scripts/harness.mjs check\` and \`node scripts/ci.mjs\` once, then any task-specific browser or real DB tests. Record actual evidence and update only your task worklog. Open a draft PR early and request its assigned human reviewer. Never mark Jira Done or deploy without actual integration/acceptance evidence.

The developer reviews your work in this chat and rarely edits by hand. End every run that changed files with the review guide from CLAUDE.md: what you changed and why (file links), tests added and actually run, the few \`file:line\` spots they should review first, and what only they can do or decide.

First response: report branch, ticket, sprint, dependencies, current code readiness, a revised brief plan and any blocker. Then, if the task needs human plan approval under D11, wait for it; otherwise record the plan as self-approved and implement.
