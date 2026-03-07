CREATE TABLE `paper_trading_portfolio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`quantity` decimal(15,8) NOT NULL,
	`average_price` decimal(15,8) NOT NULL,
	`current_price` decimal(15,8) NOT NULL,
	`total_value` decimal(15,2) NOT NULL,
	`unrealized_profit` decimal(15,2) DEFAULT '0',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paper_trading_portfolio_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trading_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_name` varchar(100) NOT NULL,
	`initial_capital` decimal(15,2) NOT NULL,
	`current_balance` decimal(15,2) NOT NULL,
	`total_profit` decimal(15,2) DEFAULT '0',
	`total_loss` decimal(15,2) DEFAULT '0',
	`total_trades` int DEFAULT 0,
	`winning_trades` int DEFAULT 0,
	`losing_trades` int DEFAULT 0,
	`win_rate` decimal(5,2) DEFAULT '0',
	`roi` decimal(8,4) DEFAULT '0',
	`sharpe_ratio` decimal(8,4) DEFAULT '0',
	`max_drawdown` decimal(8,4) DEFAULT '0',
	`status` enum('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
	`start_date` timestamp NOT NULL DEFAULT (now()),
	`end_date` timestamp,
	`duration_days` int NOT NULL DEFAULT 7,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paper_trading_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trading_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL DEFAULT 'BTC/USDT',
	`trade_type` enum('buy','sell','long','short') NOT NULL,
	`entry_price` decimal(15,8) NOT NULL,
	`exit_price` decimal(15,8),
	`quantity` decimal(15,8) NOT NULL,
	`profit` decimal(15,2) DEFAULT '0',
	`profit_percent` decimal(8,4) DEFAULT '0',
	`trade_status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`confidence` decimal(5,2) DEFAULT '0',
	`entry_time` timestamp NOT NULL DEFAULT (now()),
	`exit_time` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paper_trading_trades_id` PRIMARY KEY(`id`)
);
