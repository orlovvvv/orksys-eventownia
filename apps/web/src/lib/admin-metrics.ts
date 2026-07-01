import { isActiveOrUpcomingDate, isUnpaidBooking } from "./admin-status";

export type RequestLike = {
  status: string;
  totalEstimateGrosz: number | null;
  eventDate?: string;
};

export type BookingLike = {
  status: string;
  eventStartAt: string;
  manualPaymentStatus?: string | null;
};

export type ProductLike = {
  active: boolean;
  publicVisible?: boolean;
  assets?: unknown[];
  pricing?: { quoteMode?: string; basePriceGrosz?: number | null } | null;
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
    unpaidCount: bookings.filter((booking) => isUnpaidBooking(booking.manualPaymentStatus)).length,
    depositPaidCount: bookings.filter((booking) => booking.manualPaymentStatus === "deposit_paid").length,
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

export function notificationMetrics(notifications: NotificationLike[]) {
  return {
    failedCount: notifications.filter((notification) => notification.status === "failed").length,
    pendingCount: notifications.filter((notification) => notification.status === "pending").length,
    sentCount: notifications.filter((notification) => notification.status === "sent").length,
  };
}
