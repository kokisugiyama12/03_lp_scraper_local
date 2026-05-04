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

const HEADER = [
  "検索キーワード",
  "検索地域",
  "検索ページ数",
  "検索日",
  "検索時刻",
  "出力日",
  "出力時刻",
  "検索エリア",
  "会社名",
  "電話番号",
  "代表者名",
  "広告見出し",
  "広告説明文",
  "広告URL",
  "遷移先URL",
  "取得日時",
];

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
  meta: ExportMeta,
): Promise<{ rowsWritten: number; sheetName: string; appended: boolean }> {
  const accessToken = await getValidAccessToken(sessionId);
  const sheets = getSheetsClient(accessToken);

  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheet = sheetMeta.data.sheets?.[0]?.properties?.title ?? "Sheet1";
  const sheetName = sheetMeta.data.properties?.title || spreadsheetId;

  const { date: exportDate, time: exportTime } = formatDateTime(new Date());
  const { date: searchedDate, time: searchedTime } = formatDateTime(new Date(meta.searchedAt));

  const dataRows: string[][] = results.map((r) => [
    meta.keyword,
    meta.locations,
    String(meta.maxPages),
    searchedDate,
    searchedTime,
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

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${firstSheet}!A:A`,
  });
  const lastRow = existing.data.values?.length || 0;
  const isEmpty = lastRow === 0;

  const valuesToWrite = isEmpty ? [HEADER, ...dataRows] : dataRows;
  const startRow = isEmpty ? 1 : lastRow + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${firstSheet}!A${startRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: valuesToWrite },
  });

  return {
    rowsWritten: results.length,
    sheetName,
    appended: !isEmpty,
  };
}
