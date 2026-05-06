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
  // 連絡先抽出時の深掘り検索回数の上限 (1〜5)。1=深掘りなし
  extractionDepth: integer("extraction_depth").notNull().default(2),
  // 深掘り検索間の遅延秒数 (5〜15、bot検知回避のため)
  interSearchDelaySec: integer("inter_search_delay_sec").notNull().default(10),
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

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
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
  // 旧 companyName は後方互換のため残置 (未使用)。新規データは Formal/Brand に書く
  companyName: text("company_name"),
  // 法人格を含む正式名称 (例: 医療法人社団○○、株式会社サンプル)
  companyNameFormal: text("company_name_formal"),
  // 通称・店舗名 (例: ○○クリニック)
  companyNameBrand: text("company_name_brand"),
  // 旧 phoneNumber は後方互換のため残置 (未使用)。新規データは phoneNumber1〜5 に書く
  phoneNumber: text("phone_number"),
  // 電話番号を優先度順 (携帯 > 市外局番 > 050 > フリーダイヤル) で最大5件
  phoneNumber1: text("phone_number1"),
  phoneNumber2: text("phone_number2"),
  phoneNumber3: text("phone_number3"),
  phoneNumber4: text("phone_number4"),
  phoneNumber5: text("phone_number5"),
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
