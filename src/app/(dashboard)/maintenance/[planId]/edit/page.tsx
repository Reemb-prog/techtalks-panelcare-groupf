import type { Metadata } from "next";
import { EditPlanScreen } from "@/features/maintenance/plan-detail-screen";

export const metadata: Metadata = { title: "Edit maintenance plan · PanelCare" };

export default async function EditPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <EditPlanScreen key={planId} planId={planId} />;
}
