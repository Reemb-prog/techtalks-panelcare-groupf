# PanelCare PR

Local task ID: PC-SN-XX
Actual Jira issue key and URL:
Sprint / member / reviewer:
Target main | Review-ready day:

## User outcome and boundary

What changed, what intentionally did not change, and which criteria are covered?

## Approved plan and dependencies

Link worklogs/PC-SN-XX/plan.md, approved design/contract, merged dependency PRs and any recorded change request.

## Test evidence (do not claim unexecuted checks)

Tests added (docs/TESTING.md), per layer and paths covered (happy / misuse / error):

* Unit:
* Integration:
* E2E:
* Test exemption, if any, and why:

Commands, environment and exact result for lint / TypeScript / tests / build (full `node scripts/ci.mjs` run):

Manual desktop/mobile or Impeccable critique output and screenshots for UI:

Real API/DB/RLS/storage/scheduler tests for backend, when applicable:

Security/privacy review and image manifest entries, if applicable:

## Edge cases and rollback

Empty/loading/error/denied/retry/concurrency:

Migration or rollback impact:

## Where to look first

The few file:line spots that need human judgment (from the worklog's Developer review guide):

## Human reviewer

Reviewer name (must not be author):
Result and follow-up:

Checklist:

* [ ] Plan written before code (human-approved if decision-level, per D11)
* [ ] Work within allowed paths and acceptance tests
* [ ] Tests added for every behavior change (happy/misuse/error where relevant), without duplicate or snapshot-heavy tests
* [ ] Actual checks passed or explicitly marked Blocked
* [ ] No secrets/PII/unlicensed imagery
* [ ] Jira linked, reviewer requested, evidence captured
* [ ] Rebase/retest after main changed
