import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getTradingSessionsByUserId, 
  getAgentMetricsBySessionId, 
  getTransactionsBySessionId,
  getPortfolioSnapshotsBySessionId,
  getUserSettings,
  upsertUserSettings,
  getDb
} from "./db";
import { tradingSessions, agentMetrics, transactions, portfolioSnapshots } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Trading features
  trading: router({
    // Get all trading sessions for the current user
    getSessions: protectedProcedure.query(async ({ ctx }) => {
      return await getTradingSessionsByUserId(ctx.user.id);
    }),

    // Start a new trading simulation
    startSimulation: protectedProcedure
      .input(z.object({
        sessionName: z.string(),
        symbol: z.string().default("BTC/USDT"),
        initialFiat: z.number().default(20),
        episodes: z.number().default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { runTradingSimulation } = await import('./tradingBot');
        return await runTradingSimulation(
          ctx.user.id,
          input.sessionName,
          input.symbol,
          input.initialFiat,
          input.episodes
        );
      }),

    // Get detailed metrics for a specific session
    getSessionMetrics: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { session: null, metrics: [], transactions: [], portfolios: [] };
        
        const [metrics, transactions_data, portfolios] = await Promise.all([
          getAgentMetricsBySessionId(input.sessionId),
          getTransactionsBySessionId(input.sessionId),
          getPortfolioSnapshotsBySessionId(input.sessionId),
        ]);

        return {
          metrics,
          transactions: transactions_data,
          portfolios,
        };
      }),

    // Get agent performance comparison
    getAgentComparison: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const metrics = await getAgentMetricsBySessionId(input.sessionId);
        return metrics.map(m => ({
          name: m.agentName,
          type: m.agentType,
          roi: parseFloat(m.roi.toString()),
          winRate: parseFloat(m.winRate.toString()),
          trades: m.tradesCount,
          reinvestment: parseFloat(m.reinvestmentProfit.toString()),
        }));
      }),

    // Get transaction history
    getTransactionHistory: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await getTransactionsBySessionId(input.sessionId);
      }),

    // Get portfolio snapshots for chart
    getPortfolioEvolution: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const snapshots = await getPortfolioSnapshotsBySessionId(input.sessionId);
        return snapshots.map(s => ({
          timestamp: s.timestamp,
          agent: s.agentName,
          netWorth: parseFloat(s.netWorth.toString()),
          fiat: parseFloat(s.fiatBalance.toString()),
          crypto: parseFloat(s.cryptoBalance.toString()),
        }));
      }),

    // Create a new trading session (for future integration with actual trading bot)
    createSession: protectedProcedure
      .input(z.object({
        sessionName: z.string(),
        symbol: z.string().default("BTC/USDT"),
        initialFiat: z.number().default(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(tradingSessions).values({
          userId: ctx.user.id,
          sessionName: input.sessionName,
          symbol: input.symbol,
          episodeNumber: 1,
          initialFiat: input.initialFiat.toString(),
          finalNetWorth: input.initialFiat.toString(),
          totalROI: "0",
          totalTrades: 0,
          winRate: "0",
          reinvestmentProfit: "0",
        });

        return result;
      }),

    // Record agent metrics for a session
    recordAgentMetrics: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        agentName: z.string(),
        agentType: z.string(),
        roi: z.number(),
        winRate: z.number(),
        tradesCount: z.number(),
        reinvestmentProfit: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return await db.insert(agentMetrics).values({
          sessionId: input.sessionId,
          agentName: input.agentName,
          agentType: input.agentType,
          roi: input.roi.toString(),
          winRate: input.winRate.toString(),
          tradesCount: input.tradesCount,
          reinvestmentProfit: input.reinvestmentProfit.toString(),
        });
      }),

    // Record transaction
    recordTransaction: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        agentName: z.string(),
        transactionType: z.string(),
        amount: z.number(),
        price: z.number(),
        fee: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return await db.insert(transactions).values({
          sessionId: input.sessionId,
          agentName: input.agentName,
          transactionType: input.transactionType,
          amount: input.amount.toString(),
          price: input.price.toString(),
          fee: (input.fee ?? 0).toString(),
          description: input.description,
        });
      }),

    // Record portfolio snapshot
    recordPortfolioSnapshot: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        agentName: z.string(),
        fiatBalance: z.number(),
        cryptoBalance: z.number(),
        shortPosition: z.number().optional(),
        netWorth: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        return await db.insert(portfolioSnapshots).values({
          sessionId: input.sessionId,
          agentName: input.agentName,
          fiatBalance: input.fiatBalance.toString(),
          cryptoBalance: input.cryptoBalance.toString(),
          shortPosition: (input.shortPosition ?? 0).toString(),
          netWorth: input.netWorth.toString(),
        });
      }),
  }),

  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        theme: z.string().optional(),
        notificationsEnabled: z.boolean().optional(),
        defaultSymbol: z.string().optional(),
        defaultInitialFiat: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await upsertUserSettings(ctx.user.id, {
          theme: input.theme,
          notificationsEnabled: input.notificationsEnabled,
          defaultSymbol: input.defaultSymbol,
          defaultInitialFiat: input.defaultInitialFiat?.toString(),
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
