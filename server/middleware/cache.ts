import { getDb } from "../db";
import { eq } from "drizzle-orm";

/**
 * In-Memory Cache for frequently accessed data
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();

  set(key: string, data: T, ttl: number = 60000) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string) {
    const keysToDelete: string[] = [];
    this.store.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.store.delete(key));
  }

  clear() {
    this.store.clear();
  }
}

// Create cache instances
export const agentConfigCache = new Cache<any>();
export const walletBalanceCache = new Cache<any>();
export const tradingResultsCache = new Cache<any>();
export const metricsCache = new Cache<any>();

/**
 * Cached Query Functions
 */

export async function getCachedAgentConfigs(userId: number) {
  const cacheKey = `agent_configs:${userId}`;
  const cached = agentConfigCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = await getDb();
  if (!db) return [];
  const { agentConfigs } = await import("../../drizzle/schema");

  const data = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.userId, userId));

  agentConfigCache.set(cacheKey, data, 30000); // Cache for 30 seconds
  return data;
}

export async function getCachedWalletBalance(userId: number) {
  const cacheKey = `wallet_balance:${userId}`;
  const cached = walletBalanceCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = await getDb();
  if (!db) return [];
  const { walletBalance } = await import("../../drizzle/schema");

  const data = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, userId));

  walletBalanceCache.set(cacheKey, data, 15000); // Cache for 15 seconds
  return data;
}

export async function getCachedTradingResults(userId: number, limit: number = 100) {
  const cacheKey = `trading_results:${userId}:${limit}`;
  const cached = tradingResultsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = await getDb();
  if (!db) return [];
  const { tradingResults } = await import("../../drizzle/schema");

  const data = await db
    .select()
    .from(tradingResults)
    .where(eq(tradingResults.userId, userId))
    .limit(limit);

  tradingResultsCache.set(cacheKey, data, 10000); // Cache for 10 seconds
  return data;
}

export async function getCachedDashboardMetrics(userId: number) {
  const cacheKey = `dashboard_metrics:${userId}`;
  const cached = metricsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = await getDb();
  if (!db) return { activeAgents: 0, portfolioValue: "0", winRate: 0, totalTrades: 0, totalProfit: 0 };
  const { agentConfigs, walletBalance, tradingResults } = await import("../../drizzle/schema");

  // Get active agents count
  const agents = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.userId, userId));

  const activeAgents = agents.filter((a: any) => a.isEnabled).length;

  // Get wallet balance
  const wallet = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, userId));

  const portfolioValue = wallet.length > 0 ? wallet[0].totalBalance : "0";

  // Get trading metrics
  const trades = await db
    .select()
    .from(tradingResults)
    .where(eq(tradingResults.userId, userId));

  const winningTrades = trades.filter((t: any) => {
    const profit = typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
    return profit && profit > 0;
  }).length;

  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const metrics = {
    activeAgents,
    portfolioValue,
    winRate,
    totalTrades: trades.length,
    totalProfit: trades.reduce((sum: number, t: any) => {
      const profit = typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
      return sum + (profit || 0);
    }, 0),
  };

  metricsCache.set(cacheKey, metrics, 5000); // Cache for 5 seconds
  return metrics;
}

/**
 * Cache Invalidation
 */

export function invalidateAgentCache(userId: number) {
  agentConfigCache.invalidate(`agent_configs:${userId}`);
  metricsCache.invalidate(`dashboard_metrics:${userId}`);
}

export function invalidateWalletCache(userId: number) {
  walletBalanceCache.invalidate(`wallet_balance:${userId}`);
  metricsCache.invalidate(`dashboard_metrics:${userId}`);
}

export function invalidateTradingCache(userId: number) {
  tradingResultsCache.invalidate(`trading_results:${userId}`);
  metricsCache.invalidate(`dashboard_metrics:${userId}`);
}

export function invalidateAllCache(userId: number) {
  invalidateAgentCache(userId);
  invalidateWalletCache(userId);
  invalidateTradingCache(userId);
}
