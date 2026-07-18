ALTER TABLE `communities` ADD `updateTier` enum('hot','warm','cold') DEFAULT 'cold' NOT NULL;--> statement-breakpoint
ALTER TABLE `communities` ADD `lastScrapedAt` timestamp;