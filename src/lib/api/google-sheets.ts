import { getSheetsClient, refreshAccessToken } from "@/lib/auth/google-oauth";
import { getOAuthSession, upsertOAuthSession } from "@/lib/db/queries";

interface SheetRow {
  locationName: string;
  adUrl: string;
  landingUrl: string | null;
  companyName: string | null;
  phoneNumber: string | null;
  presidentName: string | null;
  adHeadline: string | null;
  adDescription: string | null;
  createdAt: string;
}

interface ExportMeta {
  keyword: string;
  locations: string;
  searchedAt: string;
  maxPages: number;
}

async function getValidAccessToken(sessionId: string): Promise<string> {
  const session = getOAuthSession(sessionId);
  if (!session) {
    throw new Error("Google認証が必要です。「Googleアカウントで認証」ボタンから認証してください。");
  }

  const isExpired = new Date(session.expiresAt) < new Date();

  if (!isExpired) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    throw new Error("認証の有効期限が切れました。再度認証してください。");
  }

  const credentials = await refreshAccessToken(session.refreshToken);

  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  upsertOAuthSession({
    id: sessionId,
    accessToken: credentials.access_token!,
    refreshToken: credentials.refresh_token,
    expiresAt,
  });

  return credentials.access_token!;
}

function formatDateTime(date: Date): { date: string; time: string } {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return {
    date: `${year}/${month}/${day}`,
    time: `${hours}:${minutes}`,
  };
}

export async function exportToSheet(
  spreadsheetId: string,
  results: SheetRow[],
  sessionId: string,
  meta?: ExportMeta,
  options?: { append?: boolean }
): Promise<{ rowsWritten: number; sheetName: string }> {
  const accessToken = await getValidAccessToken(sessionId);
  const sheets = getSheetsClient(accessToken);

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheet = sheetMeta.data.sheets?.[0]?.properties?.title ?? "Sheet1";
  const sheetName = sheetMeta.data.properties?.title || spreadsheetId;

  const now = new Date();
  const { date: exportDate, time: exportTime } = formatDateTime(now);

  const shouldAppend = options?.append === true;

  if (shouldAppend) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheet}!A:A`,
    });
    const lastRow = existing.data.values?.length || 0;

    const dataRows: string[][] = [];
    for (const r of results) {
      dataRows.push([
        exportDate,
        exportTime,
        r.locationName,
        r.companyName || "",
        r.phoneNumber || "",
        r.presidentName || "",
        r.adHeadline || "",
        r.adDescription || "",
        r.adUrl,
        r.landingUrl || "",
        r.createdAt,
      ]);
    }

    if (lastRow === 0) {
      const headerWithMeta: string[][] = [];
      if (meta) {
        headerWithMeta.push(["検索条件"]);
        headerWithMeta.push(["検索キーワード", meta.keyword]);
        headerWithMeta.push(["検索地域", meta.locations]);
        headerWithMeta.push(["検索ページ数", String(meta.maxPages)]);
        headerWithMeta.push(["検索日時", new Date(meta.searchedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })]);
        headerWithMeta.push([]);
      }
      headerWithMeta.push([
        "日付", "時刻", "検索エリア", "会社名", "電話番号",
        "代表者名", "広告見出し", "広告説明文", "広告URL", "遷移先URL", "取得日時",
      ]);
      headerWithMeta.push(...dataRows);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${firstSheet}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: headerWithMeta },
      });
    } else {
      const startRow = lastRow + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${firstSheet}!A${startRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: dataRows },
      });
    }
  } else {
    const values: string[][] = [];

    if (meta) {
      values.push(["検索条件"]);
      values.push(["検索キーワード", meta.keyword]);
      values.push(["検索地域", meta.locations]);
      values.push(["検索ページ数", String(meta.maxPages)]);
      values.push(["検索日時", new Date(meta.searchedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })]);
      values.push([]);
    }

    values.push([
      "日付", "時刻", "検索エリア", "会社名", "電話番号",
      "代表者名", "広告見出し", "広告説明文", "広告URL", "遷移先URL", "取得日時",
    ]);

    for (const r of results) {
      values.push([
        exportDate,
        exportTime,
        r.locationName,
        r.companyName || "",
        r.phoneNumber || "",
        r.presidentName || "",
        r.adHeadline || "",
        r.adDescription || "",
        r.adUrl,
        r.landingUrl || "",
        r.createdAt,
      ]);
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: firstSheet,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${firstSheet}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }

  return { rowsWritten: results.length, sheetName };
}
