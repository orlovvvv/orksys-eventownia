import { createInitialState } from "./seed";
import type { AnalyticsEvent, Currency, MockState, ProductPricing, PublicProduct } from "./types";
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
  const variant = findVariantForProductKey(productKey);
  if (variant) return state.products.find((product) => product.id === variant.productId);
  return state.products.find((product) => product.id === productKey);
}

export function findProductById(productId: string) {
  return state.products.find((product) => product.id === productId);
}

export function findDefaultVariant(productId: string) {
  return state.productVariants.find((variant) => variant.productId === productId && variant.isDefault && variant.active) ?? null;
}

export function findVariantBySkuOrId(key: string) {
  return state.productVariants.find((variant) => variant.id === key || variant.sku === key) ?? null;
}

export function findVariantForProductKey(key: string) {
  return findVariantBySkuOrId(key) ?? findDefaultVariant(key);
}

export function findPriceSetForVariant(variantId: string) {
  return state.priceSets.find((priceSet) => priceSet.variantId === variantId && priceSet.active) ?? null;
}

export function findActiveHourlyPrice(priceSetId: string, currency: Currency = "PLN") {
  return state.prices.find((price) => price.priceSetId === priceSetId && price.currency === currency && price.unitMode === "per_hour" && price.active) ?? null;
}

export function resolveProductPricing(productId: string): {
  variant: ReturnType<typeof findDefaultVariant>;
  priceSet: ReturnType<typeof findPriceSetForVariant>;
  price: ReturnType<typeof findActiveHourlyPrice>;
  pricing: ProductPricing | null;
} {
  const variant = findDefaultVariant(productId);
  const priceSet = variant ? findPriceSetForVariant(variant.id) : null;
  const price = priceSet ? findActiveHourlyPrice(priceSet.id) : null;
  const pricing: ProductPricing | null = priceSet && price
    ? {
      priceSetId: priceSet.id,
      priceId: price.id,
      currency: price.currency,
      unitMode: price.unitMode,
      hourlyPriceZloty: price.amountZloty,
      depositMode: priceSet.depositMode,
      depositAmountZloty: priceSet.depositAmountZloty,
      depositPercent: priceSet.depositPercent,
      priceUpdatedAt: price.updatedAt,
      priceSetUpdatedAt: priceSet.updatedAt,
    }
    : null;

  return { variant, priceSet, price, pricing };
}

export function publicProduct(productId: string): PublicProduct | null {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return null;
  const category = state.categories.find((item) => item.id === product.categoryId) ?? null;
  const { variant, pricing } = resolveProductPricing(product.id);
  const assets = state.productAssets
    .filter((asset) => asset.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...product,
    sku: variant?.sku ?? product.id,
    inventoryCount: variant?.inventoryCount ?? 0,
    defaultVariant: variant,
    category,
    pricing,
    assets,
    supplierUrl: undefined,
  };
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
