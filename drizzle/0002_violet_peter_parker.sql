ALTER TABLE `communities` ADD `isFlagged` enum('caution','warning');--> statement-breakpoint
ALTER TABLE `communities` ADD `flagReason` text;