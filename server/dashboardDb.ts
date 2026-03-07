import { eq, sum, count } from "drizzle-orm";
import { getDb } from "./db";
import { agentConfigs, tradingResults, walletBalance } from "../drizzle/schema";

export async function getDashboardMetrics(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      activeAgents: 0,
      portfolioValue: 0,
      winRate: 0,
      totalProfit: 0,
      totalTrades: 0,
    };
  }

  try {
    // Get active agents count
    const activeAgentsResult = await db
      .select({ count: count() })
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, userId));
    const activeAgents = activeAgentsResult[0]?.count || 0;

    // Get all trades for this user
    const allTrades = await db
      .select()
      .from(tradingResults)
      .where(eq(tradingResults.userId, userId));

    const totalTrades = allTrades.length;

    // Calculate total profit and win rate from actual trades
    let totalProfit = 0;
    let winningCount = 0;

    for (const trade of allTrades) {
      const profit = typeof trade.profit === 'string' ? parseFloat(trade.profit) : (trade.profit || 0);
      totalProfit += profit;
      if (profit > 0) {
        winningCount++;
      }
    }

    const winRate = totalTrades > 0 ? (winningCount / totalTrades) * 100 : 0;

    // Portfolio value = initial capital + total profit
    const portfolioValue = 1000 + totalProfit;

    return {
      activeAgents,
      portfolioValue: Math.max(0, portfolioValue),
      winRate: Math.round(winRate * 10) / 10,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalTrades,
    };
  } catch (error) {
    console.error("[DashboardDb] Error getting metrics:", error);
    return {
      activeAgents: 0,
      portfolioValue: 0,
      winRate: 0,
      totalProfit: 0,
      totalTrades: 0,
    };
  }
}

export async function getRecentActivity(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const trades = await db
      .select()
      .from(tradingResults)
      .where(eq(tradingResults.userId, userId))
      .limit(limit);

    return trades.map((trade) => ({
      id: trade.id,
      agentId: trade.agentId,
      type: trade.tradeType,
      symbol: trade.symbol,
      profit: trade.profit ? parseFloat(trade.profit.toString()) : 0,
      executedAt: trade.entryTime,
    }));
  } catch (error) {
    console.error("[DashboardDb] Error getting recent activity:", error);
    return [];
  }
}
