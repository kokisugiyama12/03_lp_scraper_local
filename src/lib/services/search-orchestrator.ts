import { searchGoogleAds } from "@/lib/scraper/google-search";
import { scrapePage } from "@/lib/scraper/page-scraper";
import { extractContactInfo } from "@/lib/ai/extract-contact";
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
        const ads = await searchGoogleAds(query.searchQuery);

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
            const { text, finalUrl } = await scrapePage(ad.url);
            const contact = await extractContactInfo(text);

            const extractionStatus =
              contact.phoneNumber || contact.presidentName
                ? contact.phoneNumber && contact.presidentName
                  ? "success"
                  : "partial"
                : text
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
              locationName: query.locationName,
              extractionStatus,
              rawPageText: text.slice(0, 2000),
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
