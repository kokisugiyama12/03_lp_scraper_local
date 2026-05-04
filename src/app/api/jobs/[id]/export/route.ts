import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getJob, getResultsForJob, updateJobStatus, upsertExportHistory } from "@/lib/db/queries";
import { exportToSheet } from "@/lib/api/google-sheets";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: "ジョブが見つかりません" },
      { status: 404 }
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Google認証が必要です", needsAuth: true },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const spreadsheetId = body.spreadsheetId || job.spreadsheetId;

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "SpreadsheetのIDが指定されていません" },
      { status: 400 }
    );
  }

  try {
    const results = getResultsForJob(id);

    const locations = JSON.parse(job.locationsJson || "[]");
    const locationNames = locations.map((l: { name: string }) => l.name).join("、");

    const { rowsWritten, sheetName, appended } = await exportToSheet(
      spreadsheetId,
      results,
      sessionId,
      {
        keyword: job.keyword,
        locations: locationNames,
        searchedAt: job.createdAt,
        maxPages: job.maxPages,
      },
    );

    updateJobStatus(id, job.status, {
      exportedAt: new Date().toISOString(),
      spreadsheetId,
    });

    upsertExportHistory(spreadsheetId, sheetName);

    return NextResponse.json({
      rowsWritten,
      appended,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });
  } catch (error) {
    console.error("Export error:", error);

    const message = error instanceof Error ? error.message : "エクスポートに失敗しました";
    const needsAuth = message.includes("認証");

    return NextResponse.json(
      { error: message, needsAuth },
      { status: needsAuth ? 401 : 500 }
    );
  }
}
