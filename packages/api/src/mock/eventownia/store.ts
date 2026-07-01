import { createInitialState } from "./seed";
import type { AnalyticsEvent, MockState } from "./types";
import { makeId, nowIso } from "./ids";

const state = createInitialState();

export function getState(): MockState {
  return state;
}

export function getMockAdmin() {
  return state.adminUsers[0];
}

export function recordAnalytics(
  event: string,
  entityType: string | null = null,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {},
) {
  const row: AnalyticsEvent = {
    id: makeId("evt"),
    event,
    entityType,
    entityId,
    metadataJson: JSON.stringify(metadata),
    createdAt: nowIso(),
  };
  state.analyticsEvents.unshift(row);
  return row;
}

export function findProductBySkuOrId(productKey: string) {
  return state.products.find((product) => product.sku === productKey || product.id === productKey);
}

export function findPriceRule(productId: string) {
  return state.priceRules.find((rule) => rule.productId === productId && rule.active);
}

export function publicProduct(productId: string) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return null;
  const category = state.categories.find((item) => item.id === product.categoryId) ?? null;
  const pricing = findPriceRule(product.id) ?? null;
  const assets = state.productAssets
    .filter((asset) => asset.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { ...product, category, pricing, assets, supplierUrl: undefined };
}

export function rentalRequestDetail(idOrToken: string) {
  const request = state.rentalRequests.find(
    (item) => item.id === idOrToken || item.publicToken === idOrToken,
  );
  if (!request) return null;
  const customer = state.customers.find((item) => item.id === request.customerId) ?? null;
  const location = state.locations.find((item) => item.id === request.locationId) ?? null;
  const items = state.rentalRequestItems
    .filter((item) => item.rentalRequestId === request.id)
    .map((item) => ({
      ...item,
      product: publicProduct(item.productId),
    }));
  const booking =
    state.bookings.find((item) => item.rentalRequestId === request.id) ??
    null;
  const notifications = state.notifications.filter(
    (item) => item.rentalRequestId === request.id,
  );
  return { ...request, customer, location, items, booking, notifications };
}

export function bookingDetail(idOrToken: string) {
  const booking = state.bookings.find(
    (item) => item.id === idOrToken || item.publicToken === idOrToken,
  );
  if (!booking) return null;
  const customer = state.customers.find((item) => item.id === booking.customerId) ?? null;
  const location = state.locations.find((item) => item.id === booking.locationId) ?? null;
  const items = state.bookingItems
    .filter((item) => item.bookingId === booking.id)
    .map((item) => ({
      ...item,
      product: publicProduct(item.productId),
    }));
  const notifications = state.notifications.filter((item) => item.bookingId === booking.id);
  const generatedDocuments = state.generatedDocuments.filter((item) => item.bookingId === booking.id);
  return { ...booking, customer, location, items, notifications, generatedDocuments };
}
