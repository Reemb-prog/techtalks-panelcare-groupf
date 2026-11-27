import type { IsoDate, JobStatus } from "@/types";

const statusAppearance: Record<JobStatus, { label: string; tone: string }> = {
  scheduled: { label: "Scheduled", tone: "bg-pc-neutral-bg text-pc-neutral-text" },
  assigned: { label: "Assigned", tone: "bg-pc-info-bg text-pc-info-text" },
  in_progress: { label: "In progress", tone: "bg-pc-info-bg text-pc-info-text" },
  completed: { label: "Completed", tone: "bg-pc-success-bg text-pc-success-text" },
  cancelled: { label: "Cancelled", tone: "bg-pc-neutral-bg text-pc-neutral-text" },
};

// The schedule uses a calendar date. Format in UTC so it is unchanged across viewer time zones.
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export function JobDate({ date }: { date: IsoDate }) {
  return <time dateTime={date}>{dateFormat.format(new Date(date))}</time>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, tone } = statusAppearance[status];
  return (
    <span className={`inline-block rounded-pc-pill px-2.5 py-1 text-sm font-semibold ${tone}`}>
      {label}
    </span>
  );
}
