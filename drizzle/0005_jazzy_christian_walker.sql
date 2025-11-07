CREATE TABLE `wallet_balance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_balance` decimal(15,2) DEFAULT '0',
	`available_balance` decimal(15,2) DEFAULT '0',
	`locked_balance` decimal(15,2) DEFAULT '0',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_balance_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_balance_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`transaction_type` enum('deposit','withdrawal') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USDT',
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
