ALTER TABLE `contentPages` MODIFY COLUMN `type` enum('founder','review','category','guide','pillar','faq','skool-news') NOT NULL;--> statement-breakpoint
ALTER TABLE `communities` ADD `aflPercent` double;--> statement-breakpoint
ALTER TABLE `communities` ADD `mrrStatus` varchar(32);--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerName` varchar(255);--> statement-breakpoint
ALTER TABLE `communities` ADD `active30dStreak` int;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerJoined` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerJoinedAt` timestamp;