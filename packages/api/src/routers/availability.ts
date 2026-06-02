import { z } from "zod";

import { publicProcedure, router } from "../index";
import { checkAvailability } from "../mock/eventownia/availability";

export const availabilityRouter = router({
  check: publicProcedure
    .input(
      z.object({
        items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })),
        date: z.string().min(1),
        startTime: z.string().optional(),
        durationHours: z.number().positive(),
      }),
    )
    .query(({ input }) => checkAvailability(input)),
});
