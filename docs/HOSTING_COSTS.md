# Free-first hosting and account reality

**Checked against official provider materials on November 19, 2026.** Costs and limits can change; recheck at S3 release. No purchase, credit-card entry, paid upgrade or production deployment is authorized by this document.

| Layer | Selected | $0 availability and meaningful constraint |
| --- | --- | --- |
| Code and PRs | GitHub Free, one personal-account-owned private repo with four collaborators | Free repos and Actions are available, but enforcing mandatory protected-branch reviews in a **private** repo requires eligible paid plans. Review is team process, not guaranteed by policy engine. |
| Team planning | Jira Software Free Scrum | Free for up to 10 Jira users; project/board permissions, issue types and custom workflows may vary. Avoid expensive automation and verify exact account entitlements. |
| App host | Vercel Hobby | **Personal, noncommercial** projects only. Private-repo collaboration/automatic team previews are restricted; Hobby deployment commit author must match team owner, and private GitHub organization repos are unsuitable. **Reem performs approved deploys manually using her account/CLI**, after local PR CI and review. |
| Database/Auth/Storage | Supabase Free | 500 MB database per free project, up to two active free projects per account (verify current quota), with inactivity pausing after roughly seven days. Reserve one isolated staging/test project and one demo production project if quota allows; use local CLI + containers for routine integration. |
| Daily generator | Vercel Cron on Hobby | Daily schedule supported, but Hobby timing is approximate (hour-level scheduling). Make generator catch up 90 days idempotently; no exact-time promise. Protected cron secret, audit run and manual retry. |
| Image assets | Verified-source Unsplash/Pexels or own licensed photos | Free licenses can permit use, but verify any person, property, brand and restrictions; Pinterest discovery alone never confers rights. |
| Tests/monitoring | Vitest, Playwright, GitHub Actions, Vercel/Supabase usage pages | Open source local test tooling and included dashboard access; free plan quotas and log retention are limited. |
| Domain | vercel.app subdomain | No custom domain purchase in $0 baseline. |

**Critical Vercel collaboration detail:** a four-member private GitHub project does **not** automatically get four-member Vercel Hobby preview deployments. Keep PR validation through Actions and local screenshots. Only the owning Reem Vercel account deploys a preview or release if eligible, after manually checking branch/commit and configuration. If a commercial service or shared private Vercel team is required, free Hobby is not an honest long-term solution. Stop and seek approval to revise deployment provider or budget.

## Capacity scenario (assumptions, not measured usage)

Initial demonstration: four developers, 2 coordinator accounts, 3 test technician accounts, 25 synthetic customers, 50 sites, 80 solar systems, 300 components, a few hundred generated visits and 100 small compressed inspection photos. Keep each photo small (e.g. around 1 MB target), monitor storage/database egress in Supabase, builds/functions/bandwidth in Vercel and Actions minutes in GitHub. Free capacity must be verified against **actual** project utilization before onboarding real users.

The earliest likely operational constraints are Supabase free-project inactivity pause, Vercel Hobby author/collaboration rules, and free quotas. None of these services guarantees always-on production business use on free tiers. For a real installer-facing commercial product, obtain a compliant hosting plan and an operational budget first.

## Responsible operations

1. Use anonymous synthetic seed data; do not collect real customer addresses/photos in a public demo.
2. Local development uses Supabase CLI and containers; local DB resets are permitted only after verifying the local target. Production DB resets are forbidden.
3. Create separate development/test and demo secrets. Preview content uses mocks or isolated test DB, **never production data**.
4. Weekly manual database and media export to a secure, access-controlled location if the provider's free tier doesn't offer adequate backups. Record export date, location owner and restore test. Do not commit backups into Git.
5. Watch quota pages before deployments. When pause occurs, the owner resumes project and reruns smoke; idempotent scheduler catches up. Do not fake an always-online guarantee by sending artificial traffic.
6. If limits or licensing no longer meet requirements, stop onboarding/deployment and consider a paid compliant plan or migration to a self-hosted PostgreSQL/PostgREST-compatible stack. That migration has operational cost even if license cost is zero.

## Official source references

* Vercel Hobby and noncommercial terms: https://vercel.com/docs/plans/hobby
* Vercel Git deployment / private repo restrictions: https://vercel.com/docs/git
* Vercel deployment collaboration: https://vercel.com/docs/deployments/troubleshoot-project-collaboration
* Vercel cron scheduling: https://vercel.com/i/event-driven-architecture
* Supabase Free/pricing: https://supabase.com/pricing
* Supabase inactivity: https://supabase.com/docs/guides/platform/free-project-pausing
* Supabase local development: https://supabase.com/docs/guides/local-development
* GitHub protected branch availability: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
* Jira plan features: https://support.atlassian.com/jira-cloud-administration/docs/explore-jira-cloud-plans/
* Pinterest copyright: https://help.pinterest.com/en/article/copyright
* Unsplash license: https://unsplash.com/license
* Pexels license: https://www.pexels.com/license/
