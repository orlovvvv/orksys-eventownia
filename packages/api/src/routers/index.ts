import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { availabilityRouter } from "./availability";
import { catalogRouter } from "./catalog";
import { contactRouter } from "./contact";
import { paymentsRouter } from "./payments";
import { quotesRouter } from "./quotes";
import { rentalRequestsRouter } from "./rental-requests";
import { todoRouter } from "./todo";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  catalog: catalogRouter,
  availability: availabilityRouter,
  quotes: quotesRouter,
  rentalRequests: rentalRequestsRouter,
  contact: contactRouter,
  payments: paymentsRouter,
  admin: adminRouter,
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
