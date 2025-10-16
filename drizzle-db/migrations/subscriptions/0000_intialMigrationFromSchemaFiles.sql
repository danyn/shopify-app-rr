CREATE TABLE `subscription_tracking` (
	`id` integer PRIMARY KEY NOT NULL,
	`shopify_subscription_id` text NOT NULL,
	`charge_id` text NOT NULL,
	`shop_domain` text NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`trial_days` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_tracking_shopify_subscription_id_unique` ON `subscription_tracking` (`shopify_subscription_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_tracking_shop_domain_unique` ON `subscription_tracking` (`shop_domain`);