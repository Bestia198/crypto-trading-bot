import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getMarketData, analyzeMarketTrend, getPrice } from "../binanceApi";
import { selectOptimalStrategy, getAllStrategyRecommendations } from "../aiStrategySelector";

export const marketRouter = router({
  // Get current market data for a symbol
  getMarketData: publicProcedure
    .input(z.object({ symbol: z.string().default("BTCUSDT") }))
    .query(async ({ input }) => {
      return await getMarketData(input.symbol);
    }),

  // Get market trend analysis
  analyzeMarketTrend: publicProcedure
    .input(z.object({ symbol: z.string().default("BTCUSDT") }))
    .query(async ({ input }) => {
      return await analyzeMarketTrend(input.symbol);
    }),

  // Get current price
  getPrice: publicProcedure
    .input(z.object({ symbol: z.string().default("BTCUSDT") }))
    .query(async ({ input }) => {
      return await getPrice(input.symbol);
    }),

  // Get optimal strategy recommendation
  selectOptimalStrategy: publicProcedure
    .input(z.object({ symbol: z.string().default("BTCUSDT") }))
    .query(async ({ input }) => {
      return await selectOptimalStrategy(input.symbol);
    }),

  // Get all strategy recommendations ranked
  getAllStrategyRecommendations: publicProcedure
    .input(z.object({ symbol: z.string().default("BTCUSDT") }))
    .query(async ({ input }) => {
      return await getAllStrategyRecommendations(input.symbol);
    }),

  // Get market data for multiple symbols
  getMultipleMarketData: publicProcedure
    .input(z.object({ symbols: z.array(z.string()).default(["BTCUSDT", "ETHUSDT"]) }))
    .query(async ({ input }) => {
      return Promise.all(input.symbols.map(symbol => getMarketData(symbol)));
    }),
});
