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
    <div className="space-y-3">
      <div>
        <div
          className="flex w-fit overflow-hidden"
          style={{
            border: "1px solid var(--rule)",
            borderRadius: 3,
          }}
        >
          <SegBtn active={mode === "keyword"} onClick={() => setMode("keyword")}>
            キーワード地名検索
          </SegBtn>
          <SegBtn active={mode === "geo"} onClick={() => setMode("geo")}>
            位置情報エミュレート
          </SegBtn>
        </div>
        <p className="mt-1.5" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {mode === "keyword"
            ? "クエリに地名を追加して検索（例: 美容院 渋谷駅）"
            : "X-Geoヘッダーで位置をエミュレートしてその地域の広告を取得"}
        </p>
      </div>

      {selected.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-[3px] p-2"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--rule)",
          }}
        >
          {selected.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11.5px] font-medium"
              style={{
                background: "var(--bg-card)",
                color: "var(--accent)",
                border: "1px solid var(--rule)",
                borderRadius: 2,
              }}
            >
              {loc.name}
              <button
                type="button"
                className="ml-0.5 cursor-pointer text-xs opacity-60 hover:opacity-100"
                onClick={() => onToggle(loc)}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs underline"
            style={{ color: "var(--error)", marginLeft: 4 }}
          >
            すべてクリア
          </button>
        </div>
      )}

      <div
        className="overflow-hidden rounded-[3px]"
        style={{
          border: "1px solid var(--rule)",
          background: "var(--bg-sunken)",
        }}
      >
        <div
          className="flex"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--rule-soft)",
          }}
        >
          {mode === "keyword" ? (
            <>
              <SubTab
                active={keywordTab === "train"}
                onClick={() => setKeywordTab("train")}
              >
                路線
              </SubTab>
              <SubTab
                active={keywordTab === "area"}
                onClick={() => setKeywordTab("area")}
              >
                エリア
              </SubTab>
            </>
          ) : (
            <SubTab active>都道府県</SubTab>
          )}
          <div className="flex-1" />
          <div
            className="mono self-center"
            style={{
              padding: "6px 12px",
              fontSize: 10.5,
              color: "var(--ink-2)",
            }}
          >
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>
              {(mode === "keyword" ? keywordLocations : geoLocations).length}
            </strong>{" "}
            selected
          </div>
        </div>
        <div
          className="overflow-y-auto px-3 py-3"
          style={{ maxHeight: 280, background: "var(--bg-card)" }}
        >
          {mode === "keyword" && keywordTab === "train" && (
            <TrainLinePicker selected={selected} onToggle={onToggle} />
          )}
          {mode === "keyword" && keywordTab === "area" && (
            <AreaPicker selected={selected} onToggle={onToggle} />
          )}
          {mode === "geo" && (
            <PrefecturePicker selected={selected} onToggle={onToggle} />
          )}
        </div>
      </div>
    </div>
  );
}

function SegBtn({
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
        padding: "5px 14px",
        border: "none",
        background: active ? "var(--accent)" : "var(--bg-card)",
        color: active ? "#fff" : "var(--ink-2)",
        fontSize: 11.5,
        fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

function SubTab({
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
        padding: "7px 14px",
        border: "none",
        background: "transparent",
        color: active ? "var(--ink)" : "var(--ink-2)",
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        fontFamily: "var(--font-body)",
        borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}
