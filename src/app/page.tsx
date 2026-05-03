import SearchForm from "@/components/search/SearchForm";
import JobList from "@/components/jobs/JobList";
import { listJobs } from "@/lib/db/queries";
import type { SearchJob } from "@/types/job";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const jobs = listJobs() as SearchJob[];

  return (
    <div className="space-y-8">
      <section>
        <h2
          className="mb-3 text-base font-bold"
          style={{ color: "var(--ink)" }}
        >
          新規検索
        </h2>
        <div
          className="rounded-lg border p-5"
          style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
        >
          <SearchForm />
        </div>
      </section>

      <section>
        <h2
          className="mb-3 text-base font-bold"
          style={{ color: "var(--ink)" }}
        >
          検索履歴
        </h2>
        <JobList jobs={jobs} />
      </section>
    </div>
  );
}
