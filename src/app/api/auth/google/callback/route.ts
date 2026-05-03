import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/auth/google-oauth";
import { upsertOAuthSession } from "@/lib/db/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const sessionId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?auth_error=denied", request.url));
  }

  if (!code || !sessionId) {
    return NextResponse.redirect(new URL("/?auth_error=missing_params", request.url));
  }

  try {
    const tokens = await exchangeCode(code);

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    upsertOAuthSession({
      id: sessionId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    const response = NextResponse.redirect(new URL("/?auth=success", request.url));
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/?auth_error=exchange_failed", request.url));
  }
}
