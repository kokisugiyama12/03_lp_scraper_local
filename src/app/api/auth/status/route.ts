import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuthSession } from "@/lib/db/queries";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false });
    }

    const session = getOAuthSession(sessionId);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const isExpired = new Date(session.expiresAt) < new Date();
    const hasRefreshToken = !!session.refreshToken;

    return NextResponse.json({
      authenticated: !isExpired || hasRefreshToken,
      email: session.email,
      needsRefresh: isExpired && hasRefreshToken,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
