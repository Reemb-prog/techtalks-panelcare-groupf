import type { Metadata } from "next";
import { PlanDetailScreen } from "@/features/maintenance/plan-detail-screen";

export const metadata: Metadata = { title: "Maintenance plan · PanelCare" };

export default async function PlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <PlanDetailScreen key={planId} planId={planId} />;
}
