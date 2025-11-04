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