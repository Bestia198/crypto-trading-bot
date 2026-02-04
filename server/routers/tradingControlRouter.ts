/**
 * Trading Control Router
 * Handles start/stop trading operations and status management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { agentConfigs, agentExecutions } from "../../drizzle/schema";

export const tradingControlRouter = router({
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
        lastUpdate: new Date(),
        error: "Database connection failed",
      };
    }

    try {
      // Get all agents for user
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      const activeAgents = agents.filter((a) => a.isEnabled).length;
      const isTrading = activeAgents > 0;

      return {
        isTrading,
        activeAgents,
        totalAgents: agents.length,
        lastUpdate: new Date(),
        agents: agents.map((a) => ({
          id: a.id,
          name: a.agentName,
          type: a.agentType,
          isEnabled: a.isEnabled,
          learningRate: a.learningRate,
        })),
      };
    } catch (error) {
      console.error("[TradingControl] Error getting status:", error);
      return {
        isTrading: false,
        activeAgents: 0,
        totalAgents: 0,
        lastUpdate: new Date(),
        error: "Failed to get trading status",
      };
    }
  }),

  /**
   * Start trading - enable all agents
   */
  startTrading: protectedProcedure
    .input(
      z.object({
        agentIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database connection failed",
          startedAgents: 0,
        };
      }

      try {
        let agents;

        if (input.agentIds && input.agentIds.length > 0) {
          // Start specific agents
          agents = await db
            .select()
            .from(agentConfigs)
            .where(
              and(
                eq(agentConfigs.userId, ctx.user.id),
                // Note: Drizzle doesn't have direct array support, so we'd need to query individually
                // For now, get all and filter
              )
            );
          agents = agents.filter((a) => input.agentIds!.includes(a.id));
        } else {
          // Start all agents
          agents = await db
            .select()
            .from(agentConfigs)
            .where(eq(agentConfigs.userId, ctx.user.id));
        }

        let startedCount = 0;

        // Enable each agent
        for (const agent of agents) {
          if (!agent.isEnabled) {
            await db
              .update(agentConfigs)
              .set({
                isEnabled: true,
                updatedAt: new Date(),
              })
              .where(eq(agentConfigs.id, agent.id));

            startedCount++;
          }
        }

        console.log(`[TradingControl] Started ${startedCount} agents for user ${ctx.user.id}`);

        return {
          success: true,
          startedAgents: startedCount,
          totalAgents: agents.length,
          message: `Started ${startedCount} trading agent(s)`,
        };
      } catch (error) {
        console.error("[TradingControl] Error starting trading:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to start trading",
          startedAgents: 0,
        };
      }
    }),

  /**
   * Stop trading - disable all agents
   */
  stopTrading: protectedProcedure
    .input(
      z.object({
        agentIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database connection failed",
          stoppedAgents: 0,
        };
      }

      try {
        let agents;

        if (input.agentIds && input.agentIds.length > 0) {
          // Stop specific agents
          agents = await db
            .select()
            .from(agentConfigs)
            .where(eq(agentConfigs.userId, ctx.user.id));
          agents = agents.filter((a) => input.agentIds!.includes(a.id));
        } else {
          // Stop all agents
          agents = await db
            .select()
            .from(agentConfigs)
            .where(eq(agentConfigs.userId, ctx.user.id));
        }

        let stoppedCount = 0;

        // Disable each agent
        for (const agent of agents) {
          if (agent.isEnabled) {
            await db
              .update(agentConfigs)
              .set({
                isEnabled: false,
                updatedAt: new Date(),
              })
              .where(eq(agentConfigs.id, agent.id));

            stoppedCount++;
          }
        }

        console.log(`[TradingControl] Stopped ${stoppedCount} agents for user ${ctx.user.id}`);

        return {
          success: true,
          stoppedAgents: stoppedCount,
          totalAgents: agents.length,
          message: `Stopped ${stoppedCount} trading agent(s)`,
        };
      } catch (error) {
        console.error("[TradingControl] Error stopping trading:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to stop trading",
          stoppedAgents: 0,
        };
      }
    }),

  /**
   * Get recent trades
   */
  getRecentTrades: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const trades = await db
          .select()
          .from(agentExecutions)
          .limit(input.limit);

        return trades.map((t) => ({
          id: t.id,
          agentId: t.agentId,
          status: t.status,
          totalTrades: t.totalTrades,
          totalProfit: t.totalProfit,
          winRate: t.winRate,
          timestamp: t.createdAt,
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
        lastTradeTime: null,
      };
    }

    try {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      const activeAgents = agents.filter((a) => a.isEnabled).length;

      const executions = await db.select().from(agentExecutions);

      if (executions.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          totalProfit: 0,
          activeAgents,
          lastTradeTime: null,
        };
      }

      const totalTrades = executions.reduce((sum, e) => sum + (e.totalTrades || 0), 0);
      const totalProfits = executions
        .map((e) => (typeof e.totalProfit === 'number' ? e.totalProfit : parseFloat(e.totalProfit as string) || 0))
        .filter((p) => !isNaN(p));

      const avgWinRate = executions.length > 0
        ? executions.reduce((sum, e) => sum + (typeof e.winRate === 'number' ? e.winRate : parseFloat(e.winRate as string) || 0), 0) / executions.length
        : 0;
      const totalProfit = totalProfits.reduce((a, b) => a + b, 0);

      const lastExecution = executions[executions.length - 1];

      return {
        totalTrades,
        winRate: parseFloat(avgWinRate.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        activeAgents,
        lastTradeTime: lastExecution?.createdAt || null,
      };
    } catch (error) {
      console.error("[TradingControl] Error getting stats:", error);
      return {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        activeAgents: 0,
        lastTradeTime: null,
      };
    }
  }),
});
