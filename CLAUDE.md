# PanelCare Claude Code entry point

You are working as **one developer assistant on one assigned task branch** in a four-person project. The repository, Jira, and reviewed PRs are authoritative; chat memory is not.

## Every session, in this order

1. Run \`git status --short --branch\` and \`node scripts/harness.mjs status\`. Read this file, \`docs/ROADMAP.md\`, \`docs/DECISIONS.md\`, \`progress.md\`, \`session-handoff.md\`, and the current work item's entry in \`config/work-items.json\`.
2. Check Jira's work item state, assignee, sprint, blockers, acceptance criteria, and linked PR. If Jira access is unavailable, report that and use the repository's last reviewed baseline without inventing state.
3. If on \`main\`, make no feature edits. Ask the developer to select an approved Jira task and run \`node scripts/harness.mjs start <LOCAL_ID>\`. Never reuse another member's branch. Never push to main directly.
4. Run \`node scripts/harness.mjs plan\` if the branch does not yet have a plan. Before coding, complete \`worklogs/<LOCAL_ID>/plan.md\`: intended result, files and contracts, UX sections/images if relevant, edge cases, tests, security, risk and reviewer. **Planning precedes implementation, for every phase and work item.** Plan approval is tiered (D11): for a routine task inside its own allowed paths, the owner records the plan as self-approved and proceeds; the non-author PR review is the gate. A separate human plan approval (Reem, or a non-author for Reem's own work) is required before coding when the task touches an API contract, schema/migrations/RLS, auth or role model, recurrence policy, design system/tokens, provider, spend, deployment/release or shared files.
5. Implement only the assigned task and allowed file areas. If shared files, migrations, contracts, design tokens or architecture must change, stop and coordinate a separate lead-owned PR and assess downstream impact.
6. Verify honestly: \`node scripts/harness.mjs check\` then \`node scripts/ci.mjs\`. For UI, manually inspect desktop/mobile and run the Impeccable critique/audit once installed; for backend, independently prove authorization, validations, scheduler and persistence behaviors. Do not call mocked UI a real backend.
7. Update only your own \`worklogs/<LOCAL_ID>/plan.md\` with tests actually run, status and handoff. Create PR using the template. Only after review and merged evidence should Jira move to Done. The team lead updates shared \`progress.md\`, \`session-handoff.md\`, roadmap gates and any global work-item revisions in an integration PR.

## Invariants

* One short-lived branch **per Jira work item**, named \`sN/member/pc-sN-XX\`, always branched from current main. Do not create sprint-wide feature branches or develop directly on a member's permanent branch.
* Sprint work can be parallel only when file ownership and interfaces do not conflict. Respect dependencies and the earliest start day in config. Jira is the live status truth, not guessed flags.
* Frontend first: **design review → mock-backed UI → local UX signoff** in S1 (Nov 20 – Dec 1). Backend, database, real integration and the demo release in S2 (Dec 2 – Dec 13), each owner wiring real services into their own screens (approved four-week plan, CR-01). Implement contracts before both sides.
* No unapproved feature expansion. P0 takes priority. No inverter telemetry, billing, inventory, native mobile app or customer portal in MVP.
* User-specific data is private. Enforce authorization on server/database, not only the UI. Never commit secrets, identifiable customer fixtures or private image binaries.
* Changes to provider, API contract, database schema, recurrence policy, role model, design system, deadline or spend require a documented impact review and lead signoff.
* **Never let a decision-level change go unnoticed because it is out of scope.** If you find a needed change outside your current task that touches a [DECISIONS.md](docs/DECISIONS.md) topic or the list above (including stale roadmap, sprint, contract or config docs), do not silently skip it and do not silently do it. If the person you are working with is the team lead (Reem), ask whether to do it now, as a separate lead-owned PR. Otherwise, report it explicitly to the team lead: what needs to change, why, what it affects, and that it is outside your current scope. Record it in your worklog handoff.
* Never execute destructive database resets, release, billing changes, external Jira changes, or deploy production solely because a script suggests it. Each requires explicit human control.
* Pinterest is a design-discovery source, **not an automatic image license**. Use only images whose publishing rights are verified and recorded in \`assets/image-manifest.csv\`.
* Each PR has one non-author human reviewer; Reem also approves architecture/security changes, and someone else reviews Reem's PRs. A Claude review is supplemental.

See [docs/TEAM_BRANCHES.md](docs/TEAM_BRANCHES.md) for commands, [docs/DESIGN_BLUEPRINT.md](docs/DESIGN_BLUEPRINT.md) for frontend guidance, [docs/CONTRACTS.md](docs/CONTRACTS.md) for invariants and [docs/QUALITY_SECURITY.md](docs/QUALITY_SECURITY.md) for exit criteria.
