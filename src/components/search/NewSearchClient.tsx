"use client";

import { useState } from "react";
import Link from "next/link";
import SearchForm, { PanelHeader } from "./SearchForm";
import type { SearchJob } from "@/types/job";

interface NewSearchClientProps {
  recentJobs: SearchJob[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  running: "実行中",
  completed: "完了",
  failed: "エラー",
  cancelled: "キャンセル",
};

export default function NewSearchClient({ recentJobs }: NewSearchClientProps) {
  const [preview, setPreview] = useState<string[]>([]);

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
            新規検索
          </h1>
          <p
            className="m-0 mt-[3px]"
            style={{ fontSize: 11.5, color: "var(--ink-2)" }}
          >
            業種キーワードと検索エリアを指定してジョブを作成します
          </p>
        </div>
      </div>

      <div
        className="grid items-start gap-4 px-6 py-4"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}
      >
        <SearchForm onPreviewChange={setPreview} />

        <div className="flex flex-col gap-3.5">
          <div
            className="rounded-[4px]"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--rule)",
            }}
          >
            <PanelHeader title="検索プレビュー" sub="QUERIES TO RUN" />
            <div
              className="mono overflow-auto"
              style={{ maxHeight: 280, fontSize: 11 }}
            >
              {preview.length === 0 ? (
                <div
                  className="px-3.5 py-3 text-center"
                  style={{ color: "var(--ink-3)", fontSize: 11 }}
                >
                  キーワード・エリアを入力するとここに表示
                </div>
              ) : (
                preview.map((q, i) => (
                  <div
                    key={i}
                    className="flex justify-between"
                    style={{
                      padding: "5px 14px",
                      borderBottom: "1px solid var(--rule-soft)",
                      color: "var(--ink)",
                    }}
                  >
                    <span>
                      <span
                        style={{ color: "var(--ink-3)", marginRight: 8 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {q}
                    </span>
                    <span style={{ color: "var(--ink-3)" }}>queued</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-[4px]"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--rule)",
            }}
          >
            <PanelHeader title="直近のジョブ" sub="RECENT" />
            {recentJobs.length === 0 ? (
              <div
                className="py-6 text-center"
                style={{ color: "var(--ink-3)", fontSize: 11.5 }}
              >
                まだジョブがありません
              </div>
            ) : (
              recentJobs.map((job, i) => {
                const locations = JSON.parse(job.locationsJson) as {
                  name: string;
                }[];
                const date = new Date(job.createdAt).toLocaleString("ja-JP", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block"
                  >
                    <RecentRow
                      name={`${job.keyword} (${locations
                        .slice(0, 2)
                        .map((l) => l.name)
                        .join(", ")}${
                        locations.length > 2 ? "..." : ""
                      })`}
                      date={date}
                      count={job.totalResults || 0}
                      status={STATUS_LABELS[job.status] || job.status}
                      statusKey={job.status}
                      last={i === recentJobs.length - 1}
                    />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function RecentRow({
  name,
  date,
  count,
  status,
  statusKey,
  last,
}: {
  name: string;
  date: string;
  count: number;
  status: string;
  statusKey: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "8px 14px",
        borderBottom: last ? "none" : "1px solid var(--rule-soft)",
        fontSize: 12,
      }}
    >
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{ fontWeight: 600, color: "var(--ink)" }}
        >
          {name}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            marginTop: 1,
          }}
        >
          {date}
        </div>
      </div>
      <div className="ml-2 flex items-center gap-2.5">
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink)", fontWeight: 700 }}
        >
          {count}
        </span>
        <span className={`status-chip ${statusKey}`}>{status}</span>
      </div>
    </div>
  );
}
