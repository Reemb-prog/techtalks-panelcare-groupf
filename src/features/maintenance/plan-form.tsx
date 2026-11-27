"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { formatShortDate, relativeDay } from "@/features/dashboard/dashboard-view";
import { describeRecurrence } from "@/lib/adapters/maintenance/recurrence";
import { businessToday } from "@/lib/validations/dates";
import { toFieldErrors } from "@/lib/validations/errors";
import { createPlanSchema, updatePlanSchema } from "@/lib/validations/maintenance";
import { DEFAULT_BUSINESS_TIMEZONE, type FieldErrors, type JobListItem, type MaintenancePlan, type SystemListItem } from "@/types";
import { INTERVAL_PRESETS, impactNeedsAttention, impactSentences, isValidRule, planImpact, previewOccurrences } from "./planner-view";
import { Chip, FieldError, Panel, Section, buttonPrimary, buttonSecondary, captionClass, inputClass, labelClass } from "./ui";

export type PlanFormMode =
  | { kind: "create"; systems: SystemListItem[]; initialSystemId?: string }
  | { kind: "edit"; plan: MaintenancePlan; planJobs: JobListItem[]; onReload: () => void };

const FIELD_ELEMENT: Record<string, string> = { systemId: "plan-system", intervalMonths: "plan-interval", anchorDate: "plan-anchor" };

/** Create or edit a plan's schedule. Blueprint sections 2–4: frequency/anchor/timezone, live preview, impact warning. */
export function PlanForm({ mode, cancelHref, onSaved }: { mode: PlanFormMode; cancelHref: string; onSaved: (plan: MaintenancePlan) => void }) {
  const { adapters } = useAdapters();
  const [today] = useState(() => businessToday(new Date(), DEFAULT_BUSINESS_TIMEZONE));
  const existing = mode.kind === "edit" ? mode.plan : null;
  const presetFor = (months: number) => (INTERVAL_PRESETS.some((preset) => preset.months === months) ? String(months) : "custom");

  const [systemId, setSystemId] = useState(mode.kind === "create" ? (mode.initialSystemId ?? "") : mode.plan.systemId);
  const [intervalChoice, setIntervalChoice] = useState(existing ? presetFor(existing.intervalMonths) : "3");
  const [customInterval, setCustomInterval] = useState(existing && presetFor(existing.intervalMonths) === "custom" ? String(existing.intervalMonths) : "");
  const [anchorDate, setAnchorDate] = useState(existing?.anchorDate ?? today);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ text: string; reload: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const intervalMonths = intervalChoice === "custom" ? Number(customInterval || NaN) : Number(intervalChoice);
  const rule = { anchorDate, intervalMonths };
  const preview = previewOccurrences(rule, today);
  const impact = mode.kind === "edit" ? planImpact({ ...rule, status: mode.plan.status }, mode.planJobs, today) : null;

  function showErrors(next: FieldErrors) {
    setErrors(next);
    const first = Object.keys(FIELD_ELEMENT).find((key) => next[key]);
    if (first) {
      const id = first === "intervalMonths" && intervalChoice === "custom" ? "plan-interval-custom" : FIELD_ELEMENT[first];
      formRef.current?.querySelector<HTMLElement>("#" + id)?.focus();
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    setMessage(null);
    setErrors({});

    let save: () => ReturnType<typeof adapters.maintenance.createPlan>;
    if (mode.kind === "create") {
      const parsed = createPlanSchema.safeParse({ systemId, intervalMonths, anchorDate, timezone: DEFAULT_BUSINESS_TIMEZONE });
      if (!parsed.success) {
        showErrors(toFieldErrors(parsed.error));
        setMessage({ text: "Check the highlighted fields.", reload: false });
        return;
      }
      save = () => adapters.maintenance.createPlan(parsed.data);
    } else {
      const changes = {
        ...(intervalMonths !== mode.plan.intervalMonths ? { intervalMonths } : {}),
        ...(anchorDate !== mode.plan.anchorDate ? { anchorDate } : {}),
      };
      if (!Object.keys(changes).length) {
        setMessage({ text: "Nothing changed. Change the interval or first visit date to save.", reload: false });
        return;
      }
      const parsed = updatePlanSchema.safeParse({ expectedVersion: mode.plan.version, ...changes });
      if (!parsed.success) {
        showErrors(toFieldErrors(parsed.error));
        setMessage({ text: "Check the highlighted fields.", reload: false });
        return;
      }
      const planId = mode.plan.id;
      save = () => adapters.maintenance.updatePlan(planId, parsed.data);
    }

    locked.current = true;
    setPending(true);
    let saved = false;
    try {
      const result = await save();
      if (result.ok) {
        saved = true;
        onSaved(result.data);
      } else {
        const conflict = result.error.code === "CONFLICT";
        setMessage({ text: conflict ? `${result.error.message} Nothing was saved.` : result.error.message, reload: conflict && mode.kind === "edit" });
        showErrors(result.error.fieldErrors ?? {});
      }
    } catch {
      setMessage({ text: "The mock request failed. Your entries are still here. Try again.", reload: false });
    } finally {
      if (!saved) {
        locked.current = false;
        setPending(false);
      }
    }
  }

  const describedBy = (key: string, hint?: string) => [errors[key] ? `${FIELD_ELEMENT[key]}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className="flex flex-col gap-6">
      {message && (
        <Panel tone="danger" title={message.reload ? "This plan changed" : "The plan was not saved"} role="alert">
          <p>{message.text}</p>
          {message.reload && mode.kind === "edit" && (
            <button type="button" onClick={mode.onReload} className={`${buttonSecondary} w-fit`}>
              Reload plan
            </button>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Schedule" id="schedule-heading">
          <div className="flex flex-col gap-4">
            {/* 1. System context */}
            {mode.kind === "create" ? (
              <div>
                <label htmlFor="plan-system" className={labelClass}>
                  Solar system
                </label>
                <select
                  id="plan-system"
                  value={systemId}
                  onChange={(event) => setSystemId(event.target.value)}
                  aria-invalid={!!errors.systemId}
                  aria-describedby={describedBy("systemId")}
                  className={inputClass}
                >
                  <option value="">Choose a system</option>
                  {mode.systems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.customerName} · {system.siteLabel} · {system.label}
                    </option>
                  ))}
                </select>
                <FieldError id="plan-system-error" messages={errors.systemId} />
                {mode.systems.length === 0 && <p className={captionClass}>No systems are registered yet. Register one under Customers first.</p>}
              </div>
            ) : null}

            {/* 2. Frequency, anchor, timezone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="plan-interval" className={labelClass}>
                  How often
                </label>
                <select
                  id="plan-interval"
                  value={intervalChoice}
                  onChange={(event) => setIntervalChoice(event.target.value)}
                  aria-invalid={!!errors.intervalMonths && intervalChoice !== "custom"}
                  aria-describedby={intervalChoice !== "custom" ? describedBy("intervalMonths") : undefined}
                  className={inputClass}
                >
                  {INTERVAL_PRESETS.map((preset) => (
                    <option key={preset.months} value={String(preset.months)}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Another number of months…</option>
                </select>
                {intervalChoice === "custom" && (
                  <div className="mt-2">
                    <label htmlFor="plan-interval-custom" className={labelClass}>
                      Months between visits (1 to 60)
                    </label>
                    <input
                      id="plan-interval-custom"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={60}
                      step={1}
                      value={customInterval}
                      onChange={(event) => setCustomInterval(event.target.value)}
                      aria-invalid={!!errors.intervalMonths}
                      aria-describedby={describedBy("intervalMonths")}
                      className={inputClass}
                    />
                  </div>
                )}
                <FieldError id="plan-interval-error" messages={errors.intervalMonths} />
              </div>
              <div>
                <label htmlFor="plan-anchor" className={labelClass}>
                  First visit date
                </label>
                <input
                  id="plan-anchor"
                  type="date"
                  value={anchorDate}
                  onChange={(event) => setAnchorDate(event.target.value)}
                  aria-invalid={!!errors.anchorDate}
                  aria-describedby={describedBy("anchorDate", "plan-anchor-hint")}
                  className={inputClass}
                />
                <p id="plan-anchor-hint" className={captionClass}>
                  Every later visit counts from this date.
                </p>
                <FieldError id="plan-anchor-error" messages={errors.anchorDate} />
              </div>
            </div>
            <div>
              <p className={labelClass}>Business timezone</p>
              <p>Asia/Beirut. Visit dates follow the Beirut calendar day.</p>
            </div>
          </div>
        </Section>

        {/* 3. Readable next-occurrences preview */}
        <Section title="Upcoming visit dates" id="preview-heading">
          <div aria-live="polite" className="flex flex-col gap-3">
            {preview && isValidRule(rule) ? (
              <>
                <p className="font-semibold">{describeRecurrence(rule)}</p>
                <ol className="flex flex-col gap-2">
                  {preview.map(({ date, inWindow }) => (
                    <li key={date} className="flex flex-wrap items-center justify-between gap-2 border-t border-pc-border pt-2 first:border-t-0 first:pt-0">
                      <span>
                        <span className="font-semibold">{formatShortDate(date)}</span> <span className="text-pc-muted">{date.slice(0, 4)} · {relativeDay(date, today)}</span>
                      </span>
                      {inWindow ? <Chip tone="info">Next 90 days</Chip> : <Chip tone="neutral">Later</Chip>}
                    </li>
                  ))}
                </ol>
                <p className={captionClass}>Visits in the next 90 days are created when visits are generated. Later dates follow automatically.</p>
              </>
            ) : (
              <p className="text-pc-muted">Choose how often and a first visit date to see the dates.</p>
            )}
          </div>
        </Section>
      </div>

      {/* 4. Edit impact warning */}
      {impact && (
        <div aria-live="polite">
          <Panel tone={impactNeedsAttention(impact) ? "warning" : "neutral"} title="What this change does">
            {impactSentences(impact).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {impact.paused && <p>The new schedule applies when the plan is resumed.</p>}
          </Panel>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Saving…" : mode.kind === "create" ? "Create plan" : "Save schedule"}
        </button>
        <Link href={cancelHref} className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
