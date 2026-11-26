"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JobDate, JobStatusBadge } from "@/components/technician/job-summary";
import type { JobListItem } from "@/types";
import type { InspectionDraft } from "./inspection-form";
import { JobInspection } from "./job-inspection";
import { JobQuery } from "./job-query";

export function JobDetails({ jobId }: { jobId: string }) {
  const { adapters: { dispatch } } = useAdapters();
  const [draft, setDraft] = useState<InspectionDraft>({ answers: {}, notes: "", photos: [], step: "checklist" });
  const [load, setLoad] = useState(() => () => dispatch.getJob(jobId));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<{ message: string; reload: boolean }>();
  const startingRef = useRef(false);
  const hasChanges = Object.values(draft.answers).some(Boolean) || Boolean(draft.notes) || draft.photos.length > 0;

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const reloadJob = useCallback(() => {
    setStartError(undefined);
    setLoad(() => () => dispatch.getJob(jobId));
  }, [dispatch, jobId]);

  async function startJob(job: JobListItem) {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setStartError(undefined);
    try {
      const result = await dispatch.updateJob(job.id, { action: "start", expectedVersion: job.version });
      if (result.ok || result.error.code === "NOT_FOUND" || result.error.code === "FORBIDDEN") {
        reloadJob();
        return;
      }
      const reload = result.error.code !== "INTERNAL";
      setStartError({
        message: reload ? "This job could not be started. Reload the job before trying again." : "Unable to start the job. Try again.",
        reload,
      });
    } catch {
      setStartError({ message: "Could not confirm whether the job started. Reload the job before trying again.", reload: true });
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <Link
          className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control font-semibold text-pc-primary underline"
          href="/technician"
          onNavigate={(event) => {
            if (hasChanges && !window.confirm("Leave this job? Your unsent changes will be lost.")) event.preventDefault();
          }}
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
          <div className={job.status === "in_progress" ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]" : "max-w-3xl"}>
            <section aria-labelledby="job-site"
              className={`min-w-0 space-y-4 rounded-pc-card border border-pc-border bg-pc-surface p-5 shadow-pc-card ${job.status === "in_progress" ? "lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1" : ""}`}>
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
              {job.status === "assigned" && (
                <div className="space-y-2">
                  {startError && <p role="alert" className="text-sm text-pc-danger-text">{startError.message}</p>}
                  <button
                    type="button"
                    disabled={starting}
                    className="min-h-[var(--pc-control-min-height)] w-full rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover disabled:opacity-60 sm:w-auto"
                    onClick={() => startError?.reload ? reloadJob() : void startJob(job)}
                  >
                    {starting ? "Starting job…" : startError?.reload ? "Reload job" : startError ? "Retry Start Job" : "Start Job"}
                  </button>
                </div>
              )}
            </section>
            {job.status === "in_progress" && (
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <JobInspection jobId={job.id} draft={draft} setDraft={setDraft} />
              </div>
            )}
          </div>
        )}
      </JobQuery>
    </div>
  );
}
