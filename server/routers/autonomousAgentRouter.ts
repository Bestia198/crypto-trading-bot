import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { selectOptimalStrategy, generateTradingSignal, MarketData } from "../autonomousAgent";

export const autonomousAgentRouter = router({
  selectStrategy: protectedProcedure
    .input(
      z.object({
        currentPrice: z.number(),
        priceHistory: z.array(z.number()),
        volatility: z.number(),
        riskPreference: z.enum(["low", "medium", "high"]),
      })
    )
    .mutation(async ({ input }) => {
      const marketData: MarketData = {
        currentPrice: input.currentPrice,
        priceHistory: input.priceHistory,
        volatility: input.volatility,
        riskPreference: input.riskPreference,
      };

      return await selectOptimalStrategy(marketData);
    }),

  generateSignal: protectedProcedure
    .input(
      z.object({
        currentPrice: z.number(),
        priceHistory: z.array(z.number()),
        volatility: z.number(),
        riskPreference: z.enum(["low", "medium", "high"]),
      })
    )
    .mutation(async ({ input }) => {
      const marketData: MarketData = {
        currentPrice: input.currentPrice,
        priceHistory: input.priceHistory,
        volatility: input.volatility,
        riskPreference: input.riskPreference,
      };

      return await generateTradingSignal(marketData);
    }),
});
