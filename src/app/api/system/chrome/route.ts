import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("http://localhost:9222/json/version", {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      return NextResponse.json({
        connected: false,
        error: `HTTP ${res.status}`,
      });
    }
    const data = (await res.json()) as {
      Browser?: string;
      "User-Agent"?: string;
      "Protocol-Version"?: string;
    };
    return NextResponse.json({
      connected: true,
      browser: data.Browser ?? "unknown",
      protocolVersion: data["Protocol-Version"] ?? "",
      userAgent: data["User-Agent"] ?? "",
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: err instanceof Error ? err.message : "unknown error",
    });
  }
}
