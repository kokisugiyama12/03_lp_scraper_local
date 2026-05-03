"use client";

interface SpreadsheetInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SpreadsheetInput({
  value,
  onChange,
}: SpreadsheetInputProps) {
  return (
    <div>
      <label
        className="mb-1 block text-sm font-medium"
        style={{ color: "var(--ink-2)" }}
      >
        Google SpreadsheetのURL（任意）
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/..."
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
        style={{
          borderColor: "var(--rule)",
          background: "var(--bg-card)",
          color: "var(--ink)",
        }}
      />
      <p className="mt-1 text-xs" style={{ color: "var(--ink-4)" }}>
        検索完了後にエクスポートすることもできます
      </p>
    </div>
  );
}
