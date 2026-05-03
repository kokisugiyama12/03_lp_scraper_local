import { google } from "googleapis";

function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth の設定がありません。GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET を .env.local に設定してください。"
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(sessionId: string): string {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    state: sessionId,
  });
}

export async function exchangeCode(code: string) {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const client = getClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials;
}

export function getSheetsClient(accessToken: string) {
  const client = getClient();
  client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: client });
}
