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

    // Get portfolio value (wallet balance)
    const walletResult = await db
      .select({ totalBalance: walletBalance.totalBalance })
      .from(walletBalance)
      .where(eq(walletBalance.userId, userId));
    const portfolioValue = walletResult[0]?.totalBalance || 0;

    // Get trading metrics
    const tradesResult = await db
      .select({
        totalTrades: count(),
        totalProfit: sum(tradingResults.profit),
      })
      .from(tradingResults)
      .where(eq(tradingResults.userId, userId));

    const totalTrades = tradesResult[0]?.totalTrades || 0;
    const totalProfit = tradesResult[0]?.totalProfit || 0;

    // Calculate win rate
    let winRate = 0;
    if (totalTrades > 0) {
      const allTrades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, userId));
      
      const winningCount = allTrades.filter(
        (t) => {
          const profit = typeof t.profit === 'string' ? parseFloat(t.profit) : t.profit;
          return profit && profit > 0;
        }
      ).length;
      
      winRate = totalTrades > 0 ? (winningCount / totalTrades) * 100 : 0;
    }

    return {
      activeAgents,
      portfolioValue: typeof portfolioValue === 'number' ? portfolioValue : 0,
      winRate: Math.round(winRate * 10) / 10,
      totalProfit: typeof totalProfit === 'number' ? totalProfit : 0,
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
