import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getAgentConfigsByUserId,
  createAgentConfig,
  getAutomationSchedulesByUserId,
  createAutomationSchedule,
  toggleAutomationSchedule,
  deleteAutomationSchedule,
  getAgentStatusByScheduleId,
} from "../automationDb";

export const automationRouter = router({
  getAgentConfigs: protectedProcedure.query(async ({ ctx }) => {
    return await getAgentConfigsByUserId(ctx.user.id);
  }),

  createAgentConfig: protectedProcedure
    .input(
      z.object({
        agentType: z.string(),
        agentName: z.string(),
        learningRate: z.number().optional(),
        stopLossPct: z.number().optional(),
        takeProfitPct: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createAgentConfig({
        userId: ctx.user.id,
        ...input,
      });
    }),

  getAutomationSchedules: protectedProcedure.query(async ({ ctx }) => {
    return await getAutomationSchedulesByUserId(ctx.user.id);
  }),

  createAutomationSchedule: protectedProcedure
    .input(
      z.object({
        scheduleName: z.string(),
        cronExpression: z.string(),
        symbol: z.string().default("BTC/USDT"),
        initialCapital: z.number(),
        agentIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createAutomationSchedule({
        userId: ctx.user.id,
        ...input,
      });
    }),

  toggleSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      return await toggleAutomationSchedule(input.scheduleId, input.isActive);
    }),

  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteAutomationSchedule(input.scheduleId);
    }),

  getAgentStatus: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .query(async ({ input }) => {
      return await getAgentStatusByScheduleId(input.scheduleId);
    }),
});
