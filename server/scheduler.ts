import { getDb } from "./db";
import { agentConfigs, tradingResults, walletBalance, walletTransactions, users } from "../drizzle/schema";
import { generateRealisticTrade } from "./tradingSimulation";
import { eq } from "drizzle-orm";

/**
 * Scheduler for automatic trade generation
 */
export class TradeScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler to generate trades periodically
   * @param intervalMs Interval in milliseconds (default: 5 minutes)
   */
  start(intervalMs: number = 5 * 60 * 1000) {
    if (this.isRunning) {
      console.log("[TradeScheduler] Already running");
      return;
    }

    this.isRunning = true;
    console.log(`[TradeScheduler] Started with interval ${intervalMs}ms`);

    // Run immediately on start
    this.generateTradesForAllUsers().catch(error => {
      console.error("[TradeScheduler] Error on initial run:", error);
    });

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.generateTradesForAllUsers().catch(error => {
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
  private async generateTradesForAllUsers() {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[TradeScheduler] Database not available");
        return;
      }

      // Get all users
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
  private async generateTradesForUser(userId: number) {
    const db = await getDb();
    if (!db) return;

    try {
      // Get user's agents
      const userAgents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, userId));

      if (userAgents.length === 0) {
        return;
      }

      // Generate 0-1 trades per agent (30% chance)
      for (const agent of userAgents) {
        if (Math.random() > 0.7) {
          const trade = generateRealisticTrade(agent.id, agent.agentType, 45000);

          // Insert trade
          await db.insert(tradingResults).values({
            executionId: agent.id,
            userId,
            agentId: agent.id,
            symbol: trade.symbol,
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice.toString(),
            quantity: trade.quantity.toString(),
            profit: trade.profit.toString(),
            profitPercent: ((trade.profit / (trade.entryPrice * trade.quantity)) * 100).toString(),
            tradeType: trade.tradeType,
            status: "closed",
            confidence: trade.confidence.toString(),
            entryTime: trade.timestamp,
            exitTime: new Date(),
            createdAt: trade.timestamp,
          });

          // Record transaction
          if (trade.profit !== 0) {
            await db.insert(walletTransactions).values({
              userId,
              transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
              amount: Math.abs(trade.profit).toString(),
              currency: "USDT",
              status: "completed",
              description: `Automated trade by ${agent.agentType} agent - ${trade.symbol}`,
            });
          }

          // Update wallet balance
          const wallet = await db
            .select()
            .from(walletBalance)
            .where(eq(walletBalance.userId, userId))
            .limit(1);

          if (wallet.length > 0) {
            const currentBalance = parseFloat(wallet[0].totalBalance?.toString() || "0");
            const newBalance = currentBalance + trade.profit;

            await db
              .update(walletBalance)
              .set({
                totalBalance: Math.max(0, newBalance).toString(),
                availableBalance: Math.max(0, newBalance).toString(),
              })
              .where(eq(walletBalance.userId, userId));
          }
        }
      }
    } catch (error) {
      console.error(`[TradeScheduler] Error generating trades for user ${userId}:`, error);
    }
  }
}

// Export singleton instance
export const tradeScheduler = new TradeScheduler();
