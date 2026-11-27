"use client";

import { useCallback, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { ChecklistFields, checklistFieldId } from "@/components/technician/checklist-fields";
import { PhotoEvidence } from "@/components/technician/photo-evidence";
import { InspectionReview } from "@/components/technician/inspection-review";
import type { ChecklistTemplate } from "@/types";
import { validateChecklist, type InspectionDraft } from "./inspection-form";
import { JobQuery } from "./job-query";
import type { useInspectionSubmission } from "./use-inspection-submission";

type JobInspectionProps = {
  jobId: string;
  draft: InspectionDraft;
  setDraft: Dispatch<SetStateAction<InspectionDraft>>;
  submission: ReturnType<typeof useInspectionSubmission>;
  onReload: () => void;
};

export function JobInspection({ jobId, draft, setDraft, submission, onReload }: JobInspectionProps) {
  const { adapters: { inspections } } = useAdapters();
  const load = useCallback(() => inspections.getChecklistTemplate(), [inspections]);
  const stepFocusPending = useRef(false);
  const focusStepHeading = useCallback((heading: HTMLHeadingElement | null) => {
    if (heading && stepFocusPending.current) {
      heading.focus();
      stepFocusPending.current = false;
    }
  }, []);

  function goToStep(step: InspectionDraft["step"]) {
    stepFocusPending.current = true;
    setDraft((previous) => ({ ...previous, step }));
  }

  if (draft.step === "photos") {
    return (
      <PhotoEvidence
        jobId={jobId}
        photos={draft.photos}
        notes={draft.notes}
        registeredIds={submission.registeredIds}
        headingRef={focusStepHeading}
        onPhotosChange={(photos) => setDraft((previous) => ({ ...previous, photos }))}
        onNotesChange={(notes) => setDraft((previous) => ({ ...previous, notes }))}
        onBack={() => goToStep("checklist")}
        onContinue={() => goToStep("review")}
      />
    );
  }

  return (
    <JobQuery
      load={load}
      loadingMessage="Loading inspection checklist…"
      errorMessage="Unable to load the inspection checklist."
      deniedMessage="You don't have permission to view the inspection checklist."
    >
      {(template) => draft.step === "review" ? (
        <InspectionReview
          jobId={jobId}
          template={template}
          draft={draft}
          headingRef={focusStepHeading}
          state={submission.state}
          registeredIds={submission.registeredIds}
          onConfirmationChange={(updates) => setDraft((previous) => ({ ...previous, ...updates }))}
          onBack={() => goToStep("photos")}
          onEditChecklist={() => goToStep("checklist")}
          onSubmit={(prepared) => { void submission.run(prepared); }}
          onRetry={() => { void submission.run(); }}
          onCheck={() => { void submission.checkJob(); }}
          onEdit={(step) => {
            submission.reset();
            goToStep(step);
          }}
          onReload={onReload}
        />
      ) : (
        <InspectionChecklist
          template={template}
          values={draft.answers}
          onChange={(itemId, value) => setDraft((previous) => ({
            ...previous, answers: { ...previous.answers, [itemId]: value },
          }))}
          onContinue={() => {
            stepFocusPending.current = true;
            setDraft((previous) => ({ ...previous, step: "photos", checklistVersion: template.version }));
          }}
          headingRef={focusStepHeading}
        />
      )}
    </JobQuery>
  );
}

function InspectionChecklist({ template, values, onChange, onContinue, headingRef }: {
  template: ChecklistTemplate;
  values: InspectionDraft["answers"];
  onChange: (itemId: string, value: string) => void;
  onContinue: () => void;
  headingRef: (heading: HTMLHeadingElement | null) => void;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const { fieldErrors } = validateChecklist(template, values);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  function continueToPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasErrors) {
      onContinue();
      return;
    }
    setShowErrors(true);
    const firstInvalid = template.items.find((item) => fieldErrors[`answers.${item.id}`]);
    if (firstInvalid) document.getElementById(checklistFieldId(firstInvalid.id))?.focus();
  }

  return (
    <form noValidate onSubmit={continueToPhotos} aria-labelledby="inspection-checklist-heading"
      className="min-w-0 space-y-5 rounded-pc-card border border-pc-border bg-pc-surface p-5 shadow-pc-card">
      <div>
        <h2 ref={headingRef} id="inspection-checklist-heading" tabIndex={-1}
          className="text-[length:var(--pc-type-section)] font-semibold">Inspection Checklist</h2>
        <p className="mt-1 text-sm text-pc-muted">{template.title}</p>
      </div>
      {showErrors && hasErrors && (
        <p role="alert" className="rounded-pc-control bg-pc-danger-bg p-3 text-pc-danger-text">
          Check the fields marked below before continuing.
        </p>
      )}
      <ChecklistFields template={template} values={values} errors={showErrors ? fieldErrors : {}} onChange={onChange} />
      <button type="submit"
        className="min-h-[var(--pc-control-min-height)] w-full rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover sm:w-auto">
        Continue to Photo Evidence
      </button>
    </form>
  );
}
