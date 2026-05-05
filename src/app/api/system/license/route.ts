import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function maskLicense(key: string): string {
  if (!key) return "";
  if (key.length <= 12) return key.slice(0, 5) + "••••";
  return `${key.slice(0, 5)}${"•".repeat(8)}${key.slice(-4)}`;
}

export async function GET() {
  const apiBase = process.env.TELEAPO_API_BASE || null;
  const licenseKey = process.env.TELEAPO_LICENSE_KEY || null;
  return NextResponse.json({
    apiBase,
    licenseConfigured: !!licenseKey,
    licenseMasked: licenseKey ? maskLicense(licenseKey) : null,
  });
}

export async function POST() {
  const apiBase = process.env.TELEAPO_API_BASE;
  const licenseKey = process.env.TELEAPO_LICENSE_KEY;

  if (!apiBase || !licenseKey) {
    return NextResponse.json({
      ok: false,
      reason: "missing_config",
      message: "TELEAPO_API_BASE または TELEAPO_LICENSE_KEY が未設定",
    });
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(`${apiBase}/api/ai/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey,
      },
      body: JSON.stringify({ pageText: "ping" }),
      signal: AbortSignal.timeout(15_000),
    });
    const latencyMs = Date.now() - startedAt;

    let body: { error?: string; usage?: { remaining?: number; limit?: number } } = {};
    try {
      body = await response.json();
    } catch {
      // ignore parse error
    }

    if (response.status === 200) {
      return NextResponse.json({
        ok: true,
        status: response.status,
        latencyMs,
        usage: body.usage ?? null,
        message: "接続OK・ライセンス有効",
      });
    }

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        ok: false,
        reason: "invalid_license",
        status: response.status,
        latencyMs,
        message: body.error || "ライセンスキーが無効、または期限切れの可能性があります",
      });
    }

    if (response.status === 429) {
      return NextResponse.json({
        ok: false,
        reason: "rate_limited",
        status: response.status,
        latencyMs,
        usage: body.usage ?? null,
        message: body.error || "レート制限に達しました",
      });
    }

    return NextResponse.json({
      ok: false,
      reason: "http_error",
      status: response.status,
      latencyMs,
      message: body.error || `HTTP ${response.status}`,
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const isAbort =
      error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({
      ok: false,
      reason: isAbort ? "timeout" : "connection_error",
      latencyMs,
      message:
        error instanceof Error
          ? error.message
          : "バックエンドへの接続に失敗しました",
    });
  }
}
