# feat(shell): coordinator shell, mock sign-in and dashboard (PC-S1-05, KAN-17)

Local task ID: PC-S1-05
Actual Jira issue key and URL: KAN-17, https://techtalks-panelcare.atlassian.net/browse/KAN-17
Sprint / member / reviewer: S1 / Reem / Mahdi
Target main | Review-ready day: D6 (2026-11-25); ready 2026-11-22

## User outcome and boundary

A coordinator opens `/` (now redirects to `/login`), picks a clearly labeled **mock** demo role, and lands in a responsive app shell with a real-count dashboard.

* **Tokens:** `src/styles/tokens.css` is imported once in `globals.css`, with an `@theme inline` mapping so screens can use `bg-pc-surface`, `text-pc-muted`, `rounded-pc-card` and similar. Body font and colors, the focus ring and reduced motion are also set there.
* **Mock sign-in (`/login`):** two buttons, "Continue as demo coordinator" and "Continue as demo technician", plus a persistent "Mock: demo sign-in, not a real login" notice. There is deliberately no password field. A tab that is already signed in goes straight to its role's home page.
* **Shared provider (`useAdapters()`):** one `createMockAdapters()` per layout mount. The role and scenario persist in sessionStorage (validated, and cleared if tampered), so a reload or moving between route groups keeps the tab signed in. PC-S1-06/07 get it through the dashboard layout; PC-S1-08 wraps `src/app/technician/layout.tsx` with `<AdaptersProvider>`.
* **Shell:**
  * Skip link, then the always-visible mock banner with a "Mock data" scenario switcher (normal, empty, slow, error, denied).
  * Sidebar with Dashboard, Customers, Systems, Maintenance and Dispatch, with `aria-current` on the active item.
  * Below 1024 px the sidebar becomes a native modal `<dialog>` drawer.
  * Top-bar search submits to `/customers?q=…`.
  * Signed-in name and a demo role chip, plus Sign out.
* **Dashboard:**
  * Today header (Beirut business date) and an "Open dispatch board" action.
  * Five summary cards from `dashboard.getStats()`.
  * Upcoming and overdue visits from `dispatch.listJobs()`, overdue first, with status chips.
  * Expiring warranties.
  * Loading, empty, error (Retry) and denied states. A technician gets the denied panel and no coordinator data is fetched.

Intentionally not changed:

* No real auth, and no changes to `src/types`, `src/lib` or fixtures.
* No fault tickets (P1).
* The Customers, Systems, Maintenance, Dispatch and `/technician` routes belong to PC-S1-06/07/08 and return 404 until those merge.
* The summary cards do not link to filtered lists yet, because PC-S1-07's query params aren't defined.
* No photo on the sign-in page: no rights-verified image exists (D09).

All five KAN-17 acceptance items are covered.

## Approved plan and dependencies

* Plan: worklogs/PC-S1-05/plan.md. Self-approved by Reem (lead) on 2026-11-22 as a recorded exception to D11's separate plan approval, so this PR review is the gate. Please look closely at the provider API, the token mapping and the mock sign-in.
* Dependencies merged and Done: PC-S1-01 (KAN-13), PC-S1-02 (KAN-14), PC-S1-03 (KAN-15). Contract: docs/CONTRACTS.md (unchanged). Design: docs/DESIGN_BLUEPRINT.md page sections for Sign in and Coordinator dashboard.
* Scope change: `src/app/page.tsx` and `src/app/__e2e__/home.spec.ts` were added to PC-S1-05 in the lead/config PR (commit 3c7f65f), and KAN-17 was updated to match. **That lead PR merges before this one.**

## Test evidence (do not claim unexecuted checks)

Tests added (docs/TESTING.md), per layer and paths covered (happy / misuse / error):

* Unit (18 new):
  * `src/components/layout/__tests__/mock-session.test.ts`: role and scenario round-trip (happy); tampered values rejected and cleared (misuse); blocked storage falls back without throwing (error); `restoreMockSession` with the real mock adapters, where a coordinator gets stats, a technician gets FORBIDDEN and the stored error scenario gets INTERNAL.
  * `src/components/layout/__tests__/nav-items.test.ts`: active-route matching (child routes, look-alike prefixes, null) and role home and navigation separation.
  * `src/features/dashboard/__tests__/dashboard-view.test.ts`: result-to-state mapping (ready, empty, signed-out, denied, error, stats-first), row cap versus total, overdue-first ordering, card tones, and date formatting without day shift.
* Integration: none beyond the adapter wiring above. No backend exists in S1.
* E2E, `src/app/__e2e__/dashboard.spec.ts` (desktop and mobile projects):
  * Mock notice and no password field, then the coordinator lands on the dashboard (cards, jobs, warranties, search). Reload keeps the session; sign out returns to /login.
  * Signed out: /dashboard redirects to /login.
  * Keyboard: skip link focuses main; `aria-current` on Dashboard.
  * Mobile drawer: Escape closes it and focus returns to the menu button.
  * Empty, error (Retry) and denied scenarios; technician gets the denied panel.
  * `home.spec.ts` now asserts that / redirects to /login.
* Test exemption: none. Component rendering tests are not set up (jsdom, D12).

Commands, environment and exact result for lint / TypeScript / tests / build (full `node scripts/ci.mjs` run):

* Windows 11, Node 23.1, 2026-11-22, on main 176b24a.
* `node scripts/ci.mjs`: **Passed**. Harness validate; lint; typecheck; Vitest 11 files / 118 tests (100 existing + 18 new); `next build` (/login 2.34 kB, /dashboard 4.02 kB).
* `npx playwright test`, cold dev server: **Passed**, 13 passed / 1 skipped. The drawer test only runs on mobile. Same result twice.
* `--repeat-each=2`: 26 passed / 2 skipped.
* One earlier affected run failed the first sign-in test on both projects: a cold `next dev` compile of /dashboard took longer than 5 s. That navigation now waits up to 20 s.
* `node scripts/harness.mjs check` currently flags `src/app/page.tsx`. It passes once the lead/config PR (3c7f65f) is on main and this branch is updated. **CI's "Branch and file ownership" step will fail until then.**

Manual desktop/mobile or Impeccable critique output and screenshots for UI:

* Inspected in the browser at 1440, 768 and 375:
  * At 1440, the sidebar and data sit side by side.
  * At 375, a page overflow from the jobs table was found and fixed: the table now scrolls in its own region, and the status chip shows under the date.
  * Drawer and login checked at 375.
* Impeccable detector found one issue (a thick accent border on rounded cards), now fixed; rerun clean. Brief critique notes are in the worklog.
* Screenshots: **[FILL: attach screenshots of /login and /dashboard at 375, 768 and 1440 px]**

Real API/DB/RLS/storage/scheduler tests for backend, when applicable: not applicable. S1 uses typed mock adapters only, and nothing here claims backend behavior.

Security/privacy review and image manifest entries, if applicable:

* No credentials and no password field.
* No network calls; synthetic fixtures only.
* The stored role is UI-only and validated.
* Mock code is marked for removal at the S2 release signoff (PC-S3-09).
* No images added, so no manifest entries.

## Edge cases and rollback

Empty/loading/error/denied/retry/concurrency:

* **Loading:** skeleton cards with a polite live region; the title stays visible.
* **Empty:** zero counts render as 0, plus a first-run panel with "Add a customer" and an empty message per section.
* **Error:** the adapter message plus Try again, which refetches without a reload.
* **Denied:** an explanation, and for a technician a link to My jobs. No record details are shown.
* **Expired or signed out:** ends the demo session and redirects to /login.
* **Blocked sessionStorage:** falls back to in-memory, and nothing crashes.
* **Unsaved mock edits:** mock edits made inside the dashboard layout survive navigation but not a reload, as the banner says.

Migration or rollback impact: no migrations. Rollback is a revert of this PR. `/` would then show the PC-S1-01 scaffold again, and screens built on `useAdapters()` would need it back.

## Where to look first

1. `src/components/layout/adapters-provider.tsx:19`: the shared `useAdapters()` API that the S1 screens depend on.
2. `src/components/layout/mock-session.ts:46`: the stored role is validated, cleared when tampered, and non-authoritative.
3. `src/app/globals.css:10`: the `@theme inline` token mapping becomes the team convention.
4. `src/features/dashboard/dashboard-view.ts:83`: how 401/403/500 and zero data map to signed-out, denied, error and empty.
5. `src/features/dashboard/dashboard-screen.tsx:88`: a technician gets the denied panel, and no coordinator data is fetched.

## Human reviewer

Reviewer name (must not be author): Mahdi Dagher
Result and follow-up: **[FILL: Mahdi's review result and any follow-ups]**

Checklist:

* [x] Plan written before code (self-approved by the lead as a recorded D11 exception; this review is the gate)
* [x] Work within allowed paths and acceptance tests (root page path granted by lead/config 3c7f65f)
* [x] Tests added for every behavior change (happy/misuse/error where relevant), without duplicate or snapshot-heavy tests
* [x] Actual checks passed or explicitly marked Blocked
* [x] No secrets/PII/unlicensed imagery
* [ ] Jira linked, reviewer requested, evidence captured (screenshots pending)
* [ ] Rebase/retest after main changed (after the lead/config merge)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
