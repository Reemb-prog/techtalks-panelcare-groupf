"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AdaptersProvider } from "@/components/layout/adapters-provider";
import { AppShell } from "@/components/layout/app-shell";
import { RequireSession } from "@/components/layout/require-session";

export default function TechnicianLayout({ children }: { children: ReactNode }) {
  return (
    <AdaptersProvider>
      <RequireSession>
        {(session) => (
          <AppShell session={session}>
            {session.role === "technician" ? (
              children
            ) : (
              <section className="max-w-xl space-y-3 rounded-pc-card border border-pc-border bg-pc-surface p-5">
                <h1 className="text-2xl font-bold">Permission denied</h1>
                <p>This area is for demo technicians.</p>
                <Link className="inline-flex min-h-[var(--pc-control-min-height)] items-center rounded-pc-control font-semibold text-pc-primary underline" href="/dashboard">
                  Back to dashboard
                </Link>
              </section>
            )}
          </AppShell>
        )}
      </RequireSession>
    </AdaptersProvider>
  );
}
