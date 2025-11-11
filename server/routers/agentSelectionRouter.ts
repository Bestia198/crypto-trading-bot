import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  analyzeMarketCondition,
  recommendAgent,
  selectEnsembleAgents,
  type MarketCondition,
} from "../agentSelector";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { agentConfigs } from "../../drizzle/schema";

export const agentSelectionRouter = router({
  /**
   * Analyze current market condition
   */
  analyzeMarketCondition: protectedProcedure
    .input(
      z.object({
        prices: z.array(z.number()).min(2),
        volatility: z.number().min(0),
      })
    )
    .query(({ input }) => {
      const condition = analyzeMarketCondition(input.prices, input.volatility);
      return {
        condition,
        description: getConditionDescription(condition),
      };
    }),

  /**
   * Get recommended agent for current market conditions
   */
  getRecommendedAgent: protectedProcedure
    .input(
      z.object({
        marketCondition: z.enum(["trending_up", "trending_down", "volatile", "sideways"]),
        riskPreference: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database not available",
        };
      }

      // Get user's agents
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      if (agents.length === 0) {
        return {
          success: false,
          error: "No agents configured",
        };
      }

      const agentIds = agents.map((a) => a.id);
      const recommendation = await recommendAgent(
        input.marketCondition as MarketCondition,
        agentIds,
        ctx.user.id,
        input.riskPreference as any
      );

      if (!recommendation) {
        return {
          success: false,
          error: "Could not generate recommendation",
        };
      }

      return {
        success: true,
        recommendation,
      };
    }),

  /**
   * Get ensemble of agents for diversified trading
   */
  getEnsembleAgents: protectedProcedure
    .input(
      z.object({
        marketCondition: z.enum(["trending_up", "trending_down", "volatile", "sideways"]),
        ensembleSize: z.number().min(2).max(5).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database not available",
        };
      }

      // Get user's agents
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      if (agents.length === 0) {
        return {
          success: false,
          error: "No agents configured",
        };
      }

      const agentIds = agents.map((a) => a.id);
      const ensemble = await selectEnsembleAgents(
        input.marketCondition as MarketCondition,
        agentIds,
        ctx.user.id,
        input.ensembleSize || 3
      );

      return {
        success: true,
        ensemble,
        totalWeight: ensemble.reduce((sum, a) => sum + a.confidence, 0),
      };
    }),

  /**
   * Autonomously select best strategy based on market analysis
   */
  selectAutonomousStrategy: protectedProcedure
    .input(
      z.object({
        currentPrice: z.number(),
        priceHistory: z.array(z.number()).min(10),
        volatility: z.number(),
        riskPreference: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Analyze market condition
      const marketCondition = analyzeMarketCondition(
        input.priceHistory,
        input.volatility
      );

      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database not available",
        };
      }

      // Get user's agents
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, ctx.user.id));

      if (agents.length === 0) {
        return {
          success: false,
          error: "No agents configured",
        };
      }

      const agentIds = agents.map((a) => a.id);

      // Get recommendation
      const recommendation = await recommendAgent(
        marketCondition,
        agentIds,
        ctx.user.id,
        input.riskPreference as any
      );

      if (!recommendation) {
        return {
          success: false,
          error: "Could not generate strategy",
        };
      }

      // Get ensemble for backup
      const ensemble = await selectEnsembleAgents(
        marketCondition,
        agentIds,
        ctx.user.id,
        3
      );

      return {
        success: true,
        strategy: {
          primary: recommendation,
          ensemble,
          marketCondition,
          confidence: recommendation.confidence,
          timestamp: new Date(),
        },
      };
    }),
});

function getConditionDescription(condition: MarketCondition): string {
  const descriptions: Record<MarketCondition, string> = {
    trending_up: "Market is in an uptrend - prices rising steadily",
    trending_down: "Market is in a downtrend - prices falling steadily",
    volatile: "Market is highly volatile - large price swings",
    sideways: "Market is sideways - prices moving in a range",
  };
  return descriptions[condition];
}
