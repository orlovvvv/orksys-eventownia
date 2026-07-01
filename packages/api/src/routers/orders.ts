import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { checkAvailability } from "../mock/eventownia/availability";
import { appendAuditLog } from "../mock/eventownia/audit";
import { cancelBooking, completeBooking, confirmRentalRequest, declineRentalRequest } from "../mock/eventownia/booking";
import { dateTimeIso, makeId, makePublicToken, nowIso } from "../mock/eventownia/ids";
import { createNotification } from "../mock/eventownia/notifications";
import { calculateQuote } from "../mock/eventownia/pricing";
import {
  bookingDetail,
  findProductBySkuOrId,
  getMockAdmin,
  getState,
  recordAnalytics,
  rentalRequestDetail,
} from "../mock/eventownia/store";
import type { ManualPaymentStatus, RentalRequest, RentalRequestItem } from "../mock/eventownia/types";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const eventPreviewSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationHours: z.number().positive(),
  postalCode: z.string().min(1),
  city: z.string().min(1),
});

const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().regex(/^\+48\d{9}$/, "Invalid Polish phone number."),
});

const eventSubmitSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationHours: z.number().positive(),
  location: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.literal("PL").default("PL"),
    powerAvailable: z.boolean().optional(),
    accessNotes: z.string().optional(),
  }),
});

const orderPreviewInput = z.object({
  event: eventPreviewSchema,
  items: z.array(orderItemSchema).min(1),
});

function quoteItems(items: Array<{ productId: string; quantity: number }>) {
  return items.map((item) => ({ sku: item.productId, quantity: item.quantity }));
}

function previewOrder(input: z.infer<typeof orderPreviewInput>) {
  const quote = calculateQuote(
    {
      event: input.event,
      items: quoteItems(input.items),
    },
    { persist: false },
  );
  const availability = checkAvailability({
    items: input.items,
    date: input.event.date,
    startTime: input.event.startTime,
    durationHours: input.event.durationHours,
  });

  return {
    quote,
    availability,
  };
}

function normalizeRequest(idOrToken: string) {
  const request = rentalRequestDetail(idOrToken);
  if (!request) return null;
  return {
    kind: "pending" as const,
    id: request.id,
    publicToken: request.publicToken,
    status: request.status,
    customer: request.customer,
    location: request.location,
    items: request.items,
    eventDate: request.eventDate,
    startTime: request.startTime,
    durationHours: request.durationHours,
    eventStartAt: dateTimeIso(request.eventDate, request.startTime),
    eventEndAt: null,
    setupStartAt: null,
    teardownEndAt: null,
    subtotalGrosz: request.subtotalGrosz,
    travelFeeGrosz: request.travelFeeGrosz,
    discountGrosz: request.discountGrosz,
    totalGrosz: request.totalEstimateGrosz,
    manualPaymentStatus: null as ManualPaymentStatus | null,
    depositRequiredGrosz: 0,
    paidAmountGrosz: 0,
    paymentNotes: null as string | null,
    paymentUpdatedAt: null as string | null,
    adminNotes: request.adminNotes,
    customerNotes: request.message,
    source: request.source,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    booking: request.booking,
    notifications: request.notifications,
    generatedDocuments: [],
  };
}

function normalizeBooking(idOrToken: string) {
  const booking = bookingDetail(idOrToken);
  if (!booking) return null;
  return {
    kind: "booking" as const,
    id: booking.id,
    publicToken: booking.publicToken,
    status: booking.status,
    customer: booking.customer,
    location: booking.location,
    items: booking.items,
    eventDate: booking.eventStartAt.slice(0, 10),
    startTime: booking.eventStartAt.slice(11, 16),
    durationHours: booking.durationHours,
    eventStartAt: booking.eventStartAt,
    eventEndAt: booking.eventEndAt,
    setupStartAt: booking.setupStartAt,
    teardownEndAt: booking.teardownEndAt,
    subtotalGrosz: booking.subtotalGrosz,
    travelFeeGrosz: booking.travelFeeGrosz,
    discountGrosz: booking.discountGrosz,
    totalGrosz: booking.totalGrosz,
    manualPaymentStatus: booking.manualPaymentStatus,
    depositRequiredGrosz: booking.depositRequiredGrosz,
    paidAmountGrosz: booking.paidAmountGrosz,
    paymentNotes: booking.paymentNotes,
    paymentUpdatedAt: booking.paymentUpdatedAt,
    adminNotes: booking.adminNotes,
    customerNotes: booking.customerNotes,
    source: booking.rentalRequestId ? "website" as const : "admin" as const,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    booking,
    notifications: booking.notifications,
    generatedDocuments: booking.generatedDocuments,
  };
}

function normalizeOrder(idOrToken: string) {
  const request = rentalRequestDetail(idOrToken);
  if (request?.status === "confirmed" && request.booking) return normalizeBooking(request.booking.id);
  return (request ? normalizeRequest(request.id) : null) ?? normalizeBooking(idOrToken);
}

function listNormalizedOrders() {
  const state = getState();
  const pending = state.rentalRequests.map((request) => normalizeRequest(request.id)).flatMap((item) => (item ? [item] : []));
  const bookings = state.bookings.map((booking) => normalizeBooking(booking.id)).flatMap((item) => (item ? [item] : []));
  return [...pending, ...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function findPendingRequest(id: string) {
  return getState().rentalRequests.find((item) => item.id === id || item.publicToken === id) ?? null;
}

function findBooking(id: string) {
  return getState().bookings.find((item) => item.id === id || item.publicToken === id) ?? null;
}

function findBookingForRequest(requestId: string) {
  return getState().bookings.find((item) => item.rentalRequestId === requestId) ?? null;
}

export const ordersRouter = router({
  preview: publicProcedure.input(orderPreviewInput).query(({ input }) => previewOrder(input)),

  submit: publicProcedure
    .input(
      z.object({
        customer: customerSchema,
        event: eventSubmitSchema,
        items: z.array(orderItemSchema).min(1),
        consents: z.object({
          privacyAccepted: z.boolean(),
          termsAccepted: z.boolean(),
          marketingAccepted: z.boolean().optional(),
        }),
        turnstileToken: z.string().min(1),
        message: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      if (!input.consents.privacyAccepted || !input.consents.termsAccepted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Privacy and terms consent are required." });
      }

      const preview = previewOrder({
        event: {
          date: input.event.date,
          startTime: input.event.startTime,
          durationHours: input.event.durationHours,
          postalCode: input.event.location.postalCode,
          city: input.event.location.city,
        },
        items: input.items,
      });

      if (!preview.availability.available) {
        throw new TRPCError({ code: "CONFLICT", message: "Selected items are unavailable for this event date." });
      }

      const state = getState();
      const now = nowIso();
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
        postalCode: input.event.location.postalCode,
        city: input.event.location.city,
        country: "PL" as const,
        surfaceType: null,
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
        quoteMode: preview.quote.quoteMode,
        subtotalGrosz: preview.quote.subtotalGrosz,
        travelFeeGrosz: null,
        discountGrosz: 0,
        totalEstimateGrosz: preview.quote.totalEstimateGrosz,
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
        const product = findProductBySkuOrId(item.productId);
        const line = preview.quote.lines.find((quoteLine) => quoteLine.productId === product?.id || quoteLine.sku === item.productId);
        return {
          id: makeId("rritem"),
          rentalRequestId: request.id,
          productId: product?.id ?? item.productId,
          quantity: item.quantity,
          unitPriceGrosz: line?.basePriceGrosz ?? null,
          extraHours: line?.extraHours ?? 0,
          lineTotalGrosz: line?.lineTotalGrosz ?? null,
          quoteMode: line?.quoteMode ?? "manual",
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
        templateKey: "admin_new_order",
        recipient: state.businessSettings.publicEmail,
      });
      createNotification({
        rentalRequestId: request.id,
        customerId: customer.id,
        templateKey: "customer_order_received",
        recipient: customer.email ?? customer.phone,
      });
      recordAnalytics("order_submitted", "rental_request", request.id, { itemCount: requestItems.length });

      return {
        orderId: request.id,
        publicToken: request.publicToken,
        status: request.status,
        nextStep: "Obsługa potwierdzi dostępność, dojazd i finalne warunki.",
      };
    }),

  byPublicToken: publicProcedure.input(z.object({ publicToken: z.string() })).query(({ input }) => normalizeOrder(input.publicToken)),

  cancelRequest: publicProcedure
    .input(z.object({ publicToken: z.string(), reason: z.string().optional() }))
    .mutation(({ input }) => {
      const request = findPendingRequest(input.publicToken);
      if (request?.status === "pending_admin_review") {
        request.status = "cancelled";
        request.adminNotes = input.reason ?? "Customer cancellation requested from public status page.";
        request.updatedAt = nowIso();
        return normalizeRequest(request.id);
      }
      if (request) {
        const linkedBooking = findBookingForRequest(request.id);
        if (linkedBooking) {
          cancelBooking(linkedBooking.id, input.reason ?? "Customer cancellation requested.", "customer");
          return normalizeBooking(linkedBooking.id);
        }
      }
      const booking = findBooking(input.publicToken);
      if (booking) {
        cancelBooking(booking.id, input.reason ?? "Customer cancellation requested.", "customer");
        return normalizeBooking(booking.id);
      }
      return null;
    }),
});

export const adminOrdersRouter = router({
  list: publicProcedure.query(() => listNormalizedOrders()),

  detail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => normalizeOrder(input.id)),

  confirm: publicProcedure
    .input(
      z.object({
        id: z.string(),
        travelFeeGrosz: z.number().int().min(0),
        discountGrosz: z.number().int().min(0).default(0),
        depositRequiredGrosz: z.number().int().min(0),
        adminNotes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const request = findPendingRequest(input.id);
      if (!request || request.status !== "pending_admin_review") return null;
      const before = rentalRequestDetail(request.id);
      request.discountGrosz = input.discountGrosz;
      request.totalEstimateGrosz = request.subtotalGrosz + input.travelFeeGrosz - input.discountGrosz;
      const booking = confirmRentalRequest(request.id, {
        travelFeeGrosz: input.travelFeeGrosz,
        depositRequiredGrosz: input.depositRequiredGrosz,
        adminNotes: input.adminNotes,
      });
      appendAuditLog("order.confirm", "order", input.id, before, booking);
      return booking ? normalizeBooking(booking.id) : null;
    }),

  updateNotes: publicProcedure
    .input(z.object({ id: z.string(), adminNotes: z.string().optional(), customerNotes: z.string().optional() }))
    .mutation(({ input }) => {
      const request = findPendingRequest(input.id);
      if (request) {
        const before = { ...request };
        if (input.adminNotes !== undefined) request.adminNotes = input.adminNotes;
        if (input.customerNotes !== undefined) request.message = input.customerNotes;
        request.updatedAt = nowIso();
        appendAuditLog("order.notes.update", "rental_request", request.id, before, request);
        return normalizeRequest(request.id);
      }

      const booking = findBooking(input.id);
      if (!booking) return null;
      const before = { ...booking };
      if (input.adminNotes !== undefined) booking.adminNotes = input.adminNotes;
      if (input.customerNotes !== undefined) booking.customerNotes = input.customerNotes;
      booking.updatedAt = nowIso();
      appendAuditLog("order.notes.update", "booking", booking.id, before, booking);
      return normalizeBooking(booking.id);
    }),

  updatePayment: publicProcedure
    .input(
      z.object({
        id: z.string(),
        manualPaymentStatus: z.enum(["not_required", "unpaid", "deposit_paid", "paid"]),
        paidAmountGrosz: z.number().int().min(0),
        paymentNotes: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const booking = findBooking(input.id);
      if (!booking) return null;
      const before = { ...booking };
      booking.manualPaymentStatus = input.manualPaymentStatus;
      booking.paidAmountGrosz = input.paidAmountGrosz;
      booking.paymentNotes = input.paymentNotes ?? null;
      booking.paymentUpdatedAt = nowIso();
      booking.paymentUpdatedByAdminId = getMockAdmin()?.id ?? null;
      booking.updatedAt = booking.paymentUpdatedAt;
      appendAuditLog("order.payment.update", "booking", booking.id, before, booking);
      return normalizeBooking(booking.id);
    }),

  cancel: publicProcedure.input(z.object({ id: z.string(), reason: z.string() })).mutation(({ input }) => {
    const request = findPendingRequest(input.id);
    if (request) {
      const before = { ...request };
      request.status = "cancelled";
      request.adminNotes = input.reason;
      request.updatedAt = nowIso();
      appendAuditLog("order.cancel", "rental_request", request.id, before, request);
      return normalizeRequest(request.id);
    }

    const before = normalizeBooking(input.id);
    const booking = cancelBooking(input.id, input.reason);
    appendAuditLog("order.cancel", "booking", input.id, before, booking);
    return booking ? normalizeBooking(booking.id) : null;
  }),

  complete: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const before = normalizeBooking(input.id);
    const booking = completeBooking(input.id);
    appendAuditLog("order.complete", "booking", input.id, before, booking);
    return booking ? normalizeBooking(booking.id) : null;
  }),

  decline: publicProcedure.input(z.object({ id: z.string(), reason: z.string() })).mutation(({ input }) => {
    const before = normalizeRequest(input.id);
    const request = declineRentalRequest(input.id, input.reason);
    appendAuditLog("order.decline", "rental_request", input.id, before, request);
    return request ? normalizeRequest(request.id) : null;
  }),

  requestInfo: publicProcedure.input(z.object({ id: z.string(), message: z.string() })).mutation(({ input }) => {
    const detail = rentalRequestDetail(input.id);
    if (!detail) return null;
    createNotification({
      rentalRequestId: detail.id,
      customerId: detail.customerId,
      templateKey: "customer_order_more_info",
      recipient: detail.customer?.email ?? detail.customer?.phone ?? "mock-recipient",
    });
    appendAuditLog("order.request_info", "rental_request", input.id, null, { message: input.message });
    return normalizeRequest(input.id);
  }),
});
