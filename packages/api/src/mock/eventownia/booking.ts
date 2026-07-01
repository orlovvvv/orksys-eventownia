import { addHoursIso, addMinutesIso, dateTimeIso, makeId, makePublicToken, nowIso } from "./ids";
import { createNotification } from "./notifications";
import { getMockAdmin, getState, recordAnalytics } from "./store";
import type { Booking, BookingItem } from "./types";

export function confirmRentalRequest(
  rentalRequestId: string,
  input: {
    travelFeeGrosz: number;
    depositRequiredGrosz: number;
    adminNotes?: string;
  },
) {
  const state = getState();
  const request = state.rentalRequests.find(
    (item) => item.id === rentalRequestId && item.status === "pending_admin_review",
  );
  if (!request) return null;
  const requestItems = state.rentalRequestItems.filter((item) => item.rentalRequestId === request.id);
  const products = requestItems
    .map((item) => state.products.find((product) => product.id === item.productId))
    .filter(Boolean);
  const maxSetup = products.reduce((max, product) => Math.max(max, product?.setupMinutes ?? 45), 45);
  const maxTeardown = products.reduce((max, product) => Math.max(max, product?.teardownMinutes ?? 45), 45);
  const maxCleaning = products.reduce((max, product) => Math.max(max, product?.cleaningBufferMinutes ?? 0), 0);
  const eventStartAt = dateTimeIso(request.eventDate, request.startTime);
  const eventEndAt = addHoursIso(eventStartAt, request.durationHours);
  const now = nowIso();
  const admin = getMockAdmin();
  const totalGrosz = request.subtotalGrosz + input.travelFeeGrosz - request.discountGrosz;

  const booking: Booking = {
    id: makeId("book"),
    rentalRequestId: request.id,
    publicToken: makePublicToken("btok"),
    status: "confirmed",
    customerId: request.customerId,
    locationId: request.locationId,
    eventStartAt,
    eventEndAt,
    setupStartAt: addMinutesIso(eventStartAt, -maxSetup),
    teardownEndAt: addMinutesIso(eventEndAt, maxTeardown + maxCleaning),
    durationHours: request.durationHours,
    currency: "PLN",
    subtotalGrosz: request.subtotalGrosz,
    travelFeeGrosz: input.travelFeeGrosz,
    discountGrosz: request.discountGrosz,
    totalGrosz,
    manualPaymentStatus: input.depositRequiredGrosz > 0 ? "unpaid" : "not_required",
    depositRequiredGrosz: input.depositRequiredGrosz,
    paidAmountGrosz: 0,
    paymentNotes: null,
    paymentUpdatedAt: null,
    paymentUpdatedByAdminId: null,
    confirmedAt: now,
    expiresAt: null,
    adminNotes: input.adminNotes ?? null,
    customerNotes: request.message,
    createdByAdminId: admin?.id ?? null,
    generatedContractId: null,
    createdAt: now,
    updatedAt: now,
  };

  const bookingItems: BookingItem[] = requestItems.map((item) => ({
    id: makeId("bitem"),
    bookingId: booking.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPriceGrosz: item.unitPriceGrosz ?? 0,
    extraHours: item.extraHours,
    lineTotalGrosz: item.lineTotalGrosz ?? 0,
    createdAt: now,
    updatedAt: now,
  }));

  request.status = "confirmed";
  request.travelFeeGrosz = input.travelFeeGrosz;
  request.totalEstimateGrosz = totalGrosz;
  request.adminNotes = input.adminNotes ?? request.adminNotes;
  request.updatedAt = now;
  state.bookings.unshift(booking);
  state.bookingItems.unshift(...bookingItems);

  const customer = state.customers.find((item) => item.id === request.customerId);
  createNotification({
    bookingId: booking.id,
    rentalRequestId: request.id,
    customerId: customer?.id,
    templateKey: "customer_booking_confirmed",
    recipient: customer?.email ?? customer?.phone ?? "mock-recipient",
  });
  recordAnalytics("admin_request_confirmed", "booking", booking.id, { rentalRequestId });
  return booking;
}

export function declineRentalRequest(rentalRequestId: string, reason: string) {
  const state = getState();
  const request = state.rentalRequests.find((item) => item.id === rentalRequestId);
  if (!request) return null;
  const now = nowIso();
  request.status = "declined";
  request.adminNotes = reason;
  request.updatedAt = now;
  const customer = state.customers.find((item) => item.id === request.customerId);
  createNotification({
    rentalRequestId: request.id,
    customerId: customer?.id,
    templateKey: "customer_request_declined",
    recipient: customer?.email ?? customer?.phone ?? "mock-recipient",
  });
  return request;
}

export function completeBooking(bookingId: string) {
  const state = getState();
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) return null;
  booking.status = "completed";
  booking.updatedAt = nowIso();
  return booking;
}

export function cancelBooking(bookingId: string, reason: string, by: "customer" | "operator" = "operator") {
  const state = getState();
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) return null;
  booking.status = by === "customer" ? "cancelled_by_customer" : "cancelled_by_operator";
  booking.adminNotes = reason;
  booking.updatedAt = nowIso();
  return booking;
}
