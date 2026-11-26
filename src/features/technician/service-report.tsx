"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useAdapters } from "@/components/layout/adapters-provider";
import { ReportContent } from "@/components/technician/report-content";
import { JobQuery } from "./job-query";

export function ServiceReport({ reportId }: { reportId: string }) {
  const { adapters: { inspections }, auth } = useAdapters();
  const load = useCallback(() => inspections.getReport(reportId), [inspections, reportId]);
  const coordinator = auth.status === "signed-in" && auth.session.role === "coordinator";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <Link href={coordinator ? "/dashboard" : "/technician"}
          className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control font-semibold text-pc-primary underline">
          {coordinator ? "Back to dashboard" : "Back to My Jobs"}
        </Link>
        <h1 className="mt-2 text-[length:var(--pc-type-page)] leading-[var(--pc-line-page)] font-bold">Service Report</h1>
      </header>
      <JobQuery
        load={load}
        loadingMessage="Loading service report…"
        errorMessage="We couldn't load your service report. Check your connection and try again."
        deniedMessage="You don't have permission to view this report."
        unavailable={{ title: "Report unavailable", message: "This service report is currently unavailable." }}
      >
        {(report) => <ReportContent snapshot={report.snapshot} />}
      </JobQuery>
    </div>
  );
}
