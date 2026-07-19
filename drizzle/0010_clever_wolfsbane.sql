CREATE TABLE `categoryRankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(128) NOT NULL,
	`rankPosition` int NOT NULL,
	`communitySlug` varchar(191) NOT NULL,
	`snapshotMonth` varchar(7) NOT NULL,
	`trustSkoreAtSnapshot` double NOT NULL,
	`totalMembersAtSnapshot` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categoryRankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentPages` MODIFY COLUMN `type` enum('founder','review','category','guide','pillar','faq','skool-news','strategy') NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_categoryRankings_category_month` ON `categoryRankings` (`category`,`snapshotMonth`);--> statement-breakpoint
CREATE INDEX `idx_categoryRankings_communitySlug` ON `categoryRankings` (`communitySlug`);--> statement-breakpoint
CREATE INDEX `idx_categoryRankings_snapshotMonth` ON `categoryRankings` (`snapshotMonth`);