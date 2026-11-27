import type { Metadata } from "next";
import { Suspense } from "react";
import { DispatchScreen } from "@/features/dispatch/dispatch-screen";

export const metadata: Metadata = { title: "Dispatch · PanelCare" };

// Suspense: the board keeps its filters and open visit in the URL query.
export default function JobsPage() {
  return (
    <Suspense>
      <DispatchScreen />
    </Suspense>
  );
}
