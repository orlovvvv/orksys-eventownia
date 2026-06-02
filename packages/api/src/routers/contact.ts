import { z } from "zod";

import { publicProcedure, router } from "../index";
import { makeId, nowIso } from "../mock/eventownia/ids";
import { createNotification } from "../mock/eventownia/notifications";
import { getState } from "../mock/eventownia/store";

export const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        turnstileToken: z.string().min(1),
        name: z.string().min(2),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        message: z.string().min(3),
      }),
    )
    .mutation(({ input }) => {
      const state = getState();
      const contactId = makeId("contact");
      createNotification({
        templateKey: "admin_contact_form",
        recipient: state.businessSettings.publicEmail,
      });
      state.analyticsEvents.unshift({
        id: makeId("evt"),
        event: "contact_submitted",
        entityType: "contact",
        entityId: contactId,
        metadataJson: JSON.stringify({ name: input.name, email: input.email, phone: input.phone }),
        createdAt: nowIso(),
      });
      return { contactId, status: "received" as const };
    }),
});
