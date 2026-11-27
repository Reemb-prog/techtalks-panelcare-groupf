"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { JobDate, JobStatusBadge } from "@/components/technician/job-summary";
import type { JobListItem } from "@/types";
import type { InspectionDraft } from "./inspection-form";
import { JobInspection } from "./job-inspection";
import { JobQuery } from "./job-query";
import { useInspectionSubmission } from "./use-inspection-submission";

const LEAVE_MESSAGE = "Leave this job? Your unsent changes will be lost.";

export function JobDetails({ jobId }: { jobId: string }) {
  const { adapters: { dispatch } } = useAdapters();
  const [draft, setDraft] = useState<InspectionDraft>({
    answers: {}, notes: "", photos: [], step: "checklist", customerName: "", acknowledged: false,
  });
  const submission = useInspectionSubmission(jobId);
  const [load, setLoad] = useState(() => () => dispatch.getJob(jobId));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<{ message: string; reload: boolean }>();
  const startingRef = useRef(false);
  const backGuard = useRef(false);
  const hasChanges = submission.state.status !== "success"
    && (Object.values(draft.answers).some(Boolean) || Boolean(draft.notes) || draft.photos.length > 0
      || Boolean(draft.customerName) || draft.acknowledged);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // Browser Back or a back swipe first lands on this duplicate entry, so leaving can be confirmed.
    if (!backGuard.current) {
      history.pushState(history.state, "", location.href);
      backGuard.current = true;
    }
    const confirmBack = () => {
      if (window.confirm(LEAVE_MESSAGE)) {
        backGuard.current = false;
        window.removeEventListener("popstate", confirmBack);
        history.back();
      } else {
        history.pushState(history.state, "", location.href);
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("popstate", confirmBack);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("popstate", confirmBack);
    };
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
            if (hasChanges && !window.confirm(LEAVE_MESSAGE)) event.preventDefault();
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
        {(job) => {
          const recovering = submission.state.status === "pending" || submission.state.status === "error";
          const showInspection = submission.state.status !== "success"
            && (job.status === "in_progress" || (job.status === "completed" && recovering));
          const reportId = submission.state.status === "success" ? submission.state.report.id : recovering ? null : job.reportId;
          const shownStatus = submission.state.status === "success" ? "completed" : showInspection && recovering ? "in_progress" : job.status;
          return (
          <div className={showInspection ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]" : "space-y-5 max-w-3xl"}>
            <section aria-labelledby="job-site"
              className={`min-w-0 space-y-4 rounded-pc-card border border-pc-border bg-pc-surface p-5 ${showInspection ? "lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1" : ""}`}>
              <div>
                <h2 id="job-site" className="break-words text-[length:var(--pc-type-section)] font-semibold">{job.siteLabel}</h2>
                {job.city && <p className="mt-1 text-pc-muted">{job.city}</p>}
              </div>
              <dl className="grid gap-x-5 gap-y-4 border-t border-pc-border pt-4 sm:grid-cols-2">
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
                  <dd className="mt-1"><JobStatusBadge status={shownStatus} /></dd>
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
            {showInspection && (
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <JobInspection jobId={job.id} draft={draft} setDraft={setDraft} submission={submission}
                  onReload={() => {
                    submission.reset();
                    reloadJob();
                  }} />
              </div>
            )}
            {reportId && (
              <section className="space-y-3 rounded-pc-card border border-pc-border bg-pc-surface p-5">
                {submission.state.status === "success" && <p role="status" className="font-semibold">Inspection completed (demo).</p>}
                <Link href={`/technician/reports/${reportId}`} className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover">
                  View Service Report
                </Link>
              </section>
            )}
          </div>
          );
        }}
      </JobQuery>
    </div>
  );
}
