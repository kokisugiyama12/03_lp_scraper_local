"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LocationSelector from "./LocationSelector";
import type { SelectedLocation } from "@/types/location";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface SearchFormProps {
  onPreviewChange?: (queries: string[]) => void;
}

export default function SearchForm({ onPreviewChange }: SearchFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [locations, setLocations] = useState<SelectedLocation[]>([]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [maxPages, setMaxPages] = useState(1);
  const [extractionDepth, setExtractionDepth] = useState(2);
  const [interSearchDelaySec, setInterSearchDelaySec] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleLocation = (location: SelectedLocation) => {
    setLocations((prev) => {
      const exists = prev.find((l) => l.id === location.id);
      const next = exists
        ? prev.filter((l) => l.id !== location.id)
        : [...prev, location];
      onPreviewChange?.(buildPreview(keyword, next));
      return next;
    });
  };

  const totalQueries = locations.length;
  const { estDurationSec, estApiCalls } = useMemo(() => {
    const adsPerPage = 4;
    const lpStepSec = 5; // LPアクセス + AI抽出 1回
    const deepStepSec = 10 + interSearchDelaySec; // 深掘り1ステップ (AI抽出 + 遅延)
    const perAdSec = lpStepSec + (extractionDepth - 1) * deepStepSec;
    const perQuerySec = 5 + adsPerPage * perAdSec; // 5s = Google検索
    const betweenQueriesSec = 5;
    const total =
      totalQueries * maxPages * perQuerySec +
      Math.max(0, totalQueries - 1) * betweenQueriesSec;
    const apiCalls = totalQueries * maxPages * adsPerPage * extractionDepth;
    return {
      estDurationSec: Math.round(total),
      estApiCalls: Math.round(apiCalls),
    };
  }, [totalQueries, maxPages, extractionDepth, interSearchDelaySec]);

  function formatDuration(s: number) {
    if (s <= 0) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  }

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
          extractionDepth,
          interSearchDelaySec,
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
    <form
      onSubmit={handleSubmit}
      className="rounded-[4px]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--rule)",
      }}
    >
      <PanelHeader title="検索パラメータ" sub="PARAMETERS" />

      <div className="px-5 pb-[18px] pt-4">
        <div
          className="grid items-start"
          style={{
            gridTemplateColumns: "128px 1fr",
            columnGap: 18,
            rowGap: 14,
          }}
        >
          <FormLabel required>業種キーワード</FormLabel>
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              onPreviewChange?.(buildPreview(e.target.value, locations));
            }}
            placeholder="美容院、歯医者、弁護士、整骨院..."
            className="text-input"
            style={inputStyle}
          />

          <FormLabel required>検索エリア</FormLabel>
          <LocationSelector
            selected={locations}
            onToggle={handleToggleLocation}
            onClear={() => {
              setLocations([]);
              onPreviewChange?.([]);
            }}
          />

          <FormLabel>ページ数</FormLabel>
          <div className="flex items-center gap-3">
            <SegPicker
              values={[1, 2, 3, 4, 5]}
              value={maxPages}
              onChange={setMaxPages}
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              1ページあたり最大10広告 · ページ数 × エリア数 = 検索回数
            </span>
          </div>

          <FormLabel>抽出の深さ</FormLabel>
          <div className="flex items-center gap-3">
            <SegPicker
              values={[1, 2, 3, 4, 5]}
              value={extractionDepth}
              onChange={setExtractionDepth}
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {extractionDepth === 1
                ? "1: LP取得のみ (最速、粗め)"
                : `${extractionDepth}: 市外局番が見つかるまで最大${extractionDepth}回まで深掘り`}
            </span>
          </div>

          <FormLabel>深掘り間遅延</FormLabel>
          <div className="flex items-center gap-3">
            <SegPicker
              values={[5, 7, 10, 12, 15]}
              value={interSearchDelaySec}
              onChange={setInterSearchDelaySec}
              suffix="s"
              widthEach={42}
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {interSearchDelaySec >= 10
                ? "10秒以上推奨 (Google bot検知の回避)"
                : "短くすると bot検知のリスクあり"}
            </span>
          </div>

          <FormLabel>Spreadsheet</FormLabel>
          <input
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="text-input"
            style={inputStyle}
          />
        </div>

        {error && (
          <div
            className="mt-3 rounded-[3px] px-3 py-2 text-sm"
            style={{ background: "var(--error-soft)", color: "var(--error)" }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between"
        style={{
          padding: "11px 20px",
          borderTop: "1px solid var(--rule-soft)",
          background: "var(--bg-sunken)",
        }}
      >
        <div
          className="mono flex flex-wrap gap-[18px]"
          style={{ fontSize: 11, color: "var(--ink-2)" }}
        >
          <span>
            queries{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>
              {totalQueries * maxPages}
            </strong>
          </span>
          <span>
            予想実行時間{" "}
            <strong
              style={{
                color:
                  estDurationSec > 1800 ? "var(--warning)" : "var(--ink)",
                fontWeight: 700,
              }}
            >
              {formatDuration(estDurationSec)}
            </strong>
          </span>
          <span>
            API呼出 上限{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>
              ≈ {estApiCalls}
            </strong>
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setLocations([]);
              setSpreadsheetUrl("");
              setMaxPages(1);
              setExtractionDepth(2);
              setInterSearchDelaySec(10);
              setError(null);
              onPreviewChange?.([]);
            }}
            className="cursor-pointer"
            style={ghostButtonStyle}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer disabled:opacity-50"
            style={{
              padding: "7px 18px",
              border: "none",
              background: isSubmitting
                ? "var(--ink-4)"
                : "var(--accent)",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#fff",
              borderRadius: 3,
              fontFamily: "var(--font-body)",
              letterSpacing: "0.04em",
            }}
          >
            {isSubmitting ? "作成中..." : "検索開始 ▶"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SegPicker({
  values,
  value,
  onChange,
  suffix,
  widthEach = 34,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  widthEach?: number;
}) {
  return (
    <div
      className="flex overflow-hidden"
      style={{ border: "1px solid var(--rule)", borderRadius: 3 }}
    >
      {values.map((n, i) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="mono cursor-pointer font-semibold"
          style={{
            width: widthEach,
            height: 26,
            border: "none",
            borderLeft: i === 0 ? "none" : "1px solid var(--rule)",
            background: n === value ? "var(--accent)" : "var(--bg-card)",
            color: n === value ? "#fff" : "var(--ink-2)",
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {n}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function buildPreview(keyword: string, locations: SelectedLocation[]): string[] {
  const k = keyword.trim();
  if (!k || locations.length === 0) return [];
  return locations.map((loc) => {
    if (loc.type === "prefecture") return k;
    return `${k} ${loc.name}`;
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid var(--rule)",
  borderRadius: 3,
  fontSize: 12.5,
  fontFamily: "var(--font-body)",
  background: "var(--bg-sunken)",
  outline: "none",
  color: "var(--ink)",
};

const ghostButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--rule)",
  background: "var(--bg-card)",
  fontSize: 11.5,
  color: "var(--ink)",
  borderRadius: 3,
  fontFamily: "var(--font-body)",
  fontWeight: 500,
};

function FormLabel({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className="flex items-center gap-1"
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--ink)",
        paddingTop: 7,
      }}
    >
      {children}
      {required && (
        <span style={{ color: "var(--error)", fontSize: 10 }}>*</span>
      )}
    </label>
  );
}

export function PanelHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{
        padding: "9px 18px",
        borderBottom: "1px solid var(--rule-soft)",
        background: "var(--bg-sunken)",
      }}
    >
      <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{title}</h3>
      {sub && (
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            color: "var(--ink-3)",
            letterSpacing: "0.14em",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
