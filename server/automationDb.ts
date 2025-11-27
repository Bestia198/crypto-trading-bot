import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  agentConfigs,
  automationSchedules,
  agentStatus,
} from "../drizzle/schema";

export async function getAgentConfigsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.userId, userId));
}

export async function createAgentConfig(config: {
  userId: number;
  agentType: string;
  agentName: string;
  learningRate?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(agentConfigs).values({
    userId: config.userId,
    agentType: config.agentType,
    agentName: config.agentName,
    learningRate: config.learningRate?.toString(),
    stopLossPct: config.stopLossPct?.toString(),
    takeProfitPct: config.takeProfitPct?.toString(),
  });
}

export async function getAutomationSchedulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(automationSchedules)
    .where(eq(automationSchedules.userId, userId));
}

export async function createAutomationSchedule(schedule: {
  userId: number;
  scheduleName: string;
  cronExpression: string;
  symbol: string;
  initialCapital: number;
  agentIds: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(automationSchedules).values({
    userId: schedule.userId,
    scheduleName: schedule.scheduleName,
    cronExpression: schedule.cronExpression,
    symbol: schedule.symbol,
    initialCapital: schedule.initialCapital.toString(),
    agentIds: JSON.stringify(schedule.agentIds),
  });
}

export async function toggleAutomationSchedule(
  scheduleId: number,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(automationSchedules)
    .set({ isActive })
    .where(eq(automationSchedules.id, scheduleId));
}

export async function deleteAutomationSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(agentStatus)
    .where(eq(agentStatus.scheduleId, scheduleId));
  return await db
    .delete(automationSchedules)
    .where(eq(automationSchedules.id, scheduleId));
}

export async function getAgentStatusByScheduleId(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(agentStatus)
    .where(eq(agentStatus.scheduleId, scheduleId));
}

export async function updateAgentStatus(
  statusId: number,
  updates: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(agentStatus)
    .set(updates)
    .where(eq(agentStatus.id, statusId));
}


// Wallet Management Functions

export async function getWalletBalance(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { walletBalance } = await import("../drizzle/schema");
  return await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, userId))
    .limit(1);
}

export async function getWalletTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { walletTransactions } = await import("../drizzle/schema");
  return await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy((t: any) => t.createdAt)
    .limit(limit);
}

export async function createWalletTransaction(transaction: {
  userId: number;
  transactionType: "deposit" | "withdrawal";
  amount: number;
  currency?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { walletTransactions } = await import("../drizzle/schema");
  return await db.insert(walletTransactions).values({
    userId: transaction.userId,
    transactionType: transaction.transactionType,
    amount: transaction.amount.toString(),
    currency: transaction.currency || "USDT",
    description: transaction.description,
    status: "completed",
  });
}

export async function updateWalletBalance(userId: number, updates: {
  totalBalance?: number;
  availableBalance?: number;
  lockedBalance?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { walletBalance } = await import("../drizzle/schema");
  const updateData: Record<string, any> = {};
  
  if (updates.totalBalance !== undefined) {
    updateData.totalBalance = updates.totalBalance.toString();
  }
  if (updates.availableBalance !== undefined) {
    updateData.availableBalance = updates.availableBalance.toString();
  }
  if (updates.lockedBalance !== undefined) {
    updateData.lockedBalance = updates.lockedBalance.toString();
  }
  
  return await db
    .update(walletBalance)
    .set(updateData)
    .where(eq(walletBalance.userId, userId));
}


// Agent Execution Functions

export async function startAgentExecution(execution: {
  userId: number;
  agentId: number;
  scheduleId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { agentExecutions } = await import("../drizzle/schema");
  
  // Update agent status to enabled
  await db
    .update(agentConfigs)
    .set({ isEnabled: true, updatedAt: new Date() })
    .where(eq(agentConfigs.id, execution.agentId));
  
  // Create execution record
  return await db.insert(agentExecutions).values({
    userId: execution.userId,
    agentId: execution.agentId,
    scheduleId: execution.scheduleId,
    status: "running",
    startTime: new Date(),
  });
}

export async function stopAgentExecution(executionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { agentExecutions } = await import("../drizzle/schema");
  
  // Get the execution record to find the agent
  const execution = await db
    .select()
    .from(agentExecutions)
    .where(eq(agentExecutions.id, executionId))
    .limit(1);
  
  if (execution.length > 0) {
    // Update agent status to disabled
    await db
      .update(agentConfigs)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(agentConfigs.id, execution[0].agentId));
  }
  
  // Update execution record
  return await db
    .update(agentExecutions)
    .set({ status: "stopped", endTime: new Date() })
    .where(eq(agentExecutions.id, executionId));
}

export async function getAgentExecutions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { agentExecutions } = await import("../drizzle/schema");
  return await db
    .select()
    .from(agentExecutions)
    .where(eq(agentExecutions.userId, userId));
}

export async function updateAgentExecutionMetrics(executionId: number, metrics: {
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  totalProfit?: number;
  totalLoss?: number;
  winRate?: number;
  confidence?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { agentExecutions } = await import("../drizzle/schema");
  const updateData: Record<string, any> = {};
  
  if (metrics.totalTrades !== undefined) updateData.totalTrades = metrics.totalTrades;
  if (metrics.winningTrades !== undefined) updateData.winningTrades = metrics.winningTrades;
  if (metrics.losingTrades !== undefined) updateData.losingTrades = metrics.losingTrades;
  if (metrics.totalProfit !== undefined) updateData.totalProfit = metrics.totalProfit.toString();
  if (metrics.totalLoss !== undefined) updateData.totalLoss = metrics.totalLoss.toString();
  if (metrics.winRate !== undefined) updateData.winRate = metrics.winRate.toString();
  if (metrics.confidence !== undefined) updateData.confidence = metrics.confidence.toString();
  
  return await db
    .update(agentExecutions)
    .set(updateData)
    .where(eq(agentExecutions.id, executionId));
}

// Trading Results Functions

export async function createTradingResult(result: {
  executionId: number;
  userId: number;
  agentId: number;
  symbol: string;
  entryPrice: number;
  quantity: number;
  tradeType: "buy" | "sell" | "long" | "short";
  confidence: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { tradingResults } = await import("../drizzle/schema");
  return await db.insert(tradingResults).values({
    executionId: result.executionId,
    userId: result.userId,
    agentId: result.agentId,
    symbol: result.symbol,
    entryPrice: result.entryPrice.toString(),
    quantity: result.quantity.toString(),
    tradeType: result.tradeType,
    confidence: result.confidence.toString(),
    notes: result.notes,
  });
}

export async function closeTradingResult(resultId: number, exitPrice: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { tradingResults } = await import("../drizzle/schema");
  
  const result = await db.select().from(tradingResults).where(eq(tradingResults.id, resultId)).limit(1);
  if (!result[0]) throw new Error("Trading result not found");
  
  const entry = parseFloat(result[0].entryPrice.toString());
  const qty = parseFloat(result[0].quantity.toString());
  const profit = (exitPrice - entry) * qty;
  const profitPercent = ((exitPrice - entry) / entry) * 100;
  
  return await db
    .update(tradingResults)
    .set({
      exitPrice: exitPrice.toString(),
      exitTime: new Date(),
      status: "closed",
      profit: profit.toString(),
      profitPercent: profitPercent.toString(),
    })
    .where(eq(tradingResults.id, resultId));
}

export async function getTradingResults(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { tradingResults } = await import("../drizzle/schema");
  return await db
    .select()
    .from(tradingResults)
    .where(eq(tradingResults.userId, userId))
    .orderBy((t: any) => t.createdAt)
    .limit(limit);
}

export async function getTradingResultsByExecution(executionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { tradingResults } = await import("../drizzle/schema");
  return await db
    .select()
    .from(tradingResults)
    .where(eq(tradingResults.executionId, executionId));
}

// Portfolio Functions

export async function getPortfolioAssets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { portfolioAssets } = await import("../drizzle/schema");
  return await db
    .select()
    .from(portfolioAssets)
    .where(eq(portfolioAssets.userId, userId));
}

export async function updatePortfolioAsset(userId: number, asset: {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { portfolioAssets } = await import("../drizzle/schema");
  const totalValue = asset.quantity * asset.currentPrice;
  const unrealizedProfit = (asset.currentPrice - asset.averagePrice) * asset.quantity;
  
  return await db
    .insert(portfolioAssets)
    .values({
      userId,
      symbol: asset.symbol,
      quantity: asset.quantity.toString(),
      averagePrice: asset.averagePrice.toString(),
      currentPrice: asset.currentPrice.toString(),
      totalValue: totalValue.toString(),
      unrealizedProfit: unrealizedProfit.toString(),
    })
    .onDuplicateKeyUpdate({
      set: {
        quantity: asset.quantity.toString(),
        averagePrice: asset.averagePrice.toString(),
        currentPrice: asset.currentPrice.toString(),
        totalValue: totalValue.toString(),
        unrealizedProfit: unrealizedProfit.toString(),
      },
    });
}
