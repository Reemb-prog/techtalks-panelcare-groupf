"use client";

import { useRef, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import type { FieldErrors, ServiceReport } from "@/types";
import { describeFailure, submitMockInspection, type FailureAction, type PreparedInspection, type SubmissionAttempt } from "./inspection-submission";

type SubmissionFailure = {
  status: "error";
  message: string;
  action: FailureAction;
  photoId?: string;
  photoStatusUnknown?: boolean;
  errors?: FieldErrors;
};

export type InspectionSubmissionState =
  | { status: "idle" }
  | { status: "pending"; message: string; photoId?: string }
  | SubmissionFailure
  | { status: "success"; report: ServiceReport };

export function useInspectionSubmission(jobId: string) {
  const { adapters: { dispatch, inspections } } = useAdapters();
  const [state, setState] = useState<InspectionSubmissionState>({ status: "idle" });
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const registered = useRef(new Map<string, string>());
  const attempt = useRef<SubmissionAttempt | null>(null);
  const busy = useRef(false);

  async function run(prepared?: PreparedInspection) {
    if (busy.current || state.status === "success") return;
    if (!attempt.current && prepared) attempt.current = { prepared };
    const pendingAttempt = attempt.current;
    if (!pendingAttempt) return;

    busy.current = true;
    try {
      const outcome = await submitMockInspection(jobId, inspections, pendingAttempt, registered.current, (progress) => {
        setRegisteredIds([...registered.current.keys()]);
        setState(progress.phase === "photo"
          ? { status: "pending", message: "Adding photo details (demo)…", photoId: progress.selectionId }
          : { status: "pending", message: "Submitting inspection…" });
      });

      if (outcome.phase === "photo") {
        setState({ status: "error", ...describeFailure("photo", outcome.result.error), photoId: outcome.selectionId });
      } else if (outcome.phase === "unknown-photo") {
        setState({
          status: "error",
          // Safe to retry: the report lists only the photo IDs in the final request, so a re-added photo cannot appear twice.
          message: "Could not verify that the photo details were added. Retry to continue.",
          photoId: outcome.selectionId,
          photoStatusUnknown: true,
          action: "retry",
        });
      } else if (outcome.phase === "completion" && outcome.result.ok) {
        setState({ status: "success", report: outcome.result.data });
      } else if (outcome.phase === "completion" && !outcome.result.ok && outcome.result.error.code !== "INTERNAL") {
        const { error } = outcome.result;
        setState({ status: "error", ...describeFailure("completion", error), errors: error.fieldErrors });
      } else {
        setState({
          status: "error",
          message: "Submission status unknown. We couldn't confirm whether your inspection was submitted. Please don't submit again until the job status has been checked.",
          action: "check",
        });
      }
    } finally {
      setRegisteredIds([...registered.current.keys()]);
      busy.current = false;
    }
  }

  async function checkJob() {
    if (busy.current || !attempt.current?.request) return;
    busy.current = true;
    setState({ status: "pending", message: "Checking job status…" });
    try {
      const result = await dispatch.getJob(jobId);
      if (result.ok && (result.data.status === "in_progress" || result.data.status === "completed")) {
        setState({
          status: "error",
          message: "Job status checked. Retry the same submission to confirm the result.",
          action: "retry",
        });
      } else if (result.ok || result.status === 403 || result.status === 404 || result.status === 401) {
        setState({ status: "error", message: "This job is unavailable for submission. Return to My Jobs.", action: "none" });
      } else {
        setState({ status: "error", message: "Unable to check the job status. Try checking again.", action: "check" });
      }
    } catch {
      setState({ status: "error", message: "Unable to check the job status. Try checking again.", action: "check" });
    } finally {
      busy.current = false;
    }
  }

  /** Drops the rejected attempt so the next submit gets a new submission ID. */
  function reset() {
    if (busy.current || state.status !== "error" || (state.action !== "edit" && state.action !== "reload")) return;
    attempt.current = null;
    setState({ status: "idle" });
  }

  return { state, registeredIds, run, checkJob, reset };
}
