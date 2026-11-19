# PanelCare UX and visual engineering blueprint

**Design intent:** calm, reliable field-service software for solar installers. It should look like a credible tool for real people, not a template of oversized gradients, fake metrics, random charts or irrelevant stock photos. Functionality, hierarchy and field clarity come first. Impeccable helps critique and polish the design; human approval remains the decision gate.

## Discovery and signoff sequence for every frontend phase

1. **Research:** ask coordinator and technician what they need at each point; inspect real solar maintenance forms and validated UI references. Create a labeled Pinterest reference board with original source links; note what is inspirational rather than copyable.
2. **Information architecture:** draw route map, content hierarchy and task flows; list permission boundaries, fields, empty/error/loading states and mobile changes.
3. **Section plan:** for each page, document every major section, heading, purpose, form/table/card, interaction, visual, source and accessibility needs before building.
4. **Low-fidelity wireframes:** desktop 1440 px, tablet 768 px, mobile 375 px. Confirm user can find primary action in three seconds. Review with Reem.
5. **Design system:** document tokens and states. Install Impeccable deliberately using the official Claude Code plugin directions (from its GitHub README). Use its critique/audit commands where available; save **actual** outputs, not a claim.
6. **High-fidelity screen + thin vertical slice:** build one representative customer list and technician job detail, review screenshots with real content, then extend reusable components.
7. **Functional QA:** every visible control has a response; all forms have validation, save-state, failure and retry behavior. Mock data clearly labeled in S1.
8. **Design review and revision:** gather feedback, fix material issues, run keyboard/responsive checks, then request S1 design approval. Repeat the research/plan/check cycle for any changed screen in S2/S3.

## Suggested visual system (to be approved, not treated as final brand)

* Palette: deep navy #10293B for structure, forest teal #187463 for primary actions, solar amber #C58A2A for attention, warm paper #F7F9F7 for surfaces, neutral slate for text. Use semantic destructive/status colors with WCAG contrast tests, not color alone.
* Typography: locally bundled or Next.js-managed open-license Inter or Geist; 14–16 px body, balanced 24–32 px screen titles. Consistent numerals for dates/measurements.
* Geometry: 8 px spacing scale, moderate 10–14 px radii, subtle borders, rare shadows; not glassmorphism. Icon set: Lucide, paired with text labels for important actions.
* Components: shadcn/ui primitives, semantic input labels, validation hints, combobox/search, data tables, page headers, confirmation dialogs, accessible toast, skeleton, empty state, status chips, progress stepper and mobile bottom navigation where useful.
* Behavior: one primary CTA per context; progressive disclosure for dense forms; consistent confirmation/undo for destructive actions; do not hide a broken API behind optimistic success.

## Page-by-page section map and photography plan

| Screen | Required ordered sections and elements | Image guidance |
| --- | --- | --- |
| Sign in | 1. Brand and promise; 2. email/password card and error/help; 3. role context/safe demo notice; 4. privacy footer | One **real** landscape solar rooftop/installer photograph in a right-side panel on desktop. On mobile collapse to a small cropped banner; never obstruct form. |
| Coordinator dashboard | 1. Today header and primary action; 2. visit summary cards with real counts; 3. upcoming/overdue jobs table; 4. expiring warranties; 5. activity/empty/error state | Mostly data, **no decorative hero image**. Optional tiny verified solar-site thumbnail in a contextual detail card only. |
| Customers list | 1. Title/create customer; 2. search/status filters; 3. table and row actions; 4. empty/error/loading; 5. paginated navigation | No photo necessary. Use purposeful line illustration for first-run empty state if licensed, or CSS icon. |
| Customer details | 1. Identity/contact; 2. installation sites; 3. linked solar systems; 4. service history/timeline | Only user-provided approved site photo if available; otherwise clean placeholder, no fake customer image. |
| Register solar system | 1. customer/site breadcrumb; 2. system capacity/type/date; 3. component repeater with serial/warranty; 4. validation/confirmation; 5. save outcome | Small supporting schematic/icon, not an ambiguous photo standing in for a registered system. |
| System detail | 1. site and system summary; 2. component inventory table and warranty badges; 3. replacement history; 4. plan and visits; 5. related reports | Real installation/site photo only when uploaded/authorized; image lightbox with alt text and access control. |
| Maintenance planner | 1. system context; 2. frequency, anchor, start date, timezone; 3. readable next-occurrences preview; 4. pause/edit impact warning; 5. job-generation state | No stock imagery. Dates and recurrence examples are the visual. |
| Dispatch board | 1. counts and date range; 2. filters; 3. compact jobs list; 4. detail drawer; 5. assignment/state dialog, conflicts | No imagery. Clear status and dates make this screen useful. |
| Technician My Jobs | 1. today's work; 2. assigned visit cards with site/distance only if actually known; 3. status and large CTA; 4. offline/error/empty messages | A real customer/site thumbnail if authorized; do not invent map or location metrics. |
| Technician checklist | 1. job/system context; 2. safety and inspection checklist; 3. numeric readings with units; 4. photos with preview/validation; 5. notes; 6. customer confirmation; 7. submit/retry status | Technician's **real uploaded evidence** is the content. A decorative Pinterest photo must never be confused with inspection proof. |
| Service report | 1. customer/site/system and completed date; 2. structured results and readings; 3. evidence gallery; 4. customer acknowledgment; 5. export/print if implemented | Authorized inspection photographs with captions and object-storage access controls only. |

## Pinterest and licensed real photo workflow

Use Pinterest to find visually suitable **real** photography: e.g. searches for \`solar technician rooftop inspection photography\`, \`residential solar inverter installation field service\`, \`solar panel maintenance technician close up\`, \`clean energy operations dashboard industrial photography\`. In a S1 design review, record exact Pinterest Pin URL and original creator source, crop, aspect, reason for selection and proposed section.

**Do not download, hotlink or commit a Pinterest image just because it is visible on Pinterest.** Pinterest's official copyright guidance says permission may be required. Where rights aren't clear, source an equivalent real, verifiably licensed photo from Unsplash, Pexels or the rights holder directly. Keep original URL, author, license URL, license date, usage, alt text and final local path in \`assets/image-manifest.csv\`. Avoid visible proprietary logos and recognizable people without suitable releases. Use locally optimized WebP/AVIF in \`public/images/\` with approved dimensions and mobile crop; no remote hotlinks to Pinterest CDN. If a real source photo is not cleared, do not ship the image.

Suggested aspect ratios: sign-in 4:5 crop (desktop panel); optional contextual hero 16:9; thumbnail 1:1; evidence thumbnails original aspect with object-fit containment. Images must load gracefully and never carry essential text.

## Impeccable and quality gates

Install in **each** Claude Code environment, not automatically through a repo postinstall script:

1. Open Claude Code and run \`/plugin marketplace add pbakaus/impeccable\`.
2. Open \`/plugin\`, locate and install Impeccable. Validate installed command names in the current version and run critique/audit on implemented screens.
3. Record command/version, screenshot and concrete fixes in the task worklog. Use the critique to improve hierarchy, rhythm, consistency and accessibility, not to blindly redesign approved brand decisions.

The team's review checklist tests: 375/768/1440 widths, one-handed touch targets, keyboard focus and escape, actionable error messages, contrast, distinct status text, form labels, actual empty/slow/error/permission states, image ownership, responsive tables, and measured performance. An aesthetic opinion alone never passes the feature.
