import { getBrowser } from "./browser";

const MAX_TEXT_LENGTH = 5000;

export async function scrapePage(
  url: string
): Promise<{ text: string; finalUrl: string }> {
  const browser = await getBrowser();
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    const finalUrl = page.url();

    const text = await page.evaluate(() => {
      const scripts = document.querySelectorAll(
        "script, style, noscript, iframe"
      );
      scripts.forEach((s) => s.remove());
      return document.body?.innerText || "";
    });

    const trimmed = text
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_TEXT_LENGTH);

    return { text: trimmed, finalUrl };
  } catch (error) {
    console.error(`Page scrape error for "${url}":`, error);
    return { text: "", finalUrl: url };
  } finally {
    await page.close();
  }
}
