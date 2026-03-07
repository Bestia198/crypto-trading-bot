CREATE TABLE `agent_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_type` varchar(50) NOT NULL,
	`agent_name` varchar(100) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`learning_rate` decimal(5,4) DEFAULT '0.001',
	`stop_loss_pct` decimal(5,4) DEFAULT '0.05',
	`take_profit_pct` decimal(5,4) DEFAULT '0.1',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schedule_id` int NOT NULL,
	`agent_config_id` int NOT NULL,
	`status` enum('idle','running','paused','stopped','error') NOT NULL DEFAULT 'idle',
	`current_roi` decimal(8,4) DEFAULT '0',
	`total_trades` int DEFAULT 0,
	`winning_trades` int DEFAULT 0,
	`last_update_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`schedule_name` varchar(255) NOT NULL,
	`cron_expression` varchar(100) NOT NULL,
	`symbol` varchar(20) NOT NULL DEFAULT 'BTC/USDT',
	`initial_capital` decimal(10,2) NOT NULL,
	`agent_ids` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_executed_at` timestamp,
	`next_execution_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_schedules_id` PRIMARY KEY(`id`)
);
