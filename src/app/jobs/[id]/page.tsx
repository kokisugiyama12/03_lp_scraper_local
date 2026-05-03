"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import JobProgress from "@/components/jobs/JobProgress";
import JobResults from "@/components/jobs/JobResults";
import ExportButton from "@/components/export/ExportButton";
import type { SearchJob } from "@/types/job";

interface ResultRow {
  locationName: string;
  adUrl: string;
  landingUrl?: string;
  companyName?: string | null;
  phoneNumber?: string | null;
  presidentName?: string | null;
  adHeadline?: string | null;
  extractionStatus?: string;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<SearchJob | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [jobRes, resultsRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/jobs/${id}/results`),
      ]);
      const jobData = await jobRes.json();
      const resultsData = await resultsRes.json();

      setJob(jobData.job);
      setResults(resultsData.results || []);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleResultFound = useCallback(
    (result: Record<string, unknown>) => {
      setResults((prev) => [...prev, result as unknown as ResultRow]);
    },
    []
  );

  const handleJobUpdate = useCallback((updated: SearchJob) => {
    setJob(updated);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-8 w-8 rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--rule)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--ink-3)" }}>ジョブが見つかりません</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm underline"
          style={{ color: "var(--accent)" }}
        >
          トップに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-block text-sm underline"
        style={{ color: "var(--accent)" }}
      >
        ← トップに戻る
      </Link>

      <JobProgress
        job={job}
        onUpdate={handleJobUpdate}
        onResultFound={handleResultFound}
      />

      <div>
        <h3
          className="mb-2 text-sm font-bold"
          style={{ color: "var(--ink-2)" }}
        >
          取得結果（{results.length}件）
        </h3>
        <JobResults results={results} />
      </div>

      {job.status === "completed" && results.length > 0 && (
        <>
          {job.spreadsheetId && job.exportedAt && (
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                Spreadsheetにエクスポート済み
              </p>
              <a
                href={`https://docs.google.com/spreadsheets/d/${job.spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
                style={{ color: "var(--accent)" }}
              >
                Spreadsheetを開く
              </a>
              <span className="ml-2 text-xs" style={{ color: "var(--ink-4)" }}>
                ({new Date(job.exportedAt).toLocaleString("ja-JP")})
              </span>
            </div>
          )}
          <ExportButton jobId={job.id} spreadsheetId={job.spreadsheetId} />
        </>
      )}
    </div>
  );
}
