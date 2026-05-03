"use client";

import { useState, useEffect } from "react";

interface ExportButtonProps {
  jobId: string;
  spreadsheetId: string | null;
  disabled?: boolean;
}

export default function ExportButton({
  jobId,
  spreadsheetId: initialId,
  disabled,
}: ExportButtonProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  const extractId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  const handleExport = async () => {
    const id = initialId || extractId(spreadsheetUrl);
    if (!id) {
      setResult({
        success: false,
        message: "SpreadsheetのURLを入力してください",
      });
      return;
    }

    setIsExporting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: id }),
      });

      const data = await res.json();

      if (data.needsAuth) {
        setAuthenticated(false);
        setResult({
          success: false,
          message: "Google認証が必要です。下のボタンから認証してください。",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "エクスポートに失敗しました");
      }

      setExportedUrl(data.spreadsheetUrl);
      setResult({
        success: true,
        message: `${data.rowsWritten}件をSpreadsheetに出力しました`,
      });
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--rule)", background: "var(--bg-card)" }}
    >
      <h3
        className="mb-2 text-sm font-bold"
        style={{ color: "var(--ink-2)" }}
      >
        Google Spreadsheetにエクスポート
      </h3>

      {authenticated === false && (
        <div className="mb-3">
          <p className="mb-2 text-xs" style={{ color: "var(--ink-3)" }}>
            Spreadsheetへの出力にはGoogleアカウントの認証が必要です
          </p>
          <button
            onClick={handleAuth}
            className="rounded-lg border px-4 py-2 text-sm font-bold transition-colors"
            style={{
              borderColor: "var(--rule)",
              background: "var(--bg-card)",
              color: "var(--ink)",
            }}
          >
            Googleアカウントで認証
          </button>
        </div>
      )}

      {authenticated === true && (
        <>
          {!initialId && (
            <input
              type="url"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--rule)",
                background: "var(--bg)",
                color: "var(--ink)",
              }}
            />
          )}

          <button
            onClick={handleExport}
            disabled={disabled || isExporting}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--success)" }}
          >
            {isExporting ? "エクスポート中..." : "Spreadsheetに出力"}
          </button>
        </>
      )}

      {authenticated === null && (
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>
          認証状態を確認中...
        </p>
      )}

      {result && (
        <p
          className="mt-2 text-sm"
          style={{
            color: result.success ? "var(--success)" : "var(--error)",
          }}
        >
          {result.message}
        </p>
      )}

      {exportedUrl && (
        <a
          href={exportedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm underline"
          style={{ color: "var(--accent)" }}
        >
          Spreadsheetを開く
        </a>
      )}
    </div>
  );
}
