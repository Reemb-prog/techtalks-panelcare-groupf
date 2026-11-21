# Testing policy (D12)

Every behavior change ships with tests in the same PR. Tests prove **risk**, not coverage numbers: write the fewest tests that would fail if the change broke, and run only the tests the change can affect. This applies to every coding assistant (Claude Code, Codex) and every human.

## The three layers

| Layer | Proves | Tool and location | Use for |
| --- | --- | --- | --- |
| **Unit** | One pure function or rule, in isolation | Vitest, `src/**/__tests__/*.test.ts` next to the code | Validations, date/recurrence math, status transitions, formatters, reducers, mappers |
| **Integration** | Several modules working together through a real interface | Vitest, same location; S2 also uses local Supabase | S1: adapter + validation + store (e.g. mock adapter calls). S2: route handler + auth + DB + RLS, scheduler + DB |
| **E2E** | A user can complete a journey in a browser | Playwright, `src/app/__e2e__/<screen>.spec.ts` (e.g. `dashboard.spec.ts`), desktop and mobile projects | One spec per screen or journey: the main flow plus its key failure states |

Unit and integration tests go in a `__tests__/` folder inside the task's own paths (e.g. `src/features/dashboard/__tests__/`). E2E specs share one folder, which every task may write to; edit only your own screen's spec and coordinate before changing another's.

Pick the **lowest layer that can catch the bug**. Logic belongs in unit tests; do not prove a date rule through a browser. E2E covers what only a browser can show: routing, rendering, forms, keyboard and responsive behavior.

UI logic that needs testing is extracted into a pure function (formatter, state reducer, hook body) and unit-tested. Component-rendering tests (jsdom / Testing Library) are not set up; if a task truly needs them, ask the lead for a shared dependency PR instead of adding packages yourself.

## The three paths every change covers

For each behavior the change adds or alters, cover what applies:

* **Happy path**: the intended use works and returns the right shape and values.
* **Misuse path**: invalid input, wrong role, someone else's object, stale `expectedVersion`, duplicate submit, illegal status jump. Expect the contract's 400/403/404/409, and that **nothing was saved**.
* **Error path**: the dependency fails, is slow, returns empty or the session expired. Expect a safe message, no crash, and a retry path in UI. In S1 use the mock scenarios `error`, `slow`, `empty`, `denied`.

A path that cannot happen for this change is skipped, and the plan says why in one line.

## What each kind of change needs

| Change | Minimum tests |
| --- | --- |
| Pure logic (validation, dates, recurrence, status rules) | Unit: happy + boundaries + misuse. Table-driven (`it.each`) for many inputs |
| Adapter, route handler, scheduler, DB/RLS | Integration: happy + every rejection the contract lists (400/401/403/404/409) + one failure |
| New screen or journey | E2E: one happy flow + the screen's empty, error and denied states, on desktop and mobile projects |
| Changed screen | Update or extend the existing spec for that screen only |
| Bug fix | One regression test that fails before the fix |
| Copy, styling, docs, config with no behavior | No new test. Say so in the plan (`Test exemption:` line) |

## Do not overtest

Tests cost review time and model tokens on every run. Avoid:

* Testing the framework, TypeScript, Zod itself or third-party libraries.
* Repeating the same assertion at several layers. One layer owns each rule.
* One test per field when a table-driven test covers them.
* Snapshot tests of whole pages or large objects; assert the few values that matter.
* E2E for logic already covered by unit tests, or a separate spec per small variation.
* Sleeping for time; inject `now`, `delayMs: 0` and IDs (the mock adapters already accept them).

Rough budget per task: a handful of focused unit cases per rule, one integration test per endpoint behavior, one E2E spec per screen. If a test file grows past ~300 lines, check for repetition before adding more.

## Run only what the change affects

During a session, after each change:

```bash
node scripts/harness.mjs test
```

It diffs the branch against `origin/main` (plus uncommitted files) and runs:

* **Vitest related**: only test files that import the changed files, directly or indirectly, plus changed test files.
* **The full Vitest suite** only when shared config changed (`package.json`, lockfile, `tsconfig.json`, `vitest.config.ts`).
* **Playwright** only when UI paths changed (`src/app/`, `src/components/`, `src/features/`, `src/styles/`) or a spec changed. Use `--no-e2e` to skip it while iterating and `--e2e` to force it.

Type-only edits (for example `src/types/`) trigger no runtime tests; `npm run typecheck` covers them. Run `node scripts/ci.mjs` (the full suite) **once**, before pushing for review. CI repeats the full suite on the PR, so nobody needs to rerun everything locally after each small edit.

## Enforcement

`node scripts/harness.mjs check` fails when a branch changes behavior files under `src/` (excluding `src/types/`, tests, fixtures and CSS) without changing any test file. If the change truly needs no test, add one line to the task worklog:

```
Test exemption: <reason, e.g. copy-only change to page heading>
```

The reviewer judges whether the exemption and the tests are sufficient. The checker only proves tests exist, not that they are good.

## Recording evidence

The worklog and PR list, per layer: what was added, which paths it covers (happy / misuse / error), the command run, and the result (`Passed | Failed | Not run | Blocked`). Mocked tests are never reported as real integration (see [QUALITY_SECURITY.md](QUALITY_SECURITY.md)).
