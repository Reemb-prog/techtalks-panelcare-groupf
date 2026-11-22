"use client";

import { AdaptersProvider } from "@/components/layout/adapters-provider";
import { AppShell } from "@/components/layout/app-shell";
import { RequireSession } from "@/components/layout/require-session";

/** Coordinator area: one mock adapter set shared by every screen under (dashboard) (PC-S1-06/07/08 included). */
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdaptersProvider>
      <RequireSession>{(session) => <AppShell session={session}>{children}</AppShell>}</RequireSession>
    </AdaptersProvider>
  );
}
