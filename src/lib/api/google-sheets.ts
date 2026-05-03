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
  createdAt: string;
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

export async function exportToSheet(
  spreadsheetId: string,
  results: SheetRow[],
  sessionId: string
): Promise<number> {
  const accessToken = await getValidAccessToken(sessionId);
  const sheets = getSheetsClient(accessToken);

  const header = [
    "検索エリア",
    "広告URL",
    "遷移先URL",
    "会社名",
    "電話番号",
    "代表者名",
    "広告見出し",
    "取得日時",
  ];

  const rows = results.map((r) => [
    r.locationName,
    r.adUrl,
    r.landingUrl || "",
    r.companyName || "",
    r.phoneNumber || "",
    r.presidentName || "",
    r.adHeadline || "",
    r.createdAt,
  ]);

  const values = [header, ...rows];

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheet = meta.data.sheets?.[0]?.properties?.title ?? "Sheet1";

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

  return rows.length;
}
