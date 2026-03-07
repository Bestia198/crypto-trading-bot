import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  paperTradingSessions,
  paperTradingTrades,
  paperTradingPortfolio,
  InsertPaperTradingSession,
  InsertPaperTradingTrade,
  InsertPaperTradingPortfolio,
} from "../drizzle/schema";

/**
 * Create a new paper trading session
 */
export async function createPaperTradingSession(
  userId: number,
  sessionName: string,
  initialCapital: number,
  durationDays: number = 7
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const session: InsertPaperTradingSession = {
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
    startDate: new Date(),
    durationDays,
  };

  const result = await db.insert(paperTradingSessions).values(session);
  return result;
}

/**
 * Get all paper trading sessions for a user
 */
export async function getUserPaperTradingSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(paperTradingSessions)
    .where(eq(paperTradingSessions.userId, userId))
    .orderBy(paperTradingSessions.createdAt);
}

/**
 * Get a specific paper trading session
 */
export async function getPaperTradingSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(paperTradingSessions)
    .where(eq(paperTradingSessions.id, sessionId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update paper trading session metrics
 */
export async function updatePaperTradingSessionMetrics(
  sessionId: number,
  metrics: {
    currentBalance?: number;
    totalProfit?: number;
    totalLoss?: number;
    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;
    winRate?: number;
    roi?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    status?: "active" | "completed" | "paused" | "cancelled";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (metrics.currentBalance !== undefined) updateData.currentBalance = metrics.currentBalance.toString();
  if (metrics.totalProfit !== undefined) updateData.totalProfit = metrics.totalProfit.toString();
  if (metrics.totalLoss !== undefined) updateData.totalLoss = metrics.totalLoss.toString();
  if (metrics.totalTrades !== undefined) updateData.totalTrades = metrics.totalTrades;
  if (metrics.winningTrades !== undefined) updateData.winningTrades = metrics.winningTrades;
  if (metrics.losingTrades !== undefined) updateData.losingTrades = metrics.losingTrades;
  if (metrics.winRate !== undefined) updateData.winRate = metrics.winRate.toString();
  if (metrics.roi !== undefined) updateData.roi = metrics.roi.toString();
  if (metrics.sharpeRatio !== undefined) updateData.sharpeRatio = metrics.sharpeRatio.toString();
  if (metrics.maxDrawdown !== undefined) updateData.maxDrawdown = metrics.maxDrawdown.toString();
  if (metrics.status !== undefined) updateData.status = metrics.status;

  return await db
    .update(paperTradingSessions)
    .set(updateData)
    .where(eq(paperTradingSessions.id, sessionId));
}

/**
 * Create a paper trading trade
 */
export async function createPaperTradingTrade(
  sessionId: number,
  userId: number,
  trade: {
    symbol: string;
    tradeType: "buy" | "sell" | "long" | "short";
    entryPrice: number;
    quantity: number;
    confidence: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tradeRecord: InsertPaperTradingTrade = {
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
    entryTime: new Date(),
  };

  return await db.insert(paperTradingTrades).values(tradeRecord);
}

/**
 * Close a paper trading trade
 */
export async function closePaperTradingTrade(
  tradeId: number,
  exitPrice: number,
  profit: number,
  profitPercent: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(paperTradingTrades)
    .set({
      exitPrice: exitPrice.toString(),
      exitTime: new Date(),
      profit: profit.toString(),
      profitPercent: profitPercent.toString(),
      status: "closed",
    })
    .where(eq(paperTradingTrades.id, tradeId));
}

/**
 * Get all trades for a session
 */
export async function getSessionTrades(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(paperTradingTrades)
    .where(eq(paperTradingTrades.sessionId, sessionId))
    .orderBy(paperTradingTrades.entryTime);
}

/**
 * Update paper trading portfolio
 */
export async function updatePaperTradingPortfolio(
  sessionId: number,
  userId: number,
  symbol: string,
  quantity: number,
  averagePrice: number,
  currentPrice: number,
  totalValue: number,
  unrealizedProfit: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if portfolio entry exists
  const existing = await db
    .select()
    .from(paperTradingPortfolio)
    .where(
      and(
        eq(paperTradingPortfolio.sessionId, sessionId),
        eq(paperTradingPortfolio.symbol, symbol)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
  return await db
    .update(paperTradingPortfolio)
    .set({
      quantity: quantity.toString(),
      averagePrice: averagePrice.toString(),
      currentPrice: currentPrice.toString(),
      totalValue: totalValue.toString(),
      unrealizedProfit: unrealizedProfit.toString(),
      updatedAt: new Date(),
    })
    .where(eq(paperTradingPortfolio.id, existing[0].id));
  } else {
    // Create new
    const portfolio: InsertPaperTradingPortfolio = {
      sessionId,
      userId,
      symbol,
      quantity: quantity.toString(),
      averagePrice: averagePrice.toString(),
      currentPrice: currentPrice.toString(),
      totalValue: totalValue.toString(),
      unrealizedProfit: unrealizedProfit.toString(),
    };
    return await db.insert(paperTradingPortfolio).values(portfolio);
  }
}

/**
 * Get portfolio for a session
 */
export async function getSessionPortfolio(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(paperTradingPortfolio)
    .where(eq(paperTradingPortfolio.sessionId, sessionId));
}

/**
 * Complete a paper trading session
 */
export async function completePaperTradingSession(
  sessionId: number,
  finalMetrics: {
    totalProfit: number;
    totalLoss: number;
    winRate: number;
    roi: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(paperTradingSessions)
    .set({
      status: "completed",
      endDate: new Date(),
      totalProfit: finalMetrics.totalProfit.toString(),
      totalLoss: finalMetrics.totalLoss.toString(),
      winRate: finalMetrics.winRate.toString(),
      roi: finalMetrics.roi.toString(),
      sharpeRatio: finalMetrics.sharpeRatio.toString(),
      maxDrawdown: finalMetrics.maxDrawdown.toString(),
      updatedAt: new Date(),
    })
    .where(eq(paperTradingSessions.id, sessionId));
}
