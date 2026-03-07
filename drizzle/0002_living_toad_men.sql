CREATE TABLE `agent_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_type` varchar(50) NOT NULL,
	`agent_name` varchar(100) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`learning_rate` decimal(5,4) DEFAULT '0.001',
	`gamma` decimal(5,4) DEFAULT '0.99',
	`epsilon` decimal(5,4) DEFAULT '1.0',
	`epsilon_decay` decimal(5,4) DEFAULT '0.995',
	`rsi_period` int DEFAULT 14,
	`macd_fast_period` int DEFAULT 12,
	`macd_slow_period` int DEFAULT 26,
	`stop_loss_pct` decimal(5,4) DEFAULT '0.05',
	`take_profit_pct` decimal(5,4) DEFAULT '0.1',
	`max_position_size` decimal(10,6) DEFAULT '1',
	`custom_config` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_configurations_id` PRIMARY KEY(`id`)
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
	`agent_weights` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_executed_at` timestamp,
	`next_execution_at` timestamp,
	`max_concurrent_sessions` int DEFAULT 1,
	`stop_loss_percentage` decimal(5,4) DEFAULT '0.05',
	`take_profit_percentage` decimal(5,4) DEFAULT '0.1',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autonomous_agent_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schedule_id` int NOT NULL,
	`session_id` int,
	`agent_config_id` int NOT NULL,
	`status` enum('idle','running','paused','stopped','error') NOT NULL DEFAULT 'idle',
	`current_position` varchar(50),
	`current_roi` decimal(8,4) DEFAULT '0',
	`total_trades` int DEFAULT 0,
	`winning_trades` int DEFAULT 0,
	`losing_trades` int DEFAULT 0,
	`fiat_balance` decimal(10,2) DEFAULT '0',
	`crypto_balance` decimal(10,6) DEFAULT '0',
	`started_at` timestamp,
	`last_update_at` timestamp NOT NULL DEFAULT (now()),
	`stopped_at` timestamp,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `autonomous_agent_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hybrid_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`strategy_name` varchar(255) NOT NULL,
	`description` text,
	`agent_configurations` json NOT NULL,
	`consensus_threshold` decimal(5,4) DEFAULT '0.5',
	`total_sessions` int DEFAULT 0,
	`average_roi` decimal(8,4) DEFAULT '0',
	`best_roi` decimal(8,4) DEFAULT '0',
	`worst_roi` decimal(8,4) DEFAULT '0',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hybrid_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`schedule_id` int,
	`alert_type` enum('agent_started','agent_stopped','trade_executed','stop_loss_triggered','take_profit_triggered','error_occurred','roi_threshold_reached','high_volatility_detected') NOT NULL,
	`message` text NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`related_data` json,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_alerts_id` PRIMARY KEY(`id`)
);
