import type { Metadata } from "next";
import { PlanListScreen } from "@/features/maintenance/plan-list-screen";

export const metadata: Metadata = { title: "Maintenance plans · PanelCare" };

export default function MaintenancePage() {
  return <PlanListScreen />;
}
