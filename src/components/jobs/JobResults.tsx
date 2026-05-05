"use client";

import { useMemo, useState } from "react";
import {
  getAreaCodePrefectures,
  isTollFree,
} from "@/lib/config/area-codes";

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

type FilterKey = "all" | "areaCodeOnly" | "noFreedial" | "uniqueDomain";

export default function JobResults({ results }: { results: ResultRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    let rows = results;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.companyName || "").toLowerCase().includes(q) ||
          (r.phoneNumber || "").includes(q) ||
          (r.landingUrl || r.adUrl).toLowerCase().includes(q) ||
          (r.presidentName || "").toLowerCase().includes(q)
      );
    }
    if (filter === "areaCodeOnly") {
      rows = rows.filter(
        (r) => r.phoneNumber && !isTollFree(r.phoneNumber)
      );
    } else if (filter === "noFreedial") {
      rows = rows.filter(
        (r) => !r.phoneNumber || !isTollFree(r.phoneNumber)
      );
    } else if (filter === "uniqueDomain") {
      const seen = new Set<string>();
      rows = rows.filter((r) => {
        const host = hostname(r.landingUrl || r.adUrl);
        if (seen.has(host)) return false;
        seen.add(host);
        return true;
      });
    }
    return rows;
  }, [results, search, filter]);

  if (results.length === 0) {
    return (
      <div className="px-6 py-4">
        <div
          className="rounded-[4px] py-12 text-center text-sm"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
            color: "var(--ink-3)",
          }}
        >
          まだ結果がありません
        </div>
      </div>
    );
  }

  const stats = computeStats(results);

  return (
    <>
      {/* Stats */}
      <div
        className="flex"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <StatCell
          label="取得件数"
          value={String(stats.total)}
          delta={`+${stats.total}`}
          positive
        />
        <StatCell
          label="ユニーク社"
          value={String(stats.uniqueCompanies)}
          delta={
            stats.total > 0
              ? `${Math.round((stats.uniqueCompanies / stats.total) * 100)}%`
              : "—"
          }
          sub="dedup ratio"
        />
        <StatCell
          label="連絡先取得"
          value={`${Math.round(
            stats.total > 0 ? (stats.withPhone / stats.total) * 100 : 0
          )}%`}
          delta={`${stats.withPhone}/${stats.total}`}
          positive={stats.withPhone === stats.total}
        />
        <StatCell
          label="代表者抽出"
          value={`${Math.round(
            stats.total > 0 ? (stats.withPresident / stats.total) * 100 : 0
          )}%`}
          delta={`${stats.withPresident}/${stats.total}`}
        />
        <StatCell
          label="フリーダイヤル比率"
          value={`${Math.round(
            stats.total > 0 ? (stats.freedial / stats.total) * 100 : 0
          )}%`}
          delta={`${stats.freedial}/${stats.total}`}
          warning={stats.freedial > stats.total * 0.5}
        />
        <StatCell
          label="ユニークドメイン"
          value={String(stats.uniqueDomains)}
          delta={
            stats.total > 0
              ? `${Math.round((stats.uniqueDomains / stats.total) * 100)}%`
              : "—"
          }
          sub="domains"
          last
        />
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: "10px 24px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{
            padding: "4px 8px",
            border: "1px solid var(--rule)",
            borderRadius: 3,
            background: "var(--bg-sunken)",
            width: 240,
          }}
        >
          <span style={{ color: "var(--ink-3)", fontSize: 12 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="絞り込み (会社名, URL, 番号)"
            className="flex-1 bg-transparent outline-none"
            style={{
              border: "none",
              fontSize: 12,
              fontFamily: "var(--font-body)",
              color: "var(--ink)",
              padding: "2px 0",
            }}
          />
        </div>
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          すべて ({results.length})
        </FilterChip>
        <FilterChip
          active={filter === "areaCodeOnly"}
          onClick={() => setFilter("areaCodeOnly")}
        >
          固定電話のみ
        </FilterChip>
        <FilterChip
          active={filter === "noFreedial"}
          onClick={() => setFilter("noFreedial")}
        >
          フリーダイヤル除外
        </FilterChip>
        <FilterChip
          active={filter === "uniqueDomain"}
          onClick={() => setFilter("uniqueDomain")}
        >
          ドメイン重複排除
        </FilterChip>
        <div className="flex-1" />
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-3)" }}
        >
          {filtered.length} / {results.length} rows
        </span>
      </div>

      {/* Table */}
      <div
        className="flex-1 overflow-auto"
        style={{ padding: "0 24px 24px" }}
      >
        <table
          className="w-full"
          style={{
            borderCollapse: "collapse",
            fontSize: 12,
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
          }}
        >
          <thead
            className="sticky top-0 z-10"
            style={{ background: "var(--bg-sunken)" }}
          >
            <tr style={{ borderBottom: "1px solid var(--rule)" }}>
              <Th w={36} center>
                #
              </Th>
              <Th w={80}>エリア</Th>
              <Th>会社名</Th>
              <Th w={130}>電話番号</Th>
              <Th w={100}>市外局番</Th>
              <Th w={120}>代表者</Th>
              <Th>URL</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid var(--rule-soft)" }}
              >
                <Td center muted mono>
                  {String(i + 1).padStart(2, "0")}
                </Td>
                <Td>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: "1px 6px",
                      borderRadius: 2,
                      background: "var(--bg-sunken)",
                      border: "1px solid var(--rule)",
                      color: "var(--ink-2)",
                      fontWeight: 600,
                    }}
                  >
                    {r.locationName}
                  </span>
                </Td>
                <Td strong>{r.companyName || "-"}</Td>
                <Td mono>{r.phoneNumber || "-"}</Td>
                <Td>
                  <RegionTag phone={r.phoneNumber || ""} />
                </Td>
                <Td>{r.presidentName || "-"}</Td>
                <Td>
                  <a
                    href={r.landingUrl || r.adUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono"
                    style={{
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontSize: 11.5,
                    }}
                  >
                    {truncateUrl(r.landingUrl || r.adUrl)} ↗
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function computeStats(results: ResultRow[]) {
  const total = results.length;
  const companies = new Set<string>();
  const domains = new Set<string>();
  let withPhone = 0;
  let withPresident = 0;
  let freedial = 0;
  for (const r of results) {
    if (r.companyName) companies.add(r.companyName);
    domains.add(hostname(r.landingUrl || r.adUrl));
    if (r.phoneNumber) {
      withPhone++;
      if (isTollFree(r.phoneNumber)) freedial++;
    }
    if (r.presidentName) withPresident++;
  }
  return {
    total,
    uniqueCompanies: companies.size,
    uniqueDomains: domains.size,
    withPhone,
    withPresident,
    freedial,
  };
}

function StatCell({
  label,
  value,
  delta,
  sub,
  positive,
  warning,
  last,
}: {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  positive?: boolean;
  warning?: boolean;
  last?: boolean;
}) {
  const deltaColor = positive
    ? "var(--success)"
    : warning
      ? "var(--warning)"
      : "var(--ink-2)";
  return (
    <div
      className="flex-1"
      style={{
        padding: "12px 18px",
        borderRight: last ? "none" : "1px solid var(--rule-soft)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: "var(--ink-2)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="mono"
            style={{ fontSize: 11, color: deltaColor, fontWeight: 600 }}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
        padding: "4px 10px",
        border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
        background: active ? "var(--accent-soft)" : "var(--bg-card)",
        color: active ? "var(--accent)" : "var(--ink-2)",
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 3,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

const REGION_COLORS: Record<string, { bg: string; fg: string }> = {
  freedial: { bg: "#fdf6e3", fg: "#876915" },
  tokyo: { bg: "#f0eaf5", fg: "#52297a" },
  osaka: { bg: "#fde8e8", fg: "#86323a" },
  fukuoka: { bg: "#e8f0fb", fg: "#1e3a5f" },
  chiba: { bg: "#eef4e8", fg: "#3a5a1f" },
  kanagawa: { bg: "#e8f4f4", fg: "#1f5a5a" },
  saitama: { bg: "#fdf0e8", fg: "#864e1f" },
  aichi: { bg: "#f4ebe0", fg: "#5a3f1f" },
  hokkaido: { bg: "#e8eef8", fg: "#1f3a6a" },
  unknown: { bg: "#eee", fg: "#555" },
};

function RegionTag({ phone }: { phone: string }) {
  if (!phone) return <span style={{ color: "var(--ink-3)" }}>—</span>;
  let tag = "unknown";
  if (isTollFree(phone)) {
    tag = "freedial";
  } else {
    const prefs = getAreaCodePrefectures(phone);
    if (prefs.length > 0) tag = prefs[0];
  }
  const c = REGION_COLORS[tag] || REGION_COLORS.unknown;
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 2,
        background: c.bg,
        color: c.fg,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {tag}
    </span>
  );
}

function Th({
  children,
  w,
  center,
}: {
  children?: React.ReactNode;
  w?: number;
  center?: boolean;
}) {
  return (
    <th
      style={{
        textAlign: center ? "center" : "left",
        padding: "7px 10px",
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--ink-2)",
        letterSpacing: "0.06em",
        width: w,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  center,
  muted,
  strong,
  mono,
}: {
  children: React.ReactNode;
  center?: boolean;
  muted?: boolean;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "7px 10px",
        textAlign: center ? "center" : "left",
        color: muted ? "var(--ink-3)" : "var(--ink)",
        fontWeight: strong ? 600 : 400,
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        fontSize: mono ? 11.5 : 12,
      }}
    >
      {children}
    </td>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + (u.pathname !== "/" ? u.pathname : "")).slice(0, 50);
  } catch {
    return url.slice(0, 40);
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
