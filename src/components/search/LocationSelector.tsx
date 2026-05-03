"use client";

import { useState } from "react";
import AreaPicker from "./AreaPicker";
import TrainLinePicker from "./TrainLinePicker";
import PrefecturePicker from "./PrefecturePicker";
import type { SelectedLocation } from "@/types/location";

interface LocationSelectorProps {
  selected: SelectedLocation[];
  onToggle: (location: SelectedLocation) => void;
  onClear: () => void;
}

type Mode = "keyword" | "geo";
type KeywordTab = "train" | "area";

export default function LocationSelector({
  selected,
  onToggle,
  onClear,
}: LocationSelectorProps) {
  const [mode, setMode] = useState<Mode>("keyword");
  const [keywordTab, setKeywordTab] = useState<KeywordTab>("train");

  const keywordLocations = selected.filter((l) => l.type !== "prefecture");
  const geoLocations = selected.filter((l) => l.type === "prefecture");

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 rounded-lg border p-2"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent-soft)",
          }}
        >
          {selected.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ background: "var(--bg-card)", color: "var(--accent)" }}
            >
              {loc.type === "prefecture" ? `📍 ${loc.name}` : loc.name}
              <button
                type="button"
                className="ml-0.5 text-xs opacity-60 hover:opacity-100"
                onClick={() => onToggle(loc)}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-xs underline"
            style={{ color: "var(--error)" }}
            onClick={onClear}
          >
            すべてクリア
          </button>
        </div>
      )}

      <div
        className="flex rounded-lg border p-0.5"
        style={{ borderColor: "var(--rule)", background: "var(--bg-sunken)" }}
      >
        {(
          [
            { key: "keyword", label: "キーワードに地名を含めて検索" },
            { key: "geo", label: "位置情報を指定して検索" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: mode === key ? "var(--bg-card)" : "transparent",
              color: mode === key ? "var(--ink)" : "var(--ink-3)",
              boxShadow:
                mode === key ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "keyword" && (
        <div>
          <p className="mb-2 text-xs" style={{ color: "var(--ink-3)" }}>
            選択した駅名・エリア名をキーワードに追加して検索します（例: 「注文住宅 渋谷駅」）
          </p>
          <div className="mb-2 flex gap-1">
            {(
              [
                { key: "train", label: "路線から選ぶ" },
                { key: "area", label: "エリアから選ぶ" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="rounded-md border px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  borderColor:
                    keywordTab === key ? "var(--accent)" : "var(--rule)",
                  background:
                    keywordTab === key
                      ? "var(--accent-soft)"
                      : "var(--bg-card)",
                  color:
                    keywordTab === key ? "var(--accent)" : "var(--ink-3)",
                }}
                onClick={() => setKeywordTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {keywordLocations.length > 0 && (
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
              {keywordLocations.length}件選択中
            </p>
          )}
          <div
            className="max-h-72 overflow-y-auto rounded-lg border p-3"
            style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
          >
            {keywordTab === "train" ? (
              <TrainLinePicker selected={selected} onToggle={onToggle} />
            ) : (
              <AreaPicker selected={selected} onToggle={onToggle} />
            )}
          </div>
        </div>
      )}

      {mode === "geo" && (
        <div>
          <p className="mb-2 text-xs" style={{ color: "var(--ink-3)" }}>
            検索時の位置情報を変更します。キーワードのみで検索し、選択した地域の広告が表示されます
          </p>
          {geoLocations.length > 0 && (
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
              {geoLocations.length}件選択中
            </p>
          )}
          <div
            className="max-h-96 overflow-y-auto rounded-lg border p-3"
            style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
          >
            <PrefecturePicker selected={selected} onToggle={onToggle} />
          </div>
        </div>
      )}
    </div>
  );
}
