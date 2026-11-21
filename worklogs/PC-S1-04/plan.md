# PC-S1-04: Technician mobile flow and checklist content map

**Sprint:** S1  
**Owner:** tarek  
**Reviewer:** mahdi  
**Jira key:** KAN-16  
**Draft PR:** TO CONFIRM  
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

## Acceptance criteria

- [x] Define assigned job → checklist → photos → confirmation → report journey.
- [x] Design offline/error/draft/duplicate-submit behavior.
- [ ] Show touch-friendly small-screen wireframes, fields and evidence limits. Draft wireframes are present at 375, 768 and 1440 px. Exact limits are pending PC-S1-03 confirmation.
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

**Status:** Preliminary documentation walkthroughs and design-level accessibility review are complete. The documentation is ready for a draft PR. Confirm the evidence limits or agree with the team to leave them pending before marking it review-ready. Review by Mahdi and visual approval are pending.  
**Files changed:** docs/design/technician.md and this worklog  
**Next step:** Walk through the design with Mahdi and get visual direction approval from Reem before building. Confirm remaining checklist, evidence, draft and completion recovery details with PC-S1-03. Confirm customer acknowledgment (D06) with Reem and record the evidence privacy decisions (D07) before collecting real photos.

Lead handoff: npm flagged the existing Next.js 15.5.4 dependency with a security advisory during installation. Reem should route any dependency update through a separate task because it affects shared dependencies and the application build.
