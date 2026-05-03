import { chromium, type Browser } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }

  try {
    browser = await chromium.connectOverCDP("http://localhost:9222");
  } catch {
    throw new Error(
      "Chromeに接続できません。以下のコマンドでChromeを起動してください:\n" +
      'open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug'
    );
  }

  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    browser.removeAllListeners();
    browser = null;
  }
}
