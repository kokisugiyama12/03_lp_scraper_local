CREATE TABLE `export_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spreadsheet_id` text NOT NULL,
	`spreadsheet_name` text,
	`last_exported_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `search_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`keyword` text NOT NULL,
	`locations_json` text NOT NULL,
	`spreadsheet_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_queries` integer DEFAULT 0 NOT NULL,
	`completed_queries` integer DEFAULT 0 NOT NULL,
	`total_results` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`max_pages` integer DEFAULT 1 NOT NULL,
	`exported_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `search_queries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`location_name` text NOT NULL,
	`search_query` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ads_found` integer DEFAULT 0 NOT NULL,
	`geo_header` text,
	`completed_at` text,
	FOREIGN KEY (`job_id`) REFERENCES `search_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `search_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`query_id` integer NOT NULL,
	`ad_url` text NOT NULL,
	`landing_url` text,
	`company_name` text,
	`phone_number` text,
	`president_name` text,
	`ad_headline` text,
	`ad_description` text,
	`location_name` text NOT NULL,
	`extraction_status` text DEFAULT 'pending' NOT NULL,
	`raw_page_text` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `search_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`query_id`) REFERENCES `search_queries`(`id`) ON UPDATE no action ON DELETE no action
);
