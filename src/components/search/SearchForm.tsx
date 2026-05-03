"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationSelector from "./LocationSelector";
import SpreadsheetInput from "./SpreadsheetInput";
import type { SelectedLocation } from "@/types/location";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function SearchForm() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [locations, setLocations] = useState<SelectedLocation[]>([]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [maxPages, setMaxPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleLocation = (location: SelectedLocation) => {
    setLocations((prev) => {
      const exists = prev.find((l) => l.id === location.id);
      if (exists) {
        return prev.filter((l) => l.id !== location.id);
      }
      return [...prev, location];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!keyword.trim()) {
      setError("業種キーワードを入力してください");
      return;
    }
    if (locations.length === 0) {
      setError("検索エリアを1つ以上選択してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const spreadsheetId = spreadsheetUrl
        ? extractSpreadsheetId(spreadsheetUrl)
        : null;

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          locations,
          spreadsheetId,
          maxPages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ジョブの作成に失敗しました");
      }

      const { jobId } = await res.json();
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--ink-2)" }}
        >
          業種キーワード
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="美容院、歯医者、弁護士、整骨院..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
          style={{
            borderColor: "var(--rule)",
            background: "var(--bg-card)",
            color: "var(--ink)",
          }}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--ink-2)" }}
        >
          検索エリア
        </label>
        <LocationSelector
          selected={locations}
          onToggle={handleToggleLocation}
          onClear={() => setLocations([])}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--ink-2)" }}
        >
          検索ページ数
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={5}
            value={maxPages}
            onChange={(e) =>
              setMaxPages(Math.min(Math.max(Number(e.target.value) || 1, 1), 5))
            }
            className="w-20 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--rule)",
              background: "var(--bg-card)",
              color: "var(--ink)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--ink-3)" }}>
            ページ数を増やすと取得できる広告が増えますが、検索時間も長くなります
          </span>
        </div>
      </div>

      <SpreadsheetInput value={spreadsheetUrl} onChange={setSpreadsheetUrl} />

      {error && (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--error-soft)", color: "var(--error)" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
        style={{
          background: isSubmitting
            ? "var(--ink-4)"
            : "var(--accent)",
        }}
      >
        {isSubmitting ? "作成中..." : `検索開始（${locations.length}エリア）`}
      </button>
    </form>
  );
}
