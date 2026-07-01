import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { availabilityRouter } from "./availability";
import { catalogRouter } from "./catalog";
import { contactRouter } from "./contact";
import { ordersRouter } from "./orders";
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
  orders: ordersRouter,
  quotes: quotesRouter,
  rentalRequests: rentalRequestsRouter,
  contact: contactRouter,
  admin: adminRouter,
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
