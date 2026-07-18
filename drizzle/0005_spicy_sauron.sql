CREATE TABLE `contentPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`type` enum('founder','category','guide','pillar','faq','skool-news') NOT NULL,
	`title` varchar(512) NOT NULL,
	`metaDescription` text,
	`bodyHtml` text NOT NULL,
	`frontmatter` json,
	`wordCount` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentPages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_contentPages_type` ON `contentPages` (`type`);--> statement-breakpoint
CREATE INDEX `idx_contentPages_slug_type` ON `contentPages` (`slug`,`type`);--> statement-breakpoint
CREATE INDEX `idx_contentPages_publishedAt` ON `contentPages` (`publishedAt`);