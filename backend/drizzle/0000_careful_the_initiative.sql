CREATE TABLE `feed_items` (
	`id` char(36) NOT NULL,
	`image_url` varchar(512) NOT NULL,
	`audio_url` varchar(512) NOT NULL,
	`description` varchar(100) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` char(36) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'queued',
	`error` text,
	`feed_item_id` char(36),
	`created_at` datetime NOT NULL DEFAULT (now()),
	`updated_at` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `feed_items_created_at_idx` ON `feed_items` (`created_at`);--> statement-breakpoint
CREATE INDEX `jobs_created_at_idx` ON `jobs` (`created_at`);