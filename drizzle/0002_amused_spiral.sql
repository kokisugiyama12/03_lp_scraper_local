ALTER TABLE `search_jobs` ADD `extraction_depth` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `search_jobs` ADD `inter_search_delay_sec` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `search_results` ADD `company_name_formal` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `company_name_brand` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `phone_number1` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `phone_number2` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `phone_number3` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `phone_number4` text;--> statement-breakpoint
ALTER TABLE `search_results` ADD `phone_number5` text;