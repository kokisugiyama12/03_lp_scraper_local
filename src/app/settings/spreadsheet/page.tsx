import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import SpreadsheetSettingsClient from "@/components/settings/SpreadsheetSettingsClient";
import { listJobs } from "@/lib/db/queries";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function SpreadsheetSettingsPage() {
  const jobs = listJobs(50) as SearchJob[];
  const hasRunning = jobs.some(
    (j) => j.status === "running" || j.status === "pending"
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar jobsCount={jobs.length} hasRunning={hasRunning} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={["Export", "Spreadsheet連携"]} />
        <SpreadsheetSettingsClient />
      </main>
    </div>
  );
}
