CREATE TABLE `ownerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handle` varchar(128) NOT NULL,
	`firstName` varchar(128),
	`lastName` varchar(128),
	`mrrStatus` enum('none','clover','rocket','crown','diamond','red_diamond','goated'),
	`activityStatus` varchar(64),
	`ownedCommunities` json,
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ownerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `ownerProfiles_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE INDEX `idx_ownerProfiles_handle` ON `ownerProfiles` (`handle`);