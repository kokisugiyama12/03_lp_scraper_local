import { NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (process.platform !== "darwin") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Chrome自動起動は macOS のみ対応しています。手動で起動コマンドを実行してください",
      },
      { status: 400 }
    );
  }

  try {
    // First check if Chrome is already running on port 9222
    const alreadyRunning = await isCdpRunning();
    if (alreadyRunning) {
      return NextResponse.json({
        ok: true,
        alreadyRunning: true,
        message: "Chrome (port 9222) は既に起動しています",
      });
    }

    // Launch Chrome
    // --disable-extensions で位置スプーフィング系の拡張機能を無効化
    // (拡張機能が uule URLパラメータの位置指定を上書きしてしまうため)
    const child = spawn(
      "open",
      [
        "-na",
        "Google Chrome",
        "--args",
        "--remote-debugging-port=9222",
        "--user-data-dir=/tmp/chrome-debug",
        "--disable-extensions",
      ],
      { detached: true, stdio: "ignore" }
    );
    child.unref();

    // Wait briefly for Chrome to come up
    let connected = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isCdpRunning()) {
        connected = true;
        break;
      }
    }

    if (connected) {
      return NextResponse.json({
        ok: true,
        message: "Chromeを起動しました",
      });
    }

    return NextResponse.json({
      ok: false,
      message:
        "Chromeの起動を開始しましたが、CDP接続が確認できません。Chromeがインストールされているか確認してください",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Chrome起動コマンドの実行に失敗しました",
      },
      { status: 500 }
    );
  }
}

async function isCdpRunning(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:9222/json/version", {
      signal: AbortSignal.timeout(800),
    });
    return res.ok;
  } catch {
    return false;
  }
}
