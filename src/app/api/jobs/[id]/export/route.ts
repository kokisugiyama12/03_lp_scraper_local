import { NextResponse } from "next/server";
import { getJob, getResultsForJob, updateJobStatus } from "@/lib/db/queries";
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
    const rowsWritten = await exportToSheet(spreadsheetId, results);

    updateJobStatus(id, job.status, {
      exportedAt: new Date().toISOString(),
    });

    return NextResponse.json({ rowsWritten });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "エクスポートに失敗しました",
      },
      { status: 500 }
    );
  }
}
