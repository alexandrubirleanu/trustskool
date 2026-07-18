CREATE TABLE `clicks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`referrer` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`url` varchar(512) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`description` text,
	`totalMembers` int NOT NULL DEFAULT 0,
	`priceAmountCents` int,
	`priceCurrency` varchar(8),
	`priceInterval` varchar(16),
	`logoUrl` varchar(1024),
	`language` varchar(64) NOT NULL DEFAULT 'english',
	`category` varchar(128),
	`trustSkore` double NOT NULL DEFAULT 0,
	`scoreBreakdown` json,
	`memberHistory` json,
	`priceHistory` json,
	`rankHistory` json,
	`growthRateBp` int NOT NULL DEFAULT 0,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communities_externalId_unique` UNIQUE(`externalId`),
	CONSTRAINT `communities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `ingestionRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(512) NOT NULL,
	`status` enum('success','error') NOT NULL,
	`communitiesUpserted` int NOT NULL DEFAULT 0,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingestionRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_clicks_slug` ON `clicks` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_clicks_createdAt` ON `clicks` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_communities_trustSkore` ON `communities` (`trustSkore`);--> statement-breakpoint
CREATE INDEX `idx_communities_language` ON `communities` (`language`);--> statement-breakpoint
CREATE INDEX `idx_communities_category` ON `communities` (`category`);--> statement-breakpoint
CREATE INDEX `idx_communities_totalMembers` ON `communities` (`totalMembers`);