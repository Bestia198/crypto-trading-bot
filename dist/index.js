var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agentConfigs: () => agentConfigs,
  agentExecutions: () => agentExecutions,
  agentStatus: () => agentStatus,
  automationSchedules: () => automationSchedules,
  paperTradingPortfolio: () => paperTradingPortfolio,
  paperTradingSessions: () => paperTradingSessions,
  paperTradingTrades: () => paperTradingTrades,
  portfolioAssets: () => portfolioAssets,
  tradingResults: () => tradingResults,
  users: () => users,
  walletBalance: () => walletBalance,
  walletTransactions: () => walletTransactions
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
var users, agentConfigs, automationSchedules, agentStatus, walletTransactions, walletBalance, agentExecutions, tradingResults, portfolioAssets, paperTradingSessions, paperTradingTrades, paperTradingPortfolio;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
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
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    agentConfigs = mysqlTable("agent_configs", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull(),
      agentType: varchar("agent_type", { length: 50 }).notNull(),
      agentName: varchar("agent_name", { length: 100 }).notNull(),
      isEnabled: boolean("is_enabled").default(true).notNull(),
      learningRate: decimal("learning_rate", { precision: 5, scale: 4 }).default("0.001"),
      stopLossPct: decimal("stop_loss_pct", { precision: 5, scale: 4 }).default("0.05"),
      takeProfitPct: decimal("take_profit_pct", { precision: 5, scale: 4 }).default("0.1"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    automationSchedules = mysqlTable("automation_schedules", {
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
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    agentStatus = mysqlTable("agent_status", {
      id: int("id").autoincrement().primaryKey(),
      scheduleId: int("schedule_id").notNull(),
      agentConfigId: int("agent_config_id").notNull(),
      status: mysqlEnum("status", ["idle", "running", "paused", "stopped", "error"]).default("idle").notNull(),
      currentROI: decimal("current_roi", { precision: 8, scale: 4 }).default("0"),
      totalTrades: int("total_trades").default(0),
      winningTrades: int("winning_trades").default(0),
      lastUpdateAt: timestamp("last_update_at").defaultNow().notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    walletTransactions = mysqlTable("wallet_transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull(),
      transactionType: mysqlEnum("transaction_type", ["deposit", "withdrawal"]).notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      currency: varchar("currency", { length: 10 }).default("USDT").notNull(),
      status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    walletBalance = mysqlTable("wallet_balance", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull().unique(),
      totalBalance: decimal("total_balance", { precision: 15, scale: 2 }).default("0"),
      availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).default("0"),
      lockedBalance: decimal("locked_balance", { precision: 15, scale: 2 }).default("0"),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    agentExecutions = mysqlTable("agent_executions", {
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
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    tradingResults = mysqlTable("trading_results", {
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
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    portfolioAssets = mysqlTable("portfolio_assets", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull().unique(),
      symbol: varchar("symbol", { length: 20 }).notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
      averagePrice: decimal("average_price", { precision: 15, scale: 8 }).notNull(),
      currentPrice: decimal("current_price", { precision: 15, scale: 8 }).notNull(),
      totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
      unrealizedProfit: decimal("unrealized_profit", { precision: 15, scale: 2 }).default("0"),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    paperTradingSessions = mysqlTable("paper_trading_sessions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull(),
      sessionName: varchar("session_name", { length: 100 }).notNull(),
      initialCapital: decimal("initial_capital", { precision: 15, scale: 2 }).notNull(),
      currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull(),
      totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default("0"),
      totalLoss: decimal("total_loss", { precision: 15, scale: 2 }).default("0"),
      totalTrades: int("total_trades").default(0),
      winningTrades: int("winning_trades").default(0),
      losingTrades: int("losing_trades").default(0),
      winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
      roi: decimal("roi", { precision: 8, scale: 4 }).default("0"),
      sharpeRatio: decimal("sharpe_ratio", { precision: 8, scale: 4 }).default("0"),
      maxDrawdown: decimal("max_drawdown", { precision: 8, scale: 4 }).default("0"),
      status: mysqlEnum("status", ["active", "completed", "paused", "cancelled"]).default("active").notNull(),
      startDate: timestamp("start_date").defaultNow().notNull(),
      endDate: timestamp("end_date"),
      durationDays: int("duration_days").default(7).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    paperTradingTrades = mysqlTable("paper_trading_trades", {
      id: int("id").autoincrement().primaryKey(),
      sessionId: int("session_id").notNull(),
      userId: int("user_id").notNull(),
      symbol: varchar("symbol", { length: 20 }).default("BTC/USDT").notNull(),
      tradeType: mysqlEnum("trade_type", ["buy", "sell", "long", "short"]).notNull(),
      entryPrice: decimal("entry_price", { precision: 15, scale: 8 }).notNull(),
      exitPrice: decimal("exit_price", { precision: 15, scale: 8 }),
      quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
      profit: decimal("profit", { precision: 15, scale: 2 }).default("0"),
      profitPercent: decimal("profit_percent", { precision: 8, scale: 4 }).default("0"),
      status: mysqlEnum("trade_status", ["open", "closed", "cancelled"]).default("open").notNull(),
      confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"),
      entryTime: timestamp("entry_time").defaultNow().notNull(),
      exitTime: timestamp("exit_time"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    paperTradingPortfolio = mysqlTable("paper_trading_portfolio", {
      id: int("id").autoincrement().primaryKey(),
      sessionId: int("session_id").notNull(),
      userId: int("user_id").notNull(),
      symbol: varchar("symbol", { length: 20 }).notNull(),
      quantity: decimal("quantity", { precision: 15, scale: 8 }).notNull(),
      averagePrice: decimal("average_price", { precision: 15, scale: 8 }).notNull(),
      currentPrice: decimal("current_price", { precision: 15, scale: 8 }).notNull(),
      totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
      unrealizedProfit: decimal("unrealized_profit", { precision: 15, scale: 2 }).default("0"),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/automationDb.ts
var automationDb_exports = {};
__export(automationDb_exports, {
  closeTradingResult: () => closeTradingResult,
  createAgentConfig: () => createAgentConfig,
  createAutomationSchedule: () => createAutomationSchedule,
  createTradingResult: () => createTradingResult,
  createWalletTransaction: () => createWalletTransaction,
  deleteAutomationSchedule: () => deleteAutomationSchedule,
  getAgentConfigsByUserId: () => getAgentConfigsByUserId,
  getAgentExecutions: () => getAgentExecutions,
  getAgentStatusByScheduleId: () => getAgentStatusByScheduleId,
  getAutomationSchedulesByUserId: () => getAutomationSchedulesByUserId,
  getPortfolioAssets: () => getPortfolioAssets,
  getTradingResults: () => getTradingResults,
  getTradingResultsByExecution: () => getTradingResultsByExecution,
  getWalletBalance: () => getWalletBalance,
  getWalletTransactions: () => getWalletTransactions,
  startAgentExecution: () => startAgentExecution,
  stopAgentExecution: () => stopAgentExecution,
  toggleAutomationSchedule: () => toggleAutomationSchedule,
  updateAgentExecutionMetrics: () => updateAgentExecutionMetrics,
  updateAgentStatus: () => updateAgentStatus,
  updatePortfolioAsset: () => updatePortfolioAsset,
  updateWalletBalance: () => updateWalletBalance
});
import { eq as eq3 } from "drizzle-orm";
async function getAgentConfigsByUserId(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(agentConfigs).where(eq3(agentConfigs.userId, userId));
}
async function createAgentConfig(config) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(agentConfigs).values({
    userId: config.userId,
    agentType: config.agentType,
    agentName: config.agentName,
    learningRate: config.learningRate?.toString(),
    stopLossPct: config.stopLossPct?.toString(),
    takeProfitPct: config.takeProfitPct?.toString()
  });
}
async function getAutomationSchedulesByUserId(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(automationSchedules).where(eq3(automationSchedules.userId, userId));
}
async function createAutomationSchedule(schedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(automationSchedules).values({
    userId: schedule.userId,
    scheduleName: schedule.scheduleName,
    cronExpression: schedule.cronExpression,
    symbol: schedule.symbol,
    initialCapital: schedule.initialCapital.toString(),
    agentIds: JSON.stringify(schedule.agentIds)
  });
}
async function toggleAutomationSchedule(scheduleId, isActive) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(automationSchedules).set({ isActive }).where(eq3(automationSchedules.id, scheduleId));
}
async function deleteAutomationSchedule(scheduleId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agentStatus).where(eq3(agentStatus.scheduleId, scheduleId));
  return await db.delete(automationSchedules).where(eq3(automationSchedules.id, scheduleId));
}
async function getAgentStatusByScheduleId(scheduleId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(agentStatus).where(eq3(agentStatus.scheduleId, scheduleId));
}
async function updateAgentStatus(statusId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(agentStatus).set(updates).where(eq3(agentStatus.id, statusId));
}
async function getWalletBalance(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { walletBalance: walletBalance3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(walletBalance3).where(eq3(walletBalance3.userId, userId)).limit(1);
}
async function getWalletTransactions(userId, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { walletTransactions: walletTransactions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(walletTransactions2).where(eq3(walletTransactions2.userId, userId)).orderBy((t2) => t2.createdAt).limit(limit);
}
async function createWalletTransaction(transaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { walletTransactions: walletTransactions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.insert(walletTransactions2).values({
    userId: transaction.userId,
    transactionType: transaction.transactionType,
    amount: transaction.amount.toString(),
    currency: transaction.currency || "USDT",
    description: transaction.description,
    status: "completed"
  });
}
async function updateWalletBalance(userId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { walletBalance: walletBalance3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const updateData = {};
  if (updates.totalBalance !== void 0) {
    updateData.totalBalance = updates.totalBalance.toString();
  }
  if (updates.availableBalance !== void 0) {
    updateData.availableBalance = updates.availableBalance.toString();
  }
  if (updates.lockedBalance !== void 0) {
    updateData.lockedBalance = updates.lockedBalance.toString();
  }
  return await db.update(walletBalance3).set(updateData).where(eq3(walletBalance3.userId, userId));
}
async function startAgentExecution(execution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { agentExecutions: agentExecutions5, agentConfigs: agentConfigs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(agentConfigs2).set({ isEnabled: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(agentConfigs2.id, execution.agentId));
  return await db.insert(agentExecutions5).values({
    userId: execution.userId,
    agentId: execution.agentId,
    scheduleId: execution.scheduleId,
    status: "running",
    startTime: /* @__PURE__ */ new Date()
  });
}
async function stopAgentExecution(agentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { agentExecutions: agentExecutions5, agentConfigs: agentConfigs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(agentConfigs2).set({ isEnabled: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(agentConfigs2.id, agentId));
  return await db.update(agentExecutions5).set({ status: "stopped", endTime: /* @__PURE__ */ new Date() }).where(eq3(agentExecutions5.agentId, agentId));
}
async function getAgentExecutions(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { agentExecutions: agentExecutions5 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(agentExecutions5).where(eq3(agentExecutions5.userId, userId));
}
async function updateAgentExecutionMetrics(executionId, metrics) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { agentExecutions: agentExecutions5 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const updateData = {};
  if (metrics.totalTrades !== void 0) updateData.totalTrades = metrics.totalTrades;
  if (metrics.winningTrades !== void 0) updateData.winningTrades = metrics.winningTrades;
  if (metrics.losingTrades !== void 0) updateData.losingTrades = metrics.losingTrades;
  if (metrics.totalProfit !== void 0) updateData.totalProfit = metrics.totalProfit.toString();
  if (metrics.totalLoss !== void 0) updateData.totalLoss = metrics.totalLoss.toString();
  if (metrics.winRate !== void 0) updateData.winRate = metrics.winRate.toString();
  if (metrics.confidence !== void 0) updateData.confidence = metrics.confidence.toString();
  return await db.update(agentExecutions5).set(updateData).where(eq3(agentExecutions5.id, executionId));
}
async function createTradingResult(result) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tradingResults: tradingResults2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.insert(tradingResults2).values({
    executionId: result.executionId,
    userId: result.userId,
    agentId: result.agentId,
    symbol: result.symbol,
    entryPrice: result.entryPrice.toString(),
    quantity: result.quantity.toString(),
    tradeType: result.tradeType,
    confidence: result.confidence.toString(),
    notes: result.notes
  });
}
async function closeTradingResult(resultId, exitPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tradingResults: tradingResults2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(tradingResults2).where(eq3(tradingResults2.id, resultId)).limit(1);
  if (!result[0]) throw new Error("Trading result not found");
  const entry = parseFloat(result[0].entryPrice.toString());
  const qty = parseFloat(result[0].quantity.toString());
  const profit = (exitPrice - entry) * qty;
  const profitPercent = (exitPrice - entry) / entry * 100;
  return await db.update(tradingResults2).set({
    exitPrice: exitPrice.toString(),
    exitTime: /* @__PURE__ */ new Date(),
    status: "closed",
    profit: profit.toString(),
    profitPercent: profitPercent.toString()
  }).where(eq3(tradingResults2.id, resultId));
}
async function getTradingResults(userId, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tradingResults: tradingResults2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(tradingResults2).where(eq3(tradingResults2.userId, userId)).orderBy((t2) => t2.createdAt).limit(limit);
}
async function getTradingResultsByExecution(executionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { tradingResults: tradingResults2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(tradingResults2).where(eq3(tradingResults2.executionId, executionId));
}
async function getPortfolioAssets(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { portfolioAssets: portfolioAssets2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(portfolioAssets2).where(eq3(portfolioAssets2.userId, userId));
}
async function updatePortfolioAsset(userId, asset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { portfolioAssets: portfolioAssets2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const totalValue = asset.quantity * asset.currentPrice;
  const unrealizedProfit = (asset.currentPrice - asset.averagePrice) * asset.quantity;
  return await db.insert(portfolioAssets2).values({
    userId,
    symbol: asset.symbol,
    quantity: asset.quantity.toString(),
    averagePrice: asset.averagePrice.toString(),
    currentPrice: asset.currentPrice.toString(),
    totalValue: totalValue.toString(),
    unrealizedProfit: unrealizedProfit.toString()
  }).onDuplicateKeyUpdate({
    set: {
      quantity: asset.quantity.toString(),
      averagePrice: asset.averagePrice.toString(),
      currentPrice: asset.currentPrice.toString(),
      totalValue: totalValue.toString(),
      unrealizedProfit: unrealizedProfit.toString()
    }
  });
}
var init_automationDb = __esm({
  "server/automationDb.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/tradingDb.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
async function initializeDefaultAgents(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const existingAgents = await db.select().from(agentConfigs).where(eq2(agentConfigs.userId, userId));
    if (existingAgents.length > 0) {
      console.log(`User ${userId} already has agents, skipping initialization`);
      return;
    }
    const defaultAgents = [
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-1",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1"
      },
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-2",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1"
      },
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-3",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1"
      },
      {
        userId,
        agentType: "Momentum",
        agentName: "Momentum-Agent",
        learningRate: "0.0005",
        stopLossPct: "0.08",
        takeProfitPct: "0.15"
      },
      {
        userId,
        agentType: "MeanReversion",
        agentName: "MeanReversion-Agent",
        learningRate: "0.0008",
        stopLossPct: "0.06",
        takeProfitPct: "0.12"
      },
      {
        userId,
        agentType: "DeepSeek",
        agentName: "DeepSeek-LLM-Agent",
        learningRate: "0.001",
        stopLossPct: "0.04",
        takeProfitPct: "0.2"
      }
    ];
    for (const agent of defaultAgents) {
      await db.insert(agentConfigs).values(agent);
    }
    console.log(`Initialized ${defaultAgents.length} default agents for user ${userId}`);
  } catch (error) {
    console.error("Error initializing default agents:", error);
    throw error;
  }
}
async function initializeWalletBalance(userId, initialBalance = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const existingWallet = await db.select().from(walletBalance).where(eq2(walletBalance.userId, userId));
    if (existingWallet.length > 0) {
      console.log(`User ${userId} already has wallet, skipping initialization`);
      return;
    }
    await db.insert(walletBalance).values({
      userId,
      totalBalance: initialBalance.toString(),
      availableBalance: initialBalance.toString(),
      lockedBalance: "0"
    });
    console.log(`Initialized wallet for user ${userId} with balance $${initialBalance}`);
  } catch (error) {
    console.error("Error initializing wallet balance:", error);
    throw error;
  }
}
async function initializeUserTrading(userId) {
  try {
    await initializeDefaultAgents(userId);
    await initializeWalletBalance(userId, 30);
    console.log(`Trading infrastructure initialized for user ${userId}`);
  } catch (error) {
    console.error("Error initializing user trading:", error);
    throw error;
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const user = await getUserByOpenId(userInfo.openId);
      if (user) {
        await initializeUserTrading(user.id).catch((error) => {
          console.error("[OAuth] Failed to initialize trading infrastructure:", error);
        });
      }
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/automationRouter.ts
init_automationDb();
import { z as z2 } from "zod";
var automationRouter = router({
  getAgentConfigs: protectedProcedure.query(async ({ ctx }) => {
    return await getAgentConfigsByUserId(ctx.user.id);
  }),
  createAgentConfig: protectedProcedure.input(
    z2.object({
      agentType: z2.string(),
      agentName: z2.string(),
      learningRate: z2.number().optional(),
      stopLossPct: z2.number().optional(),
      takeProfitPct: z2.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    return await createAgentConfig({
      userId: ctx.user.id,
      ...input
    });
  }),
  getAutomationSchedules: protectedProcedure.query(async ({ ctx }) => {
    return await getAutomationSchedulesByUserId(ctx.user.id);
  }),
  createAutomationSchedule: protectedProcedure.input(
    z2.object({
      scheduleName: z2.string(),
      cronExpression: z2.string(),
      symbol: z2.string().default("BTC/USDT"),
      initialCapital: z2.number(),
      agentIds: z2.array(z2.number())
    })
  ).mutation(async ({ ctx, input }) => {
    return await createAutomationSchedule({
      userId: ctx.user.id,
      ...input
    });
  }),
  toggleSchedule: protectedProcedure.input(z2.object({ scheduleId: z2.number(), isActive: z2.boolean() })).mutation(async ({ input }) => {
    return await toggleAutomationSchedule(input.scheduleId, input.isActive);
  }),
  deleteSchedule: protectedProcedure.input(z2.object({ scheduleId: z2.number() })).mutation(async ({ input }) => {
    return await deleteAutomationSchedule(input.scheduleId);
  }),
  getAgentStatus: protectedProcedure.input(z2.object({ scheduleId: z2.number() })).query(async ({ input }) => {
    return await getAgentStatusByScheduleId(input.scheduleId);
  })
});
var walletRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const { getWalletBalance: getWalletBalance2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await getWalletBalance2(ctx.user.id);
  }),
  getTransactions: protectedProcedure.input(z2.object({ limit: z2.number().optional() })).query(async ({ ctx, input }) => {
    const { getWalletTransactions: getWalletTransactions2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await getWalletTransactions2(ctx.user.id, input.limit);
  }),
  deposit: protectedProcedure.input(z2.object({ amount: z2.number(), description: z2.string().optional() })).mutation(async ({ ctx, input }) => {
    const { createWalletTransaction: createWalletTransaction2, updateWalletBalance: updateWalletBalance2, getWalletBalance: getWalletBalance2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    await createWalletTransaction2({
      userId: ctx.user.id,
      transactionType: "deposit",
      amount: input.amount,
      description: input.description
    });
    const currentBalance = await getWalletBalance2(ctx.user.id);
    const current = currentBalance[0];
    const newTotal = (current && current.totalBalance ? parseFloat(current.totalBalance.toString()) : 0) + input.amount;
    await updateWalletBalance2(ctx.user.id, {
      totalBalance: newTotal,
      availableBalance: newTotal
    });
    return { success: true };
  }),
  withdraw: protectedProcedure.input(z2.object({ amount: z2.number(), description: z2.string().optional() })).mutation(async ({ ctx, input }) => {
    const { createWalletTransaction: createWalletTransaction2, updateWalletBalance: updateWalletBalance2, getWalletBalance: getWalletBalance2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    const currentBalance = await getWalletBalance2(ctx.user.id);
    const current = currentBalance[0];
    const available = current && current.availableBalance ? parseFloat(current.availableBalance.toString()) : 0;
    if (available < input.amount) {
      throw new Error("Insufficient balance");
    }
    await createWalletTransaction2({
      userId: ctx.user.id,
      transactionType: "withdrawal",
      amount: input.amount,
      description: input.description
    });
    const newTotal = current && current.totalBalance ? parseFloat(current.totalBalance.toString()) - input.amount : 0;
    await updateWalletBalance2(ctx.user.id, {
      totalBalance: newTotal,
      availableBalance: newTotal
    });
    return { success: true };
  })
});
var agentExecutionRouter = router({
  startExecution: protectedProcedure.input(z2.object({ agentId: z2.number(), scheduleId: z2.number().optional() })).mutation(async ({ ctx, input }) => {
    const { startAgentExecution: startAgentExecution2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await startAgentExecution2({
      userId: ctx.user.id,
      agentId: input.agentId,
      scheduleId: input.scheduleId
    });
  }),
  stopExecution: protectedProcedure.input(z2.object({ agentId: z2.number() })).mutation(async ({ input }) => {
    const { stopAgentExecution: stopAgentExecution2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await stopAgentExecution2(input.agentId);
  }),
  getExecutions: protectedProcedure.query(async ({ ctx }) => {
    const { getAgentExecutions: getAgentExecutions2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await getAgentExecutions2(ctx.user.id);
  }),
  getTradingResults: protectedProcedure.query(async ({ ctx }) => {
    const { getTradingResults: getTradingResults2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await getTradingResults2(ctx.user.id);
  }),
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const { getPortfolioAssets: getPortfolioAssets2 } = await Promise.resolve().then(() => (init_automationDb(), automationDb_exports));
    return await getPortfolioAssets2(ctx.user.id);
  })
});

// server/routers/agentSelectionRouter.ts
import { z as z3 } from "zod";

// server/agentSelector.ts
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";
function analyzeMarketCondition(prices, volatility) {
  if (prices.length < 2) return "sideways";
  const recentPrices = prices.slice(-20);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const priceChange = (lastPrice - firstPrice) / firstPrice * 100;
  const isUptrend = priceChange > 2;
  const isDowntrend = priceChange < -2;
  const isHighVolatility = volatility > 3;
  if (isHighVolatility) {
    return "volatile";
  } else if (isUptrend) {
    return "trending_up";
  } else if (isDowntrend) {
    return "trending_down";
  } else {
    return "sideways";
  }
}
async function calculateAgentPerformance(agentId, userId) {
  const db = await getDb();
  if (!db) return null;
  const agent = await db.select().from(agentConfigs).where(eq4(agentConfigs.id, agentId)).limit(1);
  if (agent.length === 0) return null;
  const results = await db.select().from(tradingResults).where(eq4(tradingResults.agentId, agentId));
  if (results.length === 0) {
    return {
      agentId,
      agentName: agent[0].agentName,
      agentType: agent[0].agentType,
      winRate: 0,
      avgProfit: 0,
      totalTrades: 0,
      confidence: 0.5,
      riskLevel: "medium"
    };
  }
  const profits = results.map((r) => {
    const p = r.profit;
    if (typeof p === "number") return p;
    if (typeof p === "string") return parseFloat(p) || 0;
    return 0;
  });
  const wins = profits.filter((p) => p > 0).length;
  const winRate = wins / profits.length;
  const avgProfit = profits.reduce((sum3, p) => sum3 + p, 0) / profits.length;
  const totalTrades = profits.length;
  const avgAbsProfit = profits.reduce((sum3, p) => sum3 + Math.abs(p), 0) / profits.length;
  const variance = profits.reduce((sum3, p) => sum3 + Math.pow(p - avgProfit, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);
  const avgAbsProfitSafe = Math.max(0.01, avgAbsProfit);
  const confidence = Math.max(0, Math.min(1, winRate * (1 - stdDev / (avgAbsProfitSafe + 1))));
  return {
    agentId,
    agentName: agent[0].agentName,
    agentType: agent[0].agentType,
    winRate,
    avgProfit,
    totalTrades,
    confidence,
    riskLevel: "medium"
  };
}
async function recommendAgent(marketCondition, userAgents, userId, riskPreference = "medium") {
  const db = await getDb();
  if (!db) return null;
  const performances = [];
  for (const agentId of userAgents) {
    const perf = await calculateAgentPerformance(agentId, userId);
    if (perf) performances.push(perf);
  }
  if (performances.length === 0) return null;
  const scores = performances.map((perf) => {
    let score = perf.confidence * perf.winRate;
    switch (marketCondition) {
      case "trending_up":
        if (perf.agentType === "Momentum") score *= 1.3;
        if (perf.agentType === "RL") score *= 1.2;
        break;
      case "trending_down":
        if (perf.agentType === "MeanReversion") score *= 1.3;
        if (perf.agentType === "DeepSeek") score *= 1.1;
        break;
      case "volatile":
        if (perf.agentType === "DeepSeek") score *= 1.4;
        if (perf.agentType === "RL") score *= 1.1;
        break;
      case "sideways":
        if (perf.agentType === "MeanReversion") score *= 1.4;
        if (perf.agentType === "Momentum") score *= 0.8;
        break;
    }
    const riskMultiplier = riskPreference === "low" && perf.riskLevel === "high" ? 0.7 : riskPreference === "high" && perf.riskLevel === "low" ? 0.8 : 1;
    score *= riskMultiplier;
    return { ...perf, score };
  });
  const bestAgent = scores.reduce(
    (best, current) => current.score > best.score ? current : best
  );
  let strategy = "";
  let reason = "";
  switch (marketCondition) {
    case "trending_up":
      strategy = "Follow the trend with momentum indicators";
      reason = `${bestAgent.agentType} agent is optimal for uptrend conditions`;
      break;
    case "trending_down":
      strategy = "Use mean reversion to catch bounces";
      reason = `${bestAgent.agentType} agent excels in downtrend reversals`;
      break;
    case "volatile":
      strategy = "Use wider stops and smaller position sizes";
      reason = `${bestAgent.agentType} agent handles high volatility effectively`;
      break;
    case "sideways":
      strategy = "Trade range-bound price action";
      reason = `${bestAgent.agentType} agent thrives in sideways markets`;
      break;
  }
  return {
    agentId: bestAgent.agentId,
    agentName: bestAgent.agentName,
    agentType: bestAgent.agentType,
    strategy,
    confidence: bestAgent.score,
    reason,
    marketCondition
  };
}
async function selectEnsembleAgents(marketCondition, userAgents, userId, ensembleSize = 3) {
  const db = await getDb();
  if (!db) return [];
  const performances = [];
  for (const agentId of userAgents) {
    const perf = await calculateAgentPerformance(agentId, userId);
    if (perf) performances.push(perf);
  }
  if (performances.length === 0) return [];
  const scores = performances.map((perf) => {
    let score = perf.confidence * perf.winRate;
    switch (marketCondition) {
      case "trending_up":
        if (perf.agentType === "Momentum") score *= 1.3;
        if (perf.agentType === "RL") score *= 1.2;
        break;
      case "trending_down":
        if (perf.agentType === "MeanReversion") score *= 1.3;
        if (perf.agentType === "DeepSeek") score *= 1.1;
        break;
      case "volatile":
        if (perf.agentType === "DeepSeek") score *= 1.4;
        if (perf.agentType === "RL") score *= 1.1;
        break;
      case "sideways":
        if (perf.agentType === "MeanReversion") score *= 1.4;
        if (perf.agentType === "Momentum") score *= 0.8;
        break;
    }
    return { ...perf, score };
  });
  const topAgents = scores.sort((a, b) => b.score - a.score).slice(0, ensembleSize);
  return topAgents.map((agent) => ({
    agentId: agent.agentId,
    agentName: agent.agentName,
    agentType: agent.agentType,
    strategy: `Ensemble member - ${agent.agentType}`,
    confidence: agent.score,
    reason: `Selected for ensemble trading with ${(agent.score * 100).toFixed(1)}% confidence`,
    marketCondition
  }));
}

// server/routers/agentSelectionRouter.ts
init_db();
init_schema();
import { eq as eq5 } from "drizzle-orm";
var agentSelectionRouter = router({
  /**
   * Analyze current market condition
   */
  analyzeMarketCondition: protectedProcedure.input(
    z3.object({
      prices: z3.array(z3.number()).min(2),
      volatility: z3.number().min(0)
    })
  ).query(({ input }) => {
    const condition = analyzeMarketCondition(input.prices, input.volatility);
    return {
      condition,
      description: getConditionDescription(condition)
    };
  }),
  /**
   * Get recommended agent for current market conditions
   */
  getRecommendedAgent: protectedProcedure.input(
    z3.object({
      marketCondition: z3.enum(["trending_up", "trending_down", "volatile", "sideways"]),
      riskPreference: z3.enum(["low", "medium", "high"]).optional()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available"
      };
    }
    const agents = await db.select().from(agentConfigs).where(eq5(agentConfigs.userId, ctx.user.id));
    if (agents.length === 0) {
      return {
        success: false,
        error: "No agents configured"
      };
    }
    const agentIds = agents.map((a) => a.id);
    const recommendation = await recommendAgent(
      input.marketCondition,
      agentIds,
      ctx.user.id,
      input.riskPreference
    );
    if (!recommendation) {
      return {
        success: false,
        error: "Could not generate recommendation"
      };
    }
    return {
      success: true,
      recommendation
    };
  }),
  /**
   * Get ensemble of agents for diversified trading
   */
  getEnsembleAgents: protectedProcedure.input(
    z3.object({
      marketCondition: z3.enum(["trending_up", "trending_down", "volatile", "sideways"]),
      ensembleSize: z3.number().min(2).max(5).optional()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available"
      };
    }
    const agents = await db.select().from(agentConfigs).where(eq5(agentConfigs.userId, ctx.user.id));
    if (agents.length === 0) {
      return {
        success: false,
        error: "No agents configured"
      };
    }
    const agentIds = agents.map((a) => a.id);
    const ensemble = await selectEnsembleAgents(
      input.marketCondition,
      agentIds,
      ctx.user.id,
      input.ensembleSize || 3
    );
    return {
      success: true,
      ensemble,
      totalWeight: ensemble.reduce((sum3, a) => sum3 + a.confidence, 0)
    };
  }),
  /**
   * Autonomously select best strategy based on market analysis
   */
  selectAutonomousStrategy: protectedProcedure.input(
    z3.object({
      currentPrice: z3.number(),
      priceHistory: z3.array(z3.number()).min(10),
      volatility: z3.number(),
      riskPreference: z3.enum(["low", "medium", "high"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const marketCondition = analyzeMarketCondition(
      input.priceHistory,
      input.volatility
    );
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available"
      };
    }
    const agents = await db.select().from(agentConfigs).where(eq5(agentConfigs.userId, ctx.user.id));
    if (agents.length === 0) {
      return {
        success: false,
        error: "No agents configured"
      };
    }
    const agentIds = agents.map((a) => a.id);
    const recommendation = await recommendAgent(
      marketCondition,
      agentIds,
      ctx.user.id,
      input.riskPreference
    );
    if (!recommendation) {
      return {
        success: false,
        error: "Could not generate strategy"
      };
    }
    const ensemble = await selectEnsembleAgents(
      marketCondition,
      agentIds,
      ctx.user.id,
      3
    );
    return {
      success: true,
      strategy: {
        primary: recommendation,
        ensemble,
        marketCondition,
        confidence: recommendation.confidence,
        timestamp: /* @__PURE__ */ new Date()
      }
    };
  })
});
function getConditionDescription(condition) {
  const descriptions = {
    trending_up: "Market is in an uptrend - prices rising steadily",
    trending_down: "Market is in a downtrend - prices falling steadily",
    volatile: "Market is highly volatile - large price swings",
    sideways: "Market is sideways - prices moving in a range"
  };
  return descriptions[condition];
}

// server/routers/tradingRouter.ts
import { z as z4 } from "zod";

// server/tradingSimulation.ts
init_db();
init_schema();
function generateRealisticTrade(agentId, agentType, currentPrice, volatility = 2.5) {
  const entryPrice = currentPrice;
  const largerVolatility = 3 + Math.random() * 5;
  const priceChange = (Math.random() - 0.5) * largerVolatility;
  const exitPrice = entryPrice * (1 + priceChange / 100);
  const tradeAmount = 15;
  const quantity = Math.max(1e-4, tradeAmount / entryPrice);
  const profit = Number(((exitPrice - entryPrice) * quantity).toFixed(4));
  let confidence = 0.5 + Math.random() * 0.25;
  switch (agentType) {
    case "RL":
      confidence = 0.6 + Math.random() * 0.3;
      break;
    case "Momentum":
      confidence = 0.55 + Math.random() * 0.25;
      break;
    case "MeanReversion":
      confidence = 0.5 + Math.random() * 0.3;
      break;
    case "DeepSeek":
      confidence = 0.6 + Math.random() * 0.3;
      break;
  }
  const tradeType = Math.random() > 0.5 ? "buy" : "sell";
  return {
    agentId,
    symbol: "BTC/USDT",
    entryPrice,
    exitPrice,
    quantity,
    tradeType,
    profit,
    confidence: Math.min(1, confidence),
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1e3)
    // Random time in last 24h
  };
}
function generateMultipleTrades(agentId, agentType, count2 = 3, currentPrice = 50) {
  const trades = [];
  for (let i = 0; i < count2; i++) {
    trades.push(generateRealisticTrade(agentId, agentType, currentPrice + (Math.random() - 0.5) * 10));
  }
  return trades;
}
async function seedDemoTradingData(userId, agentIds, agentTypes) {
  const db = await getDb();
  if (!db) return;
  try {
    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];
      const agentType = agentTypes[i];
      const tradeCount = 2 + Math.floor(Math.random() * 3);
      const trades = generateMultipleTrades(agentId, agentType, tradeCount);
      for (const trade of trades) {
        await db.insert(tradingResults).values({
          executionId: 0,
          userId,
          agentId: trade.agentId,
          symbol: trade.symbol,
          entryPrice: trade.entryPrice.toString(),
          exitPrice: trade.exitPrice.toString(),
          quantity: Number(trade.quantity.toFixed(8)).toString(),
          profit: Number(trade.profit.toFixed(2)).toString(),
          tradeType: trade.tradeType,
          confidence: trade.confidence.toString(),
          entryTime: trade.timestamp,
          createdAt: trade.timestamp
        });
      }
    }
    const totalProfit = 0;
    await db.insert(portfolioAssets).values({
      userId,
      symbol: "BTC",
      quantity: "0.0003",
      averagePrice: "45000",
      currentPrice: "45500",
      totalValue: "13.65",
      unrealizedProfit: "0.90"
    });
    await db.insert(portfolioAssets).values({
      userId,
      symbol: "ETH",
      quantity: "0.008",
      averagePrice: "2500",
      currentPrice: "2550",
      totalValue: "20.40",
      unrealizedProfit: "0.40"
    });
    console.log("Demo trading data seeded successfully");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}
async function executeTrade(userId, agentId, agentType, currentPrice = 45e3) {
  const db = await getDb();
  if (!db) return null;
  try {
    const trade = generateRealisticTrade(agentId, agentType, currentPrice);
    await db.insert(tradingResults).values({
      executionId: 0,
      userId,
      agentId: trade.agentId,
      symbol: trade.symbol,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      quantity: Number(trade.quantity.toFixed(8)).toString(),
      profit: Number(trade.profit.toFixed(2)).toString(),
      tradeType: trade.tradeType,
      confidence: trade.confidence.toString(),
      entryTime: trade.timestamp,
      createdAt: trade.timestamp
    });
    if (trade.profit !== 0) {
      await db.insert(walletTransactions).values({
        userId,
        transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
        amount: Math.abs(trade.profit).toString(),
        currency: "USDT",
        status: "completed",
        description: `Trade by ${agentType} agent - ${trade.symbol}`
      });
    }
    return trade;
  } catch (error) {
    console.error("Error executing trade:", error);
    return null;
  }
}

// server/routers/tradingRouter.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
var tradingRouter = router({
  /**
   * Seed demo trading data for testing
   */
  seedDemoData: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const agents = await db.select().from(agentConfigs).where(eq6(agentConfigs.userId, ctx.user.id));
      if (agents.length === 0) {
        throw new Error("No agents configured");
      }
      const agentIds = agents.map((a) => a.id);
      const agentTypes = agents.map((a) => a.agentType);
      await seedDemoTradingData(ctx.user.id, agentIds, agentTypes);
      return { success: true, message: "Demo data seeded successfully" };
    } catch (error) {
      console.error("Error seeding demo data:", error);
      throw error;
    }
  }),
  /**
   * Execute a single trade for an agent
   */
  executeTrade: protectedProcedure.input(
    z4.object({
      agentId: z4.number(),
      currentPrice: z4.number().optional().default(45e3)
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const agent = await db.select().from(agentConfigs).where(eq6(agentConfigs.id, input.agentId)).limit(1);
      if (agent.length === 0) {
        throw new Error("Agent not found");
      }
      const trade = await executeTrade(
        ctx.user.id,
        input.agentId,
        agent[0].agentType,
        input.currentPrice
      );
      return { success: true, trade };
    } catch (error) {
      console.error("Error executing trade:", error);
      throw error;
    }
  }),
  /**
   * Get all trading results for a user
   */
  getTradingResults: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const results = await db.select().from(tradingResults).where(eq6(tradingResults.userId, ctx.user.id));
      return results;
    } catch (error) {
      console.error("Error getting trading results:", error);
      throw error;
    }
  }),
  /**
   * Get trading statistics
   */
  getTradingStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const results = await db.select().from(tradingResults).where(eq6(tradingResults.userId, ctx.user.id));
      if (results.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          totalProfit: 0,
          avgProfit: 0,
          maxProfit: 0,
          maxLoss: 0
        };
      }
      const profits = results.map((r) => parseFloat((r.profit || 0).toString()));
      const wins = profits.filter((p) => p > 0).length;
      const totalProfit = profits.reduce((sum3, p) => sum3 + p, 0);
      return {
        totalTrades: results.length,
        winRate: wins / results.length * 100,
        totalProfit,
        avgProfit: totalProfit / results.length,
        maxProfit: Math.max(...profits),
        maxLoss: Math.min(...profits)
      };
    } catch (error) {
      console.error("Error getting trading stats:", error);
      throw error;
    }
  }),
  /**
   * Get trading results by agent
   */
  getTradesByAgent: protectedProcedure.input(z4.object({ agentId: z4.number() })).query(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const results = await db.select().from(tradingResults).where(
        eq6(tradingResults.userId, ctx.user.id) && eq6(tradingResults.agentId, input.agentId)
      );
      return results;
    } catch (error) {
      console.error("Error getting trades by agent:", error);
      throw error;
    }
  })
});

// server/routers/autoTradeRouter.ts
init_db();
init_schema();
import { eq as eq7 } from "drizzle-orm";
var autoTradeRouter = router({
  generateTradesForAllAgents: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const agents = await db.select().from(agentConfigs).where(eq7(agentConfigs.userId, ctx.user.id));
      if (agents.length === 0) {
        throw new Error("No agents configured for this user");
      }
      let totalTradesGenerated = 0;
      let totalProfitGenerated = 0;
      for (const agent of agents) {
        const tradeCount = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < tradeCount; i++) {
          const trade = generateRealisticTrade(agent.id, agent.agentType, 45e3);
          await db.insert(tradingResults).values({
            executionId: agent.id,
            userId: ctx.user.id,
            agentId: agent.id,
            symbol: trade.symbol,
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice.toString(),
            quantity: trade.quantity.toString(),
            profit: trade.profit.toString(),
            profitPercent: (trade.profit / (trade.entryPrice * trade.quantity) * 100).toString(),
            tradeType: trade.tradeType,
            status: "closed",
            confidence: trade.confidence.toString(),
            entryTime: trade.timestamp,
            exitTime: /* @__PURE__ */ new Date(),
            createdAt: trade.timestamp
          });
          totalTradesGenerated++;
          totalProfitGenerated += trade.profit;
          if (trade.profit !== 0) {
            await db.insert(walletTransactions).values({
              userId: ctx.user.id,
              transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
              amount: Math.abs(trade.profit).toString(),
              currency: "USDT",
              status: "completed",
              description: `Trade by ${agent.agentType} agent - ${trade.symbol}`
            });
          }
        }
      }
      const wallet = await db.select().from(walletBalance).where(eq7(walletBalance.userId, ctx.user.id)).limit(1);
      if (wallet.length > 0) {
        const currentBalance = parseFloat(wallet[0].totalBalance?.toString() || "0");
        const newBalance = currentBalance + totalProfitGenerated;
        await db.update(walletBalance).set({
          totalBalance: Math.max(0, newBalance).toString(),
          availableBalance: Math.max(0, newBalance).toString()
        }).where(eq7(walletBalance.userId, ctx.user.id));
      }
      return {
        success: true,
        tradesGenerated: totalTradesGenerated,
        profitGenerated: totalProfitGenerated
      };
    } catch (error) {
      console.error("Error generating trades:", error);
      throw error;
    }
  })
});

// server/routers/marketRouter.ts
import { z as z5 } from "zod";

// server/binanceApi.ts
import axios2 from "axios";
var BINANCE_API_URL = "https://api.binance.com/api/v3";
async function getPrice(symbol = "BTCUSDT") {
  try {
    const response = await axios2.get(`${BINANCE_API_URL}/ticker/price`, {
      params: { symbol },
      timeout: 5e3
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return symbol === "BTCUSDT" ? 45e3 : 2500;
  }
}
async function getMarketData(symbol = "BTCUSDT") {
  try {
    const [priceResponse, ticker24hResponse] = await Promise.all([
      axios2.get(`${BINANCE_API_URL}/ticker/price`, {
        params: { symbol },
        timeout: 5e3
      }),
      axios2.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: 5e3
      })
    ]);
    const price = parseFloat(priceResponse.data.price);
    const data24h = ticker24hResponse.data;
    return {
      symbol,
      price,
      change24h: parseFloat(data24h.priceChangePercent),
      volume24h: parseFloat(data24h.quoteAssetVolume),
      high24h: parseFloat(data24h.highPrice),
      low24h: parseFloat(data24h.lowPrice),
      volatility: calculateVolatility(
        parseFloat(data24h.highPrice),
        parseFloat(data24h.lowPrice),
        price
      )
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return {
      symbol,
      price: symbol === "BTCUSDT" ? 45e3 : 2500,
      change24h: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
      volatility: 2
    };
  }
}
async function getKlines(symbol = "BTCUSDT", interval = "1h", limit = 24) {
  try {
    const response = await axios2.get(`${BINANCE_API_URL}/klines`, {
      params: { symbol, interval, limit },
      timeout: 5e3
    });
    return response.data.map((kline) => ({
      openTime: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[7]),
      closeTime: kline[6]
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}
function calculateVolatility(high, low, close) {
  if (close === 0) return 0;
  return (high - low) / close * 100;
}
async function analyzeMarketTrend(symbol = "BTCUSDT") {
  try {
    const klines = await getKlines(symbol, "1h", 24);
    if (klines.length === 0) {
      return { trend: "sideways", strength: 0, volatility: 2 };
    }
    const closes = klines.map((k) => k.close);
    const sma12 = calculateSMA(closes, 12);
    const sma26 = calculateSMA(closes, 26);
    const volatility = calculateVolatility(
      Math.max(...closes),
      Math.min(...closes),
      closes[closes.length - 1]
    );
    let trend = "sideways";
    let strength = 0;
    if (sma12 > sma26) {
      trend = "uptrend";
      strength = Math.min(100, (sma12 - sma26) / sma26 * 1e3);
    } else if (sma12 < sma26) {
      trend = "downtrend";
      strength = Math.min(100, (sma26 - sma12) / sma26 * 1e3);
    }
    return { trend, strength, volatility };
  } catch (error) {
    console.error("Error analyzing market trend:", error);
    return { trend: "sideways", strength: 0, volatility: 2 };
  }
}
function calculateSMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  const sum3 = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum3 / period;
}

// server/aiStrategySelector.ts
async function selectOptimalStrategy(symbol = "BTCUSDT") {
  try {
    const [marketData, trendAnalysis] = await Promise.all([
      getMarketData(symbol),
      analyzeMarketTrend(symbol)
    ]);
    const volatility = marketData.volatility;
    const change24h = marketData.change24h;
    const trend = trendAnalysis.trend;
    const strength = trendAnalysis.strength;
    let strategy;
    let confidence;
    let reason;
    let marketCondition;
    if (volatility > 5) {
      if (trend === "uptrend" && strength > 50) {
        strategy = "Momentum";
        confidence = Math.min(95, 50 + strength);
        reason = "Strong uptrend with high volatility - Momentum strategy optimal";
        marketCondition = "Strong Uptrend";
      } else if (trend === "downtrend" && strength > 50) {
        strategy = "MeanReversion";
        confidence = Math.min(95, 50 + strength);
        reason = "Strong downtrend - Mean Reversion for bounce trades";
        marketCondition = "Strong Downtrend";
      } else {
        strategy = "RL";
        confidence = 70;
        reason = "High volatility with mixed signals - RL for adaptive learning";
        marketCondition = "High Volatility Mixed";
      }
    } else if (volatility < 1.5) {
      strategy = "DeepSeek";
      confidence = 75;
      reason = "Low volatility - DeepSeek LLM for pattern recognition";
      marketCondition = "Low Volatility Consolidation";
    } else {
      if (trend === "uptrend") {
        strategy = "Momentum";
        confidence = 65 + strength / 2;
        reason = "Uptrend detected - Momentum strategy for trend following";
        marketCondition = "Moderate Uptrend";
      } else if (trend === "downtrend") {
        strategy = "MeanReversion";
        confidence = 65 + strength / 2;
        reason = "Downtrend detected - Mean Reversion for counter-trend trades";
        marketCondition = "Moderate Downtrend";
      } else {
        strategy = "RL";
        confidence = 60;
        reason = "Sideways market - RL for optimal decision making";
        marketCondition = "Sideways Consolidation";
      }
    }
    if (Math.abs(change24h) > 10) {
      confidence = Math.min(99, confidence + 10);
    } else if (Math.abs(change24h) < 0.5) {
      confidence = Math.max(50, confidence - 10);
    }
    return {
      strategy,
      confidence: Math.min(99, Math.max(50, confidence)),
      reason,
      marketCondition
    };
  } catch (error) {
    console.error("Error selecting optimal strategy:", error);
    return {
      strategy: "RL",
      confidence: 50,
      reason: "Market analysis unavailable - defaulting to RL",
      marketCondition: "Unknown"
    };
  }
}
async function getAllStrategyRecommendations(symbol = "BTCUSDT") {
  const optimal = await selectOptimalStrategy(symbol);
  const strategies = [optimal];
  const allStrategies = ["RL", "Momentum", "MeanReversion", "DeepSeek"];
  const alternatives = allStrategies.filter((s) => s !== optimal.strategy);
  for (const alt of alternatives) {
    strategies.push({
      strategy: alt,
      confidence: Math.max(30, optimal.confidence - 20),
      reason: `Alternative strategy - ${alt}`,
      marketCondition: optimal.marketCondition
    });
  }
  return strategies.sort((a, b) => b.confidence - a.confidence);
}

// server/routers/marketRouter.ts
var marketRouter = router({
  // Get current market data for a symbol
  getMarketData: publicProcedure.input(z5.object({ symbol: z5.string().default("BTCUSDT") })).query(async ({ input }) => {
    return await getMarketData(input.symbol);
  }),
  // Get market trend analysis
  analyzeMarketTrend: publicProcedure.input(z5.object({ symbol: z5.string().default("BTCUSDT") })).query(async ({ input }) => {
    return await analyzeMarketTrend(input.symbol);
  }),
  // Get current price
  getPrice: publicProcedure.input(z5.object({ symbol: z5.string().default("BTCUSDT") })).query(async ({ input }) => {
    return await getPrice(input.symbol);
  }),
  // Get optimal strategy recommendation
  selectOptimalStrategy: publicProcedure.input(z5.object({ symbol: z5.string().default("BTCUSDT") })).query(async ({ input }) => {
    return await selectOptimalStrategy(input.symbol);
  }),
  // Get all strategy recommendations ranked
  getAllStrategyRecommendations: publicProcedure.input(z5.object({ symbol: z5.string().default("BTCUSDT") })).query(async ({ input }) => {
    return await getAllStrategyRecommendations(input.symbol);
  }),
  // Get market data for multiple symbols
  getMultipleMarketData: publicProcedure.input(z5.object({ symbols: z5.array(z5.string()).default(["BTCUSDT", "ETHUSDT"]) })).query(async ({ input }) => {
    return Promise.all(input.symbols.map((symbol) => getMarketData(symbol)));
  })
});

// server/routers/autonomousAgentRouter.ts
import { z as z6 } from "zod";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/autonomousAgent.ts
async function selectOptimalStrategy2(marketData) {
  try {
    const priceChange = marketData.priceHistory.length > 1 ? (marketData.currentPrice - marketData.priceHistory[0]) / marketData.priceHistory[0] * 100 : 0;
    const avgPrice = marketData.priceHistory.reduce((a, b) => a + b, 0) / marketData.priceHistory.length;
    const trend = marketData.currentPrice > avgPrice ? "uptrend" : "downtrend";
    const prompt = `You are an expert cryptocurrency trading advisor. Analyze the following market conditions and recommend the best trading strategy.

Market Data:
- Current Price: $${marketData.currentPrice}
- Price Change (24h): ${priceChange.toFixed(2)}%
- Volatility: ${marketData.volatility}%
- Trend: ${trend}
- Risk Preference: ${marketData.riskPreference}

Available Strategies:
1. RL (Reinforcement Learning) - Adaptive strategy that learns from market patterns
2. Momentum - Follows price trends and momentum indicators
3. MeanReversion - Trades when price deviates from average
4. DeepSeek - Advanced AI-powered strategy with deep market analysis

Based on the market conditions, recommend the BEST strategy. Respond in JSON format:
{
  "strategy": "RL|Momentum|MeanReversion|DeepSeek",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "parameters": {
    "learningRate": 0.01-0.1,
    "stopLossPct": 1-5,
    "takeProfitPct": 2-10
  }
}`;
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency trading expert. Provide strategic recommendations in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "strategy_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              strategy: {
                type: "string",
                enum: ["RL", "Momentum", "MeanReversion", "DeepSeek"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              reasoning: {
                type: "string"
              },
              parameters: {
                type: "object",
                properties: {
                  learningRate: { type: "number" },
                  stopLossPct: { type: "number" },
                  takeProfitPct: { type: "number" }
                }
              }
            },
            required: ["strategy", "confidence", "reasoning", "parameters"]
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return getDefaultStrategy(marketData);
    }
    const parsed = JSON.parse(content);
    return {
      strategy: parsed.strategy,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      parameters: parsed.parameters
    };
  } catch (error) {
    console.error("[AutonomousAgent] Error selecting strategy:", error);
    return getDefaultStrategy(marketData);
  }
}
function getDefaultStrategy(marketData) {
  const priceChange = marketData.priceHistory.length > 1 ? (marketData.currentPrice - marketData.priceHistory[0]) / marketData.priceHistory[0] * 100 : 0;
  if (marketData.volatility > 5) {
    return {
      strategy: "MeanReversion",
      confidence: 0.8,
      reasoning: "High volatility detected - mean reversion strategy recommended",
      parameters: {
        stopLossPct: 3,
        takeProfitPct: 4
      }
    };
  } else if (Math.abs(priceChange) > 2) {
    return {
      strategy: "Momentum",
      confidence: 0.85,
      reasoning: "Strong price momentum detected - momentum strategy recommended",
      parameters: {
        learningRate: 0.05,
        stopLossPct: 2,
        takeProfitPct: 5
      }
    };
  } else {
    return {
      strategy: "RL",
      confidence: 0.75,
      reasoning: "Stable market conditions - RL strategy for adaptive learning",
      parameters: {
        learningRate: 0.03,
        stopLossPct: 2,
        takeProfitPct: 3
      }
    };
  }
}
async function generateTradingSignal(marketData) {
  try {
    const avgPrice = marketData.priceHistory.reduce((a, b) => a + b, 0) / marketData.priceHistory.length;
    const deviation = (marketData.currentPrice - avgPrice) / avgPrice * 100;
    const prompt = `Analyze the following market data and generate a trading signal.

Current Price: $${marketData.currentPrice}
Average Price: $${avgPrice.toFixed(2)}
Price Deviation: ${deviation.toFixed(2)}%
Volatility: ${marketData.volatility}%
Risk Preference: ${marketData.riskPreference}

Provide a trading signal in JSON format:
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency trading signal generator. Provide signals in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trading_signal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["buy", "sell", "hold"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              reasoning: {
                type: "string"
              }
            },
            required: ["action", "confidence", "reasoning"]
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return {
        action: "hold",
        confidence: 0.5,
        reasoning: "Unable to generate signal - holding position"
      };
    }
    const parsed = JSON.parse(content);
    return {
      action: parsed.action,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error("[AutonomousAgent] Error generating trading signal:", error);
    return {
      action: "hold",
      confidence: 0.5,
      reasoning: "Error in signal generation - holding position"
    };
  }
}

// server/routers/autonomousAgentRouter.ts
var autonomousAgentRouter = router({
  selectStrategy: protectedProcedure.input(
    z6.object({
      currentPrice: z6.number(),
      priceHistory: z6.array(z6.number()),
      volatility: z6.number(),
      riskPreference: z6.enum(["low", "medium", "high"])
    })
  ).mutation(async ({ input }) => {
    const marketData = {
      currentPrice: input.currentPrice,
      priceHistory: input.priceHistory,
      volatility: input.volatility,
      riskPreference: input.riskPreference
    };
    return await selectOptimalStrategy2(marketData);
  }),
  generateSignal: protectedProcedure.input(
    z6.object({
      currentPrice: z6.number(),
      priceHistory: z6.array(z6.number()),
      volatility: z6.number(),
      riskPreference: z6.enum(["low", "medium", "high"])
    })
  ).mutation(async ({ input }) => {
    const marketData = {
      currentPrice: input.currentPrice,
      priceHistory: input.priceHistory,
      volatility: input.volatility,
      riskPreference: input.riskPreference
    };
    return await generateTradingSignal(marketData);
  })
});

// server/dashboardDb.ts
init_db();
init_schema();
import { eq as eq8, count } from "drizzle-orm";
async function getDashboardMetrics(userId) {
  const db = await getDb();
  if (!db) {
    return {
      activeAgents: 0,
      portfolioValue: 0,
      winRate: 0,
      totalProfit: 0,
      totalTrades: 0
    };
  }
  try {
    const activeAgentsResult = await db.select({ count: count() }).from(agentConfigs).where(eq8(agentConfigs.userId, userId));
    const activeAgents = activeAgentsResult[0]?.count || 0;
    const allTrades = await db.select().from(tradingResults).where(eq8(tradingResults.userId, userId));
    const totalTrades = allTrades.length;
    let totalProfit = 0;
    let winningCount = 0;
    for (const trade of allTrades) {
      const profit = typeof trade.profit === "string" ? parseFloat(trade.profit) : trade.profit || 0;
      totalProfit += profit;
      if (profit > 0) {
        winningCount++;
      }
    }
    const winRate = totalTrades > 0 ? winningCount / totalTrades * 100 : 0;
    const portfolioValue = 1e3 + totalProfit;
    return {
      activeAgents,
      portfolioValue: Math.max(0, portfolioValue),
      winRate: Math.round(winRate * 10) / 10,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalTrades
    };
  } catch (error) {
    console.error("[DashboardDb] Error getting metrics:", error);
    return {
      activeAgents: 0,
      portfolioValue: 0,
      winRate: 0,
      totalProfit: 0,
      totalTrades: 0
    };
  }
}
async function getRecentActivity(userId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  try {
    const trades = await db.select().from(tradingResults).where(eq8(tradingResults.userId, userId)).limit(limit);
    return trades.map((trade) => ({
      id: trade.id,
      agentId: trade.agentId,
      type: trade.tradeType,
      symbol: trade.symbol,
      profit: trade.profit ? parseFloat(trade.profit.toString()) : 0,
      executedAt: trade.entryTime
    }));
  } catch (error) {
    console.error("[DashboardDb] Error getting recent activity:", error);
    return [];
  }
}

// server/routers/dashboardRouter.ts
var dashboardRouter = router({
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    return await getDashboardMetrics(ctx.user.id);
  }),
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    return await getRecentActivity(ctx.user.id, 10);
  })
});

// server/routers/exchangeRouter.ts
import { z as z7 } from "zod";

// server/services/exchangeService.ts
var PaperTradingConnector = class {
  constructor(exchange, initialBalance = 30) {
    this.exchange = exchange;
    this.portfolio.set("USDT", {
      exchange,
      asset: "USDT",
      free: initialBalance,
      locked: 0,
      total: initialBalance,
      usdValue: initialBalance
    });
  }
  portfolio = /* @__PURE__ */ new Map();
  orderHistory = [];
  marketPrices = /* @__PURE__ */ new Map();
  async getMarketData(symbol) {
    const basePrice = this.marketPrices.get(symbol) || 100;
    const volatility = Math.random() * 0.02 - 0.01;
    const price = basePrice * (1 + volatility);
    return {
      symbol,
      price,
      bid: price * 0.999,
      ask: price * 1.001,
      volume24h: Math.random() * 1e6,
      change24h: (Math.random() - 0.5) * 10,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  async getMultipleMarketData(symbols) {
    return Promise.all(symbols.map((s) => this.getMarketData(s)));
  }
  async placeOrder(order) {
    const marketData = await this.getMarketData(order.symbol);
    const price = order.price || marketData.price;
    const cost = order.quantity * price;
    const usdt = this.portfolio.get("USDT");
    if (!usdt || usdt.free < cost) {
      throw new Error("Insufficient balance");
    }
    usdt.free -= cost;
    usdt.locked += cost;
    const asset = order.symbol.replace("USDT", "");
    const existing = this.portfolio.get(asset) || {
      exchange: this.exchange,
      asset,
      free: 0,
      locked: 0,
      total: 0,
      usdValue: 0
    };
    if (order.type === "BUY") {
      existing.free += order.quantity;
    } else {
      existing.free -= order.quantity;
    }
    existing.total = existing.free + existing.locked;
    existing.usdValue = existing.total * price;
    this.portfolio.set(asset, existing);
    const response = {
      orderId: `PAPER-${Date.now()}`,
      symbol: order.symbol,
      type: order.type,
      quantity: order.quantity,
      price,
      status: "filled",
      timestamp: /* @__PURE__ */ new Date(),
      exchange: this.exchange
    };
    this.orderHistory.push(response);
    return response;
  }
  async cancelOrder(orderId) {
    const order = this.orderHistory.find((o) => o.orderId === orderId);
    if (order) {
      order.status = "cancelled";
      return true;
    }
    return false;
  }
  async getBalance() {
    return Array.from(this.portfolio.values());
  }
  async getOrderHistory(limit = 10) {
    return this.orderHistory.slice(-limit);
  }
  async validateConnection() {
    return true;
  }
};
async function createExchangeConnector(config) {
  if (config.mode === "paper") {
    return new PaperTradingConnector(config.exchange);
  }
  switch (config.exchange) {
    case "binance":
      return createBinanceConnector(config);
    case "kraken":
      return createKrakenConnector(config);
    case "coinbase":
      return createCoinbaseConnector(config);
    case "bybit":
      return createBybitConnector(config);
    default:
      throw new Error(`Unsupported exchange: ${config.exchange}`);
  }
}
async function createBinanceConnector(config) {
  return new PaperTradingConnector(config.exchange);
}
async function createKrakenConnector(config) {
  return new PaperTradingConnector(config.exchange);
}
async function createCoinbaseConnector(config) {
  return new PaperTradingConnector(config.exchange);
}
async function createBybitConnector(config) {
  return new PaperTradingConnector(config.exchange);
}

// server/routers/exchangeRouter.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
var exchangeConfigSchema = z7.object({
  exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
  apiKey: z7.string().min(1, "API Key is required"),
  apiSecret: z7.string().min(1, "API Secret is required"),
  passphrase: z7.string().optional(),
  mode: z7.enum(["paper", "live"])
});
var orderSchema = z7.object({
  symbol: z7.string().min(1),
  type: z7.enum(["BUY", "SELL"]),
  quantity: z7.number().positive(),
  price: z7.number().positive().optional(),
  orderType: z7.enum(["market", "limit"])
});
var exchangeConnectors = /* @__PURE__ */ new Map();
var exchangeRouter = router({
  // Connect to exchange
  connectExchange: protectedProcedure.input(exchangeConfigSchema).mutation(async ({ ctx, input }) => {
    try {
      const connector = await createExchangeConnector(input);
      const isValid = await connector.validateConnection();
      if (!isValid) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "Invalid exchange credentials"
        });
      }
      const key = `${ctx.user.id}-${input.exchange}`;
      exchangeConnectors.set(key, { connector, config: input });
      return {
        success: true,
        exchange: input.exchange,
        mode: input.mode,
        message: `Connected to ${input.exchange} in ${input.mode} mode`
      };
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to connect to exchange: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Disconnect from exchange
  disconnectExchange: protectedProcedure.input(z7.object({ exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]) })).mutation(({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    exchangeConnectors.delete(key);
    return { success: true, message: `Disconnected from ${input.exchange}` };
  }),
  // Get market data
  getMarketData: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
    symbol: z7.string()
  })).query(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const marketData = await exchangeData.connector.getMarketData(input.symbol);
      return marketData;
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get market data: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Get multiple market data
  getMultipleMarketData: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
    symbols: z7.array(z7.string())
  })).query(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const marketData = await exchangeData.connector.getMultipleMarketData(input.symbols);
      return marketData;
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get market data: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Place order
  placeOrder: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
    order: orderSchema
  })).mutation(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const response = await exchangeData.connector.placeOrder(input.order);
      return response;
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to place order: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Cancel order
  cancelOrder: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
    orderId: z7.string(),
    symbol: z7.string()
  })).mutation(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const success = await exchangeData.connector.cancelOrder(input.orderId, input.symbol);
      return { success, message: success ? "Order cancelled" : "Failed to cancel order" };
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to cancel order: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Get balance
  getBalance: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"])
  })).query(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const balance = await exchangeData.connector.getBalance();
      return balance;
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get balance: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Get order history
  getOrderHistory: protectedProcedure.input(z7.object({
    exchange: z7.enum(["binance", "kraken", "coinbase", "bybit"]),
    limit: z7.number().optional()
  })).query(async ({ ctx, input }) => {
    const key = `${ctx.user.id}-${input.exchange}`;
    const exchangeData = exchangeConnectors.get(key);
    if (!exchangeData) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: `Not connected to ${input.exchange}`
      });
    }
    try {
      const orders = await exchangeData.connector.getOrderHistory(input.limit);
      return orders;
    } catch (error) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get order history: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Get connected exchanges
  getConnectedExchanges: protectedProcedure.query(({ ctx }) => {
    const prefix = `${ctx.user.id}-`;
    const exchanges = Array.from(exchangeConnectors.keys()).filter((key) => key.startsWith(prefix)).map((key) => {
      const exchange = key.replace(prefix, "");
      const data = exchangeConnectors.get(key);
      return {
        exchange,
        mode: data.config.mode,
        connected: true
      };
    });
    return exchanges;
  })
});

// server/routers/llmTradingRouter.ts
import { z as z8 } from "zod";

// server/services/llmTradingAnalysis.ts
async function analyzeMarketWithLLM(input, model = "deepseek") {
  const prompt = buildMarketAnalysisPrompt(input);
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency trader and technical analyst. Analyze market data and provide trading signals with precise entry/exit points. Always respond with valid JSON.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trading_signal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["BUY", "SELL", "HOLD"],
                description: "Trading action"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Confidence level (0-100)"
              },
              reason: {
                type: "string",
                description: "Detailed reasoning for the signal"
              },
              entryPrice: {
                type: "number",
                description: "Suggested entry price"
              },
              stopLoss: {
                type: "number",
                description: "Suggested stop loss price"
              },
              takeProfit: {
                type: "number",
                description: "Suggested take profit price"
              },
              riskRewardRatio: {
                type: "number",
                description: "Risk to reward ratio"
              },
              timeframe: {
                type: "string",
                description: "Recommended timeframe"
              }
            },
            required: ["action", "confidence", "reason"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    throw new Error("Invalid response format from LLM");
  } catch (error) {
    console.error("[LLM Trading Analysis] Error:", error);
    return {
      action: "HOLD",
      confidence: 0,
      reason: "Unable to analyze market due to LLM error"
    };
  }
}
async function assessRiskWithLLM(input, proposedPosition, model = "qwen") {
  const prompt = buildRiskAssessmentPrompt(input, proposedPosition);
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a risk management expert in cryptocurrency trading. Assess trading risks and provide recommendations. Always respond with valid JSON.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "risk_assessment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              riskLevel: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                description: "Overall risk level"
              },
              volatility: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Volatility score"
              },
              recommendation: {
                type: "string",
                description: "Risk management recommendation"
              },
              maxPositionSize: {
                type: "number",
                description: "Maximum position size as percentage"
              },
              suggestedStopLoss: {
                type: "number",
                description: "Suggested stop loss price"
              }
            },
            required: ["riskLevel", "volatility", "recommendation", "maxPositionSize", "suggestedStopLoss"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    throw new Error("Invalid response format from LLM");
  } catch (error) {
    console.error("[LLM Risk Assessment] Error:", error);
    return {
      riskLevel: "HIGH",
      volatility: 75,
      recommendation: "Unable to assess risk due to LLM error. Use caution.",
      maxPositionSize: 1,
      suggestedStopLoss: proposedPosition.entryPrice * 0.95
    };
  }
}
async function generatePortfolioRecommendations(symbols, marketData, model = "deepseek") {
  const prompt = buildPortfolioPrompt(symbols, marketData);
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a portfolio manager specializing in cryptocurrency. Provide balanced portfolio recommendations with allocation weights. Always respond with valid JSON array.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "portfolio_recommendations",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol"
                },
                action: {
                  type: "string",
                  enum: ["BUY", "SELL", "HOLD"],
                  description: "Recommended action"
                },
                weight: {
                  type: "number",
                  description: "Portfolio allocation percentage"
                },
                reasoning: {
                  type: "string",
                  description: "Reasoning for recommendation"
                },
                riskScore: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Risk score"
                }
              },
              required: ["symbol", "action", "weight", "reasoning", "riskScore"],
              additionalProperties: false
            }
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    throw new Error("Invalid response format from LLM");
  } catch (error) {
    console.error("[LLM Portfolio Recommendations] Error:", error);
    return [];
  }
}
function buildMarketAnalysisPrompt(input) {
  return `
Analyze the following cryptocurrency market data and provide a trading signal:

Symbol: ${input.symbol}
Current Price: $${input.currentPrice}
Bid: $${input.bid}
Ask: $${input.ask}
24h Volume: ${input.volume24h}
24h Change: ${input.change24h}%
${input.rsi ? `RSI: ${input.rsi}` : ""}
${input.macd ? `MACD: ${input.macd}` : ""}
${input.bollingerBands ? `Bollinger Bands - Upper: ${input.bollingerBands.upper}, Middle: ${input.bollingerBands.middle}, Lower: ${input.bollingerBands.lower}` : ""}
Timeframe: ${input.timeframe || "1h"}

Provide a trading signal with:
1. Action (BUY, SELL, or HOLD)
2. Confidence level (0-100)
3. Detailed reasoning
4. Entry price
5. Stop loss price
6. Take profit price
7. Risk/reward ratio
8. Recommended timeframe

Consider technical indicators, market trends, and risk factors.
`;
}
function buildRiskAssessmentPrompt(input, position) {
  return `
Assess the risk for the following trading position:

Symbol: ${input.symbol}
Current Price: $${input.currentPrice}
24h Change: ${input.change24h}%
24h Volume: ${input.volume24h}
Volatility (24h): ${Math.abs(input.change24h)}%

Position Details:
- Size: ${position.size} units
- Entry Price: $${position.entryPrice}
- Stop Loss: $${position.stopLoss}
- Potential Loss: ${((position.stopLoss - position.entryPrice) / position.entryPrice * 100).toFixed(2)}%

Provide a risk assessment with:
1. Risk level (LOW, MEDIUM, HIGH, CRITICAL)
2. Volatility score (0-100)
3. Risk management recommendation
4. Maximum position size (as percentage)
5. Suggested stop loss price

Consider market volatility, position size, and current market conditions.
`;
}
function buildPortfolioPrompt(symbols, marketData) {
  const marketSummary = marketData.map(
    (m) => `
${m.symbol}:
- Price: $${m.currentPrice}
- 24h Change: ${m.change24h}%
- Volume: ${m.volume24h}
`
  ).join("\n");
  return `
Create a balanced portfolio recommendation for the following cryptocurrencies:

${marketSummary}

Provide recommendations with:
1. Symbol
2. Action (BUY, SELL, HOLD)
3. Portfolio weight (allocation percentage)
4. Reasoning
5. Risk score (0-100)

Ensure the total weight adds up to 100% for BUY positions.
Consider diversification, risk management, and market conditions.
`;
}
async function analyzeSentimentWithLLM(symbol, recentTrades, model = "qwen") {
  const prompt = `
Analyze the market sentiment for ${symbol} based on recent trading activity:

${recentTrades.slice(-10).map((t2) => `Price: $${t2.price}, Volume: ${t2.volume}, Time: ${t2.timestamp.toISOString()}`).join("\n")}

Provide sentiment analysis with:
1. Sentiment (BULLISH, BEARISH, NEUTRAL)
2. Score (-100 to 100, where -100 is extremely bearish and 100 is extremely bullish)
3. Analysis explanation

Consider price trends, volume patterns, and momentum.
`;
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a market sentiment analyst. Analyze trading data and provide sentiment scores. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["BULLISH", "BEARISH", "NEUTRAL"]
              },
              score: {
                type: "number",
                minimum: -100,
                maximum: 100
              },
              analysis: {
                type: "string"
              }
            },
            required: ["sentiment", "score", "analysis"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("[LLM Sentiment Analysis] Error:", error);
    return {
      sentiment: "NEUTRAL",
      score: 0,
      analysis: "Unable to analyze sentiment due to error"
    };
  }
}

// server/routers/llmTradingRouter.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
var marketAnalysisInputSchema = z8.object({
  symbol: z8.string().min(1),
  currentPrice: z8.number().positive(),
  bid: z8.number().positive(),
  ask: z8.number().positive(),
  volume24h: z8.number().nonnegative(),
  change24h: z8.number(),
  previousPrice: z8.number().optional(),
  rsi: z8.number().optional(),
  macd: z8.number().optional(),
  bollingerBands: z8.object({
    upper: z8.number(),
    middle: z8.number(),
    lower: z8.number()
  }).optional(),
  timeframe: z8.string().optional()
});
var modelSchema = z8.enum(["deepseek", "qwen"]);
var llmTradingRouter = router({
  // Analyze market with LLM
  analyzeMarket: protectedProcedure.input(
    z8.object({
      marketData: marketAnalysisInputSchema,
      model: modelSchema.optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const signal = await analyzeMarketWithLLM(
        input.marketData,
        input.model
      );
      return signal;
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to analyze market: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Assess risk for a position
  assessRisk: protectedProcedure.input(
    z8.object({
      marketData: marketAnalysisInputSchema,
      position: z8.object({
        size: z8.number().positive(),
        entryPrice: z8.number().positive(),
        stopLoss: z8.number().positive()
      }),
      model: modelSchema.optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const assessment = await assessRiskWithLLM(
        input.marketData,
        input.position,
        input.model
      );
      return assessment;
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to assess risk: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Generate portfolio recommendations
  generatePortfolioRecommendations: protectedProcedure.input(
    z8.object({
      symbols: z8.array(z8.string()),
      marketData: z8.array(marketAnalysisInputSchema),
      model: modelSchema.optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const recommendations = await generatePortfolioRecommendations(
        input.symbols,
        input.marketData,
        input.model
      );
      return recommendations;
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to generate recommendations: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Analyze sentiment
  analyzeSentiment: protectedProcedure.input(
    z8.object({
      symbol: z8.string(),
      recentTrades: z8.array(
        z8.object({
          price: z8.number(),
          volume: z8.number(),
          timestamp: z8.date()
        })
      ),
      model: modelSchema.optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const sentiment = await analyzeSentimentWithLLM(
        input.symbol,
        input.recentTrades,
        input.model
      );
      return sentiment;
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to analyze sentiment: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }),
  // Get available models
  getAvailableModels: protectedProcedure.query(() => {
    return [
      {
        id: "deepseek",
        name: "DeepSeek",
        description: "Advanced market analysis and trading signal generation",
        capabilities: ["market_analysis", "trading_signals", "portfolio_recommendations"]
      },
      {
        id: "qwen",
        name: "Qwen",
        description: "Risk assessment and sentiment analysis",
        capabilities: ["risk_assessment", "sentiment_analysis", "market_analysis"]
      }
    ];
  }),
  // Get model recommendations for a task
  getModelRecommendation: protectedProcedure.input(
    z8.object({
      task: z8.enum(["market_analysis", "risk_assessment", "portfolio_recommendations", "sentiment_analysis"])
    })
  ).query(({ input }) => {
    const recommendations = {
      market_analysis: "deepseek",
      risk_assessment: "qwen",
      portfolio_recommendations: "deepseek",
      sentiment_analysis: "qwen"
    };
    return {
      recommendedModel: recommendations[input.task],
      alternativeModel: recommendations[input.task] === "deepseek" ? "qwen" : "deepseek"
    };
  }),
  // Batch analyze multiple markets
  analyzeMultipleMarkets: protectedProcedure.input(
    z8.object({
      markets: z8.array(marketAnalysisInputSchema),
      model: modelSchema.optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const signals = await Promise.all(
        input.markets.map(
          (market) => analyzeMarketWithLLM(market, input.model)
        )
      );
      return signals;
    } catch (error) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to analyze markets: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  })
});

// server/routers/tradingControlRouter.ts
import { z as z9 } from "zod";
init_db();
init_schema();
import { eq as eq9, and } from "drizzle-orm";
var tradingControlRouter = router({
  /**
   * Get current trading status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        isTrading: false,
        activeAgents: 0,
        totalAgents: 0,
        lastUpdate: /* @__PURE__ */ new Date(),
        error: "Database connection failed"
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq9(agentConfigs.userId, ctx.user.id));
      const activeAgents = agents.filter((a) => a.isEnabled).length;
      const isTrading = activeAgents > 0;
      return {
        isTrading,
        activeAgents,
        totalAgents: agents.length,
        lastUpdate: /* @__PURE__ */ new Date(),
        agents: agents.map((a) => ({
          id: a.id,
          name: a.agentName,
          type: a.agentType,
          isEnabled: a.isEnabled,
          learningRate: a.learningRate
        }))
      };
    } catch (error) {
      console.error("[TradingControl] Error getting status:", error);
      return {
        isTrading: false,
        activeAgents: 0,
        totalAgents: 0,
        lastUpdate: /* @__PURE__ */ new Date(),
        error: "Failed to get trading status"
      };
    }
  }),
  /**
   * Start trading - enable all agents
   */
  startTrading: protectedProcedure.input(
    z9.object({
      agentIds: z9.array(z9.number()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database connection failed",
        startedAgents: 0
      };
    }
    try {
      let agents;
      if (input.agentIds && input.agentIds.length > 0) {
        agents = await db.select().from(agentConfigs).where(
          and(
            eq9(agentConfigs.userId, ctx.user.id)
            // Note: Drizzle doesn't have direct array support, so we'd need to query individually
            // For now, get all and filter
          )
        );
        agents = agents.filter((a) => input.agentIds.includes(a.id));
      } else {
        agents = await db.select().from(agentConfigs).where(eq9(agentConfigs.userId, ctx.user.id));
      }
      let startedCount = 0;
      for (const agent of agents) {
        if (!agent.isEnabled) {
          await db.update(agentConfigs).set({
            isEnabled: true,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq9(agentConfigs.id, agent.id));
          startedCount++;
        }
      }
      console.log(`[TradingControl] Started ${startedCount} agents for user ${ctx.user.id}`);
      return {
        success: true,
        startedAgents: startedCount,
        totalAgents: agents.length,
        message: `Started ${startedCount} trading agent(s)`
      };
    } catch (error) {
      console.error("[TradingControl] Error starting trading:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start trading",
        startedAgents: 0
      };
    }
  }),
  /**
   * Stop trading - disable all agents
   */
  stopTrading: protectedProcedure.input(
    z9.object({
      agentIds: z9.array(z9.number()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database connection failed",
        stoppedAgents: 0
      };
    }
    try {
      let agents;
      if (input.agentIds && input.agentIds.length > 0) {
        agents = await db.select().from(agentConfigs).where(eq9(agentConfigs.userId, ctx.user.id));
        agents = agents.filter((a) => input.agentIds.includes(a.id));
      } else {
        agents = await db.select().from(agentConfigs).where(eq9(agentConfigs.userId, ctx.user.id));
      }
      let stoppedCount = 0;
      for (const agent of agents) {
        if (agent.isEnabled) {
          await db.update(agentConfigs).set({
            isEnabled: false,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq9(agentConfigs.id, agent.id));
          stoppedCount++;
        }
      }
      console.log(`[TradingControl] Stopped ${stoppedCount} agents for user ${ctx.user.id}`);
      return {
        success: true,
        stoppedAgents: stoppedCount,
        totalAgents: agents.length,
        message: `Stopped ${stoppedCount} trading agent(s)`
      };
    } catch (error) {
      console.error("[TradingControl] Error stopping trading:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to stop trading",
        stoppedAgents: 0
      };
    }
  }),
  /**
   * Get recent trades
   */
  getRecentTrades: protectedProcedure.input(
    z9.object({
      limit: z9.number().min(1).max(100).default(20)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const trades = await db.select().from(tradingResults).where(eq9(tradingResults.userId, ctx.user.id)).limit(input.limit);
      return trades.map((t2) => ({
        id: t2.id,
        agentId: t2.agentId,
        symbol: t2.symbol,
        tradeType: t2.tradeType,
        entryPrice: t2.entryPrice,
        exitPrice: t2.exitPrice,
        quantity: t2.quantity,
        profit: typeof t2.profit === "number" ? t2.profit : parseFloat(t2.profit) || 0,
        profitPercent: typeof t2.profitPercent === "number" ? t2.profitPercent : parseFloat(t2.profitPercent) || 0,
        status: t2.status,
        timestamp: t2.createdAt
      }));
    } catch (error) {
      console.error("[TradingControl] Error getting recent trades:", error);
      return [];
    }
  }),
  /**
   * Get trading statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        activeAgents: 0,
        lastTradeTime: null
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq9(agentConfigs.userId, ctx.user.id));
      const activeAgents = agents.filter((a) => a.isEnabled).length;
      const trades = await db.select().from(tradingResults).where(eq9(tradingResults.userId, ctx.user.id));
      if (trades.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          totalProfit: 0,
          activeAgents,
          lastTradeTime: null
        };
      }
      const totalTrades = trades.length;
      const winningTrades = trades.filter((t2) => {
        const profit = typeof t2.profit === "number" ? t2.profit : parseFloat(t2.profit) || 0;
        return profit > 0;
      }).length;
      const winRate = totalTrades > 0 ? winningTrades / totalTrades * 100 : 0;
      const totalProfit = trades.reduce((sum3, t2) => {
        const profit = typeof t2.profit === "number" ? t2.profit : parseFloat(t2.profit) || 0;
        return sum3 + profit;
      }, 0);
      const lastTrade = trades.reduce((latest, t2) => {
        return t2.createdAt > latest.createdAt ? t2 : latest;
      });
      return {
        totalTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        activeAgents,
        lastTradeTime: lastTrade?.createdAt || null
      };
    } catch (error) {
      console.error("[TradingControl] Error getting stats:", error);
      return {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        activeAgents: 0,
        lastTradeTime: null
      };
    }
  })
});

// server/routers/autonomousAgentSelectorRouter.ts
import { z as z10 } from "zod";
init_db();
init_schema();
import { eq as eq10 } from "drizzle-orm";

// server/services/autonomousAgentSelector.ts
var AutonomousAgentSelector = class {
  /**
   * Analyze market conditions based on recent price data
   */
  static analyzeMarketConditions(recentPrices, recentRSI, recentMACD) {
    if (recentPrices.length < 2) {
      return {
        trend: "ranging",
        volatility: "medium",
        momentum: "weak",
        rsi: 50,
        macd: "neutral"
      };
    }
    const priceChange = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const trend = priceChange > 0 ? "uptrend" : priceChange < 0 ? "downtrend" : "ranging";
    const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const variance = recentPrices.reduce((sum3, price) => sum3 + Math.pow(price - mean, 2), 0) / recentPrices.length;
    const stdDev = Math.sqrt(variance);
    const volatilityPercent = stdDev / mean * 100;
    const volatility = volatilityPercent > 5 ? "high" : volatilityPercent > 2 ? "medium" : "low";
    const momentum = Math.abs(priceChange) > mean * 0.05 ? "strong" : Math.abs(priceChange) > mean * 0.02 ? "moderate" : "weak";
    return {
      trend,
      volatility,
      momentum,
      rsi: recentRSI,
      macd: recentMACD
    };
  }
  /**
   * Score agents based on performance and market fit
   */
  static scoreAgents(agents, executions, marketCondition) {
    return agents.map((agent) => {
      const agentExecutions5 = executions.filter((e) => e.agentId === agent.id);
      const winningTrades = agentExecutions5.reduce(
        (sum3, e) => sum3 + (e.winningTrades || 0),
        0
      );
      const totalTrades = agentExecutions5.reduce(
        (sum3, e) => sum3 + (e.totalTrades || 0),
        0
      );
      const winRate = totalTrades > 0 ? winningTrades / totalTrades * 100 : 0;
      const totalProfit = agentExecutions5.reduce((sum3, e) => {
        const profit = typeof e.totalProfit === "number" ? e.totalProfit : parseFloat(e.totalProfit) || 0;
        return sum3 + profit;
      }, 0);
      const profitability = totalProfit > 0 ? Math.min(totalProfit * 10, 100) : 0;
      const recentPerformance = agentExecutions5.length > 0 ? Math.min(winRate / 100 * agentExecutions5.length * 10, 100) : 0;
      let marketFitScore = 0;
      if (agent.agentType === "momentum") {
        if (marketCondition.trend !== "ranging" && marketCondition.momentum === "strong") {
          marketFitScore = 40;
        } else if (marketCondition.volatility === "high") {
          marketFitScore = 30;
        } else {
          marketFitScore = 10;
        }
      } else if (agent.agentType === "mean_reversion") {
        if (marketCondition.trend === "ranging" && marketCondition.volatility === "medium") {
          marketFitScore = 40;
        } else if (marketCondition.rsi > 70 || marketCondition.rsi < 30) {
          marketFitScore = 30;
        } else {
          marketFitScore = 10;
        }
      } else if (agent.agentType === "arbitrage") {
        marketFitScore = 25;
      } else if (agent.agentType === "deepseek" || agent.agentType === "qwen") {
        if (marketCondition.volatility === "high") {
          marketFitScore = 35;
        } else {
          marketFitScore = 20;
        }
      }
      const score = winRate * 0.3 + profitability * 0.3 + recentPerformance * 0.2 + marketFitScore * 0.2;
      let recommendation = "";
      if (score > 75) {
        recommendation = "Highly Recommended - Excellent performance";
      } else if (score > 60) {
        recommendation = "Recommended - Good performance";
      } else if (score > 40) {
        recommendation = "Neutral - Average performance";
      } else {
        recommendation = "Use with caution - Below average performance";
      }
      return {
        agentId: agent.id,
        agentType: agent.agentType,
        score: Math.round(score),
        winRate: Math.round(winRate),
        profitability: Math.round(profitability),
        recentPerformance: Math.round(recentPerformance),
        volatilityScore: marketFitScore,
        recommendation
      };
    });
  }
  /**
   * Select best agent for current market conditions
   */
  static selectBestAgent(scores) {
    if (scores.length === 0) return null;
    return scores.reduce(
      (best, current) => current.score > best.score ? current : best
    );
  }
  /**
   * Select multiple agents for diversification
   */
  static selectDiversifiedAgents(scores, count2 = 3) {
    return scores.sort((a, b) => b.score - a.score).slice(0, count2);
  }
  /**
   * Detect if agent switching is needed
   */
  static shouldSwitchAgent(currentAgent, topAgent, threshold = 20) {
    return topAgent.score - currentAgent.score > threshold;
  }
  /**
   * Calculate portfolio allocation across agents
   */
  static calculateAllocation(scores, totalCapital) {
    const allocation = {};
    const totalScore = scores.reduce((sum3, s) => sum3 + s.score, 0);
    if (totalScore === 0) {
      const equalShare = totalCapital / scores.length;
      scores.forEach((s) => {
        allocation[s.agentId] = equalShare;
      });
    } else {
      scores.forEach((s) => {
        allocation[s.agentId] = s.score / totalScore * totalCapital;
      });
    }
    return allocation;
  }
  /**
   * Generate agent recommendations
   */
  static generateRecommendations(scores, marketCondition) {
    const recommendations = [];
    const topAgent = scores[0];
    if (topAgent) {
      recommendations.push(
        `Best Agent: ${topAgent.agentType} (Score: ${topAgent.score})`
      );
      recommendations.push(`Recommendation: ${topAgent.recommendation}`);
    }
    if (marketCondition.trend === "uptrend" && marketCondition.momentum === "strong") {
      recommendations.push("Market Condition: Strong Uptrend - Momentum agents recommended");
    } else if (marketCondition.trend === "downtrend") {
      recommendations.push(
        "Market Condition: Downtrend - Consider hedging or mean reversion"
      );
    } else if (marketCondition.trend === "ranging") {
      recommendations.push("Market Condition: Ranging - Mean reversion agents recommended");
    }
    if (marketCondition.volatility === "high") {
      recommendations.push("High Volatility: Increase risk management parameters");
    }
    return recommendations;
  }
  /**
   * Calculate agent health score
   */
  static calculateHealthScore(agentExecutions5, recentTradesCount = 10) {
    if (agentExecutions5.length === 0) return 50;
    const recentExecutions = agentExecutions5.slice(-recentTradesCount);
    const successfulExecutions = recentExecutions.filter(
      (e) => e.status === "completed"
    ).length;
    const errorExecutions = recentExecutions.filter(
      (e) => e.status === "error"
    ).length;
    const successRate = successfulExecutions / recentExecutions.length * 100;
    const errorPenalty = errorExecutions * 10;
    return Math.max(0, Math.min(100, successRate - errorPenalty));
  }
};

// server/routers/autonomousAgentSelectorRouter.ts
var autonomousAgentSelectorRouter = router({
  /**
   * Get agent scores for current market conditions
   */
  getAgentScores: protectedProcedure.input(
    z10.object({
      recentPrices: z10.array(z10.number()).default([100, 101, 102, 101, 103]),
      rsi: z10.number().min(0).max(100).default(50),
      macd: z10.enum(["bullish", "bearish", "neutral"]).default("neutral")
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        scores: [],
        marketCondition: null,
        error: "Database connection failed"
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq10(agentConfigs.userId, ctx.user.id));
      if (agents.length === 0) {
        return {
          scores: [],
          marketCondition: null,
          error: "No agents configured"
        };
      }
      const executions = await db.select().from(agentExecutions).where(eq10(agentExecutions.userId, ctx.user.id));
      const marketCondition = AutonomousAgentSelector.analyzeMarketConditions(
        input.recentPrices,
        input.rsi,
        input.macd
      );
      const scores = AutonomousAgentSelector.scoreAgents(
        agents,
        executions,
        marketCondition
      );
      return {
        scores,
        marketCondition,
        error: null
      };
    } catch (error) {
      console.error("[AutonomousAgentSelector] Error getting scores:", error);
      return {
        scores: [],
        marketCondition: null,
        error: error instanceof Error ? error.message : "Failed to get scores"
      };
    }
  }),
  /**
   * Get best agent recommendation
   */
  getBestAgent: protectedProcedure.input(
    z10.object({
      recentPrices: z10.array(z10.number()).default([100, 101, 102, 101, 103]),
      rsi: z10.number().min(0).max(100).default(50),
      macd: z10.enum(["bullish", "bearish", "neutral"]).default("neutral")
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        bestAgent: null,
        recommendations: [],
        error: "Database connection failed"
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq10(agentConfigs.userId, ctx.user.id));
      if (agents.length === 0) {
        return {
          bestAgent: null,
          recommendations: ["No agents configured"],
          error: null
        };
      }
      const executions = await db.select().from(agentExecutions).where(eq10(agentExecutions.userId, ctx.user.id));
      const marketCondition = AutonomousAgentSelector.analyzeMarketConditions(
        input.recentPrices,
        input.rsi,
        input.macd
      );
      const scores = AutonomousAgentSelector.scoreAgents(
        agents,
        executions,
        marketCondition
      );
      const bestAgent = AutonomousAgentSelector.selectBestAgent(scores);
      const recommendations = AutonomousAgentSelector.generateRecommendations(
        scores,
        marketCondition
      );
      return {
        bestAgent,
        recommendations,
        error: null
      };
    } catch (error) {
      console.error("[AutonomousAgentSelector] Error getting best agent:", error);
      return {
        bestAgent: null,
        recommendations: [],
        error: error instanceof Error ? error.message : "Failed to get best agent"
      };
    }
  }),
  /**
   * Get diversified agent portfolio
   */
  getDiversifiedPortfolio: protectedProcedure.input(
    z10.object({
      agentCount: z10.number().min(1).max(10).default(3),
      recentPrices: z10.array(z10.number()).default([100, 101, 102, 101, 103]),
      rsi: z10.number().min(0).max(100).default(50),
      macd: z10.enum(["bullish", "bearish", "neutral"]).default("neutral")
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        portfolio: [],
        allocation: {},
        error: "Database connection failed"
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq10(agentConfigs.userId, ctx.user.id));
      if (agents.length === 0) {
        return {
          portfolio: [],
          allocation: {},
          error: "No agents configured"
        };
      }
      const executions = await db.select().from(agentExecutions).where(eq10(agentExecutions.userId, ctx.user.id));
      const marketCondition = AutonomousAgentSelector.analyzeMarketConditions(
        input.recentPrices,
        input.rsi,
        input.macd
      );
      const scores = AutonomousAgentSelector.scoreAgents(
        agents,
        executions,
        marketCondition
      );
      const portfolio = AutonomousAgentSelector.selectDiversifiedAgents(
        scores,
        input.agentCount
      );
      const allocation = AutonomousAgentSelector.calculateAllocation(
        portfolio,
        1e4
        // Default capital
      );
      return {
        portfolio,
        allocation,
        error: null
      };
    } catch (error) {
      console.error("[AutonomousAgentSelector] Error getting portfolio:", error);
      return {
        portfolio: [],
        allocation: {},
        error: error instanceof Error ? error.message : "Failed to get portfolio"
      };
    }
  }),
  /**
   * Check if agent switching is needed
   */
  shouldSwitchAgent: protectedProcedure.input(
    z10.object({
      currentAgentId: z10.number(),
      threshold: z10.number().default(20),
      recentPrices: z10.array(z10.number()).default([100, 101, 102, 101, 103]),
      rsi: z10.number().min(0).max(100).default(50),
      macd: z10.enum(["bullish", "bearish", "neutral"]).default("neutral")
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        shouldSwitch: false,
        newAgent: null,
        reason: "Database connection failed"
      };
    }
    try {
      const agents = await db.select().from(agentConfigs).where(eq10(agentConfigs.userId, ctx.user.id));
      const executions = await db.select().from(agentExecutions).where(eq10(agentExecutions.userId, ctx.user.id));
      const marketCondition = AutonomousAgentSelector.analyzeMarketConditions(
        input.recentPrices,
        input.rsi,
        input.macd
      );
      const scores = AutonomousAgentSelector.scoreAgents(
        agents,
        executions,
        marketCondition
      );
      const currentAgent = scores.find((s) => s.agentId === input.currentAgentId);
      const topAgent = AutonomousAgentSelector.selectBestAgent(scores);
      if (!currentAgent || !topAgent) {
        return {
          shouldSwitch: false,
          newAgent: null,
          reason: "Agent not found"
        };
      }
      const shouldSwitch = AutonomousAgentSelector.shouldSwitchAgent(
        currentAgent,
        topAgent,
        input.threshold
      );
      return {
        shouldSwitch,
        newAgent: shouldSwitch ? topAgent : null,
        reason: shouldSwitch ? `Better agent available: ${topAgent.agentType} (Score: ${topAgent.score} vs ${currentAgent.score})` : "Current agent is performing well"
      };
    } catch (error) {
      console.error("[AutonomousAgentSelector] Error checking switch:", error);
      return {
        shouldSwitch: false,
        newAgent: null,
        reason: error instanceof Error ? error.message : "Failed to check switch"
      };
    }
  }),
  /**
   * Get agent health status
   */
  getAgentHealth: protectedProcedure.input(z10.object({ agentId: z10.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      return {
        agentId: input.agentId,
        healthScore: 0,
        status: "unknown",
        error: "Database connection failed"
      };
    }
    try {
      const executions = await db.select().from(agentExecutions).where(eq10(agentExecutions.agentId, input.agentId));
      const healthScore = AutonomousAgentSelector.calculateHealthScore(executions);
      let status = "unknown";
      if (healthScore >= 80) {
        status = "healthy";
      } else if (healthScore >= 50) {
        status = "warning";
      } else {
        status = "critical";
      }
      return {
        agentId: input.agentId,
        healthScore,
        status,
        error: null
      };
    } catch (error) {
      console.error("[AutonomousAgentSelector] Error getting health:", error);
      return {
        agentId: input.agentId,
        healthScore: 0,
        status: "unknown",
        error: error instanceof Error ? error.message : "Failed to get health"
      };
    }
  })
});

// server/routers/paperTradingRouter.ts
import { z as z11 } from "zod";

// server/paperTradingDb.ts
init_db();
init_schema();
import { eq as eq11, and as and2 } from "drizzle-orm";
async function createPaperTradingSession(userId, sessionName, initialCapital, durationDays = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const session = {
    userId,
    sessionName,
    initialCapital: initialCapital.toString(),
    currentBalance: initialCapital.toString(),
    totalProfit: "0",
    totalLoss: "0",
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: "0",
    roi: "0",
    sharpeRatio: "0",
    maxDrawdown: "0",
    status: "active",
    startDate: /* @__PURE__ */ new Date(),
    durationDays
  };
  const result = await db.insert(paperTradingSessions).values(session);
  return result;
}
async function getUserPaperTradingSessions(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(paperTradingSessions).where(eq11(paperTradingSessions.userId, userId)).orderBy(paperTradingSessions.createdAt);
}
async function getPaperTradingSession(sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(paperTradingSessions).where(eq11(paperTradingSessions.id, sessionId)).limit(1);
  return result[0] || null;
}
async function createPaperTradingTrade(sessionId, userId, trade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const tradeRecord = {
    sessionId,
    userId,
    symbol: trade.symbol,
    tradeType: trade.tradeType,
    entryPrice: trade.entryPrice.toString(),
    quantity: trade.quantity.toString(),
    profit: "0",
    profitPercent: "0",
    status: "open",
    confidence: trade.confidence.toString(),
    entryTime: /* @__PURE__ */ new Date()
  };
  return await db.insert(paperTradingTrades).values(tradeRecord);
}
async function closePaperTradingTrade(tradeId, exitPrice, profit, profitPercent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(paperTradingTrades).set({
    exitPrice: exitPrice.toString(),
    exitTime: /* @__PURE__ */ new Date(),
    profit: profit.toString(),
    profitPercent: profitPercent.toString(),
    status: "closed"
  }).where(eq11(paperTradingTrades.id, tradeId));
}
async function getSessionTrades(sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(paperTradingTrades).where(eq11(paperTradingTrades.sessionId, sessionId)).orderBy(paperTradingTrades.entryTime);
}
async function getSessionPortfolio(sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(paperTradingPortfolio).where(eq11(paperTradingPortfolio.sessionId, sessionId));
}
async function completePaperTradingSession(sessionId, finalMetrics) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(paperTradingSessions).set({
    status: "completed",
    endDate: /* @__PURE__ */ new Date(),
    totalProfit: finalMetrics.totalProfit.toString(),
    totalLoss: finalMetrics.totalLoss.toString(),
    winRate: finalMetrics.winRate.toString(),
    roi: finalMetrics.roi.toString(),
    sharpeRatio: finalMetrics.sharpeRatio.toString(),
    maxDrawdown: finalMetrics.maxDrawdown.toString(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq11(paperTradingSessions.id, sessionId));
}

// server/services/paperTradingEngine.ts
var PaperTradingEngine = class {
  sessionId;
  initialCapital;
  currentBalance;
  trades = [];
  portfolio = /* @__PURE__ */ new Map();
  // symbol -> quantity
  priceHistory = /* @__PURE__ */ new Map();
  startDate;
  endDate;
  dailyBalances = [];
  constructor(config) {
    this.sessionId = `paper_${Date.now()}`;
    this.initialCapital = config.initialCapital;
    this.currentBalance = config.initialCapital;
    this.startDate = /* @__PURE__ */ new Date();
    this.endDate = new Date(this.startDate.getTime() + config.durationDays * 24 * 60 * 60 * 1e3);
    this.dailyBalances = [this.initialCapital];
    for (const symbol of config.symbols) {
      this.portfolio.set(symbol, 0);
      this.priceHistory.set(symbol, []);
    }
  }
  /**
   * Execute a paper trade with current market price
   */
  executeTrade(symbol, tradeType, quantity, currentPrice, confidence = 0.5) {
    if (/* @__PURE__ */ new Date() > this.endDate) {
      console.log("[PaperTrading] Session expired");
      return null;
    }
    if (tradeType === "buy" || tradeType === "long") {
      const cost = quantity * currentPrice;
      if (cost > this.currentBalance) {
        console.log(`[PaperTrading] Insufficient balance for ${symbol} buy order`);
        return null;
      }
    }
    const trade = {
      id: `trade_${this.trades.length + 1}`,
      symbol,
      tradeType,
      entryPrice: currentPrice,
      quantity,
      profit: 0,
      profitPercent: 0,
      status: "open",
      confidence,
      entryTime: /* @__PURE__ */ new Date()
    };
    if (tradeType === "buy" || tradeType === "long") {
      const cost = quantity * currentPrice;
      this.currentBalance = this.currentBalance - cost;
      const currentQty = this.portfolio.get(symbol) || 0;
      this.portfolio.set(symbol, currentQty + quantity);
    } else {
      const proceeds = quantity * currentPrice;
      this.currentBalance = this.currentBalance + proceeds;
      const currentQty = this.portfolio.get(symbol) || 0;
      this.portfolio.set(symbol, Math.max(0, currentQty - quantity));
    }
    this.trades.push(trade);
    return trade;
  }
  /**
   * Close an open paper trade
   */
  closeTrade(tradeId, exitPrice) {
    const trade = this.trades.find((t2) => t2.id === tradeId);
    if (!trade || trade.status !== "open") {
      return null;
    }
    trade.exitPrice = exitPrice;
    trade.exitTime = /* @__PURE__ */ new Date();
    trade.status = "closed";
    if (trade.tradeType === "buy" || trade.tradeType === "long") {
      const profit = trade.quantity * (exitPrice - trade.entryPrice);
      trade.profit = profit;
      trade.profitPercent = (exitPrice - trade.entryPrice) / trade.entryPrice * 100;
    } else {
      const profit = trade.quantity * (trade.entryPrice - exitPrice);
      trade.profit = profit;
      trade.profitPercent = (trade.entryPrice - exitPrice) / trade.entryPrice * 100;
    }
    this.currentBalance = this.currentBalance + trade.profit;
    return trade;
  }
  /**
   * Update live prices for all symbols
   */
  updatePrices(prices) {
    for (const price of prices) {
      const history = this.priceHistory.get(price.symbol) || [];
      history.push(price);
      this.priceHistory.set(price.symbol, history);
      this.updateUnrealizedPL(price.symbol, price.price);
    }
  }
  /**
   * Update unrealized P&L for open positions
   */
  updateUnrealizedPL(symbol, currentPrice) {
    const openTrades = this.trades.filter((t2) => t2.symbol === symbol && t2.status === "open");
    for (const trade of openTrades) {
      if (trade.tradeType === "buy" || trade.tradeType === "long") {
        trade.profit = trade.quantity * (currentPrice - trade.entryPrice);
        trade.profitPercent = (currentPrice - trade.entryPrice) / trade.entryPrice * 100;
      } else {
        trade.profit = trade.quantity * (trade.entryPrice - currentPrice);
        trade.profitPercent = (trade.entryPrice - currentPrice) / trade.entryPrice * 100;
      }
    }
  }
  /**
   * Get current portfolio value
   */
  getPortfolioValue(currentPrices) {
    let totalValue = this.currentBalance;
    this.portfolio.forEach((quantity, symbol) => {
      const price = currentPrices.get(symbol) || 0;
      const value = quantity * price;
      totalValue += value;
    });
    return totalValue;
  }
  /**
   * Calculate performance metrics
   */
  getMetrics() {
    const closedTrades = this.trades.filter((t2) => t2.status === "closed");
    const winningTrades = closedTrades.filter((t2) => t2.profit > 0).length;
    const losingTrades = closedTrades.filter((t2) => t2.profit < 0).length;
    const totalProfit = closedTrades.filter((t2) => t2.profit > 0).reduce((sum3, t2) => sum3 + t2.profit, 0);
    const totalLoss = Math.abs(
      closedTrades.filter((t2) => t2.profit < 0).reduce((sum3, t2) => sum3 + t2.profit, 0)
    );
    const roi = (this.currentBalance - this.initialCapital) / this.initialCapital * 100;
    const sharpeRatio = this.calculateSharpeRatio();
    const maxDrawdown = this.calculateMaxDrawdown();
    return {
      totalTrades: this.trades.length,
      winningTrades,
      losingTrades,
      winRate: closedTrades.length > 0 ? winningTrades / closedTrades.length * 100 : 0,
      totalProfit,
      totalLoss,
      roi,
      sharpeRatio,
      maxDrawdown,
      currentBalance: this.currentBalance
    };
  }
  /**
   * Calculate Sharpe Ratio (simplified)
   */
  calculateSharpeRatio() {
    if (this.dailyBalances.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < this.dailyBalances.length; i++) {
      const ret = (this.dailyBalances[i] - this.dailyBalances[i - 1]) / this.dailyBalances[i - 1];
      returns.push(ret);
    }
    if (returns.length === 0) return 0;
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum3, ret) => sum3 + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const riskFreeRate = 0.02 / 252;
    return stdDev > 0 ? (meanReturn - riskFreeRate) / stdDev : 0;
  }
  /**
   * Calculate Maximum Drawdown
   */
  calculateMaxDrawdown() {
    if (this.dailyBalances.length < 2) return 0;
    let maxDrawdown = 0;
    let peak = this.dailyBalances[0];
    for (let i = 1; i < this.dailyBalances.length; i++) {
      if (this.dailyBalances[i] > peak) {
        peak = this.dailyBalances[i];
      }
      const drawdown = (peak - this.dailyBalances[i]) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    return maxDrawdown;
  }
  /**
   * Record daily balance for metrics calculation
   */
  recordDailyBalance() {
    this.dailyBalances.push(this.currentBalance);
  }
  /**
   * Check if session is still active
   */
  isActive() {
    return /* @__PURE__ */ new Date() <= this.endDate;
  }
  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startDate: this.startDate,
      endDate: this.endDate,
      daysRemaining: Math.ceil((this.endDate.getTime() - (/* @__PURE__ */ new Date()).getTime()) / (1e3 * 60 * 60 * 24)),
      isActive: this.isActive()
    };
  }
  /**
   * Get all trades
   */
  getTrades() {
    return this.trades;
  }
  /**
   * Get portfolio
   */
  getPortfolio() {
    return this.portfolio;
  }
};

// server/routers/paperTradingRouter.ts
var activeSessions = /* @__PURE__ */ new Map();
var paperTradingRouter = router({
  /**
   * Create a new paper trading session
   */
  createSession: protectedProcedure.input(
    z11.object({
      sessionName: z11.string(),
      initialCapital: z11.number().positive(),
      durationDays: z11.number().int().min(1).max(30).default(7),
      symbols: z11.array(z11.string()).default(["BTC/USDT", "ETH/USDT"])
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const result = await createPaperTradingSession(
        ctx.user.id,
        input.sessionName,
        input.initialCapital,
        input.durationDays
      );
      const engine = new PaperTradingEngine({
        sessionName: input.sessionName,
        initialCapital: input.initialCapital,
        durationDays: input.durationDays,
        symbols: input.symbols
      });
      const sessionId = result[0]?.insertId || 1;
      activeSessions.set(sessionId, engine);
      return {
        success: true,
        sessionId,
        message: `Paper trading session "${input.sessionName}" created for 7 days`
      };
    } catch (error) {
      console.error("[PaperTrading] Error creating session:", error);
      throw error;
    }
  }),
  /**
   * Get all sessions for the user
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await getUserPaperTradingSessions(ctx.user.id);
      return sessions;
    } catch (error) {
      console.error("[PaperTrading] Error fetching sessions:", error);
      throw error;
    }
  }),
  /**
   * Get session details
   */
  getSession: protectedProcedure.input(z11.object({ sessionId: z11.number() })).query(async ({ ctx, input }) => {
    try {
      const session = await getPaperTradingSession(input.sessionId);
      if (!session) throw new Error("Session not found");
      return session;
    } catch (error) {
      console.error("[PaperTrading] Error fetching session:", error);
      throw error;
    }
  }),
  /**
   * Execute a paper trade
   */
  executeTrade: protectedProcedure.input(
    z11.object({
      sessionId: z11.number(),
      symbol: z11.string(),
      tradeType: z11.enum(["buy", "sell", "long", "short"]),
      quantity: z11.number().positive(),
      currentPrice: z11.number().positive(),
      confidence: z11.number().min(0).max(1).default(0.5)
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const engine = activeSessions.get(input.sessionId);
      if (!engine) throw new Error("Session not found or expired");
      const trade = engine.executeTrade(
        input.symbol,
        input.tradeType,
        input.quantity,
        input.currentPrice,
        input.confidence
      );
      if (!trade) throw new Error("Trade execution failed");
      await createPaperTradingTrade(input.sessionId, ctx.user.id, {
        symbol: input.symbol,
        tradeType: input.tradeType,
        entryPrice: input.currentPrice,
        quantity: input.quantity,
        confidence: input.confidence
      });
      return {
        success: true,
        trade,
        message: `${input.tradeType.toUpperCase()} trade executed: ${input.quantity} ${input.symbol}`
      };
    } catch (error) {
      console.error("[PaperTrading] Error executing trade:", error);
      throw error;
    }
  }),
  /**
   * Close a paper trade
   */
  closeTrade: protectedProcedure.input(
    z11.object({
      sessionId: z11.number(),
      tradeId: z11.string(),
      exitPrice: z11.number().positive()
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const engine = activeSessions.get(input.sessionId);
      if (!engine) throw new Error("Session not found or expired");
      const closedTrade = engine.closeTrade(input.tradeId, input.exitPrice);
      if (!closedTrade) throw new Error("Trade close failed");
      const tradeIdNum = parseInt(input.tradeId.split("_")[1]);
      await closePaperTradingTrade(
        tradeIdNum,
        input.exitPrice,
        closedTrade.profit,
        closedTrade.profitPercent
      );
      return {
        success: true,
        trade: closedTrade,
        message: `Trade closed with ${closedTrade.profitPercent.toFixed(2)}% profit`
      };
    } catch (error) {
      console.error("[PaperTrading] Error closing trade:", error);
      throw error;
    }
  }),
  /**
   * Get session trades
   */
  getTrades: protectedProcedure.input(z11.object({ sessionId: z11.number() })).query(async ({ ctx, input }) => {
    try {
      const trades = await getSessionTrades(input.sessionId);
      return trades;
    } catch (error) {
      console.error("[PaperTrading] Error fetching trades:", error);
      throw error;
    }
  }),
  /**
   * Get session metrics
   */
  getMetrics: protectedProcedure.input(z11.object({ sessionId: z11.number() })).query(async ({ ctx, input }) => {
    try {
      const engine = activeSessions.get(input.sessionId);
      if (!engine) throw new Error("Session not found or expired");
      const metrics = engine.getMetrics();
      const sessionInfo = engine.getSessionInfo();
      return {
        ...metrics,
        ...sessionInfo
      };
    } catch (error) {
      console.error("[PaperTrading] Error fetching metrics:", error);
      throw error;
    }
  }),
  /**
   * Get session portfolio
   */
  getPortfolio: protectedProcedure.input(z11.object({ sessionId: z11.number() })).query(async ({ ctx, input }) => {
    try {
      const portfolio = await getSessionPortfolio(input.sessionId);
      return portfolio;
    } catch (error) {
      console.error("[PaperTrading] Error fetching portfolio:", error);
      throw error;
    }
  }),
  /**
   * Complete a paper trading session
   */
  completeSession: protectedProcedure.input(z11.object({ sessionId: z11.number() })).mutation(async ({ ctx, input }) => {
    try {
      const engine = activeSessions.get(input.sessionId);
      if (!engine) throw new Error("Session not found");
      const metrics = engine.getMetrics();
      await completePaperTradingSession(input.sessionId, {
        totalProfit: metrics.totalProfit,
        totalLoss: metrics.totalLoss,
        winRate: metrics.winRate,
        roi: metrics.roi,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown
      });
      activeSessions.delete(input.sessionId);
      return {
        success: true,
        metrics,
        message: "Paper trading session completed"
      };
    } catch (error) {
      console.error("[PaperTrading] Error completing session:", error);
      throw error;
    }
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  automation: automationRouter,
  wallet: walletRouter,
  agentExecution: agentExecutionRouter,
  agentSelection: agentSelectionRouter,
  trading: tradingRouter,
  autoTrade: autoTradeRouter,
  market: marketRouter,
  autonomousAgent: autonomousAgentRouter,
  dashboard: dashboardRouter,
  exchange: exchangeRouter,
  llmTrading: llmTradingRouter,
  tradingControl: tradingControlRouter,
  autonomousAgentSelector: autonomousAgentSelectorRouter,
  paperTrading: paperTradingRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/scheduler.ts
init_db();
init_schema();
import { eq as eq12 } from "drizzle-orm";
var TradeScheduler = class {
  intervalId = null;
  isRunning = false;
  /**
   * Start the scheduler to generate trades periodically
   * @param intervalMs Interval in milliseconds (default: 5 minutes)
   */
  start(intervalMs = 5 * 60 * 1e3) {
    if (this.isRunning) {
      console.log("[TradeScheduler] Already running");
      return;
    }
    this.isRunning = true;
    console.log(`[TradeScheduler] Started with interval ${intervalMs}ms`);
    this.generateTradesForAllUsers().catch((error) => {
      console.error("[TradeScheduler] Error on initial run:", error);
    });
    this.intervalId = setInterval(() => {
      this.generateTradesForAllUsers().catch((error) => {
        console.error("[TradeScheduler] Error in scheduled run:", error);
      });
    }, intervalMs);
  }
  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[TradeScheduler] Stopped");
  }
  /**
   * Generate trades for all users
   */
  async generateTradesForAllUsers() {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[TradeScheduler] Database not available");
        return;
      }
      const allUsers = await db.select().from(users);
      console.log(`[TradeScheduler] Processing ${allUsers.length} users`);
      for (const user of allUsers) {
        try {
          await this.generateTradesForUser(user.id);
        } catch (error) {
          console.error(`[TradeScheduler] Error processing user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[TradeScheduler] Error in generateTradesForAllUsers:", error);
    }
  }
  /**
   * Generate trades for a specific user
   */
  async generateTradesForUser(userId) {
    const db = await getDb();
    if (!db) return;
    try {
      const userAgents = await db.select().from(agentConfigs).where(eq12(agentConfigs.userId, userId));
      if (userAgents.length === 0) {
        return;
      }
      for (const agent of userAgents) {
        if (Math.random() > 0.7) {
          const trade = generateRealisticTrade(agent.id, agent.agentType, 45e3);
          const profitPercent = trade.quantity > 0 ? trade.profit / (trade.entryPrice * trade.quantity) * 100 : 0;
          try {
            const result = await db.insert(tradingResults).values({
              executionId: agent.id,
              userId,
              agentId: agent.id,
              symbol: trade.symbol,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              quantity: trade.quantity,
              profit: parseFloat(trade.profit.toFixed(2)),
              profitPercent: parseFloat(profitPercent.toFixed(4)),
              tradeType: trade.tradeType,
              status: "closed",
              confidence: parseFloat((trade.confidence * 100).toFixed(2)),
              entryTime: trade.timestamp,
              exitTime: /* @__PURE__ */ new Date(),
              createdAt: trade.timestamp
            });
          } catch (insertError) {
            console.error(`[TradeScheduler] Error inserting trade for agent ${agent.id}:`, insertError);
          }
          if (trade.profit !== 0) {
            try {
              await db.insert(walletTransactions).values({
                userId,
                transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
                amount: Math.abs(trade.profit).toFixed(2),
                currency: "USDT",
                status: "completed",
                description: `Automated trade by ${agent.agentType} agent - ${trade.symbol}`
              });
            } catch (txError) {
              console.error(`[TradeScheduler] Error recording transaction:`, txError);
            }
          }
          const wallet = await db.select().from(walletBalance).where(eq12(walletBalance.userId, userId)).limit(1);
          if (wallet.length > 0) {
            const currentBalance = parseFloat(wallet[0].totalBalance?.toString() || "0");
            const newBalance = currentBalance + trade.profit;
            await db.update(walletBalance).set({
              totalBalance: Math.max(0, newBalance).toFixed(2),
              availableBalance: Math.max(0, newBalance).toFixed(2)
            }).where(eq12(walletBalance.userId, userId));
          }
        }
      }
    } catch (error) {
      console.error(`[TradeScheduler] Error generating trades for user ${userId}:`, error);
    }
  }
};
var tradeScheduler = new TradeScheduler();

// server/autoTradingEngine.ts
init_schema();
init_db();
import { eq as eq13, and as and3 } from "drizzle-orm";

// server/services/technicalIndicators.ts
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  const ema12 = calculateEMA(prices, fast);
  const ema26 = calculateEMA(prices, slow);
  const macdLine = ema12 - ema26;
  const macdValues = [];
  for (let i = Math.max(slow - 1, 0); i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1), fast);
    const e26 = calculateEMA(prices.slice(0, i + 1), slow);
    macdValues.push(e12 - e26);
  }
  const signalLine = calculateEMA(macdValues, signal);
  const histogram = macdLine - signalLine;
  return { line: macdLine, signal: signalLine, histogram };
}
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA2(prices, period);
  const variance = prices.slice(-period).reduce((sum3, price) => sum3 + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: sma + std * stdDev,
    middle: sma,
    lower: sma - std * stdDev
  };
}
function calculateATR(data, period = 14) {
  if (data.length < period) return 0;
  const trueRanges = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}
function calculateStochastic(data, period = 14, smoothK = 3, smoothD = 3) {
  if (data.length < period) return { k: 50, d: 50 };
  const recentData = data.slice(-period);
  const high = Math.max(...recentData.map((d) => d.high));
  const low = Math.min(...recentData.map((d) => d.low));
  const close = data[data.length - 1].close;
  const k = high === low ? 50 : (close - low) / (high - low) * 100;
  const kValues = [];
  for (let i = period; i < data.length; i++) {
    const h = Math.max(...data.slice(i - period, i).map((d) => d.high));
    const l = Math.min(...data.slice(i - period, i).map((d) => d.low));
    const c = data[i].close;
    kValues.push(h === l ? 50 : (c - l) / (h - l) * 100);
  }
  const smoothedK = calculateSMA2(kValues.slice(-smoothK), smoothK);
  const smoothedD = calculateSMA2(kValues.slice(-smoothD), smoothD);
  return { k: smoothedK, d: smoothedD };
}
function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = calculateSMA2(prices.slice(0, period), period);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}
function calculateSMA2(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  const sum3 = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum3 / period;
}
function calculateAllIndicators(data, prices) {
  return {
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices, 12, 26, 9),
    bollingerBands: calculateBollingerBands(prices, 20, 2),
    atr: calculateATR(data, 14),
    stochastic: calculateStochastic(data, 14, 3, 3),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    sma20: calculateSMA2(prices, 20),
    sma50: calculateSMA2(prices, 50)
  };
}
function generateSignal(indicators) {
  let signal = 0;
  let confidence = 0;
  if (indicators.rsi < 30) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.rsi > 70) {
    signal -= 1;
    confidence += 0.2;
  }
  if (indicators.macd.histogram > 0 && indicators.macd.line > indicators.macd.signal) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.macd.histogram < 0 && indicators.macd.line < indicators.macd.signal) {
    signal -= 1;
    confidence += 0.2;
  }
  const currentPrice = (indicators.bollingerBands.upper + indicators.bollingerBands.lower) / 2;
  if (currentPrice < indicators.bollingerBands.lower) {
    signal += 1;
    confidence += 0.2;
  } else if (currentPrice > indicators.bollingerBands.upper) {
    signal -= 1;
    confidence += 0.2;
  }
  if (indicators.stochastic.k < 20) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.stochastic.k > 80) {
    signal -= 1;
    confidence += 0.2;
  }
  if (indicators.ema12 > indicators.ema26) {
    signal += 1;
    confidence += 0.2;
  } else {
    signal -= 1;
    confidence += 0.2;
  }
  return signal > 0 ? 1 : signal < 0 ? -1 : 0;
}
function calculateSignalConfidence(indicators) {
  let confidence = 0;
  let count2 = 0;
  if (indicators.rsi < 30 || indicators.rsi > 70) {
    confidence += 0.2;
    count2++;
  }
  if (Math.abs(indicators.macd.histogram) > 0.01) {
    confidence += 0.2;
    count2++;
  }
  if (indicators.bollingerBands.upper > indicators.bollingerBands.lower) {
    confidence += 0.2;
    count2++;
  }
  if (indicators.stochastic.k < 20 || indicators.stochastic.k > 80) {
    confidence += 0.2;
    count2++;
  }
  if (Math.abs(indicators.ema12 - indicators.ema26) > 0.01) {
    confidence += 0.2;
    count2++;
  }
  return count2 > 0 ? confidence / count2 : 0.5;
}

// server/services/optimizedRLAgent.ts
var OptimizedRLAgent = class {
  qTable = /* @__PURE__ */ new Map();
  experienceReplay = [];
  maxReplaySize = 1e4;
  learningRate = 0.1;
  discountFactor = 0.95;
  epsilon = 0.1;
  // Exploration rate
  epsilonDecay = 0.995;
  minEpsilon = 0.01;
  updateCounter = 0;
  targetUpdateFrequency = 100;
  targetQTable = /* @__PURE__ */ new Map();
  constructor(learningRate = 0.1, discountFactor = 0.95, epsilon = 0.1) {
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.epsilon = epsilon;
  }
  /**
   * Convert state to string key for Q-table lookup
   */
  stateToKey(state) {
    return JSON.stringify({
      rsi: Math.round(state.rsi / 5) * 5,
      macdHistogram: Math.round(state.macdHistogram * 100) / 100,
      bollingerPosition: Math.round(state.bollingerPosition * 10) / 10,
      stochasticK: Math.round(state.stochasticK / 5) * 5,
      trendStrength: Math.round(state.trendStrength * 10) / 10,
      volatility: Math.round(state.volatility * 10) / 10
    });
  }
  /**
   * Extract state from price data and indicators
   */
  extractState(indicators, recentProfit, winRate) {
    const bollingerPosition = (indicators.bollingerBands.middle - indicators.bollingerBands.lower) / (indicators.bollingerBands.upper - indicators.bollingerBands.lower) * 2 - 1;
    return {
      rsi: indicators.rsi,
      macdHistogram: indicators.macd.histogram,
      bollingerPosition,
      stochasticK: indicators.stochastic.k,
      trendStrength: (indicators.ema12 - indicators.ema26) / indicators.ema26,
      volatility: indicators.atr / indicators.bollingerBands.middle,
      recentProfit,
      winRate
    };
  }
  /**
   * Select action using epsilon-greedy strategy
   */
  selectAction(state, training = true) {
    const key = this.stateToKey(state);
    const useExploration = training && Math.random() < this.epsilon;
    if (useExploration) {
      return [-1, 0, 1][Math.floor(Math.random() * 3)];
    }
    if (!this.qTable.has(key)) {
      this.qTable.set(key, [0, 0, 0]);
    }
    const qValues = this.qTable.get(key);
    const maxQ = Math.max(...qValues);
    const bestActions = qValues.map((q, i) => q === maxQ ? i - 1 : null).filter((a) => a !== null);
    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }
  /**
   * Store experience in replay buffer
   */
  storeExperience(state, action, reward, nextState, done) {
    this.experienceReplay.push({ state, action, reward, nextState, done });
    if (this.experienceReplay.length > this.maxReplaySize) {
      this.experienceReplay.shift();
    }
  }
  /**
   * Train agent using experience replay
   */
  trainBatch(batchSize = 32) {
    if (this.experienceReplay.length < batchSize) return;
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = Math.floor(Math.random() * this.experienceReplay.length);
      batch.push(this.experienceReplay[idx]);
    }
    for (const experience of batch) {
      const stateKey = this.stateToKey(experience.state);
      const nextStateKey = this.stateToKey(experience.nextState);
      if (!this.qTable.has(stateKey)) {
        this.qTable.set(stateKey, [0, 0, 0]);
      }
      const qValues = this.qTable.get(stateKey);
      const actionIndex = experience.action + 1;
      let maxNextQ = 0;
      if (this.qTable.has(nextStateKey)) {
        maxNextQ = Math.max(...this.qTable.get(nextStateKey));
      }
      const oldQ = qValues[actionIndex];
      const newQ = oldQ + this.learningRate * (experience.reward + this.discountFactor * maxNextQ - oldQ);
      qValues[actionIndex] = newQ;
    }
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    this.updateCounter++;
    if (this.updateCounter % this.targetUpdateFrequency === 0) {
      this.targetQTable = new Map(this.qTable);
    }
  }
  /**
   * Calculate reward based on trade outcome
   */
  calculateReward(entryPrice, exitPrice, position, walletBalance3, previousWinRate) {
    let reward = 0;
    if (position === "BUY") {
      const profit = (exitPrice - entryPrice) / entryPrice;
      reward = profit * 100;
    } else {
      const profit = (entryPrice - exitPrice) / entryPrice;
      reward = profit * 100;
    }
    if (reward > 0) {
      reward += previousWinRate * 10;
    }
    if (reward < 0) {
      reward -= Math.abs(reward) * 0.5;
    }
    reward = reward / (walletBalance3 / 1e3);
    return reward;
  }
  /**
   * Get agent performance metrics
   */
  getMetrics() {
    return {
      qTableSize: this.qTable.size,
      experienceReplaySize: this.experienceReplay.length,
      epsilon: this.epsilon,
      explorationRate: this.epsilon
    };
  }
  /**
   * Reset agent
   */
  reset() {
    this.qTable.clear();
    this.experienceReplay = [];
    this.epsilon = 0.1;
    this.updateCounter = 0;
  }
};
var StrategySelector = class {
  /**
   * Select best strategy based on market regime
   */
  static selectStrategy(indicators) {
    const volatility = indicators.atr / indicators.bollingerBands.middle;
    const trend = indicators.ema12 - indicators.ema26;
    const rsi = indicators.rsi;
    if (volatility > 0.02 && Math.abs(trend) > 0.01) {
      return "momentum";
    }
    if (volatility < 0.01 && (rsi > 70 || rsi < 30)) {
      return "meanReversion";
    }
    return "rl";
  }
  /**
   * Calculate market regime
   */
  static getMarketRegime(indicators) {
    const volatility = indicators.atr / indicators.bollingerBands.middle;
    const trend = Math.abs(indicators.ema12 - indicators.ema26) / indicators.ema26;
    if (volatility > 0.025) {
      return "volatile";
    } else if (trend > 0.01) {
      return "trend";
    } else {
      return "range";
    }
  }
  /**
   * Calculate optimal position size based on risk
   */
  static calculatePositionSize(walletBalance3, volatility, maxRiskPercentage = 2) {
    const riskAmount = walletBalance3 * maxRiskPercentage / 100;
    const positionSize = riskAmount / Math.max(volatility, 0.01);
    return Math.min(positionSize, walletBalance3 * 0.1);
  }
};

// server/services/riskManagement.ts
var RiskManager = class {
  defaultParams = {
    maxRiskPerTrade: 2,
    maxDrawdown: 20,
    stopLossPercentage: 2,
    takeProfitPercentage: 5,
    maxPositionSize: 10,
    maxDailyLoss: 5,
    correlationThreshold: 0.7
  };
  peakBalance = 0;
  currentBalance = 0;
  dailyLoss = 0;
  tradeHistory = [];
  constructor(params) {
    this.defaultParams = { ...this.defaultParams, ...params };
  }
  /**
   * Calculate optimal position size using Kelly Criterion
   */
  calculatePositionSize(walletBalance3, entryPrice, stopLoss, winRate, avgWin, avgLoss) {
    const b = avgWin / avgLoss;
    const p = winRate / 100;
    const q = 1 - p;
    let kellyCriterion = (b * p - q) / b;
    kellyCriterion = Math.max(0, Math.min(kellyCriterion, 0.25));
    const positionPercentage = kellyCriterion * 0.5;
    const positionSize = walletBalance3 * positionPercentage;
    const maxPosition = walletBalance3 * this.defaultParams.maxPositionSize / 100;
    const finalPositionSize = Math.min(positionSize, maxPosition);
    const riskAmount = finalPositionSize * (this.defaultParams.stopLossPercentage / 100);
    const stopLossPrice = entryPrice - riskAmount / (finalPositionSize / entryPrice);
    const takeProfitPrice = entryPrice + riskAmount * this.defaultParams.takeProfitPercentage / this.defaultParams.stopLossPercentage / (finalPositionSize / entryPrice);
    const riskRewardRatio = Math.abs(takeProfitPrice - entryPrice) / Math.abs(entryPrice - stopLossPrice);
    return {
      positionSize: finalPositionSize,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      riskRewardRatio
    };
  }
  /**
   * Calculate dynamic stop-loss based on volatility
   */
  calculateDynamicStopLoss(entryPrice, atr, multiplier = 2) {
    return entryPrice - atr * multiplier;
  }
  /**
   * Calculate dynamic take-profit based on risk-reward ratio
   */
  calculateDynamicTakeProfit(entryPrice, stopLoss, targetRiskRewardRatio = 2) {
    const riskAmount = entryPrice - stopLoss;
    return entryPrice + riskAmount * targetRiskRewardRatio;
  }
  /**
   * Check if trade should be executed based on risk parameters
   */
  canExecuteTrade(walletBalance3, positionSize, dailyLossAmount) {
    if (positionSize > walletBalance3 * this.defaultParams.maxPositionSize / 100) {
      return false;
    }
    const dailyLossPercentage = dailyLossAmount / walletBalance3 * 100;
    if (dailyLossPercentage > this.defaultParams.maxDailyLoss) {
      return false;
    }
    const drawdown = this.calculateDrawdown(walletBalance3);
    if (drawdown > this.defaultParams.maxDrawdown) {
      return false;
    }
    return true;
  }
  /**
   * Calculate current drawdown
   */
  calculateDrawdown(currentBalance) {
    if (this.peakBalance === 0) {
      this.peakBalance = currentBalance;
      return 0;
    }
    if (currentBalance > this.peakBalance) {
      this.peakBalance = currentBalance;
      return 0;
    }
    return (this.peakBalance - currentBalance) / this.peakBalance * 100;
  }
  /**
   * Calculate portfolio risk metrics
   */
  calculatePortfolioRisk(balanceHistory, returns) {
    const currentBalance = balanceHistory[balanceHistory.length - 1];
    const peakBalance = Math.max(...balanceHistory);
    const currentDrawdown = (peakBalance - currentBalance) / peakBalance * 100;
    const maxDrawdown = this.calculateMaxDrawdown(balanceHistory);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum3, r) => sum3 + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn - 0.02) / stdDev : 0;
    const downReturns = returns.filter((r) => r < 0);
    const downVariance = downReturns.reduce((sum3, r) => sum3 + Math.pow(r, 2), 0) / downReturns.length;
    const downStdDev = Math.sqrt(downVariance);
    const sortinoRatio = downStdDev > 0 ? (avgReturn - 0.02) / downStdDev : 0;
    return {
      currentDrawdown,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      volatility: stdDev,
      correlation: 0
      // Placeholder
    };
  }
  /**
   * Calculate maximum drawdown from balance history
   */
  calculateMaxDrawdown(balanceHistory) {
    let maxDD = 0;
    let peak = balanceHistory[0];
    for (const balance of balanceHistory) {
      if (balance > peak) {
        peak = balance;
      }
      const dd = (peak - balance) / peak * 100;
      maxDD = Math.max(maxDD, dd);
    }
    return maxDD;
  }
  /**
   * Record trade for risk tracking
   */
  recordTrade(profit) {
    this.tradeHistory.push({ profit, date: /* @__PURE__ */ new Date() });
    if (profit < 0) {
      this.dailyLoss += Math.abs(profit);
    }
    const now = /* @__PURE__ */ new Date();
    if (this.tradeHistory.length > 0) {
      const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
      if (now.getDate() !== lastTrade.date.getDate()) {
        this.dailyLoss = 0;
      }
    }
  }
  /**
   * Get risk metrics
   */
  getMetrics() {
    const wins = this.tradeHistory.filter((t2) => t2.profit > 0).length;
    const winRate = this.tradeHistory.length > 0 ? wins / this.tradeHistory.length * 100 : 0;
    return {
      currentDrawdown: this.calculateDrawdown(this.currentBalance),
      dailyLoss: this.dailyLoss,
      tradeCount: this.tradeHistory.length,
      winRate
    };
  }
  /**
   * Update current balance
   */
  updateBalance(balance) {
    this.currentBalance = balance;
    if (this.peakBalance === 0) {
      this.peakBalance = balance;
    }
  }
  /**
   * Reset risk manager
   */
  reset() {
    this.peakBalance = 0;
    this.currentBalance = 0;
    this.dailyLoss = 0;
    this.tradeHistory = [];
  }
};

// server/services/BinanceMarketDataService.ts
import axios3 from "axios";
var BinanceMarketDataService = class _BinanceMarketDataService {
  static BINANCE_API = "https://api.binance.com/api/v3";
  static CACHE_TTL = 5e3;
  // 5 seconds
  priceCache = {};
  cacheTimestamps = {};
  /**
   * Get current price for a trading pair from Binance
   */
  async getPrice(symbol) {
    try {
      if (this.isCacheValid(symbol)) {
        return this.priceCache[symbol];
      }
      const response = await axios3.get(`${_BinanceMarketDataService.BINANCE_API}/ticker/24hr`, {
        params: { symbol },
        timeout: 5e3
      });
      const data = response.data;
      const price = {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        timestamp: data.time,
        change24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume)
      };
      this.priceCache[symbol] = price;
      this.cacheTimestamps[symbol] = Date.now();
      return price;
    } catch (error) {
      console.error(`[BinanceMarketData] Error fetching price for ${symbol}:`, error);
      return this.priceCache[symbol] || null;
    }
  }
  /**
   * Get prices for multiple symbols
   */
  async getPrices(symbols) {
    const prices = [];
    for (const symbol of symbols) {
      const price = await this.getPrice(symbol);
      if (price) {
        prices.push(price);
      }
    }
    return prices;
  }
  /**
   * Get OHLCV (candlestick) data for technical analysis
   */
  async getOHLCV(symbol, interval = "1h", limit = 50) {
    try {
      const response = await axios3.get(`${_BinanceMarketDataService.BINANCE_API}/klines`, {
        params: {
          symbol,
          interval,
          limit
        },
        timeout: 5e3
      });
      return response.data.map((candle) => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[7])
      }));
    } catch (error) {
      console.error(`[BinanceMarketData] Error fetching OHLCV for ${symbol}:`, error);
      return [];
    }
  }
  /**
   * Check if cached price is still valid
   */
  isCacheValid(symbol) {
    if (!this.priceCache[symbol]) return false;
    const age = Date.now() - (this.cacheTimestamps[symbol] || 0);
    return age < _BinanceMarketDataService.CACHE_TTL;
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.priceCache = {};
    this.cacheTimestamps = {};
  }
  /**
   * Get market data for trading analysis
   */
  async getMarketData(symbol, interval = "1h") {
    try {
      const [price, ohlcv] = await Promise.all([this.getPrice(symbol), this.getOHLCV(symbol, interval)]);
      if (!price || ohlcv.length === 0) {
        return null;
      }
      return {
        symbol,
        currentPrice: price.price,
        change24h: price.change24h,
        high24h: price.high24h,
        low24h: price.low24h,
        volume24h: price.volume24h,
        ohlcv,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`[BinanceMarketData] Error getting market data for ${symbol}:`, error);
      return null;
    }
  }
};
var binanceMarketData = new BinanceMarketDataService();

// server/services/ImprovedMockMarketData.ts
var ImprovedMockMarketData = class {
  marketState = /* @__PURE__ */ new Map();
  priceHistory = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeSymbol("BTC/USDT", 45e3);
    this.initializeSymbol("ETH/USDT", 2500);
    this.initializeSymbol("XRP/USDT", 0.52);
  }
  /**
   * Initialize market state for a symbol
   */
  initializeSymbol(symbol, initialPrice) {
    this.marketState.set(symbol, {
      currentPrice: initialPrice,
      trend: Math.random() - 0.5,
      // Random initial trend
      volatility: 0.02 + Math.random() * 0.03,
      // 2-5% volatility
      volume: 1e6 + Math.random() * 5e6
    });
    this.priceHistory.set(symbol, [initialPrice]);
  }
  /**
   * Generate next price with realistic market dynamics
   */
  generateNextPrice(symbol) {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45e3);
      state = this.marketState.get(symbol);
    }
    if (Math.random() < 0.1) {
      state.trend = state.trend * -0.5 + (Math.random() - 0.5) * 0.3;
    }
    if (Math.random() < 0.05) {
      state.volatility = Math.max(0.01, Math.min(0.1, state.volatility + (Math.random() - 0.5) * 0.02));
    }
    const trendComponent = state.trend * 0.5;
    const randomComponent = (Math.random() - 0.5) * state.volatility * 2;
    const priceChangePercent = (trendComponent + randomComponent) / 100;
    const newPrice = state.currentPrice * (1 + priceChangePercent);
    state.currentPrice = Math.max(newPrice * 0.8, Math.min(newPrice * 1.2, newPrice));
    state.volume = state.volume * (0.8 + Math.random() * 0.4);
    const history = this.priceHistory.get(symbol) || [];
    history.push(state.currentPrice);
    if (history.length > 100) {
      history.shift();
    }
    this.priceHistory.set(symbol, history);
    return state.currentPrice;
  }
  /**
   * Generate OHLCV data with realistic price movements
   */
  generateOHLCV(symbol, periods = 50) {
    const ohlcv = [];
    let price = this.marketState.get(symbol)?.currentPrice || 45e3;
    for (let i = 0; i < periods; i++) {
      const open = price;
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      const close = low + Math.random() * (high - low);
      const volume = 1e6 + Math.random() * 5e6;
      ohlcv.push({
        timestamp: Date.now() - (periods - i) * 6e4,
        open,
        high,
        low,
        close,
        volume
      });
      price = close;
    }
    return ohlcv;
  }
  /**
   * Get current price
   */
  getCurrentPrice(symbol) {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45e3);
      state = this.marketState.get(symbol);
    }
    return state.currentPrice;
  }
  /**
   * Get market state
   */
  getMarketState(symbol) {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45e3);
      state = this.marketState.get(symbol);
    }
    return { ...state };
  }
  /**
   * Get price history
   */
  getPriceHistory(symbol) {
    return this.priceHistory.get(symbol) || [];
  }
  /**
   * Simulate price movement for multiple periods
   */
  simulatePriceMovement(symbol, periods = 10) {
    const prices = [];
    for (let i = 0; i < periods; i++) {
      prices.push(this.generateNextPrice(symbol));
    }
    return prices;
  }
  /**
   * Reset market state (for testing)
   */
  reset() {
    this.marketState.clear();
    this.priceHistory.clear();
    this.initializeSymbol("BTC/USDT", 45e3);
    this.initializeSymbol("ETH/USDT", 2500);
    this.initializeSymbol("XRP/USDT", 0.52);
  }
};
var improvedMockMarketData = new ImprovedMockMarketData();

// server/autoTradingEngine.ts
var AutoTradingEngine = class {
  isRunning = false;
  intervalId = null;
  rlAgents = /* @__PURE__ */ new Map();
  riskManagers = /* @__PURE__ */ new Map();
  marketDataCache = /* @__PURE__ */ new Map();
  profitTracker = /* @__PURE__ */ new Map();
  /**
   * Start the autonomous trading engine
   */
  async start(intervalMs = 2 * 60 * 1e3) {
    if (this.isRunning) {
      console.log("[AutoTradingEngine] Already running");
      return;
    }
    this.isRunning = true;
    console.log(`[AutoTradingEngine] Started with interval ${intervalMs}ms`);
    await this.executeAutonomousTrading().catch((error) => {
      console.error("[AutoTradingEngine] Error on initial run:", error);
    });
    this.intervalId = setInterval(() => {
      this.executeAutonomousTrading().catch((error) => {
        console.error("[AutoTradingEngine] Error in scheduled run:", error);
      });
    }, intervalMs);
  }
  /**
   * Stop the autonomous trading engine
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[AutoTradingEngine] Stopped");
  }
  /**
   * Execute autonomous trading for all enabled agents
   */
  async executeAutonomousTrading() {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[AutoTradingEngine] Database not available");
        return;
      }
      const enabledAgents = await db.select().from(agentConfigs).where(eq13(agentConfigs.isEnabled, true));
      if (enabledAgents.length === 0) {
        console.log("[AutoTradingEngine] No enabled agents configured");
        return;
      }
      console.log(`[AutoTradingEngine] Processing ${enabledAgents.length} enabled agents`);
      for (const agent of enabledAgents) {
        try {
          await this.executeAgentTrade(agent.id, agent.userId, agent.agentType);
        } catch (error) {
          console.error(`[AutoTradingEngine] Error executing trade for agent ${agent.id}:`, error);
        }
      }
      await this.runAutomaticEcosystem();
    } catch (error) {
      console.error("[AutoTradingEngine] Error in executeAutonomousTrading:", error);
    }
  }
  /**
   * Execute a trade for a specific agent using RL + Technical Indicators
   */
  async executeAgentTrade(agentId, userId, agentType) {
    const db = await getDb();
    if (!db) return;
    try {
      const wallet = await db.select().from(walletBalance).where(eq13(walletBalance.userId, userId)).limit(1);
      if (wallet.length === 0 || !wallet[0].availableBalance) {
        console.log(`[AutoTradingEngine] Agent ${agentId}: No wallet available`);
        return;
      }
      const availableBalance = parseFloat(wallet[0].availableBalance.toString());
      if (availableBalance <= 0) {
        console.log(`[AutoTradingEngine] Agent ${agentId}: Insufficient balance`);
        return;
      }
      if (!this.rlAgents.has(agentId)) {
        this.rlAgents.set(agentId, new OptimizedRLAgent(0.1, 0.95, 0.1));
      }
      const rlAgent = this.rlAgents.get(agentId);
      if (!this.riskManagers.has(agentId)) {
        this.riskManagers.set(agentId, new RiskManager());
      }
      const riskManager = this.riskManagers.get(agentId);
      const marketData = await this.generateMarketData();
      const indicators = calculateAllIndicators(marketData.data, marketData.prices);
      const strategy = StrategySelector.selectStrategy(indicators);
      const regime = StrategySelector.getMarketRegime(indicators);
      const technicalSignal = generateSignal(indicators);
      const signalConfidence = calculateSignalConfidence(indicators);
      const rlState = {
        rsi: indicators.rsi,
        macdHistogram: indicators.macd.histogram,
        bollingerPosition: (indicators.bollingerBands.middle - indicators.bollingerBands.lower) / (indicators.bollingerBands.upper - indicators.bollingerBands.lower) * 2 - 1,
        stochasticK: indicators.stochastic.k,
        trendStrength: (indicators.ema12 - indicators.ema26) / indicators.ema26,
        volatility: indicators.atr / indicators.bollingerBands.middle,
        recentProfit: this.profitTracker.get(agentId)?.totalProfit || 0,
        winRate: this.profitTracker.get(agentId) ? this.profitTracker.get(agentId).wins / this.profitTracker.get(agentId).trades * 100 : 50
      };
      const rlAction = rlAgent.selectAction(rlState, true);
      let finalAction = 0;
      if (technicalSignal !== 0 && signalConfidence > 0.6) {
        finalAction = technicalSignal;
      } else if (rlAction !== 0) {
        finalAction = rlAction;
      } else {
        console.log(`[AutoTradingEngine] Agent ${agentId} (${agentType}): HOLD signal (regime: ${regime})`);
        return;
      }
      const currentPrice2 = improvedMockMarketData.getCurrentPrice("BTC/USDT");
      const stopLossPrice = currentPrice2 * 0.98;
      const positioning = riskManager.calculatePositionSize(
        availableBalance,
        currentPrice2,
        stopLossPrice,
        rlState.winRate,
        5,
        3
      );
      const canExecute = riskManager.canExecuteTrade(availableBalance, positioning.positionSize, 0);
      if (!canExecute) {
        console.log(`[AutoTradingEngine] Agent ${agentId}: Trade blocked by risk manager`);
        return;
      }
      const currentPrice = improvedMockMarketData.getCurrentPrice("BTC/USDT");
      const trade = generateRealisticTrade(agentId, agentType, currentPrice, signalConfidence);
      const profitPercent = trade.quantity > 0 ? trade.profit / (trade.entryPrice * trade.quantity) * 100 : 0;
      try {
        await db.insert(tradingResults).values({
          executionId: agentId,
          userId,
          agentId,
          symbol: trade.symbol,
          entryPrice: trade.entryPrice.toString(),
          exitPrice: trade.exitPrice.toString(),
          quantity: trade.quantity.toString(),
          profit: trade.profit.toFixed(2),
          profitPercent: profitPercent.toFixed(4),
          tradeType: finalAction === 1 ? "buy" : "sell",
          status: "closed",
          confidence: (signalConfidence * 100).toFixed(2),
          entryTime: trade.timestamp,
          exitTime: /* @__PURE__ */ new Date(),
          createdAt: trade.timestamp
        });
        const newBalance = Math.max(0, availableBalance + trade.profit);
        await db.update(walletBalance).set({
          totalBalance: newBalance.toFixed(2),
          availableBalance: newBalance.toFixed(2)
        }).where(eq13(walletBalance.userId, userId));
        const action = finalAction === 1 ? "BUY" : "SELL";
        console.log(
          `[AutoTradingEngine] Agent ${agentId} (${agentType}): Executed ${action} trade, Profit: $${trade.profit.toFixed(2)} (Strategy: ${strategy}, Regime: ${regime})`
        );
        const reward = rlAgent.calculateReward(
          trade.entryPrice,
          trade.exitPrice,
          finalAction === 1 ? "BUY" : "SELL",
          newBalance,
          rlState.winRate
        );
        rlAgent.storeExperience(rlState, finalAction, reward, rlState, false);
        rlAgent.trainBatch(32);
        if (!this.profitTracker.has(agentId)) {
          this.profitTracker.set(agentId, { totalProfit: 0, trades: 0, wins: 0 });
        }
        const tracker = this.profitTracker.get(agentId);
        tracker.totalProfit += trade.profit;
        tracker.trades++;
        if (trade.profit > 0) tracker.wins++;
        riskManager.updateBalance(newBalance);
        riskManager.recordTrade(trade.profit);
      } catch (insertError) {
        console.error(`[AutoTradingEngine] Error inserting trade for agent ${agentId}:`, insertError);
      }
    } catch (error) {
      console.error(`[AutoTradingEngine] Error executing trade for agent ${agentId}:`, error);
    }
  }
  /**
   * Automatic Ecosystem: Rebalancing, Profit-Taking, Loss-Cutting
   */
  async runAutomaticEcosystem() {
    try {
      const db = await getDb();
      if (!db) return;
      const activeUsers = await db.select({ userId: agentConfigs.userId }).from(agentConfigs).where(eq13(agentConfigs.isEnabled, true));
      const userIdSet = /* @__PURE__ */ new Set();
      for (const u of activeUsers) {
        userIdSet.add(u.userId);
      }
      const uniqueUserIds = Array.from(userIdSet);
      for (const userId of uniqueUserIds) {
        try {
          await this.automaticProfitTaking(userId);
          await this.automaticLossCutting(userId);
          await this.portfolioRebalancing(userId);
        } catch (error) {
          console.error(`[AutoTradingEngine] Error in ecosystem for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("[AutoTradingEngine] Error in runAutomaticEcosystem:", error);
    }
  }
  /**
   * Automatic Profit-Taking: Close winning trades at target profit
   */
  async automaticProfitTaking(userId) {
    const db = await getDb();
    if (!db) return;
    const targetProfitPercent = 5;
    const recentTrades = await db.select().from(tradingResults).where(and3(eq13(tradingResults.userId, userId), eq13(tradingResults.status, "closed"))).limit(10);
    for (const trade of recentTrades) {
      const profitPercent = parseFloat(trade.profitPercent);
      if (profitPercent > targetProfitPercent) {
        console.log(
          `[AutoEcosystem] Profit-Taking: User ${userId}, Trade ${trade.id}, Profit: ${profitPercent}%`
        );
      }
    }
  }
  /**
   * Automatic Loss-Cutting: Close losing trades at stop-loss
   */
  async automaticLossCutting(userId) {
    const db = await getDb();
    if (!db) return;
    const stopLossPercent = -2;
    const recentTrades = await db.select().from(tradingResults).where(and3(eq13(tradingResults.userId, userId), eq13(tradingResults.status, "closed"))).limit(10);
    for (const trade of recentTrades) {
      const profitPercent = parseFloat(trade.profitPercent);
      if (profitPercent < stopLossPercent) {
        console.log(
          `[AutoEcosystem] Loss-Cutting: User ${userId}, Trade ${trade.id}, Loss: ${profitPercent}%`
        );
      }
    }
  }
  /**
   * Portfolio Rebalancing: Optimize allocation across agents
   */
  async portfolioRebalancing(userId) {
    const db = await getDb();
    if (!db) return;
    const agents = await db.select().from(agentConfigs).where(and3(eq13(agentConfigs.userId, userId), eq13(agentConfigs.isEnabled, true)));
    if (agents.length === 0) return;
    const allocations = {};
    let totalPerformance = 0;
    for (const agent of agents) {
      const tracker = this.profitTracker.get(agent.id);
      const performance = tracker ? tracker.totalProfit : 0;
      allocations[agent.id] = Math.max(0, performance);
      totalPerformance += allocations[agent.id];
    }
    if (totalPerformance > 0) {
      for (const agentId in allocations) {
        allocations[agentId] = allocations[agentId] / totalPerformance;
      }
      console.log(`[AutoEcosystem] Portfolio Rebalancing for User ${userId}:`, allocations);
    }
  }
  /**
   * Generate mock market data for testing
   */
  /**
   * Generate market data from Binance or improved mock data
   */
  async generateMarketData() {
    try {
      const marketData = await binanceMarketData.getMarketData("BTCUSDT", "1h");
      if (marketData && marketData.ohlcv.length > 0) {
        const data2 = marketData.ohlcv;
        const prices2 = data2.map((candle) => candle.close);
        const indicators2 = calculateAllIndicators(data2, prices2);
        console.log(`[AutoTradingEngine] Using real Binance data: BTC $${marketData.currentPrice}`);
        return { prices: prices2, data: data2, indicators: indicators2 };
      }
    } catch (error) {
      console.warn("[AutoTradingEngine] Failed to fetch Binance data, using improved mock data");
    }
    const data = improvedMockMarketData.generateOHLCV("BTC/USDT", 50);
    const prices = data.map((candle) => candle.close);
    const indicators = calculateAllIndicators(data, prices);
    const currentPrice = improvedMockMarketData.getCurrentPrice("BTC/USDT");
    console.log(`[AutoTradingEngine] Using improved mock data: BTC $${currentPrice.toFixed(2)}`);
    return { prices, data, indicators };
  }
  /**
   * Get engine metrics
   */
  getMetrics() {
    return {
      isRunning: this.isRunning,
      agentsCount: this.rlAgents.size,
      profitTrackers: Object.fromEntries(this.profitTracker)
    };
  }
};
var autoTradingEngine = new AutoTradingEngine();

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    tradeScheduler.start(5 * 60 * 1e3);
    autoTradingEngine.start(2 * 60 * 1e3);
  });
}
startServer().catch(console.error);
