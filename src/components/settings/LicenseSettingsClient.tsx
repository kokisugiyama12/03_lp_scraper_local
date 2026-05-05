"use client";

import { useEffect, useState } from "react";

interface LicenseInfo {
  apiBase: string | null;
  licenseConfigured: boolean;
  licenseMasked: string | null;
}

interface PingResult {
  ok: boolean;
  reason?: string;
  status?: number;
  latencyMs?: number;
  message?: string;
  usage?: { remaining?: number; limit?: number } | null;
}

export default function LicenseSettingsClient() {
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/system/license", { cache: "no-store" });
        if (cancelled) return;
        const data = (await res.json()) as LicenseInfo;
        if (cancelled) return;
        setInfo(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setInfo({
            apiBase: null,
            licenseConfigured: false,
            licenseMasked: null,
          });
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runPing = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch("/api/system/license", { method: "POST" });
      const data = (await res.json()) as PingResult;
      setPingResult(data);
    } catch {
      setPingResult({
        ok: false,
        reason: "fetch_failed",
        message: "リクエスト送信に失敗しました",
      });
    } finally {
      setPinging(false);
    }
  };

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
            API / ライセンス
          </h1>
          <p
            className="m-0 mt-[3px]"
            style={{ fontSize: 11.5, color: "var(--ink-2)" }}
          >
            AI抽出バックエンドへの接続情報とライセンスキー
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-4">
        {/* Connection info */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
            maxWidth: 880,
          }}
        >
          <PanelHeader title="接続情報" sub="PARAMETERS" />
          <div className="px-5 py-5 space-y-2">
            {loading && (
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                読み込み中...
              </div>
            )}
            {info && (
              <>
                <KV
                  label="Backend URL"
                  value={info.apiBase || "(未設定)"}
                  warning={!info.apiBase}
                />
                <KV
                  label="License Key"
                  value={
                    info.licenseConfigured
                      ? info.licenseMasked || ""
                      : "(未設定)"
                  }
                  warning={!info.licenseConfigured}
                />
              </>
            )}
          </div>
        </div>

        {/* Ping test */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
            maxWidth: 880,
          }}
        >
          <PanelHeader title="接続テスト" sub="HEALTH CHECK" />
          <div className="px-5 py-5">
            <p
              style={{
                fontSize: 11.5,
                color: "var(--ink-2)",
                margin: "0 0 12px",
              }}
            >
              バックエンドに小さなリクエストを送って、接続とライセンスの有効性を検証します。
              <span style={{ color: "var(--ink-3)" }}>
                (1リクエスト分の利用量を消費します)
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={runPing}
                disabled={pinging || !info?.apiBase || !info?.licenseConfigured}
                className="cursor-pointer disabled:opacity-50"
                style={{
                  padding: "7px 18px",
                  border: "none",
                  background: "var(--accent)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#fff",
                  borderRadius: 3,
                  letterSpacing: "0.04em",
                }}
              >
                {pinging ? "テスト中..." : "接続テスト実行 ▶"}
              </button>
              {pingResult && <PingResultDisplay result={pingResult} />}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function PingResultDisplay({ result }: { result: PingResult }) {
  const color = result.ok ? "var(--success)" : "var(--error)";
  const bg = result.ok ? "var(--success-soft)" : "var(--error-soft)";
  return (
    <div
      className="flex flex-1 items-center gap-3 rounded-[3px]"
      style={{
        padding: "8px 12px",
        background: bg,
        border: `1px solid ${color}`,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          letterSpacing: "0.06em",
        }}
      >
        {result.ok ? "✓ OK" : "✗ FAIL"}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--ink)",
          flex: 1,
        }}
      >
        {result.message || (result.ok ? "接続成功" : "接続失敗")}
      </span>
      <span
        className="mono"
        style={{ fontSize: 10.5, color: "var(--ink-3)" }}
      >
        {result.status ? `HTTP ${result.status}` : ""}
        {result.status && result.latencyMs !== undefined ? " · " : ""}
        {result.latencyMs !== undefined ? `${result.latencyMs}ms` : ""}
        {result.usage?.remaining !== undefined &&
        result.usage?.limit !== undefined
          ? ` · ${result.usage.remaining}/${result.usage.limit}`
          : ""}
      </span>
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

function KV({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className="mono flex"
      style={{ fontSize: 11.5, color: "var(--ink)" }}
    >
      <span
        style={{
          color: "var(--ink-3)",
          width: 120,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        className="break-all"
        style={{
          fontWeight: 600,
          color: warning ? "var(--warning)" : "var(--ink)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
