import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { automationRouter, walletRouter, agentExecutionRouter } from "./routers/automationRouter";
import { agentSelectionRouter } from "./routers/agentSelectionRouter";
import { tradingRouter } from "./routers/tradingRouter";
import { autoTradeRouter } from "./routers/autoTradeRouter";
import { marketRouter } from "./routers/marketRouter";

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

  automation: automationRouter,
  wallet: walletRouter,
  agentExecution: agentExecutionRouter,
  agentSelection: agentSelectionRouter,
  trading: tradingRouter,
  autoTrade: autoTradeRouter,
  market: marketRouter,
});

export type AppRouter = typeof appRouter;
