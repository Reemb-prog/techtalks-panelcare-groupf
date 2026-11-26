import type { ReportSnapshot } from "@/types";
import { displayAnswer } from "./inspection-values";
import { JobDate, JobStatusBadge } from "./job-summary";

const panel = "min-w-0 space-y-3 rounded-pc-card border border-pc-border bg-pc-surface p-5 shadow-pc-card";
const localDateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Beirut" });

export function ReportContent({ snapshot }: { snapshot: ReportSnapshot }) {
  const { job, site, system, customer, checklist, notes, photos, confirmation } = snapshot;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className={panel} aria-labelledby="report-job">
          <h2 id="report-job" className="text-lg font-semibold">Job details</h2>
          <JobStatusBadge status="completed" />
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-sm text-pc-muted">Site</dt><dd className="break-words">{site.label}</dd></div>
            <div><dt className="text-sm text-pc-muted">Solar system</dt><dd className="break-words">{system.label}</dd></div>
            <div><dt className="text-sm text-pc-muted">Customer</dt><dd className="break-words">{customer.displayName}</dd></div>
            <div><dt className="text-sm text-pc-muted">Technician</dt><dd className="break-words">{job.technicianName}</dd></div>
            <div><dt className="text-sm text-pc-muted">Scheduled date</dt><dd><JobDate date={job.scheduledDate} /></dd></div>
            <div><dt className="text-sm text-pc-muted">Completed (Beirut time)</dt><dd><ReportTime value={job.completedAt} /></dd></div>
            <div className="sm:col-span-2"><dt className="text-sm text-pc-muted">Job ID</dt><dd className="[overflow-wrap:anywhere]">{job.id}</dd></div>
          </dl>
        </section>
        <section className={panel} aria-labelledby="report-checklist">
          <h2 id="report-checklist" className="text-lg font-semibold">Inspection results</h2>
          <p className="text-sm text-pc-muted">{checklist.title}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {checklist.lines.map((line) => (
              <div key={line.itemId} className="min-w-0">
                <dt className="text-sm text-pc-muted">{line.label}</dt>
                <dd className="whitespace-pre-wrap break-words font-semibold">{displayAnswer(line.value, line.unit)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className={panel} aria-labelledby="report-notes">
          <h2 id="report-notes" className="text-lg font-semibold">Inspection notes</h2>
          <p className="whitespace-pre-wrap break-words">{notes || "No notes recorded."}</p>
        </section>
      </div>
      <div className="space-y-4">
        <section className={panel} aria-labelledby="report-photos">
          <h2 id="report-photos" className="text-lg font-semibold">Photo evidence</h2>
          {photos.length ? (
            <ul className="space-y-3">
              {photos.map(({ id, caption }, index) => (
                <li key={id} className="rounded-pc-control border border-pc-border p-3">
                  <p className="font-semibold">Photo {index + 1}</p>
                  <p className="break-words">{caption || "No caption provided."}</p>
                  <p className="text-sm text-pc-muted">Image preview unavailable in this demo.</p>
                </li>
              ))}
            </ul>
          ) : <p>No photo evidence recorded.</p>}
        </section>
        <section className={panel} aria-labelledby="report-acknowledgment">
          <h2 id="report-acknowledgment" className="text-lg font-semibold">Customer acknowledgment</h2>
          <p className="break-words font-semibold">{confirmation.typedName}</p>
          <p>Visit acknowledged</p>
          <p><ReportTime value={confirmation.confirmedAt} /> (Beirut time)</p>
        </section>
      </div>
    </div>
  );
}

function ReportTime({ value }: { value: string }) {
  return <time dateTime={value}>{localDateTime.format(new Date(value))}</time>;
}
