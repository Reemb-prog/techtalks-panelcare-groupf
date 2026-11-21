# Quality, permissions, tests and evidence

## Test layers per sprint

What each change must test, how much, and how to run only affected tests: [TESTING.md](TESTING.md) (D12). The table below is the sprint-level view.

Under the approved four-week plan (CR-01), S2 covers both the backend and the integrated columns: each owner proves their backend independently, then wires their own screens. Items deferred past Dec 13 (full audit, stress timing, user validation) are noted per item in config/work-items.json.

| Layer | S1 mock UX | S2 backend | S2 integrated |
| --- | --- | --- | --- |
| Unit | Forms, DTO adapters, UI state, recurrence date fixtures | Domain algorithms, validations, state transitions | Regression |
| Contract | Typed DTO/error shapes and mocked statuses | Actual API conforms to DTO, invalid inputs rejected | Verify adapters against live APIs |
| Integration | **Not claimed** | Local Supabase migration/RLS/storage tests with test identities | Real service-to-browser persistence |
| E2E | Playwright mocked coordinator and technician flows | API smoke independently | Actual coordinator login → registry → plan → generate twice → assign → technician login → checklist/photo → report |
| Security | UI role cues (not actual authorization) | RLS, private bucket, server auth, invalid API and unauthorized object tests | Cross-role negative E2E, session expiry, no secrets in client |
| Design | Impeccable critique, 375/768/1440 screenshots, keyboard/form review | Readable API error messages | Visual regression, reduced motion, touch targets, responsive tables |

## Baseline quality command

Run \`node scripts/harness.mjs validate\` and \`node scripts/harness.mjs check\` in a task branch. After PC-S1-01 scaffolds application scripts and package-lock.json, run \`node scripts/ci.mjs\` to execute lint, typecheck, tests and production build. The harness checks do **not** independently prove a real API exists. Playwright needs installed browser binaries and a running isolated test environment; use the documented app e2e command once configured, not a simulated 'pass'.

Recommended package.json scripts added by PC-S1-01:

* \`lint\`: eslint .
* \`typecheck\`: tsc --noEmit
* \`test\`: vitest run
* \`build\`: next build
* \`e2e\`: playwright test, run separately after Playwright browser setup (\`npx playwright install chromium\`).

While iterating, \`node scripts/harness.mjs test\` runs only the Vitest and Playwright tests the branch's changes can affect. \`node scripts/ci.mjs\` runs the full suite once before review, and CI repeats it on the PR.

CI runs harness validation and app checks on PRs. Tests with Postgres and storage must use a local Supabase instance or an explicitly isolated nonproduction project, never a production database reset.

## Permission and data rules

* Supabase Auth identities map to profiles. Coordinator reads and writes operational data; technician reads only assigned job/system detail and writes checklist/report for their own assigned jobs.
* All protected Next.js handlers authorize on the server and must not trust role or profile fields supplied by the browser. RLS must also deny unauthorized direct database access.
* No service-role key or CRON_SECRET in \`NEXT_PUBLIC_*\`, \`localStorage\`, JSON responses, client code, logs or screenshot files.
* Private storage bucket; validate MIME type and maximum size, use signed URLs only when the authenticated caller has access. Define retention/consent before collecting any real photos or signatures.
* Restrict file URLs/path traversal; add safe rate limits for auth and privileged endpoints if necessary, and use environment-specific secrets and least-privilege settings.
* Protect against cross-user/IDOR reads, unauthorized assignment, status jump, duplicate completion, retry and concurrent scheduler run.
* Treat sample customer contacts, site photos and signatures as sensitive; use synthetic fixtures for screenshots, demos and repository.

## Feature acceptance checklist

1. The work-item plan and dependency signoff exist.
2. Functionality meets every criterion plus failed/empty/denied states.
3. Tests added with the change per TESTING.md; lint, TypeScript, unit/contract tests and build **actually run**; live tests used where required.
4. Relevant desktop/mobile and accessibility checks performed, with screenshots or recorded observations.
5. Security and data isolation checks pass or an explicit blocker is recorded.
6. Scope checker passes, docs and local handoff updated.
7. PR linked to actual Jira issue; review performed by a non-author human; failures repaired and rerun.
8. Merged main and shared demo are checked; only then Jira status becomes Done.

## Evidence format

Use each task's \`worklogs/PC-SN-XX/plan.md\`: command/date/environment, expected behavior, actual outcome \`Passed | Failed | Not run | Blocked\`, screenshot link or test output location, reviewer and merge PR. It is forbidden to label a mocked test as real integration or to mark 'Passed' when a command was not executed. Shared progress is updated only by the lead after PR integration.

## Scheduler golden tests required before release

Active plan, paused plan, resumed plan, one-month Jan 31, Feb leap day, multiple-month anchor, zero/negative intervals rejected, business timezone boundary, repeated run, concurrent run, edited plan with scheduled unassigned job, edited plan with assigned or in-progress job, completed history immutable, canceled date reactivation, missing/invalid authentication, two technicians attempting job completion, photo failure, dead/expired session and exact 90-day half-open boundary.
