# PC-S1-06: Customer, site, system and component registry screens

Sprint: S1 | Owner: mahdi | Reviewer: tarek
Jira key: KAN-18 | PR: not opened (assistant writes it when review-ready) | Planned start D5, review-ready day: D10
Plan review: Pending | Approver: Reem W. Basho | Date: pending

## Goal and scope
Customer, site, system and component registry screens

## Dependencies to confirm merged
PC-S1-01, PC-S1-02, PC-S1-03

## Allowed paths
* src/app/(dashboard)/customers/
* src/app/(dashboard)/systems/
* src/features/registry/
* src/components/registry/

## Implementation plan (complete and review BEFORE coding)

1. Add list, create, and detail entry points under `src/app/(dashboard)/customers/` and `src/app/(dashboard)/systems/`. Put customer identity, contacts, and sites in customer detail. Nest site detail and creation under the customer. Link each site to its systems. Put system summary, components, and replacement history in system detail. Provide component creation/detail and replacement under the system.
2. Keep screen logic in `src/features/registry/` and reusable registry form, table, and feedback UI in `src/components/registry/`. Reuse the shell, CSS tokens and its `useAdapters()` provider. Build on the existing shared registry DTOs and validation schemas. Where the adapter has no standalone site or component lookup, resolve from the parent detail payload and handle missing children.
3. Use typed adapter errors and cancellable or stale-response-safe reads when routes, filters, or scenarios change. Differentiate empty results, delayed loads, denied access, invalid form input, duplicate serials, and recoverable failures. Preserve input on failure, guard double submit, and show completion only when the mock adapter returns success. Label mock data and session limitations. Keep role cues in the existing coordinator shell.
4. Follow the approved blueprint hierarchy. Use table and card layouts that fit 375, 768 and 1440 px, labeled form controls, focus feedback, semantic status text, and no production imagery. Capture screenshots and run keyboard review and Impeccable critique before requesting review.
5. Add focused Vitest tests for registry form validation/error mapping and a Playwright simulated registry journey under `src/app/__e2e__/`. Cover create/list/detail, serial conflict, replacement history, and empty/slow/error/denied scenario behavior. Run the affected harness, scope check, and full CI.

## Acceptance criteria
* [ ] Create/list/detail UI for customer → site → system → component with validated forms
* [ ] Expose serial numbers, install date, warranty expiry and replacement history
* [ ] Empty, invalid, slow, duplicate serial and error mocks handled without fake persisted success

## Tests (docs/TESTING.md: lowest layer that catches the bug; happy, misuse and error paths)
Task test hint: Vitest form validations; Playwright simulated registry journey
* Unit: Validate form normalization, field errors and duplicate serial feedback.
* Integration: Use the in-memory typed registry mocks through the UI journey. No live database in S1.
* E2E: Playwright mock registry journey for customer, site, system and component, plus failures and replacement history.
* Skipped paths, with one-line reason: none

## Evidence (Passed/Failed/Not run/Blocked; never claim an unexecuted check)
Affected run, node scripts/harness.mjs test: NOT RUN
Full run before review, node scripts/ci.mjs: NOT RUN
Manual checks (UI 375/768/1440, keyboard) and screenshot/log link: NOT CAPTURED

## Risk, security and UX review
Adapter contract is fixed. Read site and component details via parent-scoped responses. Rights-cleared production photos are unnecessary. Impeccable critique pending implementation.

## Developer review guide (assistant updates after every run; see CLAUDE.md)
Review Implementation plan for nested navigation, use of the existing adapter, and mock error states.
Record human plan approval on KAN-18 before feature coding, as the Jira gate requires.

## Handoff
Status: Planned | Files changed: task plan only | Next step: obtain plan review
