import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const searchJobs = sqliteTable("search_jobs", {
  id: text("id").primaryKey(),
  keyword: text("keyword").notNull(),
  locationsJson: text("locations_json").notNull(),
  spreadsheetId: text("spreadsheet_id"),
  status: text("status").notNull().default("pending"),
  totalQueries: integer("total_queries").notNull().default(0),
  completedQueries: integer("completed_queries").notNull().default(0),
  totalResults: integer("total_results").notNull().default(0),
  errorMessage: text("error_message"),
  maxPages: integer("max_pages").notNull().default(1),
  exportedAt: text("exported_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const searchQueries = sqliteTable("search_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => searchJobs.id),
  locationName: text("location_name").notNull(),
  searchQuery: text("search_query").notNull(),
  status: text("status").notNull().default("pending"),
  adsFound: integer("ads_found").notNull().default(0),
  geoHeader: text("geo_header"),
  completedAt: text("completed_at"),
});

export const oauthSessions = sqliteTable("oauth_sessions", {
  id: text("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: text("expires_at").notNull(),
  email: text("email"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const exportHistory = sqliteTable("export_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  spreadsheetId: text("spreadsheet_id").notNull(),
  spreadsheetName: text("spreadsheet_name"),
  lastExportedAt: text("last_exported_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const searchResults = sqliteTable("search_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => searchJobs.id),
  queryId: integer("query_id")
    .notNull()
    .references(() => searchQueries.id),
  adUrl: text("ad_url").notNull(),
  landingUrl: text("landing_url"),
  companyName: text("company_name"),
  phoneNumber: text("phone_number"),
  presidentName: text("president_name"),
  adHeadline: text("ad_headline"),
  adDescription: text("ad_description"),
  locationName: text("location_name").notNull(),
  extractionStatus: text("extraction_status").notNull().default("pending"),
  rawPageText: text("raw_page_text"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
