# PC-S1-04: Technician mobile flow and checklist content map

**Sprint:** S1  
**Owner:** tarek  
**Reviewer:** mahdi  
**Jira key:** KAN-16  
**Merged design PR:** [#12](https://github.com/Reemb-prog/techtalks-panelcare-groupf/pull/12)
**Planned start:** D1 (2026-11-20)  
**Review-ready:** D4 (2026-11-23)  
**Plan review:** Self-approved (routine task, D11)  
**Approver:** tarek  
**Approval date:** 2026-11-20

## Goal and scope

Design and document the mobile-first technician workflow for PanelCare, covering assigned jobs, inspection checklists, photo evidence, customer confirmation, and service reports.

The deliverable is design documentation and wireframes. No backend, database, shared contracts, or application source files will be modified under this task.

## Dependencies to confirm merged

None.

## Allowed paths

- `docs/design/technician.md`
- `docs/design/technician/`

## Implementation plan

1. **Review project requirements**
   - Read `docs/DESIGN_BLUEPRINT.md`.
   - Read `docs/CONTRACTS.md` to understand the supported data and role boundaries.
   - Review relevant existing technician screens and documentation, if present.
   - Confirm unclear requirements with the team lead.

2. **Define the technician journey**
   - Assigned jobs list and job details.
   - Safety and inspection checklist.
   - Numeric readings with appropriate units.
   - Photo evidence and notes.
   - Customer confirmation.
   - Submission status and service report.

3. **Document screen content**
   - Define the purpose of each screen.
   - List required fields, labels, and actions.
   - Identify navigation between screens.
   - Define technician permission boundaries.
   - Record evidence limits after confirming the applicable contracts and team requirements.

4. **Design wireframes**
   - Prepare low-fidelity mobile wireframes at 375 px.
   - Adapt the layouts to 768 px and 1440 px.
   - Use touch-friendly controls and clear primary actions.
   - Follow the approved visual direction and page section map.
   - Avoid unlicensed or unnecessary imagery.

5. **Document exceptional states**
   - Empty assigned jobs.
   - Loading and network errors.
   - Offline access and draft handling.
   - Invalid or missing checklist values.
   - Photo validation and upload failures.
   - Permission-denied behavior.
   - Duplicate submission and retry handling.
   - Prevent displaying success unless submission is confirmed.

6. **Review and approval**
   - Review wireframes and flow with Reem or the designated approver.
   - Record feedback and make necessary changes.
   - Obtain visual direction approval before building screens.
   - Record any applicable Impeccable critique using actual results.

## Documentation follow-up plan

Tarek approved the documentation-only follow-up on 2026-11-22. Start from
current main and update this worklog and `docs/design/technician.md`. Align the
photo guidance, checklist map, and job and submission flow with frozen PC-S1-03.
Check limits, scope and privacy wording against the existing validators and
adapters. Run the scope check and CI. Mahdi is the designated reviewer.

## Acceptance criteria

- [x] Define assigned job → checklist → photos → confirmation → report journey.
- [x] Design offline/error/draft/duplicate-submit behavior.
- [x] Show touch-friendly small-screen wireframes, fields and evidence limits. The wireframes cover 375, 768 and 1440 px. The design includes the checklist content map and the frozen evidence limits.
- [ ] Obtain visual direction approval before building.
- [x] Document empty, loading, invalid-input and permission-denied states.
- [ ] Complete technician walkthrough and accessibility review. Preliminary documentation walkthroughs complete for all five screens at 375 px, 768 px, and 1440 px. Preliminary design-level accessibility review complete. Review by Mahdi is pending.

## Tests and evidence

**Intended:**
- Technician journey walkthrough.
- Responsive review at 375, 768 and 1440 px.
- Accessibility checklist.
- Validation and exceptional-state review.

**Actual results (2026-11-20)**

- Passed — `node scripts/harness.mjs check` verified the task branch and two in-scope paths.
- Passed — `node scripts/ci.mjs` completed harness validation, lint, typecheck, one existing unit test, and the production build. The first dependency download stalled with restricted registry access. The offline retry lacked a package, and the network-enabled install completed before the successful CI run.
- Passed — byte comparison confirmed that the existing technician design through Section 8 stayed unchanged when Sections 9–12 were first appended. The walkthrough later prompted targeted edits in those original sections.
- Passed on rerun after the walkthrough — `node scripts/harness.mjs check` confirmed the task branch and two allowed paths.
- Passed on rerun after the walkthrough — `node scripts/ci.mjs` completed project validation, lint, type checking, one existing unit test, and the production build. The first attempt stopped at Vitest because the sandbox denied access while loading its configuration. The run outside the sandbox passed.
- Passed with one suggested improvement — documentation walkthrough, Screen 1 (My Jobs), 375 px. The job cards and loading, error, offline, and access-denied states were clear. Updated the empty-state copy to “You have no assigned jobs right now. New assignments will appear here.”
- Passed with one suggested improvement — documentation walkthrough, Screen 2 (Job Details and Inspection Checklist), 375 px. Tarek reviewed the described wireframe and found the job context, checklist, measurements, navigation, and error states clear. Added a field-specific validation example and clarified that valid answers stay visible. Application testing and review by Mahdi remain pending.
- Passed with one suggested improvement — documentation walkthrough, Screen 3 (Photo Evidence and Notes), 375 px. Tarek found the described flow, captions, validation, notes, and error handling clear. Added explicit per-photo statuses, adapter confirmation for Uploaded, and actions for failed uploads. Exact limits remain pending PC-S1-03 approval. Application testing and review by Mahdi remain pending.
- Passed with one suggested improvement — documentation walkthrough, Screen 4 (Customer Confirmation and Final Submission), 375 px. Tarek found the described review, validation, acknowledgment, duplicate-submission prevention, and completion states clear. Updated the message for an unknown result and clarified that recovery requires a status check or approved safe retry, with no automatic retry or unconfirmed completion. Recovery and acknowledgment fields remain pending approval. Application testing and review by Mahdi remain pending.
- Passed with one suggested improvement — documentation walkthrough, Screen 5 (Service Report), 375 px. Tarek found the described layout, read-only behavior, measurements, photos, and error states clear. Added separate network, unavailable, and access-denied messages, with Retry for network errors and private details hidden when access is denied.
- Completed — Tarek reviewed all five described wireframes at 375 px and the associated error scenarios. Each screen passed with one suggested improvement, and all five changes were applied to the design document.
- Passed with one suggested improvement — preliminary documentation walkthrough at 768 px. Tarek found the described tablet layouts and reading order clear across all five screens. The Photo Evidence wireframe now groups the caption, upload status, Remove Photo, and Retry where supported directly beneath each photo.
- Passed with one suggested improvement — preliminary documentation walkthrough at 1440 px. Tarek found the described layouts, navigation, and error-message placement clear across all five screens. The checklist now proposes a sticky desktop job-information panel that stays within its own column during scrolling and returns to normal page flow on smaller screens.
- Passed with one suggested improvement — preliminary design-level accessibility review of the described documentation. Tarek reviewed reading order, field labels, error messages, keyboard behavior, photo controls, and touch and resizing requirements. Added a requirement for text labels alongside color indicators for status, errors, and required actions, with photo upload statuses as an example.
- Not run — application scenarios, rendered viewport checks, keyboard and screen-reader testing, contrast measurements, zoom and touch-target testing, other browser accessibility checks, and Impeccable critique. Review by Mahdi is pending.

**Environment:** Local Windows checkout on `s1/tarek/pc-s1-04`  
**Evidence:** Local command output and documentation walkthrough and design-level accessibility results confirmed by Tarek in chat. No screenshots captured.

Results will be recorded as Passed, Failed, Not run, or Blocked after actual execution.

### Documentation follow-up checks (2026-11-22)

- Passed — read-only merge check confirmed PR #12 is present on main. The new local task branch was created at the live main commit `9ba5934`.
- Passed — `git diff --check` and `node scripts/harness.mjs check` confirmed a clean diff and two in-scope changed files.
- Not run by `node scripts/harness.mjs test` — the affected-test runner found no runtime or test changes.
- Passed — `node scripts/ci.mjs` ran project validation, lint, type checking, 100 existing Vitest tests across 8 files, and the production build. The first attempt stopped at type checking because the local install lacked Zod. Installing the locked dependencies with `npm ci` resolved it.
- Not run — browser E2E, manual application accessibility checks, and Impeccable critique. No behavior changes or new application tests were part of this follow-up.

## Risk, security and UX review

- **Offline behavior:** Do not assume drafts are persisted or synchronized without confirming the implementation contract.
- **Duplicate submissions:** Document protection against repeated submissions and uncertain network outcomes.
- **Photo evidence:** Confirm allowed formats, count, size and access rules before finalizing the design.
- **Permissions:** Restrict the technician experience according to approved role boundaries.
- **Data integrity:** Do not display fake persisted success or claim backend integration in Sprint 1.
- **Accessibility:** Use readable text, labeled controls, visible focus, sufficient contrast and touch-friendly actions.
- **Design consistency:** Follow the approved PanelCare visual direction.
- **Impeccable critique:** Pending; record actual findings if performed.

## Handoff

**Status:** PR #12 is merged on main. The documentation follow-up aligns the design with the frozen PC-S1-03 contract. The preliminary walkthroughs and design-level accessibility review are complete. Confirm the PR review record and visual approval.
**Files changed:** docs/design/technician.md and this worklog  
**Next step:** Have Mahdi review the documentation follow-up, and record Reem's visual approval before building screens under PC-S1-08. Confirm final customer acknowledgment wording (D06) at S1 signoff and evidence consent and retention (D07) before collecting real photos.

Lead handoff: npm flagged the existing Next.js 15.5.4 dependency with a security advisory during installation. Reem should route any dependency update through a separate task because it affects shared dependencies and the application build.

## Developer review guide

### Review these first

- `docs/design/technician.md`, Sections 5.3–5.5: confirm the checklist questions, required fields, units and the Start Job transition.
- `docs/design/technician.md`, Sections 7 and 10: confirm that the retry uses the same submission ID and that unsent work stays only in the open form.
- `docs/design/technician.md`, Section 11: confirm the photo limits, demo registration labels and the pending privacy decisions.

### Human decisions

- Mahdi reviews the document updates. Confirm and record the existing PR #12 review outcome.
- Reem confirms visual direction before PC-S1-08 screen work, final acknowledgment wording at S1 signoff (D06), and consent and retention before collecting real evidence (D07).
