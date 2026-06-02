import { z } from "zod";

import { publicProcedure, router } from "../index";
import { calculateQuote } from "../mock/eventownia/pricing";

export const quotesRouter = router({
  calculate: publicProcedure
    .input(
      z.object({
        event: z.object({
          date: z.string().min(1),
          startTime: z.string().optional(),
          durationHours: z.number().positive(),
          postalCode: z.string().min(1),
          city: z.string().min(1),
        }),
        items: z.array(z.object({ sku: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
      }),
    )
    .mutation(({ input }) => calculateQuote(input)),
});
