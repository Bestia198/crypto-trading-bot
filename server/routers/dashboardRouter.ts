import { router, protectedProcedure } from "../_core/trpc";
import { getDashboardMetrics, getRecentActivity } from "../dashboardDb";

export const dashboardRouter = router({
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    return await getDashboardMetrics(ctx.user.id);
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    return await getRecentActivity(ctx.user.id, 10);
  }),
});
