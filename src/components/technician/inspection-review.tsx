"use client";

import { useState, type FormEvent } from "react";
import type { ChecklistTemplate, FieldErrors } from "@/types";
import { validateChecklist, type InspectionDraft } from "@/features/technician/inspection-form";
import { groupReviewErrors, prepareInspection, type PreparedInspection } from "@/features/technician/inspection-submission";
import type { InspectionSubmissionState } from "@/features/technician/use-inspection-submission";
import { displayAnswer } from "./inspection-values";

const actionClass = "min-h-[var(--pc-control-min-height)] rounded-pc-control px-4 font-semibold";
const primaryClass = `${actionClass} bg-pc-primary text-pc-on-primary hover:bg-pc-primary-hover`;
const secondaryClass = `${actionClass} border border-pc-control-border hover:bg-pc-canvas`;

type ReviewProps = {
  jobId: string;
  template: ChecklistTemplate;
  draft: InspectionDraft;
  state: InspectionSubmissionState;
  registeredIds: string[];
  headingRef: (heading: HTMLHeadingElement | null) => void;
  onConfirmationChange: (updates: Partial<Pick<InspectionDraft, "customerName" | "acknowledged">>) => void;
  onBack: () => void;
  onEditChecklist: () => void;
  onSubmit: (prepared: PreparedInspection) => void;
  onRetry: () => void;
  onCheck: () => void;
  onEdit: (step: InspectionDraft["step"]) => void;
  onReload: () => void;
};

export function InspectionReview({
  jobId, template, draft, state, registeredIds, headingRef, onConfirmationChange,
  onBack, onEditChecklist, onSubmit, onRetry, onCheck, onEdit, onReload,
}: ReviewProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const serverErrors = state.status === "error" ? state.errors : undefined;
  const activeErrors = serverErrors ?? errors;
  const { name, acknowledged, checklist, evidence } = groupReviewErrors(activeErrors);
  const { answers } = validateChecklist(template, draft.answers);
  const locked = state.status !== "idle";

  function clearFieldError(field: string) {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const updated = { ...previous };
      delete updated[field];
      return updated;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const result = prepareInspection(jobId, template, draft, crypto.randomUUID());
    if (result.ok) {
      setErrors({});
      onSubmit(result.prepared);
      return;
    }
    setErrors(result.errors);
    const errorsBySection = groupReviewErrors(result.errors);
    const target = errorsBySection.name ? "customer-name" : errorsBySection.acknowledged ? "customer-acknowledgment" : "inspection-review-errors";
    requestAnimationFrame(() => document.getElementById(target)?.focus());
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby="inspection-review-heading"
      className="min-w-0 space-y-5 rounded-pc-card border border-pc-border bg-pc-surface p-5 [overflow-wrap:anywhere] shadow-pc-card">
      <h2 id="inspection-review-heading" ref={headingRef} tabIndex={-1} className="text-[length:var(--pc-type-section)] font-semibold">
        Review &amp; Confirm
      </h2>
      <dl aria-label="Checklist summary" className="grid gap-3 sm:grid-cols-2">
        {template.items.map((item) => (
          <div key={item.id} className="min-w-0">
            <dt className="text-sm text-pc-muted">{item.label}</dt>
            <dd className="whitespace-pre-wrap break-words font-semibold">{displayAnswer(answers[item.id], item.unit)}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="review-evidence" className="space-y-2 border-t border-pc-border pt-4">
        <h3 id="review-evidence" className="font-semibold">Photo Evidence and Notes</h3>
        <p className="whitespace-pre-wrap break-words">{draft.notes.trim() || "No notes added."}</p>
        {draft.photos.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {draft.photos.map(({ id, file, caption }) => (
              <li key={id} className="min-w-0 space-y-1 rounded-pc-control border border-pc-border p-3">
                <p className="break-words font-semibold">{file.name}</p>
                {caption && <p className="break-words text-sm">{caption}</p>}
                <p className="text-sm text-pc-muted">
                  {registeredIds.includes(id) ? "Added (demo)" : state.status === "pending" && state.photoId === id
                    ? "Adding (demo)…" : state.status === "error" && state.photoId === id
                      ? state.photoStatusUnknown ? "Status unknown" : "Failed" : "Selected"}
                </p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-pc-muted">No photos selected.</p>}
        <p className="text-sm text-pc-muted">The demo registers photo details in memory. Image files stay on this device.</p>
      </section>
      <fieldset disabled={locked} className="min-w-0 space-y-3 rounded-pc-control border border-pc-border p-4">
        <legend className="max-w-full px-1 font-semibold">Customer acknowledgment</legend>
        <div className="space-y-1">
          <label htmlFor="customer-name" className="block font-semibold">Customer name</label>
          <input id="customer-name" type="text" required maxLength={120} value={draft.customerName}
            aria-invalid={Boolean(name)} aria-describedby={name ? "customer-name-error" : undefined}
            onChange={(event) => {
              onConfirmationChange({ customerName: event.currentTarget.value });
              clearFieldError("confirmation.typedName");
            }}
            className="w-full min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-3 py-2" />
          {name && <p id="customer-name-error" className="text-sm text-pc-danger-text">{name}</p>}
        </div>
        <div>
          <label htmlFor="customer-acknowledgment" className="flex min-h-[var(--pc-control-min-height)] items-center gap-3">
            <input id="customer-acknowledgment" type="checkbox" required checked={draft.acknowledged}
              aria-invalid={Boolean(acknowledged)} aria-describedby={acknowledged ? "customer-acknowledgment-error" : undefined}
              onChange={(event) => {
                onConfirmationChange({ acknowledged: event.currentTarget.checked });
                clearFieldError("confirmation.acknowledged");
              }}
              className="size-5 shrink-0 accent-pc-primary" />
            <span className="min-w-0">The customer acknowledges that this visit took place.</span>
          </label>
          {acknowledged && <p id="customer-acknowledgment-error" className="text-sm text-pc-danger-text">{acknowledged}</p>}
        </div>
      </fieldset>
      {(name || acknowledged || checklist || evidence.length > 0 || activeErrors._form) && (
        <div id="inspection-review-errors" role="alert" tabIndex={-1} className="space-y-1 rounded-pc-control bg-pc-danger-bg p-3 text-pc-danger-text">
          <p>Correct the marked fields before submitting.</p>
          {checklist && <p>Return to the checklist to review the answers and readings.</p>}
          {[...evidence, ...(activeErrors._form ?? [])].map((message) => <p key={message}>{message}</p>)}
        </div>
      )}
      {state.status === "pending" && <p role="status">{state.message}</p>}
      {state.status === "error" && <p role="alert" className="rounded-pc-control bg-pc-danger-bg p-3 text-pc-danger-text">{state.message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {state.status === "idle" && (
          <>
            <button className={primaryClass} type="submit">Submit Inspection</button>
            <button className={secondaryClass} type="button" onClick={onBack}>Back to Photo Evidence</button>
            {checklist && <button className={secondaryClass} type="button" onClick={onEditChecklist}>Back to Checklist</button>}
          </>
        )}
        {state.status === "pending" && <button className={`${primaryClass} opacity-60`} type="button" disabled>{state.message}</button>}
        {state.status === "error" && state.action === "check" && <button className={primaryClass} type="button" onClick={onCheck}>Check job status</button>}
        {state.status === "error" && state.action === "retry" && <button className={primaryClass} type="button" onClick={onRetry}>Retry submission</button>}
        {state.status === "error" && state.action === "reload" && <button className={primaryClass} type="button" onClick={onReload}>Reload job</button>}
        {state.status === "error" && state.action === "edit" && (
          <button className={primaryClass} type="button" onClick={() => {
            // Keep the server's field messages visible once the form unlocks.
            if (serverErrors) setErrors(serverErrors);
            onEdit(checklist ? "checklist" : evidence.length || state.photoId ? "photos" : "review");
          }}>
            Edit inspection
          </button>
        )}
      </div>
    </form>
  );
}
