import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { seedDemoTradingData, executeTrade } from "../tradingSimulation";
import { getDb } from "../db";
import { tradingResults, agentConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const tradingRouter = router({
  /**
   * Seed demo trading data for testing
   */
  seedDemoData: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all agent configs for this user
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      if (agents.length === 0) {
        throw new Error("No agents configured");
      }

      const agentIds = agents.map((a) => a.id);
      const agentTypes = agents.map((a) => a.agentType);

      // Seed demo data
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
  executeTrade: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        currentPrice: z.number().optional().default(45000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get agent config
        const agent = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.id, input.agentId))
          .limit(1);

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

      const results = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, ctx.user.id));

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

      const results = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, ctx.user.id));

      if (results.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          totalProfit: 0,
          avgProfit: 0,
          maxProfit: 0,
          maxLoss: 0,
        };
      }

      const profits = results.map((r) => parseFloat((r.profit || 0).toString()));
      const wins = profits.filter((p) => p > 0).length;
      const totalProfit = profits.reduce((sum, p) => sum + p, 0);

      return {
        totalTrades: results.length,
        winRate: (wins / results.length) * 100,
        totalProfit,
        avgProfit: totalProfit / results.length,
        maxProfit: Math.max(...profits),
        maxLoss: Math.min(...profits),
      };
    } catch (error) {
      console.error("Error getting trading stats:", error);
      throw error;
    }
  }),

  /**
   * Get trading results by agent
   */
  getTradesByAgent: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const results = await db
          .select()
          .from(tradingResults)
          .where(
            eq(tradingResults.userId, ctx.user.id) &&
              eq(tradingResults.agentId, input.agentId)
          );

        return results;
      } catch (error) {
        console.error("Error getting trades by agent:", error);
        throw error;
      }
    }),
});
