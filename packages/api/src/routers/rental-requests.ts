import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { cancelBooking } from "../mock/eventownia/booking";
import { makeId, makePublicToken, nowIso } from "../mock/eventownia/ids";
import { createNotification } from "../mock/eventownia/notifications";
import { calculateQuote } from "../mock/eventownia/pricing";
import {
  bookingDetail,
  findProductBySkuOrId,
  getState,
  recordAnalytics,
  rentalRequestDetail,
} from "../mock/eventownia/store";
import type { RentalRequest, RentalRequestItem } from "../mock/eventownia/types";

const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7),
});

const eventSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationHours: z.number().int().positive(),
  location: z.object({
    street: z.string().min(1),
    addressDetails: z.string().optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.literal("PL").default("PL"),
    surfaceType: z.string().optional(),
    powerAvailable: z.boolean().optional(),
    accessNotes: z.string().optional(),
  }),
});

export const rentalRequestsRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        quoteId: z.string().optional(),
        turnstileToken: z.string().min(1),
        customer: customerSchema,
        event: eventSchema,
        items: z.array(z.object({ sku: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
        consents: z.object({
          privacyAccepted: z.boolean(),
          termsAccepted: z.boolean(),
          marketingAccepted: z.boolean().optional(),
        }),
        message: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      if (!input.consents.privacyAccepted || !input.consents.termsAccepted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Privacy and terms consent are required." });
      }

      const state = getState();
      const now = nowIso();
      const quote = calculateQuote({
        event: {
          date: input.event.date,
          startTime: input.event.startTime,
          durationHours: input.event.durationHours,
          postalCode: input.event.location.postalCode,
          city: input.event.location.city,
        },
        items: input.items,
      });
      if (quote.quoteMode === "requires_hourly_price") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Every selected item must have an hourly price." });
      }

      const customer = {
        id: makeId("cust"),
        name: input.customer.name,
        email: input.customer.email || null,
        phone: input.customer.phone,
        marketingConsent: input.consents.marketingAccepted ?? false,
        anonymizedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const location = {
        id: makeId("loc"),
        customerId: customer.id,
        label: "Lokalizacja wydarzenia",
        street: input.event.location.street,
        addressDetails: input.event.location.addressDetails?.trim() || null,
        postalCode: input.event.location.postalCode,
        city: input.event.location.city,
        country: "PL" as const,
        surfaceType: input.event.location.surfaceType ?? null,
        powerAvailable: input.event.location.powerAvailable ?? null,
        accessNotes: input.event.location.accessNotes ?? null,
        createdAt: now,
        updatedAt: now,
      };
      const request: RentalRequest = {
        id: makeId("rr"),
        publicToken: makePublicToken("rtok"),
        status: "pending_admin_review",
        customerId: customer.id,
        locationId: location.id,
        eventDate: input.event.date,
        startTime: input.event.startTime,
        durationHours: input.event.durationHours,
        quoteMode: quote.quoteMode,
        subtotalZloty: quote.subtotalZloty,
        travelFeeZloty: null,
        discountZloty: 0,
        totalEstimateZloty: quote.totalEstimateZloty,
        message: input.message ?? null,
        source: "website",
        turnstileVerifiedAt: now,
        privacyAcceptedAt: now,
        termsAcceptedAt: now,
        adminNotes: null,
        createdAt: now,
        updatedAt: now,
      };
      const requestItems: RentalRequestItem[] = input.items.map((item) => {
        const product = findProductBySkuOrId(item.sku);
        const line = quote.lines.find((quoteLine) => quoteLine.productId === product?.id || quoteLine.sku === item.sku || quoteLine.variantId === item.sku);
        return {
          id: makeId("rritem"),
          rentalRequestId: request.id,
          variantId: line?.variantId ?? null,
          productId: line?.productId ?? product?.id ?? item.sku,
          quantity: item.quantity,
          hourlyPriceZloty: line?.hourlyPriceZloty ?? null,
          billableHours: line?.billableHours ?? input.event.durationHours,
          lineTotalZloty: line?.lineTotalZloty ?? null,
          pricingStatus: line?.pricingStatus ?? "missing_hourly_price",
          createdAt: now,
          updatedAt: now,
        };
      });

      state.customers.unshift(customer);
      state.locations.unshift(location);
      state.rentalRequests.unshift(request);
      state.rentalRequestItems.unshift(...requestItems);
      createNotification({
        rentalRequestId: request.id,
        customerId: customer.id,
        templateKey: "admin_new_request",
        recipient: state.businessSettings.publicEmail,
      });
      createNotification({
        rentalRequestId: request.id,
        customerId: customer.id,
        templateKey: "customer_request_received",
        recipient: customer.email ?? customer.phone,
      });
      recordAnalytics("rental_request_submitted", "rental_request", request.id, { itemCount: requestItems.length });

      return {
        requestId: request.id,
        publicToken: request.publicToken,
        status: request.status,
        nextStep: "Obsługa potwierdzi dostępność, dojazd i finalną wycenę.",
      };
    }),

  byPublicToken: publicProcedure.input(z.object({ publicToken: z.string() })).query(({ input }) => {
    const request = rentalRequestDetail(input.publicToken);
    if (request) return { type: "request" as const, data: request };
    const booking = bookingDetail(input.publicToken);
    if (booking) return { type: "booking" as const, data: booking };
    return null;
  }),

  cancelRequest: publicProcedure
    .input(z.object({ publicToken: z.string(), reason: z.string().optional() }))
    .mutation(({ input }) => {
      const state = getState();
      const request = state.rentalRequests.find((item) => item.publicToken === input.publicToken);
      if (request) {
        request.status = "cancelled";
        request.adminNotes = input.reason ?? "Customer cancellation requested from public status page.";
        request.updatedAt = nowIso();
        return rentalRequestDetail(request.id);
      }
      const booking = state.bookings.find((item) => item.publicToken === input.publicToken);
      if (booking) {
        cancelBooking(booking.id, input.reason ?? "Customer cancellation requested.", "customer");
        return bookingDetail(booking.id);
      }
      return null;
    }),
});
