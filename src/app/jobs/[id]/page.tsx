"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
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

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

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

  const isRunning =
    job?.status === "running" || job?.status === "pending";

  return (
    <div className="flex min-h-screen">
      <Sidebar hasRunning={isRunning} />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar
          crumb={[
            "Workspace",
            isRunning ? "実行中ジョブ" : "ジョブ履歴",
            job
              ? `#${job.id.slice(0, 6).toUpperCase()} ${job.keyword}`
              : "...",
          ]}
          right={
            job ? (
              <>
                {isRunning ? (
                  <span
                    className="flex items-center gap-1.5 font-bold"
                    style={{ color: "var(--running)" }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--running)",
                        animation: "pulse 1s infinite",
                        display: "inline-block",
                      }}
                    />
                    RUNNING
                  </span>
                ) : (
                  <span style={{ color: "var(--ink-3)" }}>
                    {STATUS_LABELS[job.status] || job.status}
                  </span>
                )}
                <span
                  style={{
                    width: 1,
                    height: 12,
                    background: "var(--rule)",
                  }}
                />
                <Link
                  href="/"
                  className="hover:underline"
                  style={{ color: "var(--ink-2)" }}
                >
                  ← トップに戻る
                </Link>
              </>
            ) : undefined
          }
        />

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              style={{
                height: 32,
                width: 32,
                border: "2px solid var(--rule)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {!loading && !job && (
          <div className="py-20 text-center">
            <p style={{ color: "var(--ink-2)" }}>ジョブが見つかりません</p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm underline"
              style={{ color: "var(--accent)" }}
            >
              トップに戻る
            </Link>
          </div>
        )}

        {!loading && job && (
          <>
            <JobProgress
              job={job}
              onUpdate={handleJobUpdate}
              onResultFound={handleResultFound}
            />

            <JobResults results={results} />

            {job.status === "completed" && results.length > 0 && (
              <div className="px-6 pb-6">
                <ExportButton
                  jobId={job.id}
                  spreadsheetId={job.spreadsheetId}
                />
                {job.spreadsheetId && job.exportedAt && (
                  <div
                    className="mt-3 rounded-[3px] p-3"
                    style={{
                      borderColor: "var(--accent)",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--accent)",
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--accent)" }}
                    >
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
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ({new Date(job.exportedAt).toLocaleString("ja-JP")})
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
