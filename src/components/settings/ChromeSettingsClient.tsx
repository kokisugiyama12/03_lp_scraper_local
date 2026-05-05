"use client";

import { useEffect, useState } from "react";

interface ChromeStatus {
  connected: boolean;
  browser?: string;
  protocolVersion?: string;
  userAgent?: string;
  error?: string;
}

const LAUNCH_CMD =
  'open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug';

export default function ChromeSettingsClient() {
  const [status, setStatus] = useState<ChromeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const launchChrome = async () => {
    setLaunching(true);
    setLaunchMsg(null);
    try {
      const res = await fetch("/api/system/chrome/launch", {
        method: "POST",
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setLaunchMsg(data);
      if (data.ok) {
        // refresh status
        await refresh();
      }
    } catch {
      setLaunchMsg({ ok: false, message: "起動に失敗しました" });
    } finally {
      setLaunching(false);
    }
  };

  const refresh = async () => {
    try {
      const res = await fetch("/api/system/chrome", { cache: "no-store" });
      const data = (await res.json()) as ChromeStatus;
      setStatus(data);
      setLoading(false);
    } catch {
      setStatus({ connected: false, error: "fetch failed" });
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/system/chrome", { cache: "no-store" });
        if (cancelled) return;
        const data = (await res.json()) as ChromeStatus;
        if (cancelled) return;
        setStatus(data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setStatus({ connected: false, error: "fetch failed" });
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LAUNCH_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
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
            Chrome接続設定
          </h1>
          <p
            className="m-0 mt-[3px]"
            style={{ fontSize: 11.5, color: "var(--ink-2)" }}
          >
            ローカルChromeのリモートデバッグ接続 (CDP, port 9222) の状態
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            void refresh();
          }}
          disabled={loading}
          className="cursor-pointer disabled:opacity-50"
          style={{
            padding: "6px 12px",
            border: "1px solid var(--rule)",
            background: "var(--bg-card)",
            fontSize: 11.5,
            color: "var(--ink)",
            borderRadius: 3,
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}
        >
          {loading ? "確認中..." : "再確認"}
        </button>
      </div>

      <div className="grid gap-4 px-6 py-4">
        {/* Status panel */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
          }}
        >
          <PanelHeader title="接続状態" sub="STATUS" />
          <div className="px-5 py-5">
            {loading && !status && (
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                確認中...
              </div>
            )}
            {status && (
              <div className="flex items-start gap-4">
                <div
                  className="mono flex items-center gap-2"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: status.connected
                      ? "var(--success)"
                      : "var(--error)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: status.connected
                        ? "var(--success)"
                        : "var(--error)",
                      boxShadow: status.connected
                        ? "0 0 8px var(--success)"
                        : "none",
                      display: "inline-block",
                    }}
                  />
                  {status.connected ? "CONNECTED" : "DISCONNECTED"}
                </div>
                <div className="flex-1">
                  {status.connected ? (
                    <div className="space-y-1">
                      <KV label="Browser" value={status.browser || "—"} />
                      <KV
                        label="Protocol"
                        value={status.protocolVersion || "—"}
                      />
                      <KV label="Endpoint" value="http://localhost:9222" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--ink)",
                          margin: 0,
                        }}
                      >
                        Chromeに接続できません。下のボタンで起動できます。
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={launchChrome}
                          disabled={launching}
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
                          {launching ? "起動中..." : "Chrome起動 ▶"}
                        </button>
                        {launchMsg && (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: launchMsg.ok
                                ? "var(--success)"
                                : "var(--error)",
                            }}
                          >
                            {launchMsg.message}
                          </span>
                        )}
                      </div>
                      {status.error && (
                        <p
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            color: "var(--ink-3)",
                            margin: "4px 0 0",
                          }}
                        >
                          {status.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Launch command */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
          }}
        >
          <PanelHeader title="Chrome起動コマンド (手動)" sub="LAUNCH" />
          <div className="px-5 py-4">
            <p
              style={{
                fontSize: 11.5,
                color: "var(--ink-2)",
                margin: "0 0 10px",
              }}
            >
              「Chrome起動」ボタンが動かない場合、ターミナルで以下のコマンドを実行してください。通常のChromeとは別プロファイル
              ({" "}
              <code
                className="mono"
                style={{ fontSize: 10.5, color: "var(--ink-3)" }}
              >
                /tmp/chrome-debug
              </code>{" "}
              ) で動作します。
            </p>
            <div className="flex items-stretch gap-2">
              <code
                className="mono flex-1 overflow-auto"
                style={{
                  display: "block",
                  padding: "10px 12px",
                  background: "#0d1b2e",
                  color: "#cad4e6",
                  fontSize: 11,
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {LAUNCH_CMD}
              </code>
              <button
                onClick={handleCopy}
                className="cursor-pointer"
                style={{
                  padding: "0 14px",
                  border: "1px solid var(--rule)",
                  background: copied ? "var(--success-soft)" : "var(--bg-card)",
                  color: copied ? "var(--success)" : "var(--ink)",
                  fontSize: 11.5,
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {copied ? "✓ コピー済" : "コピー"}
              </button>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
          }}
        >
          <PanelHeader title="トラブルシューティング" sub="HELP" />
          <div className="px-5 py-4">
            <ul
              className="space-y-2"
              style={{ fontSize: 11.5, color: "var(--ink)", paddingLeft: 18 }}
            >
              <li>
                Chromeをすでに起動している場合は、いったん完全終了してから上記コマンドで起動し直してください
              </li>
              <li>
                ポート9222が他プロセスで使用中の場合: ターミナルで{" "}
                <code className="mono" style={{ fontSize: 10.5 }}>
                  lsof -i :9222
                </code>{" "}
                を実行してプロセスを確認
              </li>
              <li>
                Googleログインが必要なサイトで使う場合は、起動した別プロファイルChromeで一度ログインしてください
              </li>
              <li>
                クラウド/サーバー環境ではGoogleが広告を返さないため動作しません。必ずローカルマシンで使用してください
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
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
