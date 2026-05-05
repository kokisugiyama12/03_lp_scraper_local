"use client";

import { useEffect, useState } from "react";

interface LicenseInfo {
  apiBase: string | null;
  licenseConfigured: boolean;
  licenseMasked: string | null;
  apiBaseSource?: "db" | "env" | "none";
  licenseSource?: "db" | "env" | "none";
}

interface PingResult {
  ok: boolean;
  reason?: string;
  status?: number;
  latencyMs?: number;
  message?: string;
  usage?: { remaining?: number; limit?: number } | null;
}

const DEFAULT_API_BASE =
  "https://04teleapoapi-kokisugiyama12-6776s-projects.vercel.app";

export default function LicenseSettingsClient() {
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [apiBaseInput, setApiBaseInput] = useState("");
  const [licenseInput, setLicenseInput] = useState("");

  const loadInfo = async () => {
    const res = await fetch("/api/system/license", { cache: "no-store" });
    const data = (await res.json()) as LicenseInfo;
    setInfo(data);
    setApiBaseInput(data.apiBase || "");
    // ライセンスキーはマスク済みなので入力欄は空にしておく (上書き入力するときだけ送信)
    setLicenseInput("");
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/system/license", { cache: "no-store" });
        if (cancelled) return;
        const data = (await res.json()) as LicenseInfo;
        if (cancelled) return;
        setInfo(data);
        setApiBaseInput(data.apiBase || "");
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

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const body: { apiBase?: string; licenseKey?: string } = {};
      if (apiBaseInput.trim() !== (info?.apiBase || "")) {
        body.apiBase = apiBaseInput.trim();
      }
      if (licenseInput.trim()) {
        body.licenseKey = licenseInput.trim();
      }
      if (Object.keys(body).length === 0) {
        setSaveMsg("変更がありません");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/system/license", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      await loadInfo();
      setSaveMsg("✓ 保存しました");
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

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

  const handleUseDefault = () => {
    setApiBaseInput(DEFAULT_API_BASE);
  };

  const isConfigured = !!info?.apiBase && !!info?.licenseConfigured;

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
        {/* Settings form */}
        <div
          className="rounded-[4px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--rule)",
            maxWidth: 880,
          }}
        >
          <PanelHeader title="接続情報" sub="SETTINGS" />
          <div className="px-5 pb-5 pt-4">
            {loading && (
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                読み込み中...
              </div>
            )}
            {info && (
              <>
                <div
                  className="grid items-start"
                  style={{
                    gridTemplateColumns: "150px 1fr",
                    columnGap: 18,
                    rowGap: 14,
                  }}
                >
                  <FormLabel>Backend URL</FormLabel>
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={apiBaseInput}
                        onChange={(e) => setApiBaseInput(e.target.value)}
                        placeholder="https://..."
                        className="mono"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={handleUseDefault}
                        className="cursor-pointer whitespace-nowrap"
                        style={ghostButtonStyle}
                      >
                        デフォルトを使う
                      </button>
                    </div>
                    <div
                      className="mono mt-1"
                      style={{ fontSize: 10.5, color: "var(--ink-3)" }}
                    >
                      設定元:{" "}
                      <span
                        style={{
                          color:
                            info.apiBaseSource === "db"
                              ? "var(--success)"
                              : info.apiBaseSource === "env"
                                ? "var(--ink-2)"
                                : "var(--warning)",
                        }}
                      >
                        {info.apiBaseSource === "db"
                          ? "DB (UI入力)"
                          : info.apiBaseSource === "env"
                            ? ".env.local"
                            : "未設定"}
                      </span>
                    </div>
                  </div>

                  <FormLabel required={!info.licenseConfigured}>
                    ライセンスキー
                  </FormLabel>
                  <div>
                    <input
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value)}
                      placeholder={
                        info.licenseConfigured
                          ? `${info.licenseMasked || ""} (変更する場合のみ入力)`
                          : "tlap_..."
                      }
                      className="mono"
                      style={inputStyle}
                      type="password"
                      autoComplete="off"
                    />
                    <div
                      className="mono mt-1"
                      style={{ fontSize: 10.5, color: "var(--ink-3)" }}
                    >
                      現在:{" "}
                      <span
                        style={{
                          color: info.licenseConfigured
                            ? "var(--ink)"
                            : "var(--warning)",
                        }}
                      >
                        {info.licenseConfigured
                          ? info.licenseMasked
                          : "未設定"}
                      </span>
                      {info.licenseSource && (
                        <>
                          {" · 設定元: "}
                          <span
                            style={{
                              color:
                                info.licenseSource === "db"
                                  ? "var(--success)"
                                  : info.licenseSource === "env"
                                    ? "var(--ink-2)"
                                    : "var(--warning)",
                            }}
                          >
                            {info.licenseSource === "db"
                              ? "DB (UI入力)"
                              : info.licenseSource === "env"
                                ? ".env.local"
                                : "未設定"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="cursor-pointer disabled:opacity-50"
                    style={primaryButtonStyle}
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  {saveMsg && (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: saveMsg.startsWith("✓")
                          ? "var(--success)"
                          : "var(--ink-2)",
                      }}
                    >
                      {saveMsg}
                    </span>
                  )}
                </div>
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
                disabled={pinging || !isConfigured}
                className="cursor-pointer disabled:opacity-50"
                style={primaryButtonStyle}
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

function FormLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className="flex items-center gap-1"
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--ink)",
        paddingTop: 7,
      }}
    >
      {children}
      {required && (
        <span style={{ color: "var(--error)", fontSize: 10 }}>*</span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid var(--rule)",
  borderRadius: 3,
  fontSize: 12,
  background: "var(--bg-sunken)",
  outline: "none",
  color: "var(--ink)",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "7px 18px",
  border: "none",
  background: "var(--accent)",
  fontSize: 12.5,
  fontWeight: 700,
  color: "#fff",
  borderRadius: 3,
  letterSpacing: "0.04em",
};

const ghostButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--rule)",
  background: "var(--bg-card)",
  fontSize: 11.5,
  color: "var(--ink)",
  borderRadius: 3,
  fontWeight: 500,
};
