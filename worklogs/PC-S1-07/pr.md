# fix(dispatch): stabilize conflict checks and visits navigation (PC-S1-07)

PC-S1-07 follow-up for [KAN-19](https://techtalks-panelcare.atlassian.net/browse/KAN-19). Sprint 1. Reem is the PR author and Tarek Bdairi is the requested independent reviewer. Target branch is main.

## User outcome and boundary

The dispatch board exposes one focusable Visits landmark and a named table. The regression tests prove that a conflicting reschedule preserves the original date, that the visit can then be cancelled and reactivated, and that invalid filters leave the table available. Dispatch rules, mock adapter behavior, and shared configuration are unchanged.

## Plan and dependencies

See the [follow-up plan and evidence](./plan.md). This branch was fast-forwarded to `6e56fa7`, the merge of PC-S1-07 into main, before editing. The change uses the existing mock contract in [CONTRACTS.md](../../docs/CONTRACTS.md).

## Test evidence

- Focused Playwright conflict case before the landmark change, desktop and mobile. Passed, 2/2.
- Dispatch Playwright spec after the landmark change, desktop and mobile. Passed, 10/10. Covers assignment, report links, conflict rejection, cancellation and reactivation, invalid filters, scroll-region focus, and empty, error and denied states.
- Desktop sign-in recheck. Passed, 1/1. Desktop assignment also passed in the dispatch run. Browser runs used a 90-second CLI timeout for cold compilation.
- `node scripts/harness.mjs test --no-e2e` found no directly related Vitest files for the screen. The Playwright checks cover the changed accessibility semantics.
- The local branch check reported the expected Reem/Rand identity mismatch. The CI-mode harness branch and scope check passed.
- `node scripts/ci.mjs` passed harness validation, lint, type checking, and all 166 Vitest tests. Its production build hit a Windows permission error in generated `.next` files. An `npm run build` retry with access to those files passed.

The browser checks use synthetic mock data. Rendered Impeccable critique, screenshots, and the four-person demo remain Sprint 1 signoff evidence.

## Edge cases and rollback

The browser clock is fixed only for the fixture conflict case so that it continues to exercise an occupied future date. The focusable scroll wrapper remains available on both browser projects. Roll back by reverting this PR. No migrations, storage changes, credentials, or new assets are involved.

## Review first

- `src/app/__e2e__/dispatch.spec.ts` at the conflict and invalid-filter tests.
- `src/features/dispatch/dispatch-screen.tsx` at the Visits section and scroll region.

## Human review

Tarek Bdairi. Review and merge are pending.
