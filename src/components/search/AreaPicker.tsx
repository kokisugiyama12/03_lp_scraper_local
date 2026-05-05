"use client";

import { AREA_GROUPS } from "@/lib/config/areas";
import type { SelectedLocation } from "@/types/location";

interface AreaPickerProps {
  selected: SelectedLocation[];
  onToggle: (location: SelectedLocation) => void;
}

export default function AreaPicker({ selected, onToggle }: AreaPickerProps) {
  const selectedIds = new Set(selected.map((s) => s.id));

  return (
    <div className="space-y-4">
      {AREA_GROUPS.map((group) => (
        <div key={group.region}>
          <div className="mb-2 flex items-center gap-2">
            <h3
              className="text-sm font-bold"
              style={{ color: "var(--ink-2)" }}
            >
              {group.region}
            </h3>
            <button
              type="button"
              className="text-xs underline"
              style={{ color: "var(--accent)" }}
              onClick={() => {
                const allSelected = group.areas.every((a) =>
                  selectedIds.has(a.id)
                );
                group.areas.forEach((area) => {
                  const isSelected = selectedIds.has(area.id);
                  if (allSelected ? isSelected : !isSelected) {
                    onToggle({ id: area.id, name: area.name, type: "area" });
                  }
                });
              }}
            >
              {group.areas.every((a) => selectedIds.has(a.id))
                ? "全解除"
                : "全選択"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.areas.map((area) => {
              const isSelected = selectedIds.has(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  className="rounded-[3px] border px-3 py-1.5 text-sm transition-colors"
                  style={{
                    borderColor: isSelected
                      ? "var(--accent)"
                      : "var(--rule)",
                    background: isSelected
                      ? "var(--accent-soft)"
                      : "var(--bg-card)",
                    color: isSelected ? "var(--accent)" : "var(--ink-2)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onClick={() =>
                    onToggle({ id: area.id, name: area.name, type: "area" })
                  }
                >
                  {area.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
