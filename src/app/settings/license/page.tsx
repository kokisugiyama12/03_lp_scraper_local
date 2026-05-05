import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import LicenseSettingsClient from "@/components/settings/LicenseSettingsClient";
import { listJobs } from "@/lib/db/queries";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function LicenseSettingsPage() {
  const jobs = listJobs(50) as SearchJob[];
  const hasRunning = jobs.some(
    (j) => j.status === "running" || j.status === "pending"
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar jobsCount={jobs.length} hasRunning={hasRunning} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={["System", "API / ライセンス"]} />
        <LicenseSettingsClient />
      </main>
    </div>
  );
}
