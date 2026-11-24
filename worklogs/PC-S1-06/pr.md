# KAN-18: Build customer and equipment registry screens

Local task ID: PC-S1-06
Jira: [KAN-18](https://techtalks-panelcare.atlassian.net/browse/KAN-18)
Sprint S1 · Owner: Mahdi Dagher · Reviewer: Tarek Bdairi
Target: main · Review-ready day: D10

## User outcome and boundary

A mock coordinator can search and page through customers and systems, create customers and nested sites, register a solar system with optional components, then add or replace equipment. Detail screens surface serial numbers, installation dates, warranty expiry, and replacement history. Existing validation schemas and scoped parent records drive both the forms and detail routes. The registry uses the existing in-memory adapter provider and shared design tokens. No backend, persistence, shared contracts, or migration changes are included.

## Approved plan and dependencies

Reem merged the [plan PR #19](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/19), and Mahdi confirmed approval to proceed. KAN-13, KAN-14, and KAN-15 are Done. The coordinator shell is on main. See the [worklog](./plan.md) and [design blueprint](../../docs/DESIGN_BLUEPRINT.md).

## Test evidence

- `node scripts/harness.mjs test` passed against the production build: 3 registry unit checks, 22 Playwright passes and 2 project-specific skips.
- Scope, lint, TypeScript, diff whitespace, and production build passed.
- Full `node scripts/ci.mjs` under Node 22 and 24 reported 120 passes and one existing dashboard date assertion failure. The same comma mismatch reproduces on unchanged main and in [the plan PR quality check](https://github.com/Reemb-prog/techtalks-panelcare-groupf/actions/runs/45365725217/job/138346829679). The dashboard test is outside this task's file scope.
- Visual screenshot review and keyboard focus passed at 375, 768 and 1440 px. The screenshots are in [the task worklog](./plan.md).
- Impeccable 4.10.0 source scan reported no findings. Source scanning does not run rules that require a rendered page.

## Edge cases and rollback

Empty and filtered lists, slow and failed reads, denied access, validation, serial conflicts, and failed saves have distinct UI outcomes. Invalid input and failed saves preserve entered values. A save locks submission until its own response, and older reads cannot overwrite a newer route, filter or scenario. Reverting this PR removes the registry routes without altering shared schemas or state. Test data is synthetic, and no photos were added.

## Where to look first

- `src/features/registry/registry-screen.tsx` for parent-scoped route resolution and registry states.
- `src/components/registry/registry-form.tsx` for field feedback, focus and submit locking.
- `src/app/__e2e__/registry.spec.ts` for the mock journey and three-width review.

## Human review

Tarek Bdairi reviews the implementation. Review result pending. Move KAN-18 through the team workflow after review and integration verification on main.
