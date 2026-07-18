CREATE TABLE `adminOtps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminOtps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_adminOtps_email` ON `adminOtps` (`email`);--> statement-breakpoint
CREATE INDEX `idx_adminOtps_expiresAt` ON `adminOtps` (`expiresAt`);