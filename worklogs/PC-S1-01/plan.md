# PC-S1-01: Initialize Next.js and repository quality gates

Sprint: S1 | Owner: reem | Reviewer: rand
Jira key: KAN-13 | Draft PR: TO CONFIRM | Planned start D1, review-ready day: D2
Plan review: Approved (routine task; lead self-approval, see CLAUDE.md plan-review rule) | Approver: Reem (lead) | Date: 2026-11-20. PR review by Rand still required before merge.

## Goal and scope
Initialize Next.js and repository quality gates

## Dependencies to confirm merged
(none)

## Allowed paths
* package.json
* package-lock.json
* src/app/
* tsconfig.json
* next.config.ts
* postcss.config.mjs
* eslint.config.mjs
* vitest.config.ts
* playwright.config.ts
* .github/workflows/
* .gitignore
* public/

## Implementation plan
1. Generate a Next.js App Router + TypeScript + Tailwind + ESLint app with create-next-app (npm, src/ dir, alias @/*) in a temp folder outside the repo, then copy only the allowed files into the repo root. Never overwrite harness files (README.md, .gitignore is merged by hand, AGENTS.md, CLAUDE.md, docs/, scripts/, config/).
2. package.json scripts: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run), e2e (playwright test). Commit package-lock.json.
3. Vitest (jsdom not needed yet; node env) with one smoke unit test under src/app/ so the test script passes honestly.
4. Playwright config (desktop Chrome + Pixel 7, webServer = next dev) with one smoke spec in src/app/__e2e__/ (e2e/ belongs to PC-S3-07).
5. src/app/globals.css: Tailwind import and minimal reset only, no design tokens (src/styles/ belongs to PC-S1-02). src/app/page.tsx: one responsive placeholder page labelled PanelCare (no mock data, no fake features).
6. CI: the existing .github/workflows/quality.yml already runs harness validate, check and node scripts/ci.mjs with npm cache once package-lock.json exists, so no new workflow is added.

## Edge cases and risks
* create-next-app must not touch the harness: generating outside the repo removes the risk.
* Keep within allowed paths; harness check enforces this. .gitignore already covers node_modules/.next/test outputs.
* Playwright browser download is not run in CI yet (e2e not part of ci.mjs); local smoke run only.
* No secrets, no env values; nothing user-facing beyond a placeholder.

## Acceptance criteria
* [ ] Create App Router TypeScript project at repository root without overwriting harness
* [ ] Tailwind, lint, typecheck, Vitest and Playwright runnable with committed npm lockfile
* [ ] A first responsive page renders and GitHub Actions passes
* [ ] Owns only the base src/app/globals.css (Tailwind import and reset), with no design tokens; src/styles/ belongs to PC-S1-02

## Tests and evidence
Intended: npm run lint; npm run typecheck; npm run test; npm run build
Actual (2026-11-20, Windows 11, Node 23.1.0, npm 10.9.1): npm run lint Passed; npm run typecheck Passed; npm run test Passed (1 test); npm run build Passed; npm run e2e Passed (2: desktop + mobile, local Chromium); node scripts/harness.mjs check Passed (17 paths in scope); node scripts/ci.mjs FAILED locally: harness validate passed, then "spawnSync npm ENOENT" (ci.mjs calls npm without a shell, which does not resolve npm.cmd on Windows; harness bug outside this task, reported to lead). The same lint/typecheck/test/build steps pass when run directly (above). Expected to work on the Linux GitHub runner. GitHub Actions: Not run yet (runs on the PR).
Screenshot/log link: NOT CAPTURED

## Risk, security and UX review
Placeholder page only, no design decisions: no tokens, no web fonts (system stack) so PC-S1-02 owns typography. next-env.d.ts is gitignored (generated). e2e is not part of CI yet. Impeccable: n/a (no designed UI).

## Handoff
Status: Ready for review | Files changed: package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, vitest.config.ts, playwright.config.ts, .gitignore, src/app/ | Next step: PR review by Rand; then PC-S1-05 wires tokens into globals.css.
