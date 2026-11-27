import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPlanScreen } from "@/features/maintenance/plan-detail-screen";

export const metadata: Metadata = { title: "New maintenance plan · PanelCare" };

// Suspense: the screen reads ?systemId= from the URL.
export default function NewPlanPage() {
  return (
    <Suspense>
      <NewPlanScreen />
    </Suspense>
  );
}
