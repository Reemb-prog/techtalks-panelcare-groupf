# PC-S1-05: Coordinator shell, route navigation and mock login

Sprint: S1 | Owner: reem | Reviewer: mahdi
Jira key: KAN-17 | PR: not opened (assistant writes it when review-ready) | Planned start D5, review-ready day: D6
Plan review: Self-approved by Reem (lead) | Approver: Reem | Date: 2026-11-22

## Approval tier (D11)

D11 would normally ask for a separate human plan approval here, because the task sets up the mock auth/role flow, the shared
dashboard layout, the adapter provider PC-S1-06/07/08 consume, and the token wiring. **Lead exception (Reem, 2026-11-22):**
the plan is self-approved; Mahdi's non-author PR review is the gate, and he should give the provider API, the token
`@theme` mapping and the mock sign-in extra attention in that review. Starting before the configured D5 (Nov 24) is also a
lead decision; all three dependencies are merged and Done in Jira. Merge order: the lead/config PR (path change, 3c7f65f)
merges before this task's PR.

## Goal and scope

A coordinator can open `/login`, pick a clearly labeled **mock** demo role, and land in a responsive app shell
(sidebar, top bar with search, mock-mode indicator) whose `/dashboard` shows real counts from the typed mock adapters, plus
upcoming/overdue jobs and expiring warranties, with loading, empty, error and permission-denied states.

Not in scope: real authentication (S2, PC-S2-0x), registry/maintenance/dispatch/technician screens (PC-S1-06/07/08, only
linked from the nav), fault tickets (P1, not accepted; no nav item), any change to `src/types`, `src/lib` or fixtures.

## Dependencies (merged and Done in Jira, verified 2026-11-22)

PC-S1-01 (KAN-13), PC-S1-02 (KAN-14), PC-S1-03 (KAN-15).

## Allowed paths

* src/app/(auth)/
* src/app/(dashboard)/layout.tsx
* src/app/(dashboard)/dashboard/
* src/components/layout/
* src/features/dashboard/
* src/app/globals.css
* src/app/page.tsx and src/app/__e2e__/home.spec.ts (added by Reem 2026-11-22 in lead/config commit 3c7f65f; that lead PR must merge before this task's PR or `harness check` flags them)
* plus my own E2E spec in src/app/__e2e__/ (shared folder, D12)

## Routes and files

| Route / file | Purpose |
| --- | --- |
| `src/app/globals.css` | `@import "../styles/tokens.css";` once, after `tailwindcss`; body uses `--pc-font-sans`, `--pc-color-canvas`, `--pc-color-text`; global `:focus-visible` ring from `--pc-color-focus`/`--pc-focus-width`. Also an `@theme inline` block mapping the tokens to Tailwind names (e.g. `bg-pc-surface`, `text-pc-muted`, `rounded-pc-card`) so every screen uses tokens instead of raw palette classes. **Approval point:** this mapping is the team-wide way to consume tokens. |
| `src/components/layout/mock-session.ts` | Pure helpers: read/write/clear the mock role and mock scenario in `sessionStorage` (`panelcare.mock.role`, `panelcare.mock.scenario`), rejecting any value not in `ROLES` / `MOCK_SCENARIOS`. |
| `src/components/layout/adapters-provider.tsx` | `"use client"`. Creates **one** `createMockAdapters()` per provider mount, rehydrates the stored role via `controls.signInAs(role)` and scenario via `controls.setScenario`, and exposes `useAdapters()` → `{ adapters, session, signInAs(role), signOut(), scenario, setScenario() }`. The only file that touches `controls`. **Shared API** for PC-S1-06/07 (under the dashboard layout) and PC-S1-08 (wraps `src/app/technician/layout.tsx` itself). |
| `src/components/layout/app-shell.tsx`, `sidebar-nav.tsx`, `top-bar.tsx`, `mock-banner.tsx`, `nav-items.ts` | Shell. Skip link to `#main`; sidebar with Dashboard, Customers (`/customers`), Systems (`/systems`), Maintenance (`/maintenance`), Dispatch (`/jobs`); active item with `aria-current="page"`; top bar with search, signed-in name + role chip, "Mock data" scenario select and Sign out. At <1024 px the sidebar becomes a menu button + dialog drawer (focus moved in, Esc and backdrop close, focus returned to the button). |
| `src/app/(auth)/login/page.tsx` (+ `src/features/dashboard/login/*` if it grows) | Sign-in page per blueprint sections: 1 brand/promise, 2 card with two buttons "Continue as demo coordinator" / "Continue as demo technician", 3 a persistent **"Mock sign-in: no real authentication, nothing is saved"** notice, 4 privacy footer. No password field: the acceptance asks for simulated role selection, and a fake password field invites a real password. No photo (no rights-verified asset in the manifest); a token-colored surface panel instead. |
| `src/app/page.tsx` | `/` redirects (server `redirect`) to `/login`; the login page sends an already signed-in tab on to its role home. `home.spec.ts` is updated to assert the redirect instead of the scaffold text. |
| `src/app/(dashboard)/layout.tsx` | Wraps children in the provider and shell. Signed out → `router.replace("/login")` with a "Checking session" placeholder (no flash of the shell). |
| `src/app/(dashboard)/dashboard/page.tsx` + `src/features/dashboard/*` | Blueprint sections: 1 today header (business date, Asia/Beirut) and primary action "View dispatch" → `/jobs`; 2 five summary cards from `dashboard.getStats()` (upcoming 7 days, overdue, unassigned, in progress, completed 30 days), each linking to its filtered list where that screen exists; 3 upcoming/overdue jobs table from `dispatch.listJobs({ status: [scheduled, assigned, in_progress], to: today+6 })`, overdue first, with status chips; 4 expiring warranties list; 5 state panel. |
| `src/features/dashboard/dashboard-view.ts` | Pure view-model: maps `ApiResult`s to `loading / ready / empty / error / denied / signed-out`, orders jobs (overdue first, then date), labels and chip tone per `JobStatus` (blueprint: neutral = scheduled/unassigned, info = assigned/in progress, success = completed, danger = overdue, warning = warranty due). |

Search entry: the top-bar search is a GET form to `/customers?q=…` (PC-S1-06 owns that list and its `q` filter). Until that
screen merges the link 404s; the nav items for unbuilt screens are visible but a broken route is expected during S1 and noted
in the PR.

Technician: signing in as technician routes to `/technician` (PC-S1-08). A technician who opens `/dashboard` sees the
permission-denied state ("The dashboard is for coordinators") with a link back to My Jobs; no stats are fetched.

## States

| State | Behavior |
| --- | --- |
| Loading | Title stays visible; skeleton cards with `aria-busy` and a polite "Loading dashboard" live region. `slow` scenario exercises it. |
| Empty | `empty` scenario: zero counts render as 0 (real, not hidden); table and warranties show "No upcoming visits" / "No warranties expire in the next 90 days" with a link to Maintenance. |
| Error | `error` scenario: message from the adapter plus Retry (re-fetches, no reload). |
| Denied | `denied` scenario and technician role: explanation and link to permitted work; no record details. |
| Signed out / expired | Redirect to `/login`; stored role cleared if `signInAs` fails. |
| Invalid input | Only the search box: empty query submits nothing (button disabled until text). |

## Edge cases and assumptions

* Route groups `(auth)` and `(dashboard)` have separate layouts, so the provider remounts between them; persistence across that boundary is the stored role/scenario only. Mock edits made on one screen survive navigation inside the dashboard layout but are lost on reload. That is acceptable for S1 and stated in the mock banner.
* `sessionStorage` is per tab and cleared on tab close (intended: no lingering "login"). Access is wrapped in try/catch (private mode) and falls back to in-memory.
* The stored role is UI convenience only; the mock banner and code comments repeat that S2 derives the role on the server.

## Acceptance criteria

* [x] Dashboard has meaningful overview and navigable sidebar, search entry and statuses
* [x] Simulated role selection is visibly labeled mock, not production login
* [x] Keyboard/mobile navigation and loading/empty/error states work
* [x] Wire the PC-S1-02 tokens from src/styles/ into src/app/globals.css (single import) after PC-S1-01 and PC-S1-02 merge
* [x] Empty, loading, error, invalid-input and permission-denied states handled (no fake persisted success) (Jira)

## Tests (docs/TESTING.md: lowest layer that catches the bug; happy, misuse and error paths)

Task test hint: Playwright mock route and manual 375px/768px/1440px inspection

* Unit (Vitest, node), `src/components/layout/__tests__/` and `src/features/dashboard/__tests__/`:
  * `mock-session`: round-trip role and scenario (happy); tampered/unknown value is rejected and cleared (misuse); storage that throws falls back without crashing (error).
  * `nav-items` active matching: `/customers/123` activates Customers, `/dashboard` does not activate others, unknown path activates none.
  * `dashboard-view`: each `ApiResult` maps to the right state (ok, zero counts → empty sections not error, 403 → denied, 401 → signed-out, 500 → error); job ordering overdue-first; chip tone per status.
  * Provider/adapter integration (node, no DOM): stored coordinator role + `createMockAdapters({ delayMs: 0 })` yields stats equal to a direct adapter call; technician role yields `FORBIDDEN`. Covers the wiring without a React renderer.
* Integration: none beyond the adapter wiring above. No backend exists in S1.
* E2E (Playwright, desktop + mobile projects), `src/app/__e2e__/dashboard.spec.ts`:
  * Happy: `/login` shows the mock notice → continue as coordinator → `/dashboard` shows the five cards with numbers, the jobs table and warranties; sign out returns to `/login`.
  * Signed out: visiting `/dashboard` directly redirects to `/login`.
  * Keyboard: skip link focuses main; sidebar links reachable by Tab with `aria-current` on Dashboard.
  * Mobile project: menu button opens the drawer, Esc closes it and focus returns to the button.
  * States via the "Mock data" select: empty (zero counts, empty messages), error (message + Retry), denied (technician sign-in → denied panel on `/dashboard`).
* Not tested: component rendering in jsdom (not set up, D12); visual layout (manual screenshots instead).
* `home.spec.ts`: `/` lands on `/login` with the mock notice visible (replaces the scaffold-text assertion).

## Evidence (Passed/Failed/Not run/Blocked; never claim an unexecuted check)

Run on 2026-11-22, Windows 11, Node 23.1, branch s1/reem/pc-s1-05 on main 176b24a.

* Affected run, `node scripts/harness.mjs test`: unit (related) **Passed** 3 files / 18 tests. E2E **Failed** 2 of 14 on the first run (the sign-in test, both projects): a cold `next dev` compile of /dashboard ran past the 5 s assertion timeout. That navigation now has a 20 s timeout. Reruns: `--repeat-each=2` 26 passed / 2 skipped; cold full run (no dev server running) 13 passed / 1 skipped, twice.
* Full run, `node scripts/ci.mjs`: **Passed**. Harness validate, lint, typecheck, Vitest 11 files / 118 tests (100 existing + 18 new), production build (/login 2.34 kB, /dashboard 4.02 kB).
* `node scripts/harness.mjs check`: **Passed** after merging main deaf24b (lead PR #17), 24 changed paths. Earlier it flagged `src/app/page.tsx` only, before that PR merged.
* After merging main deaf24b: `node scripts/ci.mjs` **Passed** (118 tests, build); Playwright cold run **Passed** 13 / 1 skipped.
* Manual (in-app browser, `next dev`): 1440 (sidebar and content side by side, no horizontal scroll), 768 (drawer, cards 3+2, table fits), 375 (no page overflow after a fix, table scrolls in its own region, status chip under the date, drawer opens with sign-out). Login checked at 1440 and 375. **Passed.** Real screenshots for the PR still need to be captured by a human.
* Impeccable: detector run on the shell, dashboard, sign-in and globals.css. It found one issue (thick top accent border on rounded cards), which is fixed (tone dot instead); rerun clean. Design critique was a brief single-context pass, not the full two-agent critique (see Risk section).

Skipped: component rendering tests (jsdom not set up, D12). No backend exists in S1.

## Risk, security and UX review

* Shared API: `useAdapters()` in src/components/layout/adapters-provider.tsx is the interface PC-S1-06/07/08 build on. Screens call `adapters.*` and re-fetch on `dataVersion`. Do not change its shape after merge without telling those owners.
* Security: no credentials, no password field, no network calls. The stored role is UI-only (sessionStorage, validated against ROLES and cleared if tampered). Mock code is flagged for removal at the S2 release signoff (PC-S3-09).
* UX: one skip link, `aria-current` in the navigation, the drawer is a native modal `<dialog>` (Esc and backdrop close it, and focus returns to the menu button), loading has a live region, the error has Retry, denied explains the limit. The mock banner is always visible and switches scenarios.
* Impeccable critique (single context, brief): strengths are data-first hierarchy, repeated honest mock labeling, and states that look deliberate. Open points, deliberately left: summary cards do not link to filtered lists yet (needs PC-S1-07's query params); the sign-in side panel is a placeholder pattern until a licensed photo exists (D09); at 768 the five cards wrap 3+2.

## Out-of-scope items for the lead (recorded per CLAUDE.md)

1. Resolved 2026-11-22: Reem added `src/app/page.tsx` and `home.spec.ts` to PC-S1-05 (lead/config 3c7f65f). KAN-17 "Allowed file paths" updated to match on 2026-11-22 (at Reem's request).
2. PC-S1-08 needs to wrap `src/app/technician/layout.tsx` with `<AdaptersProvider>`; that is in Tarek's paths, so Tarek must be told.
3. `vitest.config.ts` has no `@/` alias, so modules that unit tests load must use relative imports (as src/lib already does). Adding the alias is a one-line shared-config change for a lead PR; not blocking.

## Developer review guide (assistant updates after every run; see CLAUDE.md)

Review next (file:line and what to check):

1. src/components/layout/adapters-provider.tsx:19: the shared `useAdapters()` API that the S1 screens will depend on.
2. src/components/layout/mock-session.ts:46: the stored role is validated and cleared if tampered, and stays non-authoritative.
3. src/app/globals.css:10: the `@theme inline` token mapping becomes the team convention (Mahdi owns the tokens).
4. src/features/dashboard/dashboard-view.ts:83: how 401/403/500 and zero data map to signed-out, denied, error and empty.
5. src/features/dashboard/dashboard-screen.tsx:88: a technician gets the denied panel and no coordinator data is fetched.

Developer to fill or decide:

* Capture real screenshots at 375/768/1440 of /login and /dashboard for the PR.
* Tell Tarek to wrap `src/app/technician/layout.tsx` in `<AdaptersProvider>`, and Mahdi/Rand that `useAdapters()` exists.
* Move KAN-17 to In Review when the PR is submitted.

## Handoff

Status: Review-ready | Files changed: src/app/globals.css, src/app/page.tsx, src/app/(auth)/, src/app/(dashboard)/layout.tsx, src/app/(dashboard)/dashboard/, src/components/layout/, src/features/dashboard/, src/app/__e2e__/home.spec.ts, src/app/__e2e__/dashboard.spec.ts | Next step: submit the PR from worklogs/PC-S1-05/pr.md, request Mahdi.
