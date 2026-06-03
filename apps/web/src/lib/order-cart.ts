export type OrderCartItem = {
  sku: string;
  quantity: number;
};

export const ORDER_CART_STORAGE_KEY = "eventownia.orderCart.v1";
export const MAX_CART_QUANTITY = 99;

export function getCartMaxQuantity(value: unknown) {
  if (value === null || value === undefined) return MAX_CART_QUANTITY;
  if (typeof value !== "number" && typeof value !== "string") return MAX_CART_QUANTITY;
  if (typeof value === "string" && value.trim() === "") return MAX_CART_QUANTITY;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return MAX_CART_QUANTITY;

  const inventoryCount = Math.trunc(parsed);
  if (inventoryCount <= 0) return 0;
  return Math.min(inventoryCount, MAX_CART_QUANTITY);
}

export function clampCartQuantity(value: unknown, maxQuantity = MAX_CART_QUANTITY) {
  const max = getCartMaxQuantity(maxQuantity);
  if (max <= 0) return 0;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

export function normalizeCartItems(value: unknown): OrderCartItem[] {
  if (!Array.isArray(value)) return [];

  const bySku = new Map<string, number>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const sku = "sku" in item && typeof item.sku === "string" ? item.sku.trim() : "";
    if (!sku) continue;

    const quantity = clampCartQuantity("quantity" in item ? item.quantity : 1);
    if (quantity < 1) continue;

    bySku.set(sku, clampCartQuantity((bySku.get(sku) ?? 0) + quantity));
  }

  return Array.from(bySku.entries()).map(([sku, quantity]) => ({ sku, quantity }));
}

export function parseOrderCart(serialized: string | null): OrderCartItem[] {
  if (!serialized) return [];

  try {
    return normalizeCartItems(JSON.parse(serialized));
  } catch {
    return [];
  }
}

export function stringifyOrderCart(items: OrderCartItem[]) {
  return JSON.stringify(normalizeCartItems(items));
}
