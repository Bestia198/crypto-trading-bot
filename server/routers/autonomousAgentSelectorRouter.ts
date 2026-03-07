/**
 * Autonomous Agent Selector Router
 * tRPC endpoints for autonomous agent selection and management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { agentConfigs, agentExecutions } from "../../drizzle/schema";
import { AutonomousAgentSelector } from "../services/autonomousAgentSelector";

export const autonomousAgentSelectorRouter = router({
  /**
   * Get agent scores for current market conditions
   */
  getAgentScores: protectedProcedure
    .input(
      z.object({
        recentPrices: z.array(z.number()).default([100, 101, 102, 101, 103]),
        rsi: z.number().min(0).max(100).default(50),
        macd: z.enum(["bullish", "bearish", "neutral"]).default("neutral"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          scores: [],
          marketCondition: null,
          error: "Database connection failed",
        };
      }

      try {
        // Get user's agents
        const agents = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.userId, ctx.user.id));

        if (agents.length === 0) {
          return {
            scores: [],
            marketCondition: null,
            error: "No agents configured",
          };
        }

        // Get agent executions
        const executions = await db
          .select()
          .from(agentExecutions)
          .where(eq(agentExecutions.userId, ctx.user.id));

        // Analyze market conditions
        const marketCondition = AutonomousAgentSelector.analyzeMarketConditions(
          input.recentPrices,
          input.rsi,
          input.macd
        );

        // Score agents
        const scores = AutonomousAgentSelector.scoreAgents(
          agents,
          executions,
          marketCondition
        );

        return {
          scores,
          marketCondition,
          error: null,
        };
      } catch (error) {
        console.error("[AutonomousAgentSelector] Error getting scores:", error);
        return {
          scores: [],
          marketCondition: null,
          error: error instanceof Error ? error.message : "Failed to get scores",
        };
      }
    }),

  /**
   * Get best agent recommendation
   */
  getBestAgent: protectedProcedure
    .input(
      z.object({
        recentPrices: z.array(z.number()).default([100, 101, 102, 101, 103]),
        rsi: z.number().min(0).max(100).default(50),
        macd: z.enum(["bullish", "bearish", "neutral"]).default("neutral"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          bestAgent: null,
          recommendations: [],
          error: "Database connection failed",
        };
      }

      try {
        const agents = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.userId, ctx.user.id));

        if (agents.length === 0) {
          return {
            bestAgent: null,
            recommendations: ["No agents configured"],
            error: null,
          };
        }

        const executions = await db
          .select()
          .from(agentExecutions)
          .where(eq(agentExecutions.userId, ctx.user.id));

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
          error: null,
        };
      } catch (error) {
        console.error("[AutonomousAgentSelector] Error getting best agent:", error);
        return {
          bestAgent: null,
          recommendations: [],
          error: error instanceof Error ? error.message : "Failed to get best agent",
        };
      }
    }),

  /**
   * Get diversified agent portfolio
   */
  getDiversifiedPortfolio: protectedProcedure
    .input(
      z.object({
        agentCount: z.number().min(1).max(10).default(3),
        recentPrices: z.array(z.number()).default([100, 101, 102, 101, 103]),
        rsi: z.number().min(0).max(100).default(50),
        macd: z.enum(["bullish", "bearish", "neutral"]).default("neutral"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          portfolio: [],
          allocation: {},
          error: "Database connection failed",
        };
      }

      try {
        const agents = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.userId, ctx.user.id));

        if (agents.length === 0) {
          return {
            portfolio: [],
            allocation: {},
            error: "No agents configured",
          };
        }

        const executions = await db
          .select()
          .from(agentExecutions)
          .where(eq(agentExecutions.userId, ctx.user.id));

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
          10000 // Default capital
        );

        return {
          portfolio,
          allocation,
          error: null,
        };
      } catch (error) {
        console.error("[AutonomousAgentSelector] Error getting portfolio:", error);
        return {
          portfolio: [],
          allocation: {},
          error: error instanceof Error ? error.message : "Failed to get portfolio",
        };
      }
    }),

  /**
   * Check if agent switching is needed
   */
  shouldSwitchAgent: protectedProcedure
    .input(
      z.object({
        currentAgentId: z.number(),
        threshold: z.number().default(20),
        recentPrices: z.array(z.number()).default([100, 101, 102, 101, 103]),
        rsi: z.number().min(0).max(100).default(50),
        macd: z.enum(["bullish", "bearish", "neutral"]).default("neutral"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          shouldSwitch: false,
          newAgent: null,
          reason: "Database connection failed",
        };
      }

      try {
        const agents = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.userId, ctx.user.id));

        const executions = await db
          .select()
          .from(agentExecutions)
          .where(eq(agentExecutions.userId, ctx.user.id));

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
            reason: "Agent not found",
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
          reason: shouldSwitch
            ? `Better agent available: ${topAgent.agentType} (Score: ${topAgent.score} vs ${currentAgent.score})`
            : "Current agent is performing well",
        };
      } catch (error) {
        console.error("[AutonomousAgentSelector] Error checking switch:", error);
        return {
          shouldSwitch: false,
          newAgent: null,
          reason: error instanceof Error ? error.message : "Failed to check switch",
        };
      }
    }),

  /**
   * Get agent health status
   */
  getAgentHealth: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          agentId: input.agentId,
          healthScore: 0,
          status: "unknown",
          error: "Database connection failed",
        };
      }

      try {
        const executions = await db
          .select()
          .from(agentExecutions)
          .where(eq(agentExecutions.agentId, input.agentId));

        const healthScore = AutonomousAgentSelector.calculateHealthScore(executions);

        let status: "healthy" | "warning" | "critical" | "unknown" = "unknown";
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
          error: null,
        };
      } catch (error) {
        console.error("[AutonomousAgentSelector] Error getting health:", error);
        return {
          agentId: input.agentId,
          healthScore: 0,
          status: "unknown",
          error: error instanceof Error ? error.message : "Failed to get health",
        };
      }
    }),
});
