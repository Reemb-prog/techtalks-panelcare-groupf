# PC-S1-02: Impeccable design discovery, sitemap and approved design tokens

Sprint: S1 | Owner: mahdi | Reviewer: reem
Jira key: KAN-14 | Draft PR: this pull request | Planned start D1, review-ready day: D4
Plan review: Pending | Approver: Reem W. Basho | Date: pending

## Goal and scope
Document the PanelCare UX and provide importable design tokens for the PC-S1-05 coordinator shell. [Figma design](https://www.figma.com/design/bV24mBw1ktLfzkCbzXu3hT) and the PDF on [KAN-14](https://techtalks-panelcare.atlassian.net/browse/KAN-14) are review references.

## Dependencies to confirm merged
(none)

## Allowed paths
* docs/DESIGN_BLUEPRINT.md
* docs/design/
* assets/image-manifest.csv
* src/components/ui/
* src/styles/

Excluded (owned by other tasks):
* docs/design/technician.md
* docs/design/technician/
* docs/design/s1-signoff.md

## Implementation plan (complete and review BEFORE coding)

1. Update `docs/DESIGN_BLUEPRINT.md` with coordinator and technician personas, the role-based sitemap, and page priorities. Preserve existing implementation guidance and the PC-S1-04 ownership boundary.
2. Define semantic CSS custom properties in `src/styles/tokens.css` for colors, type scale, spacing, radii, focus, surfaces, and status foreground/background pairs. PC-S1-05 owns the import into `src/app/globals.css`. Review the Figma blue palette against the older provisional teal palette with Reem before choosing final values.
3. Document form validation, loading, no results, permission denied, and actionable errors. Keep status labels visible alongside color. Label S1 data as mock. No backend or role enforcement changes are in scope here.
4. Record Pinterest provenance for discovery. Keep the Figma photos as review references until rights are verified and recorded in `assets/image-manifest.csv`. No photo binaries are planned for this PR.
5. Review wireframe coverage at 375, 768, and 1440 px; record actual critique, accessibility checks, and lead approval. Use fallback surfaces for uncleared photos in implementation.

## Acceptance criteria
* [ ] Document personas, screen sitemap and each page's content hierarchy
* [ ] Show desktop/mobile wireframes and approve typography, spacing, color, forms and status semantics
* [ ] Discover Pinterest references; record source and usage rights for any production image
* [ ] Record explicit lead design approval before feature pages
* [ ] Design tokens live in src/styles/; do not edit src/app/ files or PC-S1-04 technician design docs

## Tests (docs/TESTING.md: lowest layer that catches the bug; happy, misuse and error paths)
Task test hint: Design critique checklist, screenshot comparison and lead signoff
* Unit: Validate CSS parsing, required token declarations, and status color contrast once implemented.
* Integration: None for foundations; PC-S1-05 owns runtime integration.
* E2E: None for the plan-only draft; review Figma at target widths and repeat on the integrated shell in PC-S1-05.
* Skipped paths, with one-line reason: none

## Evidence (Passed/Failed/Not run/Blocked; never claim an unexecuted check)
Affected run, node scripts/harness.mjs test: NOT RUN
Full run before review, node scripts/ci.mjs: NOT RUN
Manual checks (UI 375/768/1440, keyboard) and screenshot/log link: NOT CAPTURED

## Risk, security and UX review
Risks: provisional palette mismatch, uncleared mockup photos, and downstream token naming. Reem reviews proposed input/output contract before coding. Impeccable critique: not run.

## Developer review guide (assistant updates after every run; see CLAUDE.md)
Review the Implementation plan for token semantics, import ownership, and the page hierarchy boundary.
Reem: approve the plan in this PR or KAN-14 and confirm the blue palette direction and token import contract.

## Handoff
Status: Planned | Files changed: this plan only | Next step: obtain plan review
