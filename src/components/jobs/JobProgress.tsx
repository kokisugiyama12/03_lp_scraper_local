"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchJob } from "@/types/job";

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

type QueryState = "queued" | "running" | "done" | "failed";

interface QueryRow {
  i: number;
  q: string;
  locationName: string;
  state: QueryState;
  ads?: number;
  durSec?: number;
  sub?: string;
}

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
  const [queries, setQueries] = useState<QueryRow[]>(() =>
    buildInitialQueries(job)
  );
  const [errors, setErrors] = useState(0);
  const [phoneCount, setPhoneCount] = useState(0);
  const [presidentCount, setPresidentCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const startTimeMs = useMemo(
    () => new Date(job.createdAt).getTime(),
    [job.createdAt]
  );
  const queryStartRef = useRef<number | null>(null);

  // Tick clock for elapsed/ETA display
  useEffect(() => {
    if (job.status !== "running" && job.status !== "pending") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [job.status]);

  // SSE
  useEffect(() => {
    if (job.status !== "running" && job.status !== "pending") return;

    const eventSource = new EventSource(`/api/jobs/${job.id}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);

        switch (event.type) {
          case "query_start": {
            queryStartRef.current = Date.now();
            const idx = event.data.queryIndex as number;
            setQueries((prev) =>
              prev.map((q, i) =>
                i === idx ? { ...q, state: "running" } : q
              )
            );
            break;
          }

          case "query_complete": {
            const dur = queryStartRef.current
              ? (Date.now() - queryStartRef.current) / 1000
              : undefined;
            setQueries((prev) => {
              const runIdx = prev.findIndex((q) => q.state === "running");
              if (runIdx === -1) return prev;
              return prev.map((q, i) =>
                i === runIdx
                  ? {
                      ...q,
                      state: "done",
                      ads: event.data.adsFound,
                      durSec: dur,
                    }
                  : q
              );
            });
            onUpdate({
              ...job,
              completedQueries: (job.completedQueries || 0) + 1,
            });
            break;
          }

          case "result_found": {
            onResultFound(event.data);
            onUpdate({
              ...job,
              totalResults: (job.totalResults || 0) + 1,
            });
            if (event.data.phoneNumber1 || event.data.phoneNumber)
              setPhoneCount((p) => p + 1);
            if (event.data.presidentName) setPresidentCount((p) => p + 1);
            // Update sub-status of running query for visual feedback
            setQueries((prev) =>
              prev.map((q) =>
                q.state === "running"
                  ? {
                      ...q,
                      sub: `extracting from ${tinyHost(
                        event.data.landingUrl || event.data.adUrl
                      )}`,
                    }
                  : q
              )
            );
            break;
          }

          case "extraction_failed":
            setErrors((e) => e + 1);
            break;

          case "job_complete":
            onUpdate({
              ...job,
              status: "completed",
              totalResults: event.data.totalResults,
            });
            eventSource.close();
            break;

          case "job_failed":
            onUpdate({ ...job, status: "failed" });
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
  }, [job.id, job.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = job.totalQueries || queries.length;
  const completed = job.completedQueries || 0;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const elapsedSec = startTimeMs
    ? Math.max(0, Math.floor((now - startTimeMs) / 1000))
    : 0;
  const avgPerQuery = completed > 0 ? elapsedSec / completed : 0;
  const remainingQueries = Math.max(0, total - completed);
  const etaSec = avgPerQuery > 0 ? Math.round(avgPerQuery * remainingQueries) : 0;
  const completionTime =
    etaSec > 0
      ? new Date(now + etaSec * 1000).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const completionDate =
    etaSec > 0
      ? new Date(now + etaSec * 1000).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "";

  const startedDate = useMemo(() => {
    return new Date(job.createdAt).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [job.createdAt]);

  const isRunning = job.status === "running" || job.status === "pending";
  const locations = useMemo(
    () => JSON.parse(job.locationsJson) as { type: string; name: string }[],
    [job.locationsJson]
  );
  const isGeoMode = locations[0]?.type === "prefecture";

  const handleCancel = async () => {
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    onUpdate({ ...job, status: "cancelled" });
  };

  return (
    <div>
      {/* Header strip */}
      <div
        className="flex items-center justify-between gap-4"
        style={{
          padding: "14px 24px 12px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            JOB#{job.id.slice(0, 6).toUpperCase()}
          </span>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {job.keyword}
          </h1>
          <span className={`status-chip ${job.status}`}>
            {job.status === "running" || job.status === "pending" ? (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "currentColor",
                  animation: "pulse 1s infinite",
                  display: "inline-block",
                }}
              />
            ) : null}
            {STATUS_LABELS[job.status] || job.status}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-2)" }}
          >
            {total} queries · {isGeoMode ? "geo" : "keyword"} mode · 開始{" "}
            {startedDate}
          </span>
        </div>
        <div className="flex gap-1.5">
          {isRunning && (
            <button
              onClick={handleCancel}
              className="cursor-pointer"
              style={{
                padding: "6px 12px",
                border: "1px solid #e6c8c8",
                background: "var(--bg-card)",
                fontSize: 11.5,
                color: "var(--error)",
                borderRadius: 3,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              中断
            </button>
          )}
        </div>
      </div>

      {/* Big progress block */}
      {isRunning && (
        <div
          style={{
            background: "var(--bg-card)",
            padding: "20px 24px 22px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div
            className="mb-2.5 flex items-baseline justify-between"
          >
            <div className="flex items-baseline gap-3.5">
              <span
                className="mono"
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                {Math.round(pct)}
                <span
                  style={{
                    fontSize: 18,
                    color: "var(--ink-2)",
                    fontWeight: 600,
                  }}
                >
                  %
                </span>
              </span>
              <span
                className="mono"
                style={{ fontSize: 13, color: "var(--ink-2)" }}
              >
                <strong style={{ color: "var(--ink)", fontWeight: 700 }}>
                  {completed}
                </strong>
                <span style={{ color: "var(--ink-3)", margin: "0 4px" }}>
                  /
                </span>
                {total} queries
              </span>
            </div>
            <div className="flex items-center gap-6">
              <ETACard
                label="残り時間"
                value={formatMinSec(etaSec)}
                big
                highlight
              />
              <ETACard label="経過時間" value={formatMinSec(elapsedSec)} />
              <ETACard
                label="平均処理時間"
                value={
                  avgPerQuery > 0 ? `${avgPerQuery.toFixed(1)}s` : "—"
                }
                sub="/ query"
              />
              <ETACard
                label="完了予定"
                value={completionTime + (completionTime !== "—" ? " JST" : "")}
                sub={completionDate}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 10,
              borderRadius: 5,
              background: "var(--rule-soft)",
              overflow: "hidden",
              position: "relative",
              border: "1px solid var(--rule)",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, var(--accent) 0%, var(--running) 100%)`,
                transition: "width 0.4s ease",
              }}
            />
            {pct < 100 && (
              <div
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: 0,
                  bottom: 0,
                  width: 30,
                  background:
                    "repeating-linear-gradient(45deg, rgba(30,111,217,0.4) 0 6px, transparent 6px 10px)",
                  animation: "stripe 1.2s linear infinite",
                }}
              />
            )}
          </div>

          {/* Tick marks */}
          {total <= 24 && (
            <div
              className="mono mt-1.5 flex justify-between"
              style={{ fontSize: 9.5, color: "var(--ink-3)" }}
            >
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  style={{
                    color:
                      i < completed
                        ? "var(--accent)"
                        : "var(--ink-3)",
                    fontWeight: i === completed ? 700 : 500,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mini stats */}
      <div
        className="flex"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <StatCell
          label="広告URL検出"
          value={String(queries.reduce((s, q) => s + (q.ads || 0), 0))}
          delta={`+${queries.reduce((s, q) => s + (q.ads || 0), 0)}`}
          positive
        />
        <StatCell
          label="連絡先取得"
          value={String(phoneCount)}
          delta={
            job.totalResults > 0
              ? `${Math.round((phoneCount / job.totalResults) * 100)}%`
              : "—"
          }
        />
        <StatCell
          label="代表者特定"
          value={String(presidentCount)}
          delta={
            job.totalResults > 0
              ? `${Math.round(
                  (presidentCount / job.totalResults) * 100
                )}%`
              : "—"
          }
        />
        <StatCell
          label="API呼出"
          value={String(job.totalResults)}
          delta={
            elapsedSec > 0
              ? `${((job.totalResults / elapsedSec) * 60).toFixed(1)}/min`
              : "—"
          }
          sub="rate"
        />
        <StatCell
          label="エラー"
          value={String(errors)}
          delta={errors === 0 ? "—" : `${errors}`}
          sub={errors === 0 ? "all clear" : "failed"}
          positive={errors === 0}
        />
        <StatCell
          label={isRunning ? "待機中" : "完了"}
          value={String(isRunning ? remainingQueries : total)}
          delta={isRunning ? formatMinSec(etaSec) : "✓"}
          sub={isRunning ? "ETA" : ""}
          positive={!isRunning}
          last
        />
      </div>

      {/* Live query log */}
      <div className="px-6 py-4">
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
          }}
        >
          <div
            className="flex items-baseline justify-between"
            style={{
              padding: "9px 18px",
              borderBottom: "1px solid var(--rule-soft)",
              background: "var(--bg-sunken)",
            }}
          >
            <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>
              検索キュー
            </h3>
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                color: "var(--ink-3)",
                letterSpacing: "0.14em",
              }}
            >
              LIVE QUERY LOG
            </span>
          </div>
          <div>
            {queries.map((q) => (
              <QueryLogRow key={q.i} {...q} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ETACard({
  label,
  value,
  sub,
  big,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="text-right">
      <div
        style={{
          fontSize: 9.5,
          color: "var(--ink-2)",
          fontWeight: 600,
          letterSpacing: "0.1em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: big ? 20 : 15,
          fontWeight: 700,
          color: highlight ? "var(--running)" : "var(--ink)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 3 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  delta,
  sub,
  positive,
  warning,
  last,
}: {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  positive?: boolean;
  warning?: boolean;
  last?: boolean;
}) {
  const deltaColor = positive
    ? "var(--success)"
    : warning
      ? "var(--warning)"
      : "var(--ink-2)";
  return (
    <div
      className="flex-1"
      style={{
        padding: "12px 18px",
        borderRight: last ? "none" : "1px solid var(--rule-soft)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: "var(--ink-2)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="mono"
            style={{ fontSize: 11, color: deltaColor, fontWeight: 600 }}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function QueryLogRow({ i, q, state, ads, durSec, sub }: QueryRow) {
  const stateConf = {
    done: {
      bg: "var(--success-soft)",
      fg: "var(--success)",
      label: "DONE",
    },
    running: {
      bg: "var(--running-soft)",
      fg: "var(--running)",
      label: "RUNNING",
    },
    queued: {
      bg: "var(--bg-sunken)",
      fg: "var(--ink-3)",
      label: "QUEUED",
    },
    failed: { bg: "var(--error-soft)", fg: "var(--error)", label: "FAILED" },
  }[state];

  return (
    <div
      className="relative grid items-center gap-3"
      style={{
        gridTemplateColumns: "36px 1fr 88px 70px 70px",
        padding: "8px 16px",
        borderBottom: "1px solid var(--rule-soft)",
        background:
          state === "running" ? "rgba(30,111,217,0.03)" : "transparent",
      }}
    >
      {state === "running" && (
        <span
          className="absolute"
          style={{
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: "var(--running)",
          }}
        />
      )}
      <span
        className="mono"
        style={{ fontSize: 10.5, color: "var(--ink-3)" }}
      >
        {String(i).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--ink)",
            fontWeight: state === "queued" ? 400 : 600,
          }}
        >
          {q}
        </div>
        {sub && (
          <div
            className="mono mt-0.5 flex items-center gap-1.5"
            style={{ fontSize: 10.5, color: "var(--running)" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "2px solid var(--running)",
                borderRightColor: "transparent",
                animation: "spin 0.8s linear infinite",
                display: "inline-block",
              }}
            />
            {sub}
          </div>
        )}
      </div>
      <span
        className="mono text-center"
        style={{
          fontSize: 9.5,
          padding: "2px 8px",
          borderRadius: 2,
          background: stateConf.bg,
          color: stateConf.fg,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {stateConf.label}
      </span>
      <span
        className="mono text-right"
        style={{ fontSize: 11, color: "var(--ink-2)" }}
      >
        {ads !== undefined ? `${ads} ads` : "—"}
      </span>
      <span
        className="mono text-right"
        style={{ fontSize: 11, color: "var(--ink-2)" }}
      >
        {durSec !== undefined ? `${durSec.toFixed(1)}s` : "—"}
      </span>
    </div>
  );
}

function buildInitialQueries(job: SearchJob): QueryRow[] {
  try {
    const locs = JSON.parse(job.locationsJson) as {
      type: string;
      name: string;
    }[];
    const isGeo = locs[0]?.type === "prefecture";
    const total = job.totalQueries || locs.length;
    const maxPages = Math.max(1, Math.round(total / Math.max(1, locs.length)));
    const rows: QueryRow[] = [];
    let i = 1;
    for (const loc of locs) {
      for (let p = 1; p <= maxPages; p++) {
        const pSuf = maxPages > 1 ? ` p.${p}` : "";
        rows.push({
          i: i++,
          locationName: loc.name,
          q: isGeo
            ? `${job.keyword}${pSuf} (位置: ${loc.name})`
            : `${job.keyword} ${loc.name}${pSuf}`,
          state: "queued",
        });
      }
    }
    // If derived total != actual total, pad/truncate
    while (rows.length < total) {
      rows.push({
        i: rows.length + 1,
        locationName: "",
        q: `${job.keyword}`,
        state: "queued",
      });
    }
    return rows.slice(0, total);
  } catch {
    return [];
  }
}

function formatMinSec(sec: number): string {
  if (sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function tinyHost(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 30);
  }
}
