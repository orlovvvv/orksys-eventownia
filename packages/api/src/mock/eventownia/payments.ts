import { addHoursIso, makeId, nowIso } from "./ids";
import { createNotification } from "./notifications";
import { getState, recordAnalytics } from "./store";
import type { Payment, PaymentStatus } from "./types";

export function createCheckoutSession(bookingId: string, amountGrosz: number, purpose: Payment["purpose"] = "deposit") {
  const state = getState();
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) return null;

  const now = nowIso();
  const payment: Payment = {
    id: makeId("pay"),
    bookingId,
    provider: "stripe",
    purpose,
    status: "checkout_created",
    amountGrosz,
    currency: "PLN",
    providerSessionId: makeId("cs_mock"),
    providerPaymentIntentId: null,
    checkoutUrl: `https://checkout.stripe.com/mock/${booking.publicToken}`,
    expiresAt: addHoursIso(now, state.businessSettings.paymentLinkExpirationHours),
    paidAt: null,
    refundedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  state.payments.unshift(payment);
  booking.status = "payment_pending";
  booking.updatedAt = now;

  const customer = state.customers.find((item) => item.id === booking.customerId);
  createNotification({
    bookingId: booking.id,
    customerId: customer?.id,
    templateKey: "customer_payment_link",
    recipient: customer?.email ?? customer?.phone ?? "mock-recipient",
  });
  recordAnalytics("payment_link_created", "payment", payment.id, { bookingId });
  return payment;
}

export function setPaymentStatus(paymentId: string, status: PaymentStatus) {
  const state = getState();
  const payment = state.payments.find((item) => item.id === paymentId);
  if (!payment) return null;
  const booking = state.bookings.find((item) => item.id === payment.bookingId);
  const now = nowIso();

  payment.status = status;
  payment.updatedAt = now;
  if (status === "paid") {
    payment.paidAt = now;
    payment.providerPaymentIntentId = makeId("pi_mock");
    if (booking) {
      booking.status = payment.purpose === "deposit" ? "confirmed_deposit_paid" : "confirmed_paid";
      booking.updatedAt = now;
      const customer = state.customers.find((item) => item.id === booking.customerId);
      createNotification({
        bookingId: booking.id,
        customerId: customer?.id,
        templateKey: "payment_received",
        recipient: customer?.email ?? customer?.phone ?? "mock-recipient",
      });
    }
    recordAnalytics("payment_completed", "payment", payment.id, { bookingId: payment.bookingId });
  }
  if (status === "refunded") payment.refundedAt = now;

  const eventId = `evt_${payment.provider}_${payment.id}_${status}`;
  const duplicate = state.paymentEvents.some((event) => event.providerEventId === eventId);
  if (!duplicate) {
    state.paymentEvents.unshift({
      id: makeId("pevt"),
      provider: payment.provider,
      providerEventId: eventId,
      eventType: `mock.payment.${status}`,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      payloadJson: JSON.stringify({ paymentId, status }),
      receivedAt: now,
      processedAt: now,
      processingError: null,
    });
  }

  return payment;
}

export function refundPayment(paymentId: string) {
  return setPaymentStatus(paymentId, "refunded");
}
