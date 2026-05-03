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
  completedAt: text("completed_at"),
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
  locationName: text("location_name").notNull(),
  extractionStatus: text("extraction_status").notNull().default("pending"),
  rawPageText: text("raw_page_text"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
