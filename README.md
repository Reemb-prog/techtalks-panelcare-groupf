# PanelCare: shared Claude Code engineering harness

This repository starts with the **harness, not a fabricated application**. Four human developers and their separate Claude Code sessions use the same repository, a common Jira Scrum board, focused task branches, repeatable quality gates, and lead-managed Vercel deployment.

**Team:** Reem W. Basho (lead), Rand Al Yaman, Mahdi Dagher, Tarek Bdairi.

**Project:** A solar maintenance system for coordinators and technicians. Core journey: customer → site → solar system and components → maintenance plan → recurring job → dispatch → inspection → service report. Fault tickets are P1 and are not a release blocker.

## Read this first

1. Read [CLAUDE.md](CLAUDE.md) and [docs/ROADMAP.md](docs/ROADMAP.md).
2. Reem creates a private repository called \`panelcare\`, adds collaborators, and imports this folder at the root. No accounts are created by this ZIP.
3. Reem runs the separately supplied Jira setup prompt in Claude **with Jira access**. It reads [docs/JIRA_PLAYBOOK.md](docs/JIRA_PLAYBOOK.md), [config/sprints.json](config/sprints.json) and [config/work-items.json](config/work-items.json). Jira issue keys are recorded in Jira or the PR descriptions; local stable IDs stay unchanged.
4. Each member clones the repository and executes:

   \`\`\`bash
   node scripts/harness.mjs validate
   node scripts/harness.mjs member reem   # or rand, mahdi, tarek
   node scripts/harness.mjs list S1
   \`\`\`

5. After pulling an up-to-date \`main\`, start a task:

   \`\`\`bash
   node scripts/harness.mjs start PC-S1-01
   node scripts/harness.mjs plan
   node scripts/harness.mjs status
   \`\`\`

6. Write the task plan, request the plan/design review, implement only after approval, test, and open a PR. Consult [docs/TEAM_BRANCHES.md](docs/TEAM_BRANCHES.md) for daily Git commands.

## How the harness controls work

The current Git branch identifies the sprint, member, and specific work item. Example: \`s1/mahdi/pc-s1-06\`. Work items define owners, dependencies, touch paths, acceptance criteria, target PR day, and reviewers. \`node scripts/harness.mjs check\` validates the active branch, task plan, ownership, and changed-file boundaries. GitHub Actions adds a second check on pull requests.

The harness is shared **through Git**. It is not a central autonomous service that can safely coordinate four concurrent agents without Git or human review. Jira tracks status; GitHub tracks code review; the repository tracks requirements and durable decisions. Each Claude Code session must read its current branch context, and cannot treat another developer's unmerged branch as available.

## Dates

Approved four-week plan (D03, CR-01): two 12-calendar-day sprints, weekends included. S1 November 20–December 1 (designed mock frontend) and S2 December 2–13 (backend, integration and demo). See [docs/ROADMAP.md](docs/ROADMAP.md) for the day sequence and [config/sprints.json](config/sprints.json) for the authoritative dates. The earlier six-week, three-sprint plan was not adopted.

## Existing code

The first approved task, \`PC-S1-01\`, initializes the actual Next.js project at repository root, preserving harness files, with TypeScript, App Router, Tailwind CSS, ESLint, a lockfile, and test tooling. Follow [safe scaffolding instructions](docs/SCAFFOLD.md), because \`create-next-app\` may not initialize an existing nonempty directory. Before then, \`npm\` application checks are not available; harness validation **does not claim app tests passed**.

## Useful references

[Product boundaries](docs/PRODUCT_SCOPE.md) · [Roadmap and PR days](docs/ROADMAP.md) · [Design blueprint](docs/DESIGN_BLUEPRINT.md) · [API and data contracts](docs/CONTRACTS.md) · [Test and security controls](docs/QUALITY_SECURITY.md) · [Free-tier constraints](docs/HOSTING_COSTS.md) · [Jira operating manual](docs/JIRA_PLAYBOOK.md) · [Deployment checklist](docs/RELEASE.md)
