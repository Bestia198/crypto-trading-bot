import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agentConfigs, tradingResults, walletBalance, walletTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateRealisticTrade } from "../tradingSimulation";

export const autoTradeRouter = router({
  generateTradesForAllAgents: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      if (agents.length === 0) {
        throw new Error("No agents configured for this user");
      }

      let totalTradesGenerated = 0;
      let totalProfitGenerated = 0;

      for (const agent of agents) {
        const tradeCount = Math.random() > 0.5 ? 2 : 1;

        for (let i = 0; i < tradeCount; i++) {
          const trade = generateRealisticTrade(agent.id, agent.agentType, 45000);

          await db.insert(tradingResults).values({
            executionId: agent.id,
            userId: ctx.user.id,
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

          totalTradesGenerated++;
          totalProfitGenerated += trade.profit;

          if (trade.profit !== 0) {
            await db.insert(walletTransactions).values({
              userId: ctx.user.id,
              transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
              amount: Math.abs(trade.profit).toString(),
              currency: "USDT",
              status: "completed",
              description: `Trade by ${agent.agentType} agent - ${trade.symbol}`,
            });
          }
        }
      }

      const wallet = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, ctx.user.id))
        .limit(1);

      if (wallet.length > 0) {
        const currentBalance = parseFloat(wallet[0].totalBalance?.toString() || "0");
        const newBalance = currentBalance + totalProfitGenerated;

        await db
          .update(walletBalance)
          .set({
            totalBalance: Math.max(0, newBalance).toString(),
            availableBalance: Math.max(0, newBalance).toString(),
          })
          .where(eq(walletBalance.userId, ctx.user.id));
      }

      return {
        success: true,
        tradesGenerated: totalTradesGenerated,
        profitGenerated: totalProfitGenerated,
      };
    } catch (error) {
      console.error("Error generating trades:", error);
      throw error;
    }
  }),
});
