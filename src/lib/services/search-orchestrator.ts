import { searchGoogleAds } from "@/lib/scraper/google-search";
import {
  scrapePage,
  scrapeCompanyPages,
  searchCompanyPhone,
} from "@/lib/scraper/page-scraper";
import {
  extractContactInfo,
  mergeContact,
} from "@/lib/ai/extract-contact";
import { sortPhones, hasLandline } from "@/lib/utils/phones";
import {
  getJob,
  getQueriesForJob,
  updateJobStatus,
  updateQueryStatus,
  createResult,
  incrementJobProgress,
  incrementJobResults,
} from "@/lib/db/queries";
import { jobEvents } from "./event-bus";
import { closeBrowser } from "@/lib/scraper/browser";
import type { ContactInfo } from "@/types/result";

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const EMPTY_CONTACT: ContactInfo = {
  companyNameFormal: null,
  companyNameBrand: null,
  presidentName: null,
  phones: [],
};

interface ProcessAdResult {
  contact: ContactInfo;
  finalUrl: string;
  rawPageText: string;
  callsUsed: number;
}

/**
 * 1つの広告URLに対して: LPスクレイプ → 正式社名解決 → 電話番号深掘り
 * の順で情報を収集する。市外局番が見つかれば早期終了、見つからなければ
 * extractionDepth まで Google再検索を繰り返す。
 */
async function processAd(
  ad: { url: string; headline: string; description: string },
  extractionDepth: number,
  interSearchDelaySec: number
): Promise<ProcessAdResult> {
  const depthLimit = Math.max(1, Math.min(5, extractionDepth));
  const interDelayMs = Math.max(5, Math.min(15, interSearchDelaySec)) * 1000;
  let merged: ContactInfo = { ...EMPTY_CONTACT };
  let callsUsed = 0;

  // Step 1: LP本文を取得 + AI抽出 (必ず実行、これで 1 calls)
  const { text: lpText, finalUrl } = await scrapePage(ad.url);
  if (lpText) {
    const c1 = await extractContactInfo(lpText);
    merged = mergeContact(merged, c1);
    callsUsed++;
    console.log(
      `[Step1] ${ad.url} → formal=${merged.companyNameFormal}, brand=${merged.companyNameBrand}, phones=[${merged.phones.join(",")}]`
    );
  } else {
    return {
      contact: merged,
      finalUrl: finalUrl || ad.url,
      rawPageText: "",
      callsUsed,
    };
  }

  // Step 2: 同ドメイン内の会社概要ページを巡回 (Google再検索ではないので遅延短め)
  if (callsUsed < depthLimit && !hasLandline(merged.phones)) {
    try {
      const compText = await scrapeCompanyPages(finalUrl || ad.url);
      if (compText) {
        const combined = `${lpText}\n\n---\n\n${compText}`;
        const c2 = await extractContactInfo(combined);
        merged = mergeContact(merged, c2);
        callsUsed++;
        console.log(
          `[Step2] same-domain → formal=${merged.companyNameFormal}, brand=${merged.companyNameBrand}, phones=[${merged.phones.join(",")}]`
        );
      }
    } catch (err) {
      console.error("[Step2] Error:", err);
    }
  }

  // Step 3: 正式社名が未取得の場合、ブランド名で Google 検索して法人名を解決
  if (
    callsUsed < depthLimit &&
    !merged.companyNameFormal &&
    merged.companyNameBrand
  ) {
    await new Promise((r) => setTimeout(r, interDelayMs));
    try {
      const searchText = (
        await searchCompanyPhone(`${merged.companyNameBrand} 法人名`)
      ).text;
      if (searchText) {
        const c3 = await extractContactInfo(searchText);
        merged = mergeContact(merged, c3);
        callsUsed++;
        console.log(
          `[Step3] formal name search → formal=${merged.companyNameFormal}`
        );
      }
    } catch (err) {
      console.error("[Step3] Error:", err);
    }
  }

  // Step 4以降: 市外局番が出るまで Google で社名再検索を繰り返す
  while (callsUsed < depthLimit && !hasLandline(merged.phones)) {
    const queryName =
      merged.companyNameFormal || merged.companyNameBrand || null;
    if (!queryName) break; // 検索キーがない

    await new Promise((r) => setTimeout(r, interDelayMs));
    try {
      const searchText = (
        await searchCompanyPhone(`${queryName} 電話番号`)
      ).text;
      if (!searchText) break;
      const c = await extractContactInfo(searchText);
      const before = merged.phones.length;
      merged = mergeContact(merged, c);
      callsUsed++;
      console.log(
        `[Step4 calls=${callsUsed}] phone search → phones=[${merged.phones.join(",")}]`
      );
      // 進捗なし (新たな電話番号が増えていない) なら無駄な深掘り抑止のため break
      if (merged.phones.length === before) break;
    } catch (err) {
      console.error("[Step4] Error:", err);
      break;
    }
  }

  return {
    contact: merged,
    finalUrl: finalUrl || ad.url,
    rawPageText: lpText,
    callsUsed,
  };
}

export async function runSearchJob(jobId: string): Promise<void> {
  try {
    updateJobStatus(jobId, "running");
    jobEvents.emit(jobId, { type: "job_started", data: {} });

    const queries = getQueriesForJob(jobId);
    const job0 = getJob(jobId);
    const extractionDepth = job0?.extractionDepth ?? 2;
    const interSearchDelaySec = job0?.interSearchDelaySec ?? 10;
    const maxPages = job0?.maxPages ?? 1;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      const job = getJob(jobId);
      if (!job || job.status === "cancelled") {
        jobEvents.emit(jobId, {
          type: "job_failed",
          data: { error: "キャンセルされました" },
        });
        return;
      }

      jobEvents.emit(jobId, {
        type: "query_start",
        data: {
          locationName: query.locationName,
          queryIndex: i,
          totalQueries: queries.length,
        },
      });

      updateQueryStatus(query.id, "running");

      try {
        const ads = await searchGoogleAds(query.searchQuery, {
          geoHeader: query.geoHeader ?? undefined,
          maxPages,
        });

        updateQueryStatus(query.id, "completed", ads.length);

        jobEvents.emit(jobId, {
          type: "query_complete",
          data: {
            locationName: query.locationName,
            adsFound: ads.length,
          },
        });

        for (const ad of ads) {
          try {
            const {
              contact,
              finalUrl,
              rawPageText,
            } = await processAd(ad, extractionDepth, interSearchDelaySec);

            const sortedPhones = sortPhones(contact.phones).slice(0, 5);

            const hasName =
              contact.companyNameFormal || contact.companyNameBrand;
            const hasPhone = sortedPhones.length > 0;
            const extractionStatus =
              hasName && hasPhone
                ? "success"
                : hasName || hasPhone
                  ? "partial"
                  : rawPageText
                    ? "partial"
                    : "failed";

            createResult({
              jobId,
              queryId: query.id,
              adUrl: ad.url,
              landingUrl: finalUrl,
              companyNameFormal: contact.companyNameFormal,
              companyNameBrand: contact.companyNameBrand,
              phones: sortedPhones,
              presidentName: contact.presidentName ?? undefined,
              adHeadline: ad.headline,
              adDescription: ad.description,
              locationName: query.locationName,
              extractionStatus,
              rawPageText: rawPageText.slice(0, 2000),
            });

            incrementJobResults(jobId);

            jobEvents.emit(jobId, {
              type: "result_found",
              data: {
                adUrl: ad.url,
                landingUrl: finalUrl,
                companyNameFormal: contact.companyNameFormal,
                companyNameBrand: contact.companyNameBrand,
                phones: sortedPhones,
                phoneNumber1: sortedPhones[0] ?? null,
                phoneNumber2: sortedPhones[1] ?? null,
                phoneNumber3: sortedPhones[2] ?? null,
                phoneNumber4: sortedPhones[3] ?? null,
                phoneNumber5: sortedPhones[4] ?? null,
                presidentName: contact.presidentName,
                adHeadline: ad.headline,
                adDescription: ad.description,
                locationName: query.locationName,
                extractionStatus,
              },
            });
          } catch (error) {
            console.error(`Extraction failed for ${ad.url}:`, error);
            jobEvents.emit(jobId, {
              type: "extraction_failed",
              data: {
                adUrl: ad.url,
                reason:
                  error instanceof Error ? error.message : "Unknown error",
              },
            });
          }

          await randomDelay(500, 1500);
        }
      } catch (error) {
        console.error(`Query failed for "${query.searchQuery}":`, error);
        updateQueryStatus(query.id, "failed");
      }

      incrementJobProgress(jobId);

      if (i < queries.length - 1) {
        await randomDelay(3000, 8000);
      }
    }

    const finalJob = getJob(jobId);
    updateJobStatus(jobId, "completed", {
      totalResults: finalJob?.totalResults ?? 0,
    });

    jobEvents.emit(jobId, {
      type: "job_complete",
      data: { totalResults: finalJob?.totalResults ?? 0 },
    });
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    updateJobStatus(jobId, "failed", {
      errorMessage:
        error instanceof Error ? error.message : "Unknown error",
    });
    jobEvents.emit(jobId, {
      type: "job_failed",
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  } finally {
    await closeBrowser();
  }
}
