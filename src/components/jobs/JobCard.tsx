import Link from "next/link";
import type { SearchJob } from "@/types/job";

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

export default function JobCard({ job }: { job: SearchJob }) {
  const locations = JSON.parse(job.locationsJson) as { name: string }[];
  const progress =
    job.totalQueries > 0
      ? Math.round((job.completedQueries / job.totalQueries) * 100)
      : 0;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold" style={{ color: "var(--ink)" }}>
          {job.keyword}
        </h3>
        <span className={`status-chip ${job.status}`}>
          {STATUS_LABELS[job.status] || job.status}
        </span>
      </div>

      <p className="mb-2 text-xs" style={{ color: "var(--ink-3)" }}>
        {locations
          .slice(0, 5)
          .map((l) => l.name)
          .join("、")}
        {locations.length > 5 && ` 他${locations.length - 5}件`}
      </p>

      {job.status === "running" && (
        <div className="mb-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--bg-sunken)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "var(--accent)",
              }}
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-4)" }}>
            {job.completedQueries}/{job.totalQueries} エリア完了
          </p>
        </div>
      )}

      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--ink-4)" }}
      >
        <span>{job.totalResults} 件取得</span>
        <span>{new Date(job.createdAt).toLocaleString("ja-JP")}</span>
      </div>
    </Link>
  );
}
