ALTER TABLE `communities` ADD `ownerSkoolJoinedAt` timestamp;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerLastActiveAt` timestamp;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerActiveDaysLast30` int;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerActiveDaysLast90` int;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerTotalContributions` int;--> statement-breakpoint
ALTER TABLE `communities` ADD `ownerTotalFollowers` int;