import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  analyzeMarketWithLLM,
  assessRiskWithLLM,
  generatePortfolioRecommendations,
  analyzeSentimentWithLLM,
  type MarketAnalysisInput,
  type LLMModel,
} from "../services/llmTradingAnalysis";
import { TRPCError } from "@trpc/server";

// Validation schemas
const marketAnalysisInputSchema = z.object({
  symbol: z.string().min(1),
  currentPrice: z.number().positive(),
  bid: z.number().positive(),
  ask: z.number().positive(),
  volume24h: z.number().nonnegative(),
  change24h: z.number(),
  previousPrice: z.number().optional(),
  rsi: z.number().optional(),
  macd: z.number().optional(),
  bollingerBands: z
    .object({
      upper: z.number(),
      middle: z.number(),
      lower: z.number(),
    })
    .optional(),
  timeframe: z.string().optional(),
});

const modelSchema = z.enum(['deepseek', 'qwen']);

export const llmTradingRouter = router({
  // Analyze market with LLM
  analyzeMarket: protectedProcedure
    .input(
      z.object({
        marketData: marketAnalysisInputSchema,
        model: modelSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const signal = await analyzeMarketWithLLM(
          input.marketData as MarketAnalysisInput,
          input.model as LLMModel
        );
        return signal;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to analyze market: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Assess risk for a position
  assessRisk: protectedProcedure
    .input(
      z.object({
        marketData: marketAnalysisInputSchema,
        position: z.object({
          size: z.number().positive(),
          entryPrice: z.number().positive(),
          stopLoss: z.number().positive(),
        }),
        model: modelSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const assessment = await assessRiskWithLLM(
          input.marketData as MarketAnalysisInput,
          input.position,
          input.model as LLMModel
        );
        return assessment;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to assess risk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Generate portfolio recommendations
  generatePortfolioRecommendations: protectedProcedure
    .input(
      z.object({
        symbols: z.array(z.string()),
        marketData: z.array(marketAnalysisInputSchema),
        model: modelSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const recommendations = await generatePortfolioRecommendations(
          input.symbols,
          input.marketData as MarketAnalysisInput[],
          input.model as LLMModel
        );
        return recommendations;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Analyze sentiment
  analyzeSentiment: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        recentTrades: z.array(
          z.object({
            price: z.number(),
            volume: z.number(),
            timestamp: z.date(),
          })
        ),
        model: modelSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const sentiment = await analyzeSentimentWithLLM(
          input.symbol,
          input.recentTrades,
          input.model as LLMModel
        );
        return sentiment;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get available models
  getAvailableModels: protectedProcedure.query(() => {
    return [
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'Advanced market analysis and trading signal generation',
        capabilities: ['market_analysis', 'trading_signals', 'portfolio_recommendations'],
      },
      {
        id: 'qwen',
        name: 'Qwen',
        description: 'Risk assessment and sentiment analysis',
        capabilities: ['risk_assessment', 'sentiment_analysis', 'market_analysis'],
      },
    ];
  }),

  // Get model recommendations for a task
  getModelRecommendation: protectedProcedure
    .input(
      z.object({
        task: z.enum(['market_analysis', 'risk_assessment', 'portfolio_recommendations', 'sentiment_analysis']),
      })
    )
    .query(({ input }) => {
      const recommendations: Record<string, LLMModel> = {
        market_analysis: 'deepseek',
        risk_assessment: 'qwen',
        portfolio_recommendations: 'deepseek',
        sentiment_analysis: 'qwen',
      };

      return {
        recommendedModel: recommendations[input.task],
        alternativeModel: recommendations[input.task] === 'deepseek' ? 'qwen' : 'deepseek',
      };
    }),

  // Batch analyze multiple markets
  analyzeMultipleMarkets: protectedProcedure
    .input(
      z.object({
        markets: z.array(marketAnalysisInputSchema),
        model: modelSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const signals = await Promise.all(
          input.markets.map((market) =>
            analyzeMarketWithLLM(market as MarketAnalysisInput, input.model as LLMModel)
          )
        );
        return signals;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to analyze markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),
});
