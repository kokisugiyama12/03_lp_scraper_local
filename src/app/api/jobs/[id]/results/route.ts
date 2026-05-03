import { NextResponse } from "next/server";
import { getResultsForJob } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const results = getResultsForJob(id);
  return NextResponse.json({ results });
}
