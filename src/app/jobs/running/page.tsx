import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { listJobs } from "@/lib/db/queries";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function RunningJobPage() {
  const jobs = listJobs(50) as SearchJob[];
  const running = jobs.find(
    (j) => j.status === "running" || j.status === "pending"
  );

  if (running) {
    redirect(`/jobs/${running.id}`);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar jobsCount={jobs.length} hasRunning={false} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={["Workspace", "実行中ジョブ"]} />

        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div
            className="rounded-[4px] px-12 py-12 text-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--rule)",
              minWidth: 420,
            }}
          >
            <div
              className="mono mb-2"
              style={{
                fontSize: 10.5,
                color: "var(--ink-3)",
                letterSpacing: "0.14em",
              }}
            >
              NO RUNNING JOB
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: "0 0 6px",
                color: "var(--ink)",
              }}
            >
              実行中のジョブはありません
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-2)",
                margin: "0 0 18px",
              }}
            >
              現在処理中のジョブはありません。新しい検索を開始するか、過去のジョブを確認できます。
            </p>
            <div className="flex justify-center gap-2">
              <Link
                href="/"
                style={{
                  padding: "7px 18px",
                  border: "none",
                  background: "var(--accent)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#fff",
                  borderRadius: 3,
                  textDecoration: "none",
                  letterSpacing: "0.04em",
                }}
              >
                新規検索 ▶
              </Link>
              <Link
                href="/jobs"
                style={{
                  padding: "7px 14px",
                  border: "1px solid var(--rule)",
                  background: "var(--bg-card)",
                  fontSize: 11.5,
                  color: "var(--ink)",
                  borderRadius: 3,
                  textDecoration: "none",
                }}
              >
                ジョブ履歴を見る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
