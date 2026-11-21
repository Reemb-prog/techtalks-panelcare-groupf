
# Technician Mobile Flow and Checklist Content Map

**Task:** PC-S1-04 (KAN-16)
**Sprint:** S1
**Owner:** tarek
**Status:** Design draft — visual approval pending

## 1. Purpose

Design a mobile-first web experience that allows an
assigned solar maintenance technician to:

- View their assigned maintenance jobs.
- Open an assigned job and review its details.
- Complete safety and inspection checklists.
- Record numeric readings with units.
- Attach inspection photos and notes.
- Record customer acknowledgment.
- Review the inspection before submitting.
- View the resulting service report.

This document defines the user experience and screen
content. It does not implement backend functionality.

## 2. Technician Journey

1. The technician opens the My Jobs screen.
2. The system displays jobs assigned to that technician.
3. The technician selects a job.
4. The technician reviews the job and system details. For an assigned job,
   they select **Start Job** and wait for confirmation before continuing.
5. The technician completes the safety and inspection
   checklist.
6. The technician enters required measurements.
7. The technician attaches evidence photos and notes.
8. The technician records customer acknowledgment.
9. The technician reviews the inspection summary.
10. The technician submits the inspection.
11. The system confirms the result only after a
    successful response.
12. The technician opens the service report.

## 3. Scope and Constraints

- Mobile-first responsive web design.
- Target widths: 375 px, 768 px, and 1440 px.
- Technician access is limited to assigned jobs.
- S1 uses typed mock adapters, not real backend services.
- No unapproved changes to API contracts or schemas.
- No invoicing, inventory, telemetry, or native mobile app.
- Photo evidence is private and must not use decorative
  stock imagery as inspection proof.
- The checklist content map and evidence limits below use the frozen
  PC-S1-03 contract.

## 4. Screen 1 — My Assigned Jobs

### 4.1 Purpose

Allow technicians to quickly find and open maintenance
jobs assigned to them.

Only jobs belonging to the authenticated technician
may be displayed.

### 4.2 Screen content

Header:
- PanelCare name
- Page title: "My Jobs"
- Current technician's display name, if available

Job list:
- Site label
- Solar system label, if available
- Scheduled maintenance date
- Job status
- Primary action: "View Job"

Optional:
- Status filter
- Refresh action

Do not display estimated travel distance unless
reliable location data is available.

### 4.3 Job statuses

Supported contract values:
- scheduled
- assigned
- in_progress
- completed
- cancelled

The technician sees only their authorized jobs.
The interface must not offer unauthorized
assignment controls.

### 4.4 Empty, loading, and error states

Empty:
"You have no assigned jobs right now. New assignments will appear here."

Loading:
Show a loading indicator or skeleton.

Network error:
"Unable to load your jobs."
Provide a Retry action.

Offline:
"You're offline. Job information may be unavailable
or outdated."

Permission denied:
"You don't have permission to view this job."

### 4.5 Accessibility

- Buttons must be large enough for touch interaction.
- Job statuses must not rely on color alone.
- All actions must have descriptive labels.
- Maintain readable text and sufficient contrast.
- Support keyboard navigation and visible focus.

### 4.6 Contract notes

- GET /api/jobs returns jobs scoped to the technician.
- Use the frozen job list and detail fields from PC-S1-03. A missing job
  and a job outside the technician's scope both return 404.
- S1 screens must use mock data only.
- Do not imply live backend connectivity.

## 5. Screen 2 — Job Details and Inspection Checklist

### 5.1 Purpose

Allow an assigned technician to review job information,
complete the inspection checklist, and record
measurements before moving to photo evidence.

### 5.2 Job details

Display:
- Site label
- Solar system label
- Scheduled maintenance date
- Job status
- Job identifier

Optional, if authorized and available:
- Site address
- System capacity (kW)
- Relevant component details

Only display information the technician is authorized
to access for their assigned job.

### 5.3 Inspection checklist

Display:
- Checklist section headings
- Checklist item descriptions
- Appropriate response controls
- Required-field indicators
- Validation messages

**Routine solar maintenance visit — checklist content map**

Use the versioned `ChecklistTemplate` returned by the adapter. This map
uses the existing version 1 demo item IDs and identifies the fields to show.

| Section | Question or field label | Item ID | Answer type and choices | Required | Unit and input range |
| --- | --- | --- | --- | --- | --- |
| Safety | Were the AC and DC isolators tested and locked out before work? | `safety_isolation` | Yes or no (boolean) | Yes | — |
| Panels | What is the panel surface condition? | `panel_condition` | Choice: good, minor soiling, damage found | Yes | — |
| Panels | Are the mounting and fixings secure? | `mounting_secure` | Yes or no (boolean) | Yes | — |
| Inverter | Is the inverter free of active faults? | `inverter_no_faults` | Yes or no (boolean) | Yes | — |
| Readings | What is the string DC voltage? | `dc_voltage` | Number | Yes | V, 0–1,500 |
| Readings | What is the AC output at the time of the visit? | `ac_output` | Number | Yes | kW, 0–1,000 |
| Battery | What is the battery state of charge? | `battery_soc` | Number | No. Applies only to systems with a battery. | %, 0–100 |
| Panels | How much panel cleaning was performed? | `cleaning_done` | Choice: none, partial, full | Yes | — |
| Observations | Other observations | `observations` | Text | No | — |

The numeric ranges above match the S1 demo template's input validation.
A required yes/no item needs an explicit answer. Both yes and no are valid
answers. Use the returned template's version and constraints when submitting.

### 5.4 Measurements

Each measurement should include:
- A clear label
- A numeric input
- The appropriate unit
- Validation feedback

Keep the unit visible next to the input and use the bounds and required flags
from the current template.

### 5.5 Actions

- Back to My Jobs
- **Start Job** for a visit assigned to the signed-in technician. Send the
  `start` action and current `expectedVersion` to `PATCH /api/jobs/:id`.
  Wait for the job to change from `assigned` to `in_progress` before
  continuing. If the version is stale (409), reload the job first.
- **Continue to Photo Evidence** after the job is in progress.

### 5.6 Exceptional states

Loading:
Show a loading indicator while job details load.

Permission denied:
Explain that the technician cannot access this job.

Invalid input:
Show a specific message next to each affected field.
For an invalid numeric reading, use “Enter a valid number for this measurement.”
Keep valid checklist answers visible when another field fails validation.

Network error:
Show a retry option without losing confirmed data.

Offline:
Show that entries are unsaved. Keep them in the open form where possible.
Reloading or closing the page may discard those entries.

Stale job:
If the job was changed or completed elsewhere,
explain the conflict and require refresh.

### 5.7 Accessibility

- Use visible labels for every input.
- Group related checklist questions.
- Make controls touch-friendly.
- Display errors using text, not color alone.
- Support keyboard navigation and visible focus.

### 5.8 Contract notes

- Technicians can access only their assigned jobs.
- Checklist data belongs to an inspection.
- The checklist uses a versioned template.
- Measurements must include appropriate units.
- The checklist map in Section 5.3 uses the PC-S1-03 template shape.
- An outdated checklist version returns 409 and requires a reload.
- S1 uses mock-backed behavior, not a live API.

## 6. Screen 3 — Photo Evidence and Notes

### 6.1 Purpose

Allow technicians to attach inspection photos and
record observations for their assigned maintenance job.

### 6.2 Screen content

- Back to Checklist
- Job and site information
- Add Photo action
- Photo previews
- Photo captions
- Remove Photo action
- Inspection Notes text area
- Continue to Customer Confirmation

### 6.3 Photo validation

Handle:
- Unsupported file types
- Files exceeding the maximum size
- Too many photos
- Failed photo registration in S1 or failed uploads in S2

Accept JPEG, PNG, or WebP, up to 5 MB per file and 10 photos per job.
See Section 11 for caption and evidence rules.

### 6.4 Offline and error behavior

- Show a warning when offline.
- In S1, use **Selected**, **Adding (demo)**, **Added (demo)**, or **Failed**.
  Show **Added (demo)** after the mock adapter confirms photo registration.
- For a failed registration, show **Retry** where supported and **Remove Photo**
  for the affected selection. The contract provides no photo deletion endpoint.
- Real uploads can show **Uploading** and then **Uploaded** after the upload
  is confirmed.
- Preserve valid entries where technically possible.

### 6.5 Privacy and accessibility

- Keep inspection evidence private.
- Never expose private storage paths.
- Label upload and remove controls.
- Display errors as readable text.
- Make controls touch-friendly and keyboard accessible.

### 6.6 Contract notes

- Photos belong to an inspection.
- Photo metadata includes type, size and caption.
- Files are stored separately in private storage.
- S1 registers photo metadata for the technician's own open job. The mock
  returns no image URL. Real files and authorized retrieval are S2 work.

## 7. Screen 4 — Customer Confirmation and Final Submission

### 7.1 Purpose

Allow the assigned technician to review the inspection,
record customer acknowledgment, and submit the job
for completion.

### 7.2 Screen content

Header:
- Back to Photo Evidence
- Page title: "Review & Confirm"

Job summary:
- Site label
- Solar system label
- Job identifier
- Scheduled maintenance date

Inspection summary:
- Completed checklist responses
- Recorded measurements and units
- Inspection notes
- Photo evidence summary
- Missing or invalid information warnings

Customer acknowledgment:
- Label: "Customer Acknowledgment"
- Name of the person acknowledging the work
- Acknowledgment action and recorded time

The current S1 form uses a typed name of 2–120 characters and a required
acknowledgment checkbox. The service supplies the timestamp. Final wording
and customer acknowledgment signoff remain pending under D06.

Actions:
- Back to Edit
- Submit Inspection

### 7.3 Validation

Before submission:
- Check required checklist responses.
- Check measurement validity.
- Check photo evidence requirements.
- Check acknowledgment requirements.
- Show clear errors for missing or invalid fields.

Final validation is performed by the server when
the real API is implemented.

### 7.4 Submission states

Ready:
- Display "Submit Inspection".

Submitting:
- Disable repeated submission.
- Display "Submitting inspection..."

Success:
- Show completion only after a confirmed response.
- Provide "View Service Report".

Validation error:
- Identify affected fields.
- Allow the technician to correct the information.

Network error:
- Show “Submission status unknown. We couldn't confirm whether your inspection was submitted. Please don't submit again until the job status has been checked.”
- Keep the form open. Do not automatically retry or show completion
  until the result is confirmed.
- Do not assume the submission failed or succeeded.
- Check the current job status with `GET /api/jobs/:id` before offering recovery.
  A retry of the unresolved submission must use the original request and
  its original submission ID (`idempotencyKey`).

Permission denied:
- Explain that the technician cannot complete
  this job.

Conflict:
- Explain if the job status changed elsewhere.
- Require refresh or an approved recovery action.

### 7.5 Duplicate submission behavior

- Prevent repeated taps while submission is pending.
- The backend must guarantee one report per job.
- A repeat using the same submission ID for that job returns the same report after
  completion. A different ID for an already completed job returns 409.
- Never display a second success result as a
  separate completed inspection.
- Handle uncertain network outcomes without
  claiming a new submission is necessary.

### 7.6 Security and privacy

- Only the assigned technician may complete the job.
- Do not expose private photo storage paths.
- Do not reveal raw database errors.
- Do not display completion until confirmed.

### 7.7 Accessibility

- Use clearly labeled acknowledgment controls.
- Display validation errors in text.
- Provide visible focus indicators.
- Keep the primary action touch-friendly.
- Announce submission status changes accessibly.

### 7.8 Contract notes

- POST /api/jobs/:id/complete handles completion.
- Completion creates the inspection and report
  transactionally.
- One job must have only one service report.
- Only the assigned technician can complete a job in progress. Submit the
  current checklist version, answers, notes, photo IDs, confirmation and
  submission ID using the frozen request fields.
- Sprint 1 uses mock-backed behavior only.

## 8. Screen 5 — Service Report

### 8.1 Purpose

Allow the technician to view the final service report
after successful completion of an assigned job.

The report is read-only and represents the inspection
information captured at completion time.

### 8.2 Screen content

Header:
- Back to My Jobs
- Page title: "Service Report"
- Report status: Completed

Job information:
- Job identifier
- Site label
- Solar system label
- Completed date, if available
- Assigned technician, if authorized

Inspection results:
- Completed checklist responses
- Recorded measurements with units
- Inspection notes
- Photo evidence gallery
- Customer acknowledgment information

Actions:
- Back to My Jobs
- View authorized photo evidence

Optional actions:
- Print Report
- Export Report

Print and export actions must only appear if
they are actually supported by the approved scope.

### 8.3 Report behavior

- Show the report only after confirmed completion.
- The report must use the stored completion snapshot.
- Do not silently change historical report details.
- Do not allow the technician to edit a completed report.
- Only show reports belonging to authorized jobs.

### 8.4 Exceptional states

Loading:
Show a loading indicator.

Report unavailable:
"This service report is currently unavailable."

Access denied:
"You don't have permission to view this report."
Keep report details and private photos hidden.

Network error:
"We couldn't load your service report. Check your connection and try again."
Show **Retry**.

Offline:
Do not claim the report is available offline
unless offline access has been implemented.

### 8.5 Accessibility

- Use clear headings and readable labels.
- Display measurements together with their units.
- Provide meaningful descriptions for evidence photos.
- Ensure accessible keyboard navigation.
- Do not rely only on color to communicate status.

### 8.6 Contract notes

- GET /api/reports/:id is restricted to authorized users. A missing report
  and one outside the technician's scope both return 404. Use the same
  unavailable message for either 404 response.
- A service report belongs to one maintenance job.
- Reports contain a historical snapshot.
- Each job can have only one service report.
- Sprint 1 uses mock-backed behavior only.


## 9. Text-based wireframes

Brackets show controls. Each row below describes a separate screen. Read each
screen from top to bottom, and read side-by-side regions from left to right.
Put the current status or recovery message near the affected content. Keep
one primary action per step. Use synthetic labels and photo placeholders.

### 9.1 Phone — 375 px

Use one column with full-width primary buttons in the normal reading order.
Keep actions easy to reach with one hand and leave room for the on-screen keyboard.

```text
MY JOBS
  Status or retry message
  [Job card: site, system, scheduled date, status]
  [View Job]                          Repeat for each assigned job

JOB DETAILS & CHECKLIST
  [Back to My Jobs]
  Site, system, scheduled date, job ID, status
  [Start Job] if assigned | wait for In progress
  Safety and inspection items [Responses]
  Readings [Numeric fields with units]
  Field errors beside the relevant inputs
  [Continue to Photo Evidence]

PHOTO EVIDENCE
  [Back to Checklist]
  Job context and evidence guidance
  [Add Photo]
  Preview, S1 status (Selected / Adding (demo) / Added (demo) / Failed)
  [Caption], [Remove Photo], [Retry if supported and failed]
  [Inspection Notes]
  [Continue to Customer Confirmation]

REVIEW & CONFIRM
  [Back to Photo Evidence]
  Job, checklist, readings, evidence and notes summary
  [Back to Edit]
  Customer acknowledgment [Typed name] [Checkbox] (final wording pending)
  Validation or submission status
  [Submit Inspection] or [View Service Report] when confirmed

SERVICE REPORT
  [Back to My Jobs]
  Completed status, job, site, system and completion date
  Checklist results, readings and notes
  Authorized evidence with captions
  Customer acknowledgment
```

### 9.2 Tablet — 768 px

Keep the header, status messages and action row full width. Keep forms in one
reading column. Use extra width for job cards and evidence previews where they fit.

```text
My Jobs          Header and status | up to two job cards per row
                 Each card has site, system, date, status and [View Job]
Checklist        [Back] | job context | [Start Job] if assigned
                 Checklist and readings with units when In progress
                 Inline errors | [Continue to Photo Evidence]
Photo Evidence   [Back] | guidance and [Add Photo] | up to two previews per row
                 Directly under each photo, group its caption, status,
                 [Remove Photo] and [Retry] if adding the photo failed and retry is supported
                 Below the photo grid: [Notes] | [Continue]
Review & Confirm [Back] | job and inspection summary | [Back to Edit]
                 Acknowledgment and status | [Submit] or [View Service Report]
Service Report   [Back to My Jobs] | completed job context | results and readings
                 Notes | up to two authorized photos per row | acknowledgment
```

### 9.3 Desktop — 1440 px

Use a centered workspace. Keep the main form and its actions together. Use a
side column for read-only context and let it stack below the main content
when space is tight. Put errors and submission messages with the main action.

```text
My Jobs          Header and status above job cards in columns
                 Each card has site, system, date, status and [View Job]
Checklist        Main: [Start Job] if assigned, then checklist and readings
                       with units, errors, [Continue] once In progress
                 Side: site, system, date, job ID and status (proposed sticky panel)
Photo Evidence   Main: guidance, [Add Photo], previews, captions, remove, [Notes], [Continue]
                 Side: job context
Review & Confirm Main: inspection summary, [Back to Edit], acknowledgment,
                       submission status, [Submit] or [View Service Report]
                 Side: job context
Service Report   Main: completed job summary, checklist, readings and notes
                 Side: authorized evidence with captions, then acknowledgment
```

Proposed enhancement for the desktop checklist: keep the job-information side
panel visible while scrolling through a long checklist. Keep it within its own
column so it does not cover fields, messages or actions. On smaller screens,
place the job information above the checklist in the normal page flow so it
scrolls with the rest of the page.

Keep unsent entries in the open form where possible.
Keep the same action names and back navigation across widths.

## 10. Offline, recovery and completion

| When | What the technician sees and can do |
| --- | --- |
| Loading jobs, job details or report | Show a loading message for the current screen. Show the empty job list only after a successful load with zero assigned jobs. |
| Open a screen while offline | Show “You're offline” and explain if the requested information is unavailable. Any future cached job data requires an approved offline storage and access policy. |
| Connection drops while editing | Keep entries in the open form where possible. Show “Unsaved changes on this screen” and explain that reload or closing the page may lose them. Disable actions that require a connection and explain why. |
| Leave with unsaved changes | For navigation within PanelCare, warn that edits may be lost. Offer “Keep editing” and “Leave without saving.” Apply the same warning to unsaved photo selections. |
| Draft or offline storage | The current contract has no draft save, restore, or offline cache. Keep unsent entries only in the open form where possible and warn that leaving or reloading can discard them. |
| Load or photo registration fails | Explain what failed and offer Retry where supported. Keep other valid entries in the open form. Mark the failed photo and offer to remove the local selection. |
| Input is missing or invalid | Put a text message beside each affected field. On submit, show an error summary and help the technician jump to the first error. Keep valid values. |
| Access is denied or the job changes | Explain what happened. Hide restricted data and actions after access is lost. If the job changed, refresh and check its current state before allowing further edits. |
| Submit is in progress | Show “Submitting inspection…” and disable further submit attempts. |
| Submit times out or loses the connection | Show “Submission status unknown. We couldn't confirm whether your inspection was submitted. Please don't submit again until the job status has been checked.” Keep the form open. After the job status check, a manual retry of the same submission uses the original request and submission ID. Reconnecting alone does not submit it. |
| Completion is confirmed, including a repeat request that returns the existing report | Show one completed state and link to the same service report. The project blueprint calls for one report per job, including repeated completion requests. |
| Completion is rejected with a confirmed validation error | Reopen the affected step for correction. Enable Submit again once the errors are resolved. |

S1 can walk through these states with mock responses. The mocks hold data in
memory for the current session. A selected photo, confirmed demo photo
registration, and confirmed inspection completion are separate states.

## 11. Photo evidence limits and feedback

| Detail | Design treatment |
| --- | --- |
| Allowed file types | JPEG, PNG, or WebP. Show accepted types beside Add Photo. Explain how to replace an unsupported file. |
| Maximum size per file | 5 MB. About 1 MB is the target. Show the limit before selection and identify the file that exceeds it. |
| Maximum photo count | 10 per job. Show the current count and explain how to remove a selection to make room before registration. |
| Minimum count and required categories | The frozen completion validator accepts zero photos. No required photo category is defined. |
| Caption requirements | Optional, up to 200 characters. Keep each caption with its own photo. |
| Consent, retention and detailed access policy | Pending lead review under D07. Design for private evidence and authorized access. Use synthetic examples in reviews. |

Place guidance before the photo picker and feedback next to the affected
file. A preview means the file is selected. Show **Added (demo)** only after
mock registration is confirmed. In S2, show **Uploaded** after confirmation
of the actual upload.

## 12. Technician walkthrough and accessibility checklist

### 12.1 Walkthrough

- [ ] At 375 px, 768 px and 1440 px, locate each screen's main action and
  follow the full journey from an assigned job to the read-only report.
- [ ] Check loading, an empty job list, a failed load, a stale job, and an
  attempt to open another technician's job or report.
- [ ] Enter an invalid reading and omit a required answer. Check that the
  message names the affected field and other entries stay in place.
- [ ] With sample files, review unsupported type, size and count feedback,
  registration failure and removal of a local selection.
- [ ] Walk through losing the connection and leaving with unsaved edits.
  Check what stays in the open form and what may be lost.
- [ ] Walk through a rapid double tap and a lost completion response.
  Confirm the design shows uncertainty and opens the same report when
  completion is confirmed.
- [ ] Record the width, scenario, expected result, observed result and
  any follow-up in the PC-S1-04 worklog.

### 12.2 Accessibility checks

Do not rely on color alone to communicate status, errors, or required actions. Use clear text labels alongside any color indicators.
Show photo status as text. Use **Adding (demo)**, **Added (demo)**, or
**Failed** for mock registration and **Uploading**, **Uploaded**, or
**Failed** for real uploads.

- [ ] Confirm primary and secondary actions fit at 375 px without sideways
  scrolling. Check one-handed reach and leave space between touch targets.
- [ ] Check headings, reading order, explicit field labels, required
  indicators, and units that stay visible beside readings.
- [ ] Follow the flow with a keyboard. Check visible focus and logical
  Tab order. When a picker or dialog closes, return focus to its trigger.
- [ ] Check that labels and status text work without color alone. Measure text
  and control contrast once approved colors are applied.
- [ ] Check that loading, errors, save and submit outcomes can be announced
  by a screen reader. Link field errors to their inputs and keep errors visible.
- [ ] Give each photo a meaningful description and give photo controls
  distinct labels, such as “Remove photo 2.”
- [ ] Check zoom and text resizing in the built UI. Confirm that the keyboard
  or action area does not cover the focused field or its error.

Use this checklist for design review now and verify keyboard, screen-reader,
contrast and touch behavior in the implemented UI. Record visual direction
approval from Reem before building screens. The typed acknowledgment layout
is provisional until the D06 decision is confirmed.

