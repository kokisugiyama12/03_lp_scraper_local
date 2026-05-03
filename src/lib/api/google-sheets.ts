import { google } from "googleapis";

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

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Google Service Account の認証情報が設定されていません。GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY を .env.local に設定してください。"
    );
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function exportToSheet(
  spreadsheetId: string,
  results: SheetRow[]
): Promise<number> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

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

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "Sheet1",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return rows.length;
}
