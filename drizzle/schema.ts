import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Automation & Autonomous Agents Tables

export const agentConfigs = mysqlTable("agent_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  learningRate: decimal("learning_rate", { precision: 5, scale: 4 }).default("0.001"),
  stopLossPct: decimal("stop_loss_pct", { precision: 5, scale: 4 }).default("0.05"),
  takeProfitPct: decimal("take_profit_pct", { precision: 5, scale: 4 }).default("0.1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type InsertAgentConfig = typeof agentConfigs.$inferInsert;

export const automationSchedules = mysqlTable("automation_schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  scheduleName: varchar("schedule_name", { length: 255 }).notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).default("BTC/USDT").notNull(),
  initialCapital: decimal("initial_capital", { precision: 10, scale: 2 }).notNull(),
  agentIds: json("agent_ids").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastExecutedAt: timestamp("last_executed_at"),
  nextExecutionAt: timestamp("next_execution_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AutomationSchedule = typeof automationSchedules.$inferSelect;
export type InsertAutomationSchedule = typeof automationSchedules.$inferInsert;

export const agentStatus = mysqlTable("agent_status", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("schedule_id").notNull(),
  agentConfigId: int("agent_config_id").notNull(),
  status: mysqlEnum("status", ["idle", "running", "paused", "stopped", "error"]).default("idle").notNull(),
  currentROI: decimal("current_roi", { precision: 8, scale: 4 }).default("0"),
  totalTrades: int("total_trades").default(0),
  winningTrades: int("winning_trades").default(0),
  lastUpdateAt: timestamp("last_update_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = typeof agentStatus.$inferInsert;

// Wallet Management Tables

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  transactionType: mysqlEnum("transaction_type", ["deposit", "withdrawal"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USDT").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

export const walletBalance = mysqlTable("wallet_balance", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  totalBalance: decimal("total_balance", { precision: 15, scale: 2 }).default("0"),
  availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).default("0"),
  lockedBalance: decimal("locked_balance", { precision: 15, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WalletBalance = typeof walletBalance.$inferSelect;
export type InsertWalletBalance = typeof walletBalance.$inferInsert;


// Agent Execution & Trading Results Tables

export const agentExecutions = mysqlTable("agent_executions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id").notNull(),
  scheduleId: int("schedule_id"),
  status: mysqlEnum("status", ["running", "stopped", "paused", "completed", "error"]).default("stopped").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  totalTrades: int("total_trades").default(0),
  winningTrades: int("winning_trades").default(0),
  losingTrades: int("losing_trades").default(0),
  totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default("0"),
  totalLoss: decimal("total_loss", { precision: 15, scale: 2 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentExecution = typeof agentExecutions.$inferSelect;
export type InsertAgentExecution = typeof agentExecutions.$inferInsert;

export const tradingResults = mysqlTable("trading_results", {
  id: int("id").autoincrement().primaryKey(),
  executionId: int("execution_id").notNull(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).default("BTC/USDT").notNull(),
  entryPrice: decimal("entry_price", { precision: 15, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 15, scale: 8 }),
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  profit: decimal("profit", { precision: 15, scale: 2 }).default("0"),
  profitPercent: decimal("profit_percent", { precision: 8, scale: 4 }).default("0"),
  tradeType: mysqlEnum("trade_type", ["buy", "sell", "long", "short"]).notNull(),
  status: mysqlEnum("trade_status", ["open", "closed", "cancelled"]).default("open").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"),
  entryTime: timestamp("entry_time").defaultNow().notNull(),
  exitTime: timestamp("exit_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TradingResult = typeof tradingResults.$inferSelect;
export type InsertTradingResult = typeof tradingResults.$inferInsert;

export const portfolioAssets = mysqlTable("portfolio_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
  averagePrice: decimal("average_price", { precision: 15, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 8 }).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  unrealizedProfit: decimal("unrealized_profit", { precision: 15, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioAsset = typeof portfolioAssets.$inferSelect;
export type InsertPortfolioAsset = typeof portfolioAssets.$inferInsert;
