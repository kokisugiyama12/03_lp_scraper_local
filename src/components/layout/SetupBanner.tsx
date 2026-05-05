import Link from "next/link";

interface SetupBannerProps {
  missingApiBase?: boolean;
  missingLicense?: boolean;
  chromeMissing?: boolean;
}

export default function SetupBanner({
  missingApiBase,
  missingLicense,
}: SetupBannerProps) {
  const items: { label: string; href: string }[] = [];
  if (missingApiBase || missingLicense) {
    items.push({ label: "ライセンスキー / Backend URL", href: "/settings/license" });
  }

  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: "12px 24px",
        background: "var(--warning-soft)",
        borderBottom: "1px solid var(--warning)",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--warning)",
          letterSpacing: "0.1em",
        }}
      >
        SETUP REQUIRED
      </span>
      <span style={{ fontSize: 12, color: "var(--ink)" }}>
        利用前に設定が必要です:
      </span>
      {items.map((it, i) => (
        <Link
          key={i}
          href={it.href}
          className="hover:underline"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          {it.label} を設定 →
        </Link>
      ))}
    </div>
  );
}
