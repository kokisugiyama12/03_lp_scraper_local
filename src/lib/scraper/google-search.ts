import { getBrowser } from "./browser";
import type { AdResult } from "@/types/result";

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export async function searchGoogleAds(
  query: string,
  options?: { geoHeader?: string; maxPages?: number }
): Promise<AdResult[]> {
  const maxPages = options?.maxPages ?? 1;
  const geoHeader = options?.geoHeader;

  const browser = await getBrowser();
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  const results: AdResult[] = [];
  const seenDomains = new Set<string>();

  try {
    if (geoHeader) {
      await page.setExtraHTTPHeaders({ "X-Geo": geoHeader });
    }

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      const start = pageIndex * 10;
      let url = `https://www.google.co.jp/search?q=${encodeURIComponent(query)}&hl=ja`;
      if (start > 0) url += `&start=${start}`;

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await randomDelay(2000, 3000);

      const pageAds = await page.evaluate(() => {
        const found: { headline: string; description: string; url: string }[] = [];
        const pageDomains = new Set<string>();

        function getDomain(u: string): string {
          try { return new URL(u).hostname; } catch { return u; }
        }

        function isExternalUrl(href: string): boolean {
          return (
            href.startsWith("http") &&
            !href.includes("google.") &&
            !href.includes("/aclk") &&
            !href.includes("gstatic.")
          );
        }

        function getAdDescription(adBlock: Element): string {
          const allText = (adBlock as HTMLElement).innerText || adBlock.textContent || "";
          const lines = allText.split("\n").map(l => l.trim()).filter(l => l.length > 10);
          // Skip the first few lines (domain, headline) and get the description
          for (const line of lines.slice(1)) {
            if (line.length > 20 && !line.includes("http") && !line.includes(".co.jp") && !line.includes(".com")) {
              return line;
            }
          }
          return "";
        }

        function extractFromContainer(container: Element) {
          const links = container.querySelectorAll('a[href^="http"]');
          for (const link of links) {
            const href = link.getAttribute("href") || "";
            if (!isExternalUrl(href)) continue;
            const domain = getDomain(href);
            if (pageDomains.has(domain)) continue;
            pageDomains.add(domain);
            const headline = link.textContent?.trim().split("\n")[0]?.trim() || "";
            if (headline.length > 3) {
              const adBlock = link.closest("[data-text-ad]") || container;
              const description = getAdDescription(adBlock);
              found.push({ headline, description, url: href });
            }
          }
        }

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

        if (found.length === 0) {
          const adRegions = document.querySelectorAll('[aria-label="広告"]');
          for (const region of adRegions) extractFromContainer(region);
        }

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

      for (const ad of pageAds) {
        const domain = extractDomain(ad.url);
        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);
        results.push({
          headline: ad.headline,
          description: ad.description,
          url: ad.url,
          displayUrl: ad.url,
        });
      }

      if (pageIndex < maxPages - 1) {
        await randomDelay(2000, 4000);
      }
    }
  } catch (error) {
    console.error(`Google search error for "${query}":`, error);
  } finally {
    await page.close();
  }

  return results;
}
