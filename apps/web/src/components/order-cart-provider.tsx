import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ORDER_CART_STORAGE_KEY,
  type OrderCartItem,
  clampCartQuantity,
  getCartMaxQuantity,
  normalizeCartItems,
  parseOrderCart,
  stringifyOrderCart,
} from "@/lib/order-cart";

export type AddOrderCartItemResult = {
  addedQuantity: number;
  maxQuantity: number;
  previousQuantity: number;
  quantity: number;
  sku: string;
  status: "added" | "invalid" | "max-reached";
};

type AddOrderCartItemOptions = {
  maxQuantity?: number | null;
};

type OrderCartContextValue = {
  items: OrderCartItem[];
  itemCount: number;
  uniqueCount: number;
  addItem: (sku: string, quantity?: number, options?: AddOrderCartItemOptions) => AddOrderCartItemResult;
  setQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
};

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

function readInitialCart() {
  if (typeof window === "undefined") return [];
  return parseOrderCart(window.localStorage.getItem(ORDER_CART_STORAGE_KEY));
}

export function OrderCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderCartItem[]>(readInitialCart);
  const itemsRef = useRef(items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    itemsRef.current = items;
    window.localStorage.setItem(ORDER_CART_STORAGE_KEY, stringifyOrderCart(items));
  }, [items]);

  const addItem = useCallback((sku: string, quantity = 1, options?: AddOrderCartItemOptions): AddOrderCartItemResult => {
    const normalizedSku = sku.trim();
    const maxQuantity = getCartMaxQuantity(options?.maxQuantity);
    if (!normalizedSku) {
      return {
        addedQuantity: 0,
        maxQuantity,
        previousQuantity: 0,
        quantity: 0,
        sku: "",
        status: "invalid",
      };
    }

    const current = itemsRef.current;
    const requestedQuantity = clampCartQuantity(quantity, maxQuantity);
    const existing = current.find((item) => item.sku === normalizedSku);
    const previousQuantity = existing?.quantity ?? 0;
    const nextQuantity = Math.min(previousQuantity + requestedQuantity, maxQuantity);
    const addedQuantity = Math.max(0, nextQuantity - previousQuantity);
    const status: AddOrderCartItemResult["status"] = addedQuantity > 0 ? "added" : "max-reached";

    if (addedQuantity > 0) {
      const nextItems = existing
        ? current.map((item) => item.sku === normalizedSku ? { ...item, quantity: nextQuantity } : item)
        : [...current, { sku: normalizedSku, quantity: nextQuantity }];
      const normalizedItems = normalizeCartItems(nextItems);
      itemsRef.current = normalizedItems;
      setItems(normalizedItems);
    }

    return {
      addedQuantity,
      maxQuantity,
      previousQuantity,
      quantity: nextQuantity,
      sku: normalizedSku,
      status,
    };
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((current) => {
      const nextItems = normalizeCartItems(
        current.map((item) =>
          item.sku === sku ? { ...item, quantity: clampCartQuantity(quantity) } : item,
        ),
      );
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((current) => {
      const nextItems = current.filter((item) => item.sku !== sku);
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
  }, []);

  const value = useMemo<OrderCartContextValue>(() => {
    return {
      items,
      itemCount,
      uniqueCount: items.length,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, clearCart, itemCount, items, removeItem, setQuantity]);

  return <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>;
}

export function useOrderCart() {
  const context = useContext(OrderCartContext);
  if (!context) {
    throw new Error("useOrderCart must be used within OrderCartProvider");
  }
  return context;
}
