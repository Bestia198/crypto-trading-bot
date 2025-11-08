CREATE TABLE `agent_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`schedule_id` int,
	`status` enum('running','stopped','paused','completed','error') NOT NULL DEFAULT 'stopped',
	`start_time` timestamp,
	`end_time` timestamp,
	`total_trades` int DEFAULT 0,
	`winning_trades` int DEFAULT 0,
	`losing_trades` int DEFAULT 0,
	`total_profit` decimal(15,2) DEFAULT '0',
	`total_loss` decimal(15,2) DEFAULT '0',
	`win_rate` decimal(5,2) DEFAULT '0',
	`confidence` decimal(5,2) DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`quantity` decimal(15,8) NOT NULL,
	`average_price` decimal(15,8) NOT NULL,
	`current_price` decimal(15,8) NOT NULL,
	`total_value` decimal(15,2) NOT NULL,
	`unrealized_profit` decimal(15,2) DEFAULT '0',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_assets_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `trading_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`execution_id` int NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL DEFAULT 'BTC/USDT',
	`entry_price` decimal(15,8) NOT NULL,
	`exit_price` decimal(15,8),
	`quantity` decimal(15,8) NOT NULL,
	`profit` decimal(15,2) DEFAULT '0',
	`profit_percent` decimal(8,4) DEFAULT '0',
	`trade_type` enum('buy','sell','long','short') NOT NULL,
	`trade_status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`confidence` decimal(5,2) DEFAULT '0',
	`entry_time` timestamp NOT NULL DEFAULT (now()),
	`exit_time` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_results_id` PRIMARY KEY(`id`)
);
