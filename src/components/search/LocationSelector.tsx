"use client";

import { useState } from "react";
import AreaPicker from "./AreaPicker";
import TrainLinePicker from "./TrainLinePicker";
import type { SelectedLocation } from "@/types/location";

interface LocationSelectorProps {
  selected: SelectedLocation[];
  onToggle: (location: SelectedLocation) => void;
  onClear: () => void;
}

type Tab = "area" | "train";

export default function LocationSelector({
  selected,
  onToggle,
  onClear,
}: LocationSelectorProps) {
  const [tab, setTab] = useState<Tab>("train");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex rounded-lg border p-0.5"
          style={{ borderColor: "var(--rule)", background: "var(--bg-sunken)" }}
        >
          {(
            [
              { key: "train", label: "路線から選ぶ" },
              { key: "area", label: "エリアから選ぶ" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background:
                  tab === key ? "var(--bg-card)" : "transparent",
                color: tab === key ? "var(--ink)" : "var(--ink-3)",
                boxShadow:
                  tab === key
                    ? "0 1px 2px rgba(0,0,0,0.08)"
                    : "none",
              }}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            className="text-xs underline"
            style={{ color: "var(--error)" }}
            onClick={onClear}
          >
            すべてクリア ({selected.length})
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div
          className="mb-3 flex flex-wrap gap-1.5 rounded-lg border p-2"
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
              {loc.name}
              <button
                type="button"
                className="ml-0.5 text-xs opacity-60 hover:opacity-100"
                onClick={() => onToggle(loc)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className="max-h-80 overflow-y-auto rounded-lg border p-3"
        style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
      >
        {tab === "train" ? (
          <TrainLinePicker selected={selected} onToggle={onToggle} />
        ) : (
          <AreaPicker selected={selected} onToggle={onToggle} />
        )}
      </div>
    </div>
  );
}
