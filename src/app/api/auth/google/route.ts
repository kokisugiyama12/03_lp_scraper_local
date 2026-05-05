import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAuthUrl } from "@/lib/auth/google-oauth";
import { cookies } from "next/headers";
import { deleteOAuthSession } from "@/lib/db/queries";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (sessionId) {
      deleteOAuthSession(sessionId);
    }
    const response = NextResponse.json({ success: true });
    response.cookies.delete("session_id");
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "認証解除に失敗しました",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      sessionId = nanoid(24);
    }

    const authUrl = getAuthUrl(sessionId);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("OAuth init error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "認証の開始に失敗しました" },
      { status: 500 }
    );
  }
}
