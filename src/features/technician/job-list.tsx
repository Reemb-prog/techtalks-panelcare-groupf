"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JobDate, JobStatusBadge } from "@/components/technician/job-summary";
import { JobQuery } from "./job-query";

export function JobList() {
  const { adapters: { dispatch }, auth, dataVersion } = useAdapters();
  const [pagination, setPagination] = useState({ page: 1, version: dataVersion });
  const page = pagination.version === dataVersion ? pagination.page : 1;
  const load = useCallback(() => dispatch.listJobs({ page }), [dispatch, page]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold">My Jobs</h1>
        {auth.status === "signed-in" && <p className="mt-1 text-pc-muted">{auth.session.displayName}</p>}
      </header>
      <JobQuery
        load={load}
        loadingMessage="Loading your jobs…"
        errorMessage="Unable to load your jobs."
        deniedMessage="You don't have permission to view these jobs."
      >
        {({ items, pageSize, total }) => (
          total === 0 ? (
            <p role="status" className="rounded-pc-card border border-pc-border bg-pc-surface p-5">
              You have no assigned jobs right now. New assignments will appear here.
            </p>
          ) : (
            <>
              <ul aria-label="Assigned jobs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((job) => (
                  <li key={job.id} className="flex min-w-0 flex-col gap-4 rounded-pc-card border border-pc-border bg-pc-surface p-4 shadow-pc-card">
                    <div className="space-y-1">
                      <h2 className="break-words text-[length:var(--pc-type-card)] font-semibold">{job.siteLabel}</h2>
                      <p className="break-words text-pc-muted">{job.systemLabel}</p>
                    </div>
                    <p className="flex flex-wrap items-center gap-2">
                      <JobStatusBadge status={job.status} />
                      <span className="text-sm text-pc-muted"><JobDate date={job.scheduledDate} /></span>
                    </p>
                    <Link
                      className="mt-auto inline-flex min-h-[var(--pc-control-min-height)] items-center justify-center rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover"
                      href={`/technician/jobs/${job.id}`}
                      aria-label={`View Job at ${job.siteLabel} on ${job.scheduledDate}`}
                    >
                      View Job
                    </Link>
                  </li>
                ))}
              </ul>
              {total > pageSize && (
                <nav aria-label="Job pages" className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-3 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPagination({ page: page - 1, version: dataVersion })}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {Math.ceil(total / pageSize)}</span>
                  <button
                    type="button"
                    className="min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-3 disabled:opacity-50"
                    disabled={page * pageSize >= total}
                    onClick={() => setPagination({ page: page + 1, version: dataVersion })}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )
        )}
      </JobQuery>
    </div>
  );
}
