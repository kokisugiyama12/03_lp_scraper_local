import { NextResponse } from "next/server";
import { getExportHistoryList } from "@/lib/db/queries";

export async function GET() {
  const history = getExportHistoryList();
  return NextResponse.json({ history });
}
