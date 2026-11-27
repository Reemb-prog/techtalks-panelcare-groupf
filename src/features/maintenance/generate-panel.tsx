"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { formatShortDate } from "@/features/dashboard/dashboard-view";
import type { GenerationRunResult } from "@/types";
import { generationSummary } from "./planner-view";
import { Panel, buttonSecondary, captionClass, linkClass } from "./ui";

/** Blueprint section 5: job-generation state. Runs the SIMULATED generator for all plans or one plan. */
export function GeneratePanel({ planId, onGenerated }: { planId?: string; onGenerated?: () => void }) {
  const { adapters } = useAdapters();
  const busy = useRef(false);
  const [state, setState] = useState<{ kind: "idle" } | { kind: "running" } | { kind: "done"; result: GenerationRunResult } | { kind: "failed"; message: string }>({ kind: "idle" });

  async function run() {
    if (busy.current) return;
    busy.current = true;
    setState({ kind: "running" });
    try {
      const result = await adapters.maintenance.generateJobs(planId ? { planId } : {});
      if (result.ok) {
        setState({ kind: "done", result: result.data });
        onGenerated?.();
      } else setState({ kind: "failed", message: result.error.message });
    } catch {
      setState({ kind: "failed", message: "The mock request failed. Please try again." });
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={state.kind === "running"} className={buttonSecondary}>
          {state.kind === "running" ? "Generating…" : planId ? "Generate visits for this plan" : "Generate visits for all plans"}
        </button>
        <p className={captionClass}>Creates any missing visits for the next 90 days. Safe to run again: existing visits are never duplicated.</p>
      </div>
      <div aria-live="polite">
        {state.kind === "done" && (
          <Panel tone={state.result.conflicts.length ? "warning" : "success"} title="Simulated generation finished" role="status">
            <p>{generationSummary(state.result)}</p>
            {state.result.conflicts.length > 0 && (
              <>
                <p>These assigned visits no longer match their plan. They were kept; decide in dispatch whether to reschedule or cancel them:</p>
                <ul className="list-disc pl-5">
                  {state.result.conflicts.map((conflict) => (
                    <li key={conflict.jobId}>
                      <Link href={`/jobs?status=all&job=${conflict.jobId}`} className={linkClass}>
                        Visit on {formatShortDate(conflict.scheduledDate)}
                      </Link>{" "}
                      ({conflict.reason === "in_progress_job_no_longer_valid" ? "in progress" : "assigned"})
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        )}
        {state.kind === "failed" && (
          <Panel tone="danger" title="Generation did not run" role="alert">
            <p>{state.message} No visits were created.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
