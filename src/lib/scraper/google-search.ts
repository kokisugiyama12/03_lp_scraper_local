import { getBrowser } from "./browser";
import type { AdResult } from "@/types/result";

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchGoogleAds(query: string): Promise<AdResult[]> {
  const browser = await getBrowser();
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  const results: AdResult[] = [];

  try {
    await page.goto(
      `https://www.google.co.jp/search?q=${encodeURIComponent(query)}&hl=ja`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );

    await randomDelay(2000, 3000);

    const ads = await page.evaluate(() => {
      const found: { headline: string; url: string }[] = [];
      const seenDomains = new Set<string>();

      function getDomain(url: string): string {
        try { return new URL(url).hostname; } catch { return url; }
      }

      function isExternalUrl(href: string): boolean {
        return (
          href.startsWith("http") &&
          !href.includes("google.") &&
          !href.includes("/aclk") &&
          !href.includes("gstatic.")
        );
      }

      function extractFromContainer(container: Element) {
        const links = container.querySelectorAll('a[href^="http"]');
        for (const link of links) {
          const href = link.getAttribute("href") || "";
          if (!isExternalUrl(href)) continue;
          const domain = getDomain(href);
          if (seenDomains.has(domain)) continue;
          seenDomains.add(domain);
          const headline = link.textContent?.trim().split("\n")[0]?.trim() || "";
          if (headline.length > 3) {
            found.push({ headline, url: href });
          }
        }
      }

      // Method 1: #tads and #tadsb containers with [data-text-ad]
      for (const containerId of ["#tads", "#tadsb"]) {
        const container = document.querySelector(containerId);
        if (!container) continue;
        const adBlocks = container.querySelectorAll("[data-text-ad]");
        if (adBlocks.length > 0) {
          for (const block of adBlocks) extractFromContainer(block);
        } else {
          extractFromContainer(container);
        }
      }

      // Method 2: aria-label="広告" regions
      if (found.length === 0) {
        const adRegions = document.querySelectorAll('[aria-label="広告"]');
        for (const region of adRegions) extractFromContainer(region);
      }

      // Method 3: walk up from "スポンサー" labels
      if (found.length === 0) {
        const spans = document.querySelectorAll("span");
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (text !== "スポンサー" && text !== "スポンサー広告") continue;
          let el = span.parentElement;
          for (let i = 0; i < 10 && el; i++) {
            const links = el.querySelectorAll('a[href^="http"]');
            if (links.length >= 2) {
              extractFromContainer(el);
              break;
            }
            el = el.parentElement;
          }
        }
      }

      return found;
    });

    for (const ad of ads) {
      results.push({
        headline: ad.headline,
        url: ad.url,
        displayUrl: ad.url,
      });
    }
  } catch (error) {
    console.error(`Google search error for "${query}":`, error);
  } finally {
    await page.close();
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const domain = extractDomain(r.url);
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
