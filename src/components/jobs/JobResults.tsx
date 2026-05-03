"use client";

interface ResultRow {
  locationName: string;
  adUrl: string;
  landingUrl?: string;
  companyName?: string | null;
  phoneNumber?: string | null;
  presidentName?: string | null;
  adHeadline?: string | null;
  extractionStatus?: string;
}

export default function JobResults({ results }: { results: ResultRow[] }) {
  if (results.length === 0) {
    return (
      <div
        className="rounded-lg border p-6 text-center text-sm"
        style={{
          borderColor: "var(--rule-soft)",
          color: "var(--ink-4)",
          background: "var(--bg-card)",
        }}
      >
        まだ結果がありません
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: "var(--rule)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-sunken)" }}>
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              エリア
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              会社名
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              電話番号
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              代表者名
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              URL
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={i}
              className="border-t"
              style={{
                borderColor: "var(--rule-soft)",
                background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)",
              }}
            >
              <td className="whitespace-nowrap px-3 py-2">{r.locationName}</td>
              <td className="px-3 py-2">{r.companyName || "-"}</td>
              <td className="whitespace-nowrap px-3 py-2 num">
                {r.phoneNumber || "-"}
              </td>
              <td className="px-3 py-2">{r.presidentName || "-"}</td>
              <td className="max-w-48 truncate px-3 py-2">
                <a
                  href={r.landingUrl || r.adUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--accent)" }}
                >
                  {truncateUrl(r.landingUrl || r.adUrl)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url.slice(0, 40);
  }
}
