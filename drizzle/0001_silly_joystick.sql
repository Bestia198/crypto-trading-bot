CREATE TABLE `agent_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`agent_name` varchar(100) NOT NULL,
	`agent_type` varchar(50) NOT NULL,
	`roi` decimal(8,4) NOT NULL,
	`win_rate` decimal(5,4) NOT NULL,
	`trades_count` int NOT NULL DEFAULT 0,
	`kyc_verified` boolean NOT NULL DEFAULT false,
	`reinvestment_profit` decimal(10,2) NOT NULL DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`agent_name` varchar(100) NOT NULL,
	`fiat_balance` decimal(10,2) NOT NULL,
	`crypto_balance` decimal(10,6) NOT NULL,
	`short_position` decimal(10,6) NOT NULL DEFAULT '0',
	`net_worth` decimal(10,2) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_name` varchar(255) NOT NULL,
	`symbol` varchar(20) NOT NULL DEFAULT 'BTC/USDT',
	`episode_number` int NOT NULL,
	`initial_fiat` decimal(10,2) NOT NULL,
	`final_net_worth` decimal(10,2) NOT NULL,
	`total_roi` decimal(8,4) NOT NULL,
	`total_trades` int NOT NULL DEFAULT 0,
	`win_rate` decimal(5,4) NOT NULL DEFAULT '0',
	`reinvestment_profit` decimal(10,2) NOT NULL DEFAULT '0',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`agent_name` varchar(100) NOT NULL,
	`transaction_type` varchar(50) NOT NULL,
	`amount` decimal(10,6) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`fee` decimal(10,2) NOT NULL DEFAULT '0',
	`description` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`theme` varchar(20) NOT NULL DEFAULT 'light',
	`notifications_enabled` boolean NOT NULL DEFAULT true,
	`default_symbol` varchar(20) NOT NULL DEFAULT 'BTC/USDT',
	`default_initial_fiat` decimal(10,2) NOT NULL DEFAULT '20',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_id_unique` UNIQUE(`user_id`)
);
