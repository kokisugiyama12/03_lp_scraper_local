import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import JobHistoryClient from "@/components/jobs/JobHistoryClient";
import { listJobs } from "@/lib/db/queries";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function JobsHistoryPage() {
  const jobs = listJobs(500) as SearchJob[];
  const hasRunning = jobs.some(
    (j) => j.status === "running" || j.status === "pending"
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar jobsCount={jobs.length} hasRunning={hasRunning} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={["Workspace", "ジョブ履歴"]} />
        <JobHistoryClient jobs={jobs} />
      </main>
    </div>
  );
}
