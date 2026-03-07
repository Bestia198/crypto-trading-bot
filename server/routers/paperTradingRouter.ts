import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createPaperTradingSession,
  getUserPaperTradingSessions,
  getPaperTradingSession,
  updatePaperTradingSessionMetrics,
  createPaperTradingTrade,
  closePaperTradingTrade,
  getSessionTrades,
  updatePaperTradingPortfolio,
  getSessionPortfolio,
  completePaperTradingSession,
} from "../paperTradingDb";
import { PaperTradingEngine } from "../services/paperTradingEngine";

// Store active sessions in memory (in production, use Redis or database)
const activeSessions = new Map<number, PaperTradingEngine>();

export const paperTradingRouter = router({
  /**
   * Create a new paper trading session
   */
  createSession: protectedProcedure
    .input(
      z.object({
        sessionName: z.string(),
        initialCapital: z.number().positive(),
        durationDays: z.number().int().min(1).max(30).default(7),
        symbols: z.array(z.string()).default(["BTC/USDT", "ETH/USDT"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createPaperTradingSession(
          ctx.user.id,
          input.sessionName,
          input.initialCapital,
          input.durationDays
        );

        // Create engine instance
        const engine = new PaperTradingEngine({
          sessionName: input.sessionName,
          initialCapital: input.initialCapital,
          durationDays: input.durationDays,
          symbols: input.symbols,
        });

        const sessionId = (result as any)[0]?.insertId || 1;
        activeSessions.set(sessionId, engine);

        return {
          success: true,
          sessionId,
          message: `Paper trading session "${input.sessionName}" created for 7 days`,
        };
      } catch (error) {
        console.error("[PaperTrading] Error creating session:", error);
        throw error;
      }
    }),

  /**
   * Get all sessions for the user
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await getUserPaperTradingSessions(ctx.user.id);
      return sessions;
    } catch (error) {
      console.error("[PaperTrading] Error fetching sessions:", error);
      throw error;
    }
  }),

  /**
   * Get session details
   */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const session = await getPaperTradingSession(input.sessionId);
        if (!session) throw new Error("Session not found");
        return session;
      } catch (error) {
        console.error("[PaperTrading] Error fetching session:", error);
        throw error;
      }
    }),

  /**
   * Execute a paper trade
   */
  executeTrade: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        symbol: z.string(),
        tradeType: z.enum(["buy", "sell", "long", "short"]),
        quantity: z.number().positive(),
        currentPrice: z.number().positive(),
        confidence: z.number().min(0).max(1).default(0.5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const engine = activeSessions.get(input.sessionId);
        if (!engine) throw new Error("Session not found or expired");

        const trade = engine.executeTrade(
          input.symbol,
          input.tradeType,
          input.quantity,
          input.currentPrice,
          input.confidence
        );

        if (!trade) throw new Error("Trade execution failed");

        // Save to database
        await createPaperTradingTrade(input.sessionId, ctx.user.id, {
          symbol: input.symbol,
          tradeType: input.tradeType,
          entryPrice: input.currentPrice,
          quantity: input.quantity,
          confidence: input.confidence,
        });

        return {
          success: true,
          trade,
          message: `${input.tradeType.toUpperCase()} trade executed: ${input.quantity} ${input.symbol}`,
        };
      } catch (error) {
        console.error("[PaperTrading] Error executing trade:", error);
        throw error;
      }
    }),

  /**
   * Close a paper trade
   */
  closeTrade: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        tradeId: z.string(),
        exitPrice: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const engine = activeSessions.get(input.sessionId);
        if (!engine) throw new Error("Session not found or expired");

        const closedTrade = engine.closeTrade(input.tradeId, input.exitPrice);
        if (!closedTrade) throw new Error("Trade close failed");

        // Update in database
        const tradeIdNum = parseInt(input.tradeId.split("_")[1]);
        await closePaperTradingTrade(
          tradeIdNum,
          input.exitPrice,
          closedTrade.profit,
          closedTrade.profitPercent
        );

        return {
          success: true,
          trade: closedTrade,
          message: `Trade closed with ${closedTrade.profitPercent.toFixed(2)}% profit`,
        };
      } catch (error) {
        console.error("[PaperTrading] Error closing trade:", error);
        throw error;
      }
    }),

  /**
   * Get session trades
   */
  getTrades: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const trades = await getSessionTrades(input.sessionId);
        return trades;
      } catch (error) {
        console.error("[PaperTrading] Error fetching trades:", error);
        throw error;
      }
    }),

  /**
   * Get session metrics
   */
  getMetrics: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const engine = activeSessions.get(input.sessionId);
        if (!engine) throw new Error("Session not found or expired");

        const metrics = engine.getMetrics();
        const sessionInfo = engine.getSessionInfo();

        return {
          ...metrics,
          ...sessionInfo,
        };
      } catch (error) {
        console.error("[PaperTrading] Error fetching metrics:", error);
        throw error;
      }
    }),

  /**
   * Get session portfolio
   */
  getPortfolio: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const portfolio = await getSessionPortfolio(input.sessionId);
        return portfolio;
      } catch (error) {
        console.error("[PaperTrading] Error fetching portfolio:", error);
        throw error;
      }
    }),

  /**
   * Complete a paper trading session
   */
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const engine = activeSessions.get(input.sessionId);
        if (!engine) throw new Error("Session not found");

        const metrics = engine.getMetrics();

        await completePaperTradingSession(input.sessionId, {
          totalProfit: metrics.totalProfit,
          totalLoss: metrics.totalLoss,
          winRate: metrics.winRate,
          roi: metrics.roi,
          sharpeRatio: metrics.sharpeRatio,
          maxDrawdown: metrics.maxDrawdown,
        });

        activeSessions.delete(input.sessionId);

        return {
          success: true,
          metrics,
          message: "Paper trading session completed",
        };
      } catch (error) {
        console.error("[PaperTrading] Error completing session:", error);
        throw error;
      }
    }),
});
