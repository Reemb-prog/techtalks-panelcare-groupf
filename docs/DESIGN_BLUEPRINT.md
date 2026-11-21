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
8. **Design review and revision:** gather feedback, fix material issues, run keyboard/responsive checks, then request S1 design approval. Repeat the research/plan/check cycle for any changed screen in S2.

## Personas and sitemap

| Persona | Primary goal | Information needed first |
| --- | --- | --- |
| Solar installer or service coordinator | Register installed systems, plan preventive work, assign visits, and investigate warranty claims. | Upcoming and unassigned jobs, system identity, warranty dates, and assignment status. |
| Field technician | Find today's assigned visit and finish it on a phone at the site. | Visit time, site and system, work instructions, checklist, and submission status. |

```text
Sign in
├── Coordinator dashboard
│   ├── Installed base → Customers → Sites → Systems → Components
│   ├── Maintenance planner → Plan details → Create or edit plan
│   ├── Dispatch board → Job detail → Assign or reschedule → Report
│   └── Fault tickets → Ticket detail → Linked system and warranty
└── Technician My Jobs → Job detail → Checklist → Service report
```

The coordinator assigns a visit and can review its completed report from the job detail. The technician sees assigned work. S1 uses labeled mock data and demo roles. See [the separate technician flow specification](design/technician.md) for its owned interaction details.

## Design tokens and component semantics

The importable source is [`src/styles/tokens.css`](../src/styles/tokens.css). PC-S1-05 owns adding `@import "../styles/tokens.css";` alongside the global CSS imports. Use the `--pc-*` variables in components. The [Figma screens and tokens](https://www.figma.com/design/bV24mBw1ktLfzkCbzXu3hT) provide visual context. The blue palette uses navy for structure, blue for primary actions, and amber for attention.

- Typography uses Inter when available and a system sans fallback. Use the page, section, card, body, control, and caption size and line-height pairs.
- Spacing uses a 4 px base. Use control, card, panel, and pill radii according to the element's role.
- Buttons use a primary action per context, a secondary style for supporting actions, and a clear disabled state. Inputs use persistent labels, visible focus, and field-level error text. Use the stronger control border for identifying editable fields.
- Status chips pair a label with semantic foreground and background tokens. Use neutral for unassigned or paused, info for assigned or in progress, warning for warranty due or scheduling conflict, success for completed, and danger for errors or expired coverage where urgent action is needed.

## Required interaction states

| State | UI response |
| --- | --- |
| Loading | Keep the page title visible, announce loading, and prevent duplicate submissions. |
| Empty | Explain whether there are no records or no matching results. Provide a create action or a way to clear filters where the role permits it. |
| Error | Explain what failed, preserve user-entered values, and offer retry when appropriate. |
| Invalid input | Show field-level guidance and a summary for multiple errors. Focus the first invalid field on submit. |
| Permission denied | Explain the limit and offer a return to permitted work. Avoid exposing restricted record details. |

At 375 px, stack content and keep the primary action reachable. At 768 px, prioritize essential columns and use a scrollable region for wide tables. At 1440 px, show the coordinator navigation and related data side by side. Use the Figma desktop and mobile boards as design references and capture all three widths during implementation review.

## Page-by-page section map and photography plan

| Screen | Required ordered sections and elements | Image guidance |
| --- | --- | --- |
| Sign in | 1. Brand and promise; 2. email/password card and error/help; 3. role context/safe demo notice; 4. privacy footer | One **real** landscape solar rooftop/installer photograph in a right-side panel on desktop. On mobile collapse to a small cropped banner; never obstruct form. |
| Coordinator dashboard | 1. Today header and primary action; 2. visit summary cards with real counts; 3. upcoming/overdue jobs table; 4. expiring warranties; 5. activity/empty/error state | Mostly data, **no decorative hero image**. Optional tiny verified solar-site thumbnail in a contextual detail card only. |
| Customers list | 1. Title/create customer; 2. search/status filters; 3. table and row actions; 4. empty/error/loading; 5. paginated navigation | No photo necessary. Use purposeful line illustration for first-run empty state if licensed, or CSS icon. |
| Customer details | 1. Identity/contact; 2. installation sites; 3. linked solar systems; 4. service history/timeline | Only user-provided approved site photo if available; otherwise clean placeholder, no fake customer image. |
| Site detail | 1. Site identity and access instructions; 2. linked customer; 3. systems and warranty alerts; 4. recent visits | Use an authorized photo only when it helps identify the site. |
| Register solar system | 1. customer/site breadcrumb; 2. system capacity/type/date; 3. component repeater with serial/warranty; 4. validation/confirmation; 5. save outcome | Small supporting schematic/icon, not an ambiguous photo standing in for a registered system. |
| System detail | 1. site and system summary; 2. component inventory table and warranty badges; 3. replacement history; 4. plan and visits; 5. related reports | Real installation/site photo only when uploaded/authorized; image lightbox with alt text and access control. |
| Maintenance planner | 1. system context; 2. frequency, anchor, start date, timezone; 3. readable next-occurrences preview; 4. pause/edit impact warning; 5. job-generation state | No stock imagery. Dates and recurrence examples are the visual. |
| Dispatch board | 1. counts and date range; 2. filters; 3. compact jobs list; 4. detail drawer; 5. assignment/state dialog, conflicts | No imagery. Clear status and dates make this screen useful. |
| Fault tickets | 1. Title and log issue action; 2. priority and status filters; 3. ticket list; 4. linked system and warranty detail; 5. empty/error/loading | No decorative imagery. Approved customer evidence belongs on the relevant record. |
| Technician My Jobs | 1. today's work; 2. assigned visit cards with site/distance only if actually known; 3. status and large CTA; 4. offline/error/empty messages | A real customer/site thumbnail if authorized; do not invent map or location metrics. |
| Technician job detail | 1. Visit time and site; 2. system and work instructions; 3. checklist action; 4. loading, failure and denied states | An authorized site reference may help identify the location. See the technician flow for details. |
| Technician checklist | 1. job/system context; 2. safety and inspection checklist; 3. numeric readings with units; 4. photos with preview/validation; 5. notes; 6. customer confirmation; 7. submit/retry status | Technician's **real uploaded evidence** is the content. A decorative Pinterest photo must never be confused with inspection proof. |
| Service report | 1. customer/site/system and completed date; 2. structured results and readings; 3. evidence gallery; 4. customer acknowledgment; 5. export/print if implemented | Authorized inspection photographs with captions and object-storage access controls only. |

## Pinterest and licensed real photo workflow

[Light dashboard references on Pinterest](https://www.pinterest.com/search/pins/?q=light%20field%20service%20dashboard%20ui) informed sidebar navigation and compact cards. FieldPulse and Housecall Pro screenshots are competitor references in Figma. The Figma photos from [EnergyVision](https://www.energyvision.be/en/energy-solutions-0) and [AP Electrical Services](https://apelectricalservices.com.au/installation-guide/hiring-certified-solar-installers-in-adelaide) are review references with production rights unverified. Use a surface or icon fallback until an asset clears the manifest requirements below.

Use Pinterest to find visually suitable **real** photography: e.g. searches for \`solar technician rooftop inspection photography\`, \`residential solar inverter installation field service\`, \`solar panel maintenance technician close up\`, \`clean energy operations dashboard industrial photography\`. In a S1 design review, record exact Pinterest Pin URL and original creator source, crop, aspect, reason for selection and proposed section.

**Do not download, hotlink or commit a Pinterest image just because it is visible on Pinterest.** Pinterest's official copyright guidance says permission may be required. Where rights aren't clear, source an equivalent real, verifiably licensed photo from Unsplash, Pexels or the rights holder directly. Keep original URL, author, license URL, license date, usage, alt text and final local path in \`assets/image-manifest.csv\`. Avoid visible proprietary logos and recognizable people without suitable releases. Use locally optimized WebP/AVIF in \`public/images/\` with approved dimensions and mobile crop; no remote hotlinks to Pinterest CDN. If a real source photo is not cleared, do not ship the image.

Suggested aspect ratios: sign-in 4:5 crop (desktop panel); optional contextual hero 16:9; thumbnail 1:1; evidence thumbnails original aspect with object-fit containment. Images must load gracefully and never carry essential text.

## Impeccable and quality gates

Install in **each** Claude Code environment, not automatically through a repo postinstall script:

1. Open Claude Code and run \`/plugin marketplace add pbakaus/impeccable\`.
2. Open \`/plugin\`, locate and install Impeccable. Validate installed command names in the current version and run critique/audit on implemented screens.
3. Record command/version, screenshot and concrete fixes in the task worklog. Use the critique to improve hierarchy, rhythm, consistency and accessibility, not to blindly redesign approved brand decisions.

The team's review checklist tests: 375/768/1440 widths, one-handed touch targets, keyboard focus and escape, actionable error messages, contrast, distinct status text, form labels, actual empty/slow/error/permission states, image ownership, responsive tables, and measured performance. An aesthetic opinion alone never passes the feature.
