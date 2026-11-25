import { JobDetails } from "@/features/technician/job-details";

export default async function TechnicianJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobDetails jobId={jobId} />;
}
