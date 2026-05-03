import { getDb } from "./index";
import { searchJobs, searchQueries, searchResults, oauthSessions } from "./schema";
import { eq, desc } from "drizzle-orm";

export function createJob(job: {
  id: string;
  keyword: string;
  locationsJson: string;
  spreadsheetId?: string;
  totalQueries: number;
  maxPages?: number;
}) {
  getDb().insert(searchJobs).values({
    id: job.id,
    keyword: job.keyword,
    locationsJson: job.locationsJson,
    spreadsheetId: job.spreadsheetId ?? null,
    totalQueries: job.totalQueries,
    maxPages: job.maxPages ?? 1,
  }).run();
}

export function getJob(id: string) {
  return getDb().select().from(searchJobs).where(eq(searchJobs.id, id)).get();
}

export function listJobs(limit = 20) {
  return getDb()
    .select()
    .from(searchJobs)
    .orderBy(desc(searchJobs.createdAt))
    .limit(limit)
    .all();
}

export function updateJobStatus(
  id: string,
  status: string,
  extra?: Partial<{
    completedQueries: number;
    totalResults: number;
    errorMessage: string;
    exportedAt: string;
    spreadsheetId: string;
  }>
) {
  getDb()
    .update(searchJobs)
    .set({
      status,
      updatedAt: new Date().toISOString(),
      ...extra,
    })
    .where(eq(searchJobs.id, id))
    .run();
}

export function incrementJobProgress(id: string) {
  const job = getJob(id);
  if (!job) return;
  getDb()
    .update(searchJobs)
    .set({
      completedQueries: job.completedQueries + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(searchJobs.id, id))
    .run();
}

export function incrementJobResults(id: string) {
  const job = getJob(id);
  if (!job) return;
  getDb()
    .update(searchJobs)
    .set({
      totalResults: job.totalResults + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(searchJobs.id, id))
    .run();
}

export function createSearchQueries(
  queries: {
    jobId: string;
    locationName: string;
    searchQuery: string;
    geoHeader?: string | null;
  }[]
) {
  getDb().insert(searchQueries).values(queries).run();
}

export function getQueriesForJob(jobId: string) {
  return getDb()
    .select()
    .from(searchQueries)
    .where(eq(searchQueries.jobId, jobId))
    .all();
}

export function updateQueryStatus(
  id: number,
  status: string,
  adsFound?: number
) {
  getDb()
    .update(searchQueries)
    .set({
      status,
      adsFound: adsFound ?? 0,
      completedAt: status === "completed" ? new Date().toISOString() : null,
    })
    .where(eq(searchQueries.id, id))
    .run();
}

export function createResult(result: {
  jobId: string;
  queryId: number;
  adUrl: string;
  landingUrl?: string;
  companyName?: string;
  phoneNumber?: string;
  presidentName?: string;
  adHeadline?: string;
  locationName: string;
  extractionStatus: string;
  rawPageText?: string;
}) {
  getDb().insert(searchResults).values({
    jobId: result.jobId,
    queryId: result.queryId,
    adUrl: result.adUrl,
    landingUrl: result.landingUrl ?? null,
    companyName: result.companyName ?? null,
    phoneNumber: result.phoneNumber ?? null,
    presidentName: result.presidentName ?? null,
    adHeadline: result.adHeadline ?? null,
    locationName: result.locationName,
    extractionStatus: result.extractionStatus,
    rawPageText: result.rawPageText ?? null,
  }).run();
}

export function getResultsForJob(jobId: string) {
  return getDb()
    .select()
    .from(searchResults)
    .where(eq(searchResults.jobId, jobId))
    .all();
}

export function upsertOAuthSession(session: {
  id: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt: string;
  email?: string | null;
}) {
  const existing = getDb()
    .select()
    .from(oauthSessions)
    .where(eq(oauthSessions.id, session.id))
    .get();

  if (existing) {
    getDb()
      .update(oauthSessions)
      .set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken ?? existing.refreshToken,
        expiresAt: session.expiresAt,
        email: session.email ?? existing.email,
      })
      .where(eq(oauthSessions.id, session.id))
      .run();
  } else {
    getDb()
      .insert(oauthSessions)
      .values({
        id: session.id,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken ?? null,
        expiresAt: session.expiresAt,
        email: session.email ?? null,
      })
      .run();
  }
}

export function getOAuthSession(id: string) {
  return getDb()
    .select()
    .from(oauthSessions)
    .where(eq(oauthSessions.id, id))
    .get();
}

export function deleteOAuthSession(id: string) {
  getDb()
    .delete(oauthSessions)
    .where(eq(oauthSessions.id, id))
    .run();
}
