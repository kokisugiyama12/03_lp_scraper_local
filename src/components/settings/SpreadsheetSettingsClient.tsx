"use client";

import { useEffect, useState } from "react";

interface AuthStatus {
  authenticated: boolean;
  email?: string;
  needsRefresh?: boolean;
}

export default function SpreadsheetSettingsClient() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" });
      const data = (await res.json()) as AuthStatus;
      setAuth(data);
    } catch {
      setAuth({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        if (cancelled) return;
        const data = (await res.json()) as AuthStatus;
        if (cancelled) return;
        setAuth(data);
      } catch {
        if (!cancelled) setAuth({ authenticated: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div
        className="flex items-center justify-between"
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid var(--rule)",
          background: "var(--bg-card)",
        }}
      >
        <div>
          <h1
            className="m-0"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.005em",
            }}
          >
            Spreadsheet連携
          </h1>
          <p
            className="m-0 mt-[3px]"
            style={{ fontSize: 11.5, color: "var(--ink-2)" }}
          >
            Google Spreadsheetへエクスポートするためのアカウント連携
          </p>
        </div>
      </div>

      <div className="px-6 py-4">
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
            maxWidth: 720,
          }}
        >
          <PanelHeader title="Google認証" sub="OAUTH" />
          <div className="px-5 py-5">
            {loading && !auth && (
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                確認中...
              </div>
            )}

            {auth && auth.authenticated && (
              <AuthenticatedView auth={auth} onChanged={refresh} />
            )}

            {auth && !auth.authenticated && (
              <UnauthenticatedView />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AuthenticatedView({
  auth,
  onChanged,
}: {
  auth: AuthStatus;
  onChanged: () => void;
}) {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!confirm("Google認証を解除しますか？再度エクスポートする際は再認証が必要です。"))
      return;
    setRevoking(true);
    try {
      await fetch("/api/auth/google", { method: "DELETE" });
    } catch {
      // ignore
    } finally {
      setRevoking(false);
      onChanged();
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className="mono flex items-center gap-2"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--success)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--success)",
            boxShadow: "0 0 8px var(--success)",
            display: "inline-block",
          }}
        />
        AUTHENTICATED
      </div>
      <div className="flex-1 space-y-1">
        <KV label="Email" value={auth.email || "—"} />
        <KV label="Status" value="アクセストークン有効" />
        {auth.needsRefresh && (
          <KV label="Note" value="次回利用時にリフレッシュされます" />
        )}
        <p
          style={{
            fontSize: 11.5,
            color: "var(--ink-2)",
            margin: "10px 0 0",
          }}
        >
          ジョブ完了画面の「Spreadsheet出力」ボタンからスプレッドシートに書き込めます。
        </p>
        <div className="pt-2">
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="cursor-pointer disabled:opacity-50"
            style={{
              padding: "6px 12px",
              border: "1px solid #e6c8c8",
              background: "var(--bg-card)",
              fontSize: 11.5,
              color: "var(--error)",
              borderRadius: 3,
              fontWeight: 500,
            }}
          >
            {revoking ? "処理中..." : "認証を解除"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedView() {
  return (
    <div>
      <div
        className="mono mb-3 flex items-center gap-2"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-2)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--ink-3)",
            display: "inline-block",
          }}
        />
        NOT AUTHENTICATED
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--ink)",
          margin: "0 0 14px",
        }}
      >
        Spreadsheetへの出力にはGoogleアカウントの認証が必要です。下のボタンから認証を開始してください。
      </p>
      <a
        href="/api/auth/google"
        style={{
          display: "inline-block",
          padding: "8px 18px",
          border: "none",
          background: "var(--accent)",
          fontSize: 12.5,
          fontWeight: 700,
          color: "#fff",
          borderRadius: 3,
          textDecoration: "none",
          letterSpacing: "0.04em",
        }}
      >
        Googleアカウントで認証 ▶
      </a>
      <p
        style={{
          fontSize: 10.5,
          color: "var(--ink-3)",
          margin: "14px 0 0",
        }}
      >
        必要な権限: Google Sheets API (https://www.googleapis.com/auth/spreadsheets)
      </p>
    </div>
  );
}

function PanelHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{
        padding: "9px 18px",
        borderBottom: "1px solid var(--rule-soft)",
        background: "var(--bg-sunken)",
      }}
    >
      <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{title}</h3>
      {sub && (
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            color: "var(--ink-3)",
            letterSpacing: "0.14em",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="mono flex"
      style={{ fontSize: 11.5, color: "var(--ink)" }}
    >
      <span
        style={{
          color: "var(--ink-3)",
          width: 90,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
