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
4. Playwright config (chromium only, webServer = next dev) with one smoke spec placed under src/app/ is out of scope for e2e/ (owned by PC-S3-07), so keep testDir at src/app/__e2e__/.
5. src/app/globals.css: Tailwind import and minimal reset only, no design tokens (src/styles/ belongs to PC-S1-02). src/app/page.tsx: one responsive placeholder page labelled PanelCare (no mock data, no fake features).
6. .github/workflows/ci.yml: Node 22, npm ci, node scripts/ci.mjs (runs harness validate + lint/typecheck/test/build).

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
Actual commands, date, environment and result (Passed/Failed/Not run/Blocked): NOT RUN
Screenshot/log link: NOT CAPTURED

## Risk, security and UX review
Unknowns / mitigations / Impeccable critique if UI: TO COMPLETE

## Handoff
Status: Planned | Files changed: none | Next step: obtain plan review
