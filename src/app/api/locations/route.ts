import { NextResponse } from "next/server";
import { AREA_GROUPS } from "@/lib/config/areas";
import { TRAIN_LINE_GROUPS } from "@/lib/config/train-lines";

export async function GET() {
  return NextResponse.json({
    areas: AREA_GROUPS,
    trainLines: TRAIN_LINE_GROUPS,
  });
}
