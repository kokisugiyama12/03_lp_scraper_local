import { searchGoogleAds } from "@/lib/scraper/google-search";
import { scrapePage, scrapeCompanyPages, searchCompanyPhone } from "@/lib/scraper/page-scraper";
import { extractContactInfo } from "@/lib/ai/extract-contact";
import { getLocationIdFromName } from "@/lib/config/area-codes";
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

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSearchJob(jobId: string): Promise<void> {
  try {
    updateJobStatus(jobId, "running");
    jobEvents.emit(jobId, {
      type: "job_started",
      data: {},
    });

    const queries = getQueriesForJob(jobId);

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
          maxPages: job?.maxPages ?? 1,
        });

        updateQueryStatus(query.id, "completed", ads.length);

        jobEvents.emit(jobId, {
          type: "query_complete",
          data: {
            locationName: query.locationName,
            adsFound: ads.length,
          },
        });

        const locationId = getLocationIdFromName(query.locationName);

        for (const ad of ads) {
          try {
            // Step 1: LP をスクレイピング
            const { text: lpText, finalUrl } = await scrapePage(ad.url);
            let contact = await extractContactInfo(lpText, { locationId });
            console.log(`[Step1] ${ad.url} → company=${contact.companyName}, phone=${contact.phoneNumber}, allPhones=${contact.allPhoneNumbers?.join(",")}`);

            // Step 2: 会社名 or 電話番号 or 代表者名が取れなければ同ドメイン内を探索
            if (!contact.companyName || !contact.phoneNumber || !contact.presidentName) {
              console.log(`[Step2] Deep scrape for ${ad.url}`);
              try {
                const companyPageText = await scrapeCompanyPages(finalUrl || ad.url);
                console.log(`[Step2] Company page text length: ${companyPageText.length}`);
                if (companyPageText) {
                  const combinedText = `${lpText}\n\n---\n\n${companyPageText}`;
                  const deepContact = await extractContactInfo(combinedText, { locationId });
                  console.log(`[Step2] Deep result → company=${deepContact.companyName}, phone=${deepContact.phoneNumber}, allPhones=${deepContact.allPhoneNumbers?.join(",")}`);
                  contact = {
                    companyName: contact.companyName || deepContact.companyName,
                    phoneNumber: contact.phoneNumber || deepContact.phoneNumber,
                    presidentName: contact.presidentName || deepContact.presidentName,
                    allPhoneNumbers: [...new Set([...(contact.allPhoneNumbers || []), ...(deepContact.allPhoneNumbers || [])])],
                  };
                }
              } catch (err) {
                console.error(`[Step2] Error:`, err);
              }
            }

            // Step 3: 会社名はあるが電話番号 or 代表者名がない → Google検索で補完
            if (contact.companyName && (!contact.phoneNumber || !contact.presidentName)) {
              console.log(`[Step3] Google search for "${contact.companyName}"`);
              try {
                const { text: searchText } = await searchCompanyPhone(contact.companyName);
                if (searchText) {
                  const searchContact = await extractContactInfo(searchText, { locationId });
                  console.log(`[Step3] Search result → phone=${searchContact.phoneNumber}, president=${searchContact.presidentName}`);
                  if (!contact.phoneNumber && searchContact.phoneNumber) {
                    contact.phoneNumber = searchContact.phoneNumber;
                  }
                  if (!contact.presidentName && searchContact.presidentName) {
                    contact.presidentName = searchContact.presidentName;
                  }
                }
              } catch (err) {
                console.error(`[Step3] Error:`, err);
              }
            }

            const extractionStatus =
              contact.companyName && contact.phoneNumber
                ? "success"
                : contact.companyName || contact.phoneNumber
                  ? "partial"
                  : lpText
                    ? "partial"
                    : "failed";

            createResult({
              jobId,
              queryId: query.id,
              adUrl: ad.url,
              landingUrl: finalUrl,
              companyName: contact.companyName ?? undefined,
              phoneNumber: contact.phoneNumber ?? undefined,
              presidentName: contact.presidentName ?? undefined,
              adHeadline: ad.headline,
              adDescription: ad.description,
              locationName: query.locationName,
              extractionStatus,
              rawPageText: lpText.slice(0, 2000),
            });

            incrementJobResults(jobId);

            jobEvents.emit(jobId, {
              type: "result_found",
              data: {
                adUrl: ad.url,
                landingUrl: finalUrl,
                companyName: contact.companyName,
                phoneNumber: contact.phoneNumber,
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
