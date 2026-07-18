CREATE TABLE `fraudReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityRef` varchar(512) NOT NULL,
	`reporterEmail` varchar(320) NOT NULL,
	`description` text NOT NULL,
	`evidence` text,
	`status` enum('pending','reviewing','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraudReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_fraudReports_status` ON `fraudReports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_fraudReports_createdAt` ON `fraudReports` (`createdAt`);