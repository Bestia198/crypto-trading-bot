import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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

/**
 * Trading sessions table - stores individual training episodes
 */
export const tradingSessions = mysqlTable("trading_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionName: varchar("session_name", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).default("BTC/USDT").notNull(),
  episodeNumber: int("episode_number").notNull(),
  initialFiat: decimal("initial_fiat", { precision: 10, scale: 2 }).notNull(),
  finalNetWorth: decimal("final_net_worth", { precision: 10, scale: 2 }).notNull(),
  totalROI: decimal("total_roi", { precision: 8, scale: 4 }).notNull(),
  totalTrades: int("total_trades").default(0).notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 4 }).default("0").notNull(),
  reinvestmentProfit: decimal("reinvestment_profit", { precision: 10, scale: 2 }).default("0").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TradingSession = typeof tradingSessions.$inferSelect;
export type InsertTradingSession = typeof tradingSessions.$inferInsert;

/**
 * Agent performance metrics table - stores metrics for each agent per session
 */
export const agentMetrics = mysqlTable("agent_metrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // 'RL', 'DeepSeek', 'Momentum', 'MeanReversion', 'Consensus'
  roi: decimal("roi", { precision: 8, scale: 4 }).notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 4 }).notNull(),
  tradesCount: int("trades_count").default(0).notNull(),
  kycVerified: boolean("kyc_verified").default(false).notNull(),
  reinvestmentProfit: decimal("reinvestment_profit", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;

/**
 * Transaction history table - stores individual trades
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'buy', 'sell', 'short', 'close_short', 'deposit', 'withdraw'
  amount: decimal("amount", { precision: 10, scale: 6 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Portfolio snapshots table - stores portfolio state at different points in time
 */
export const portfolioSnapshots = mysqlTable("portfolio_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  fiatBalance: decimal("fiat_balance", { precision: 10, scale: 2 }).notNull(),
  cryptoBalance: decimal("crypto_balance", { precision: 10, scale: 6 }).notNull(),
  shortPosition: decimal("short_position", { precision: 10, scale: 6 }).default("0").notNull(),
  netWorth: decimal("net_worth", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;

/**
 * User settings/preferences table
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  theme: varchar("theme", { length: 20 }).default("light").notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  defaultSymbol: varchar("default_symbol", { length: 20 }).default("BTC/USDT").notNull(),
  defaultInitialFiat: decimal("default_initial_fiat", { precision: 10, scale: 2 }).default("20").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
