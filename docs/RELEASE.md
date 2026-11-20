# Vercel release runbook and verification gate

**Owner:** Reem, after independent human approval. S1/S2 contain *no production deployment*. Keep existing Vercel accounts, databases and Git connections untouched until explicitly authorized.

## Before linking an account

1. Verify site is personal noncommercial TechTalks demo. Vercel Hobby is unsuitable for production use by a commercial solar company. Validate GitHub ownership and the current documented Hobby deployment-author limitations.
2. Confirm GitHub repository belongs to Reem's personal account if using private GitHub + Vercel Hobby; **do not expect member-authored commits to auto-deploy previews**. Instead Reem may manually deploy approved snapshots from her local clone using Vercel CLI. Every PR still gets GitHub Actions, screenshots and local tests.
3. Verify the nonproduction Supabase project is isolated from demo production, storage bucket private, policies tested and quota accessible. Use an actual migration/release script only after a staging rehearsal and backup/export.
4. Configure Vercel project secrets in the dashboard: \`NEXT_PUBLIC_SUPABASE_URL\`, \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` (publishable/anon only), server-only Supabase credentials if absolutely needed, and \`CRON_SECRET\`. Never commit their values.
5. Register one daily cron job only **after** implementing protected \`GET /api/cron/maintenance\`: proposed \`vercel.json\` entry with path /api/cron/maintenance and schedule \`0 3 * * *\` (UTC, exact hour not guaranteed on Hobby). Do not add a cron config pointing to a missing endpoint.

## Staging and release sequence

1. Verify Jira PRs and the S2 release gate (PC-S3-09), \`node scripts/ci.mjs\`, actual Playwright E2E and SQL concurrency/authorization evidence. Freeze branch/tag, record SHA.
2. Reem deploys a private preview with synthetic data and tests login, registry, scheduler, assignment, checklist photo, report and role denials. Check mobile and external image license manifest.
3. Take export/backup, apply approved migrations, configure production environment, deploy only after approval. No destructive migration from a Claude prompt without explicit review.
4. Perform safe production smoke: coordinator and technician demo accounts, no real personal info, manual protected generation with 90-day golden fixtures, denial of unauthorized cron, record creation/report read, scheduler logs and quota check.
5. Record actual URL, timestamp, SHA, reviewer, observed status and limitations in \`docs/test-results/release.md\`. If deployment is blocked by plan/terms, **do not claim deployed**. Share local demo instead and request a hosting decision.
6. Roll back application through previously accepted deployment SHA and restore database only through reviewed recovery procedure; account for schema compatibility before rolling back. Service reports and completed jobs must not be lost.

## After launch

Daily check: cron succeeded or warning has visible owner, no duplicate jobs, Supabase not paused, quota headroom. Weekly: export plus restore drill on isolated project, dependency audit, user-reported defects and Jira triage. If staging was paused by inactivity, resume as owner and rerun smoke before demo.
