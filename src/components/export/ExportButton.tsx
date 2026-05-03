"use client";

import { useState, useEffect } from "react";

interface ExportHistory {
  id: number;
  spreadsheetId: string;
  spreadsheetName: string | null;
  lastExportedAt: string;
}

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
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));

    fetch("/api/export-history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {});
  }, []);

  const extractId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  const handleExport = async () => {
    let id: string | null = null;
    let append = false;

    if (selectedHistoryId) {
      id = selectedHistoryId;
      append = true;
    } else if (initialId) {
      id = initialId;
    } else {
      id = extractId(spreadsheetUrl);
    }

    if (!id) {
      setResult({
        success: false,
        message: "SpreadsheetのURLを入力するか、過去の履歴を選択してください",
      });
      return;
    }

    setIsExporting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: id, append }),
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
        message: append
          ? `${data.rowsWritten}件を既存のSpreadsheetに追記しました`
          : `${data.rowsWritten}件をSpreadsheetに出力しました`,
      });

      fetch("/api/export-history")
        .then((r) => r.json())
        .then((d) => setHistory(d.history || []))
        .catch(() => {});
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
          {history.length > 0 && (
            <div className="mb-3">
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--ink-3)" }}
              >
                過去のSpreadsheetに追記
              </label>
              <select
                value={selectedHistoryId}
                onChange={(e) => {
                  setSelectedHistoryId(e.target.value);
                  if (e.target.value) setSpreadsheetUrl("");
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--rule)",
                  background: "var(--bg)",
                  color: "var(--ink)",
                }}
              >
                <option value="">新しいSpreadsheetに出力...</option>
                {history.map((h) => (
                  <option key={h.id} value={h.spreadsheetId}>
                    {h.spreadsheetName || h.spreadsheetId.slice(0, 20)}
                    （{new Date(h.lastExportedAt).toLocaleDateString("ja-JP")}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {!selectedHistoryId && !initialId && (
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
            {isExporting
              ? "エクスポート中..."
              : selectedHistoryId
                ? "Spreadsheetに追記"
                : "Spreadsheetに出力"}
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
