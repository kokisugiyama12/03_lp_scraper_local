import JobCard from "./JobCard";
import type { SearchJob } from "@/types/job";

export default function JobList({ jobs }: { jobs: SearchJob[] }) {
  if (jobs.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center text-sm"
        style={{
          borderColor: "var(--rule-soft)",
          color: "var(--ink-4)",
          background: "var(--bg-card)",
        }}
      >
        まだ検索ジョブがありません。上のフォームから検索を開始してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
