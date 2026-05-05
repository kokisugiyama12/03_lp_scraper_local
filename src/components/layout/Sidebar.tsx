"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  jobsCount?: number;
  hasRunning?: boolean;
}

export default function Sidebar({ jobsCount = 0, hasRunning = false }: SidebarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isJobsList = pathname === "/jobs";
  const isJobDetail =
    !!pathname &&
    pathname.startsWith("/jobs/") &&
    pathname !== "/jobs/running";
  const isRunningRoute =
    pathname === "/jobs/running" || (isJobDetail && hasRunning);
  const isJobsHistory = isJobsList || (isJobDetail && !hasRunning);
  const isChromeSettings = pathname === "/settings/chrome";
  const isSpreadsheetSettings = pathname === "/settings/spreadsheet";
  const isLicenseSettings = pathname === "/settings/license";

  return (
    <aside
      className="flex flex-shrink-0 flex-col"
      style={{
        width: 208,
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        className="px-4 pb-3.5 pt-3.5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="text-[13px] font-bold tracking-wide" style={{ color: "#fff" }}>
          テレアポリスト
        </div>
        <div
          className="mono mt-[3px] text-[9.5px]"
          style={{ color: "rgba(168,179,199,0.55)", letterSpacing: "0.1em" }}
        >
          v2.4.0 · LOCAL CDP
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-px px-2 py-3">
        <SidebarHeader>WORKSPACE</SidebarHeader>
        <SidebarItem href="/" active={isHome} icon="+">
          新規検索
        </SidebarItem>
        <SidebarItem
          href="/jobs/running"
          active={isRunningRoute}
          icon="●"
          running={hasRunning}
        >
          実行中ジョブ
        </SidebarItem>
        <SidebarItem
          href="/jobs"
          active={isJobsHistory}
          badge={jobsCount > 0 ? String(jobsCount) : undefined}
        >
          ジョブ履歴
        </SidebarItem>

        <SidebarHeader className="mt-3.5">EXPORT</SidebarHeader>
        <SidebarItem
          href="/settings/spreadsheet"
          active={isSpreadsheetSettings}
        >
          Spreadsheet連携
        </SidebarItem>

        <SidebarHeader className="mt-3.5">SYSTEM</SidebarHeader>
        <SidebarItem href="/settings/chrome" active={isChromeSettings}>
          Chrome接続設定
        </SidebarItem>
        <SidebarItem href="/settings/license" active={isLicenseSettings}>
          API / ライセンス
        </SidebarItem>
      </nav>

      <div
        className="flex flex-col gap-[5px] px-3.5 pb-3 pt-2.5 text-[10.5px]"
        style={{
          borderTop: "1px solid var(--sidebar-border)",
          color: "rgba(168,179,199,0.75)",
        }}
      >
        <SysRow label="CDP" value="9222" ok />
        <SysRow label="API" value="142ms" ok />
        <SysRow label="License" value="tlap_••a3f1" />
      </div>
    </aside>
  );
}

function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-2 pb-1 pt-1.5 text-[9.5px] font-bold ${className || ""}`}
      style={{
        color: "rgba(168,179,199,0.45)",
        letterSpacing: "0.16em",
      }}
    >
      {children}
    </div>
  );
}

function SidebarItem({
  href,
  active,
  badge,
  running,
  icon,
  children,
}: {
  href?: string;
  active?: boolean;
  badge?: string;
  running?: boolean;
  icon?: string;
  children: React.ReactNode;
}) {
  const content = (
    <span
      className="relative flex cursor-pointer items-center justify-between rounded-[4px] py-1.5 pl-3 pr-2.5 text-[12.5px]"
      style={{
        color: active ? "#fff" : "var(--sidebar-text)",
        background: active ? "var(--sidebar-active)" : "transparent",
        fontWeight: active ? 600 : 500,
      }}
    >
      {active && (
        <span
          className="absolute"
          style={{
            left: -8,
            top: 6,
            bottom: 6,
            width: 2,
            background: "var(--sidebar-active-bar)",
            borderRadius: 2,
          }}
        />
      )}
      <span className="flex items-center gap-2">
        {icon && (
          <span
            className="mono"
            style={{
              fontSize: 9,
              width: 12,
              color: running ? "#5fd97a" : "rgba(168,179,199,0.5)",
            }}
          >
            {icon}
          </span>
        )}
        {children}
      </span>
      {badge && (
        <span
          className="mono inline-flex items-center justify-center font-semibold"
          style={{
            fontSize: 9.5,
            padding: "0 5px",
            height: 14,
            lineHeight: "14px",
            borderRadius: 7,
            background: "rgba(168,179,199,0.16)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {badge}
        </span>
      )}
    </span>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function SysRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div
      className="mono flex items-center justify-between"
      style={{ fontSize: 10 }}
    >
      <span
        className="flex items-center gap-[5px]"
        style={{ letterSpacing: "0.06em" }}
      >
        <span
          className="inline-block"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: ok ? "#5fd97a" : "rgba(168,179,199,0.3)",
            boxShadow: ok ? "0 0 6px #5fd97a" : "none",
          }}
        />
        {label}
      </span>
      <span style={{ color: ok ? "#fff" : "rgba(168,179,199,0.6)" }}>{value}</span>
    </div>
  );
}
