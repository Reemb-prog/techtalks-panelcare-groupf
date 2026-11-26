import { ServiceReport } from "@/features/technician/service-report";

export default async function CoordinatorReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ServiceReport reportId={reportId} />;
}
