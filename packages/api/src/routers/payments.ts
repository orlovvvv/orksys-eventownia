import { z } from "zod";

import { publicProcedure, router } from "../index";
import { setPaymentStatus } from "../mock/eventownia/payments";

export const paymentsRouter = router({
  mockCheckoutResult: publicProcedure
    .input(z.object({ paymentId: z.string(), result: z.enum(["paid", "failed", "expired"]) }))
    .mutation(({ input }) => setPaymentStatus(input.paymentId, input.result)),
});
