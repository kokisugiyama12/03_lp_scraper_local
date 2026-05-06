import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createJob, createSearchQueries, listJobs } from "@/lib/db/queries";
import { runSearchJob } from "@/lib/services/search-orchestrator";
import { makeUule } from "@/lib/config/uule";
import { PREFECTURE_GROUPS } from "@/lib/config/prefectures";
import type { SelectedLocation } from "@/types/location";

// id → canonicalName の lookup map
const CANONICAL_BY_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const group of PREFECTURE_GROUPS) {
    for (const pref of group.prefectures) {
      map[pref.id] = pref.canonicalName;
    }
  }
  return map;
})();

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
      if (loc.type === "prefecture") {
        const canonical = CANONICAL_BY_ID[loc.id];
        const uule = canonical ? makeUule(canonical) : null;
        // ハイブリッド方式: クエリに都道府県名を追加 (確実な地域マッチ用) + uule (バックアップ)
        // Google は uule を必ずしも honor しないので、クエリ自体に地名を入れて確実に地域絞込みする
        return {
          jobId,
          locationName: loc.name,
          searchQuery: `${keyword.trim()} ${loc.name}`,
          // schema column "geo_header" を流用して uule URL パラメータを保存
          geoHeader: uule,
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
