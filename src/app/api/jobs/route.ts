import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createJob, createSearchQueries, listJobs } from "@/lib/db/queries";
import { runSearchJob } from "@/lib/services/search-orchestrator";
import { formatXGeoHeader } from "@/lib/config/uule";
import type { SelectedLocation } from "@/types/location";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      keyword,
      locations,
      spreadsheetId,
      maxPages,
    }: {
      keyword: string;
      locations: SelectedLocation[];
      spreadsheetId?: string;
      maxPages?: number;
    } = body;

    if (!keyword?.trim()) {
      return NextResponse.json(
        { error: "キーワードは必須です" },
        { status: 400 }
      );
    }
    if (!locations?.length) {
      return NextResponse.json(
        { error: "エリアを1つ以上選択してください" },
        { status: 400 }
      );
    }

    const jobId = nanoid(12);
    const clampedPages = Math.min(Math.max(maxPages ?? 1, 1), 5);

    createJob({
      id: jobId,
      keyword: keyword.trim(),
      locationsJson: JSON.stringify(locations),
      spreadsheetId: spreadsheetId || undefined,
      totalQueries: locations.length,
      maxPages: clampedPages,
    });

    const queries = locations.map((loc) => {
      if (loc.type === "prefecture" && loc.lat != null && loc.lng != null) {
        return {
          jobId,
          locationName: loc.name,
          searchQuery: keyword.trim(),
          geoHeader: formatXGeoHeader(loc.lat, loc.lng),
        };
      }
      return {
        jobId,
        locationName: loc.name,
        searchQuery: `${keyword.trim()} ${loc.name}`,
        geoHeader: null,
      };
    });

    createSearchQueries(queries);

    runSearchJob(jobId).catch((err) =>
      console.error("Background job error:", err)
    );

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: "ジョブの作成に失敗しました" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const jobs = listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Job list error:", error);
    return NextResponse.json(
      { error: "ジョブ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
