import { isActiveOrUpcomingDate, isUnpaidBooking } from "./admin-status";

export type RequestLike = {
  status: string;
  totalEstimateGrosz: number | null;
  eventDate?: string;
};

export type BookingLike = {
  status: string;
  eventStartAt: string;
  payments?: Array<{ status: string }>;
};

export type ProductLike = {
  active: boolean;
  publicVisible?: boolean;
  assets?: unknown[];
  pricing?: { quoteMode?: string; basePriceGrosz?: number | null } | null;
};

export type PaymentLike = {
  status: string;
  amountGrosz: number;
};

export type NotificationLike = {
  status: string;
};

export function requestMetrics(requests: RequestLike[]) {
  const pending = requests.filter((request) => request.status === "pending_admin_review");
  return {
    pendingCount: pending.length,
    confirmedCount: requests.filter((request) => request.status === "confirmed").length,
    pendingValueGrosz: pending.reduce((total, request) => total + (request.totalEstimateGrosz ?? 0), 0),
  };
}

export function bookingMetrics(bookings: BookingLike[]) {
  const upcoming = bookings.filter((booking) => isActiveOrUpcomingDate(booking.eventStartAt));
  return {
    upcomingCount: upcoming.length,
    unpaidCount: bookings.filter((booking) => isUnpaidBooking(booking.status)).length,
    depositPaidCount: bookings.filter((booking) => booking.status === "confirmed_deposit_paid").length,
    completedCount: bookings.filter((booking) => booking.status === "completed").length,
  };
}

export function productMetrics(products: ProductLike[]) {
  return {
    allCount: products.length,
    activeCount: products.filter((product) => product.active && product.publicVisible !== false).length,
    hiddenCount: products.filter((product) => !product.active || product.publicVisible === false).length,
    missingMediaCount: products.filter((product) => !product.assets || product.assets.length === 0).length,
    manualPricingCount: products.filter((product) => product.pricing?.quoteMode === "manual").length,
    missingPriceCount: products.filter((product) => product.pricing?.basePriceGrosz === null).length,
  };
}

export function paymentMetrics(payments: PaymentLike[]) {
  return {
    dueCount: payments.filter((payment) => payment.status !== "paid" && payment.status !== "refunded").length,
    paidCount: payments.filter((payment) => payment.status === "paid").length,
    expiredCount: payments.filter((payment) => payment.status === "expired" || payment.status === "failed").length,
    refundedCount: payments.filter((payment) => payment.status === "refunded").length,
    dueValueGrosz: payments
      .filter((payment) => payment.status !== "paid" && payment.status !== "refunded")
      .reduce((total, payment) => total + payment.amountGrosz, 0),
  };
}

export function notificationMetrics(notifications: NotificationLike[]) {
  return {
    failedCount: notifications.filter((notification) => notification.status === "failed").length,
    pendingCount: notifications.filter((notification) => notification.status === "pending").length,
    sentCount: notifications.filter((notification) => notification.status === "sent").length,
  };
}
