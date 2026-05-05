"use client";

import { PREFECTURE_GROUPS } from "@/lib/config/prefectures";
import type { SelectedLocation } from "@/types/location";

interface PrefecturePickerProps {
  selected: SelectedLocation[];
  onToggle: (location: SelectedLocation) => void;
}

export default function PrefecturePicker({
  selected,
  onToggle,
}: PrefecturePickerProps) {
  const selectedIds = new Set(selected.map((s) => s.id));

  return (
    <div className="space-y-5">
      {PREFECTURE_GROUPS.map((group) => {
        const prefs = group.prefectures.filter((p) => !p.isCity);
        const cities = group.prefectures.filter((p) => p.isCity);
        const allIds = group.prefectures.map((p) => p.id);
        const allSelected = allIds.every((id) => selectedIds.has(id));

        return (
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
                  group.prefectures.forEach((pref) => {
                    const isSelected = selectedIds.has(pref.id);
                    if (allSelected ? isSelected : !isSelected) {
                      onToggle({
                        id: pref.id,
                        name: pref.name,
                        type: "prefecture",
                        lat: pref.lat,
                        lng: pref.lng,
                      });
                    }
                  });
                }}
              >
                {allSelected ? "全解除" : "全選択"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {prefs.map((pref) => {
                const isSelected = selectedIds.has(pref.id);
                return (
                  <button
                    key={pref.id}
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
                      onToggle({
                        id: pref.id,
                        name: pref.name,
                        type: "prefecture",
                        lat: pref.lat,
                        lng: pref.lng,
                      })
                    }
                  >
                    {pref.name}
                  </button>
                );
              })}
            </div>

            {cities.length > 0 && (
              <div className="mt-1.5 ml-3 flex flex-wrap gap-1.5">
                <span
                  className="self-center text-xs"
                  style={{ color: "var(--ink-4)" }}
                >
                  主要都市:
                </span>
                {cities.map((city) => {
                  const isSelected = selectedIds.has(city.id);
                  return (
                    <button
                      key={city.id}
                      type="button"
                      className="rounded-[3px] border px-2.5 py-1 text-xs transition-colors"
                      style={{
                        borderColor: isSelected
                          ? "var(--accent)"
                          : "var(--rule)",
                        background: isSelected
                          ? "var(--accent-soft)"
                          : "transparent",
                        color: isSelected ? "var(--accent)" : "var(--ink-3)",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                      onClick={() =>
                        onToggle({
                          id: city.id,
                          name: city.name,
                          type: "prefecture",
                          lat: city.lat,
                          lng: city.lng,
                        })
                      }
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
