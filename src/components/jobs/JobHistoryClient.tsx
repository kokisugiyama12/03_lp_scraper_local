"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchJob } from "@/types/job";

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

type StatusFilter = "all" | "running" | "completed" | "failed" | "cancelled";

interface JobHistoryClientProps {
  jobs: SearchJob[];
}

export default function JobHistoryClient({ jobs }: JobHistoryClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let rows = jobs;
    if (statusFilter !== "all") {
      if (statusFilter === "running") {
        rows = rows.filter(
          (j) => j.status === "running" || j.status === "pending"
        );
      } else {
        rows = rows.filter((j) => j.status === statusFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((j) => {
        if (j.keyword.toLowerCase().includes(q)) return true;
        try {
          const locs = JSON.parse(j.locationsJson) as { name: string }[];
          return locs.some((l) => l.name.toLowerCase().includes(q));
        } catch {
          return false;
        }
      });
    }
    return rows;
  }, [jobs, search, statusFilter]);

  const counts = useMemo(() => {
    const c = {
      all: jobs.length,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const j of jobs) {
      if (j.status === "running" || j.status === "pending") c.running++;
      else if (j.status === "completed") c.completed++;
      else if (j.status === "failed") c.failed++;
      else if (j.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [jobs]);

  return (
    <>
      <div
        className="flex items-center justify-between"
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid var(--rule)",
          background: "var(--bg-card)",
        }}
      >
        <div>
          <h1
            className="m-0"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.005em",
            }}
          >
            ジョブ履歴
          </h1>
          <p
            className="m-0 mt-[3px]"
            style={{ fontSize: 11.5, color: "var(--ink-2)" }}
          >
            これまでに実行した検索ジョブ一覧
          </p>
        </div>
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
      </div>

      <div
        className="flex items-center gap-2"
        style={{
          padding: "10px 24px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{
            padding: "4px 8px",
            border: "1px solid var(--rule)",
            borderRadius: 3,
            background: "var(--bg-sunken)",
            width: 280,
          }}
        >
          <span style={{ color: "var(--ink-3)", fontSize: 12 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="絞り込み (キーワード・エリア)"
            className="flex-1 bg-transparent outline-none"
            style={{
              border: "none",
              fontSize: 12,
              fontFamily: "var(--font-body)",
              color: "var(--ink)",
              padding: "2px 0",
            }}
          />
        </div>
        <FilterChip
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          すべて ({counts.all})
        </FilterChip>
        <FilterChip
          active={statusFilter === "running"}
          onClick={() => setStatusFilter("running")}
        >
          実行中 ({counts.running})
        </FilterChip>
        <FilterChip
          active={statusFilter === "completed"}
          onClick={() => setStatusFilter("completed")}
        >
          完了 ({counts.completed})
        </FilterChip>
        <FilterChip
          active={statusFilter === "failed"}
          onClick={() => setStatusFilter("failed")}
        >
          エラー ({counts.failed})
        </FilterChip>
        <FilterChip
          active={statusFilter === "cancelled"}
          onClick={() => setStatusFilter("cancelled")}
        >
          中断 ({counts.cancelled})
        </FilterChip>
        <div className="flex-1" />
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-3)" }}
        >
          {filtered.length} / {jobs.length} jobs
        </span>
      </div>

      <div
        className="flex-1 overflow-auto"
        style={{ padding: "0 24px 24px" }}
      >
        {filtered.length === 0 ? (
          <div
            className="rounded-[4px] py-12 text-center text-sm"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--rule)",
              color: "var(--ink-3)",
              marginTop: 16,
            }}
          >
            該当するジョブがありません
          </div>
        ) : (
          <table
            className="w-full"
            style={{
              borderCollapse: "collapse",
              fontSize: 12,
              background: "var(--bg-card)",
              border: "1px solid var(--rule)",
            }}
          >
            <thead
              className="sticky top-0 z-10"
              style={{ background: "var(--bg-sunken)" }}
            >
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                <Th w={90}>JOB</Th>
                <Th>キーワード</Th>
                <Th w={80} center>
                  ステータス
                </Th>
                <Th w={130}>エリア</Th>
                <Th w={70} right>
                  進捗
                </Th>
                <Th w={70} right>
                  取得
                </Th>
                <Th w={150}>作成日時</Th>
                <Th w={28} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const locations = parseLocations(job.locationsJson);
                const date = new Date(job.createdAt).toLocaleString(
                  "ja-JP",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );
                const progress =
                  job.totalQueries > 0
                    ? Math.round(
                        (job.completedQueries / job.totalQueries) * 100
                      )
                    : 0;
                return (
                  <tr
                    key={job.id}
                    style={{
                      borderBottom: "1px solid var(--rule-soft)",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      window.location.href = `/jobs/${job.id}`;
                    }}
                  >
                    <Td mono muted>
                      #{job.id.slice(0, 6).toUpperCase()}
                    </Td>
                    <Td strong>{job.keyword}</Td>
                    <Td center>
                      <span className={`status-chip ${job.status}`}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </Td>
                    <Td muted>
                      {locations.length > 0
                        ? `${locations[0].name}${
                            locations.length > 1
                              ? ` 他${locations.length - 1}件`
                              : ""
                          }`
                        : "-"}
                    </Td>
                    <Td right mono>
                      {job.completedQueries}/{job.totalQueries}
                      {job.status === "running" && (
                        <span
                          style={{
                            color: "var(--running)",
                            marginLeft: 4,
                            fontSize: 10.5,
                          }}
                        >
                          ({progress}%)
                        </span>
                      )}
                    </Td>
                    <Td right mono strong>
                      {job.totalResults}
                    </Td>
                    <Td muted mono>
                      {date}
                    </Td>
                    <Td center muted>
                      ›
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function parseLocations(json: string): { name: string }[] {
  try {
    return JSON.parse(json) as { name: string }[];
  } catch {
    return [];
  }
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer"
      style={{
        padding: "4px 10px",
        border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
        background: active ? "var(--accent-soft)" : "var(--bg-card)",
        color: active ? "var(--accent)" : "var(--ink-2)",
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 3,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  w,
  center,
  right,
}: {
  children?: React.ReactNode;
  w?: number;
  center?: boolean;
  right?: boolean;
}) {
  return (
    <th
      style={{
        textAlign: center ? "center" : right ? "right" : "left",
        padding: "7px 10px",
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--ink-2)",
        letterSpacing: "0.06em",
        width: w,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  center,
  right,
  muted,
  strong,
  mono,
}: {
  children: React.ReactNode;
  center?: boolean;
  right?: boolean;
  muted?: boolean;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "8px 10px",
        textAlign: center ? "center" : right ? "right" : "left",
        color: muted ? "var(--ink-2)" : "var(--ink)",
        fontWeight: strong ? 600 : 400,
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        fontSize: mono ? 11.5 : 12,
      }}
    >
      {children}
    </td>
  );
}
