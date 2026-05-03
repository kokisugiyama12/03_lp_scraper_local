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

const COMPANY_LINK_KEYWORDS = [
  "会社概要", "会社情報", "企業情報", "企業概要",
  "会社案内", "運営会社", "事業者情報", "特定商取引",
  "about", "company", "corporate",
];

const FALLBACK_PATHS = [
  "/company/", "/about/", "/corporate/", "/company-info/",
  "/about-us/", "/profile/", "/corporate/outline/",
  "/company/overview/", "/gaiyou/",
];

async function extractPageText(pageInstance: Awaited<ReturnType<Awaited<ReturnType<typeof getBrowser>>["newPage"]>>): Promise<string> {
  const text = await pageInstance.evaluate(() => {
    const scripts = document.querySelectorAll("script, style, noscript, iframe");
    scripts.forEach((s) => s.remove());
    return document.body?.innerText || "";
  });
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export async function scrapeCompanyPages(
  baseUrl: string
): Promise<string> {
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return "";
  }

  const browser = await getBrowser();
  const context = browser.contexts()[0] || await browser.newContext();

  // Step 1: ホームページを開いてナビ/フッターからリンクを探す
  const companyPageUrls: string[] = [];
  const homePage = await context.newPage();

  try {
    await homePage.goto(origin, { waitUntil: "domcontentloaded", timeout: 15000 });
    await homePage.waitForTimeout(1500);

    const foundLinks = await homePage.evaluate((keywords: string[]) => {
      const links = document.querySelectorAll("a[href]");
      const results: string[] = [];
      const seen = new Set<string>();

      for (const link of links) {
        const href = link.getAttribute("href") || "";
        const text = link.textContent?.trim() || "";
        const matchesKeyword = keywords.some(
          (kw) => text.includes(kw) || href.toLowerCase().includes(kw.toLowerCase())
        );
        if (!matchesKeyword) continue;

        let fullUrl = href;
        try {
          fullUrl = new URL(href, document.location.origin).href;
        } catch { continue; }

        if (!fullUrl.startsWith("http")) continue;
        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);
        results.push(fullUrl);
        if (results.length >= 3) break;
      }
      return results;
    }, COMPANY_LINK_KEYWORDS);

    companyPageUrls.push(...foundLinks);
  } catch {
    // homepage load failed
  } finally {
    await homePage.close();
  }

  // Step 2: リンクが見つからなければフォールバックパスを試す
  if (companyPageUrls.length === 0) {
    for (const path of FALLBACK_PATHS) {
      companyPageUrls.push(`${origin}${path}`);
    }
  }

  // Step 3: 見つかったURLを順に訪問してテキスト取得
  const collectedTexts: string[] = [];

  for (const url of companyPageUrls) {
    const page = await context.newPage();
    try {
      const res = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      if (!res || res.status() >= 400) continue;

      await page.waitForTimeout(1000);
      const text = await extractPageText(page);

      if (text.length > 100) {
        collectedTexts.push(text.slice(0, 3000));
        if (collectedTexts.length >= 2) break;
      }
    } catch {
      // page not found, skip
    } finally {
      await page.close();
    }
  }

  return collectedTexts.join("\n\n---\n\n");
}

export async function searchCompanyPhone(
  companyName: string
): Promise<{ text: string }> {
  const browser = await getBrowser();
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  try {
    const query = `${companyName} 電話番号`;
    await page.goto(
      `https://www.google.co.jp/search?q=${encodeURIComponent(query)}&hl=ja`,
      { waitUntil: "domcontentloaded", timeout: 15000 }
    );
    await page.waitForTimeout(2000);

    const text = await page.evaluate(() => {
      const scripts = document.querySelectorAll(
        "script, style, noscript, iframe"
      );
      scripts.forEach((s) => s.remove());
      const main = document.querySelector("#search") || document.body;
      return (main as HTMLElement)?.innerText || "";
    });

    return { text: text.replace(/\n{3,}/g, "\n\n").trim().slice(0, 3000) };
  } catch (error) {
    console.error(`Company phone search error for "${companyName}":`, error);
    return { text: "" };
  } finally {
    await page.close();
  }
}
