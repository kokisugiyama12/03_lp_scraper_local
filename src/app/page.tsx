import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import SetupBanner from "@/components/layout/SetupBanner";
import NewSearchClient from "@/components/search/NewSearchClient";
import { listJobs } from "@/lib/db/queries";
import { getTeleapoConfig } from "@/lib/config/teleapo-config";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const jobs = listJobs() as SearchJob[];
  const hasRunning = jobs.some(
    (j) => j.status === "running" || j.status === "pending"
  );
  const config = getTeleapoConfig();

  return (
    <div className="flex min-h-screen">
      <Sidebar jobsCount={jobs.length} hasRunning={hasRunning} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={["Workspace", "新規検索"]} />
        <SetupBanner
          missingApiBase={!config.apiBase}
          missingLicense={!config.licenseKey}
        />
        <NewSearchClient recentJobs={jobs.slice(0, 5)} />
      </main>
    </div>
  );
}
