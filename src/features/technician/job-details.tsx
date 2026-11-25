"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JobDate, JobStatusBadge } from "@/components/technician/job-summary";
import { JobQuery } from "./job-query";

export function JobDetails({ jobId }: { jobId: string }) {
  const { adapters: { dispatch } } = useAdapters();
  const load = useCallback(() => dispatch.getJob(jobId), [dispatch, jobId]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <Link
          className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control font-semibold text-pc-primary underline"
          href="/technician"
        >
          Back to My Jobs
        </Link>
        <h1 className="mt-2 text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold">Job Details</h1>
      </header>
      <JobQuery
        load={load}
        loadingMessage="Loading job details…"
        errorMessage="Unable to load job details."
        deniedMessage="You don't have permission to view this job."
      >
        {(job) => (
          <section aria-labelledby="job-site" className="space-y-4 rounded-pc-card border border-pc-border bg-pc-surface p-5 shadow-pc-card">
            <div>
              <h2 id="job-site" className="break-words text-[length:var(--pc-type-section)] font-semibold">{job.siteLabel}</h2>
              {job.city && <p className="mt-1 text-pc-muted">{job.city}</p>}
            </div>
            <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-pc-muted">Solar system</dt>
                <dd className="break-words font-semibold">{job.systemLabel}</dd>
              </div>
              <div>
                <dt className="text-sm text-pc-muted">Scheduled date</dt>
                <dd className="font-semibold"><JobDate date={job.scheduledDate} /></dd>
              </div>
              <div>
                <dt className="text-sm text-pc-muted">Status</dt>
                <dd className="mt-1"><JobStatusBadge status={job.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-pc-muted">Job ID</dt>
                <dd className="[overflow-wrap:anywhere]">{job.id}</dd>
              </div>
            </dl>
          </section>
        )}
      </JobQuery>
    </div>
  );
}
