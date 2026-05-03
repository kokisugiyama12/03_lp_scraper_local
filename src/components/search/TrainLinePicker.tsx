"use client";

import { useState } from "react";
import { TRAIN_LINE_GROUPS } from "@/lib/config/train-lines";
import type { SelectedLocation } from "@/types/location";

interface TrainLinePickerProps {
  selected: SelectedLocation[];
  onToggle: (location: SelectedLocation) => void;
}

export default function TrainLinePicker({
  selected,
  onToggle,
}: TrainLinePickerProps) {
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const selectedIds = new Set(selected.map((s) => s.id));

  return (
    <div className="space-y-4">
      {TRAIN_LINE_GROUPS.map((group) => (
        <div key={group.company}>
          <h3
            className="mb-2 text-sm font-bold"
            style={{ color: "var(--ink-2)" }}
          >
            {group.company}
          </h3>
          <div className="space-y-1">
            {group.lines.map((line) => {
              const isExpanded = expandedLine === line.id;
              const selectedCount = line.stations.filter((s) =>
                selectedIds.has(s.id)
              ).length;
              const allSelected =
                selectedCount === line.stations.length &&
                line.stations.length > 0;

              return (
                <div
                  key={line.id}
                  className="overflow-hidden rounded-lg border"
                  style={{
                    borderColor: selectedCount > 0
                      ? "var(--accent)"
                      : "var(--rule)",
                    background: "var(--bg-card)",
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                    onClick={() =>
                      setExpandedLine(isExpanded ? null : line.id)
                    }
                  >
                    <span className="text-sm font-medium">{line.name}</span>
                    <span className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                          }}
                        >
                          {selectedCount}駅
                        </span>
                      )}
                      <span
                        className="text-xs"
                        style={{ color: "var(--ink-4)" }}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      className="border-t px-3 py-2"
                      style={{ borderColor: "var(--rule-soft)" }}
                    >
                      <div className="mb-2">
                        <button
                          type="button"
                          className="text-xs underline"
                          style={{ color: "var(--accent)" }}
                          onClick={() => {
                            line.stations.forEach((station) => {
                              const isSelected = selectedIds.has(station.id);
                              if (allSelected ? isSelected : !isSelected) {
                                onToggle({
                                  id: station.id,
                                  name: station.name,
                                  type: "station",
                                });
                              }
                            });
                          }}
                        >
                          {allSelected
                            ? "この路線すべて解除"
                            : "この路線すべて選択"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {line.stations.map((station) => {
                          const isSelected = selectedIds.has(station.id);
                          return (
                            <button
                              key={station.id}
                              type="button"
                              className="rounded border px-2 py-1 text-xs transition-colors"
                              style={{
                                borderColor: isSelected
                                  ? "var(--accent)"
                                  : "var(--rule)",
                                background: isSelected
                                  ? "var(--accent-soft)"
                                  : "transparent",
                                color: isSelected
                                  ? "var(--accent)"
                                  : "var(--ink-2)",
                                fontWeight: isSelected ? 600 : 400,
                              }}
                              onClick={() =>
                                onToggle({
                                  id: station.id,
                                  name: station.name,
                                  type: "station",
                                })
                              }
                            >
                              {station.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
