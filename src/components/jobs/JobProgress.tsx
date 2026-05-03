"use client";

import { useEffect, useState, useCallback } from "react";
import type { SearchJob } from "@/types/job";

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

interface JobProgressProps {
  job: SearchJob;
  onUpdate: (job: SearchJob) => void;
  onResultFound: (result: Record<string, unknown>) => void;
}

export default function JobProgress({
  job,
  onUpdate,
  onResultFound,
}: JobProgressProps) {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-20), msg]);
  }, []);

  useEffect(() => {
    if (job.status !== "running" && job.status !== "pending") return;

    const eventSource = new EventSource(`/api/jobs/${job.id}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);

        switch (event.type) {
          case "query_start":
            setCurrentLocation(event.data.locationName);
            addLog(
              `検索中: ${event.data.locationName}（${event.data.queryIndex + 1}/${event.data.totalQueries}）`
            );
            break;

          case "query_complete":
            addLog(
              `${event.data.locationName}: ${event.data.adsFound}件の広告を発見`
            );
            onUpdate({
              ...job,
              completedQueries: (job.completedQueries || 0) + 1,
            });
            break;

          case "result_found":
            onResultFound(event.data);
            onUpdate({
              ...job,
              totalResults: (job.totalResults || 0) + 1,
            });
            addLog(
              `取得: ${event.data.companyName || event.data.adUrl}`
            );
            break;

          case "extraction_failed":
            addLog(`抽出失敗: ${event.data.adUrl}`);
            break;

          case "job_complete":
            onUpdate({
              ...job,
              status: "completed",
              totalResults: event.data.totalResults,
            });
            addLog(`完了: ${event.data.totalResults}件取得`);
            setCurrentLocation(null);
            eventSource.close();
            break;

          case "job_failed":
            onUpdate({ ...job, status: "failed" });
            addLog(`エラー: ${event.data.error}`);
            setCurrentLocation(null);
            eventSource.close();
            break;
        }
      } catch {
        // parse error
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [job.id, job.status]);  // eslint-disable-line react-hooks/exhaustive-deps

  const progress =
    job.totalQueries > 0
      ? Math.round((job.completedQueries / job.totalQueries) * 100)
      : 0;

  const handleCancel = async () => {
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    onUpdate({ ...job, status: "cancelled" });
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{job.keyword}</h2>
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            {job.totalQueries} エリア
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-chip ${job.status}`}>
            {STATUS_LABELS[job.status] || job.status}
          </span>
          {(job.status === "running" || job.status === "pending") && (
            <button
              onClick={handleCancel}
              className="rounded-md border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--error)",
                color: "var(--error)",
              }}
            >
              キャンセル
            </button>
          )}
        </div>
      </div>

      {(job.status === "running" || job.status === "pending") && (
        <>
          <div className="mb-2">
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--bg-sunken)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <div
              className="mt-1 flex justify-between text-xs"
              style={{ color: "var(--ink-4)" }}
            >
              <span>
                {job.completedQueries}/{job.totalQueries} エリア
              </span>
              <span>{job.totalResults} 件取得</span>
            </div>
          </div>

          {currentLocation && (
            <p
              className="mb-2 text-sm"
              style={{
                color: "var(--accent)",
                animation: "pulse 1.5s infinite",
              }}
            >
              検索中: {currentLocation}
            </p>
          )}
        </>
      )}

      {job.status === "completed" && (
        <p className="text-sm" style={{ color: "var(--success)" }}>
          {job.totalResults} 件のリストを取得しました
        </p>
      )}

      {log.length > 0 && (
        <div
          className="mt-3 max-h-32 overflow-y-auto rounded border p-2 text-xs"
          style={{
            borderColor: "var(--rule-soft)",
            background: "var(--bg-sunken)",
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {log.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
