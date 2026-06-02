import { makeId, nowIso } from "./ids";
import { findPriceRule, findProductBySkuOrId, getState, recordAnalytics } from "./store";
import type { Quote, QuoteLine, QuoteMode } from "./types";

export type QuoteInput = {
  event: {
    date: string;
    startTime?: string;
    durationHours: number;
    postalCode: string;
    city: string;
  };
  items: { sku: string; quantity: number }[];
};

export function calculateQuote(input: QuoteInput): Quote {
  const state = getState();
  const lines: QuoteLine[] = input.items.map((item) => {
    const product = findProductBySkuOrId(item.sku);
    if (!product) {
      return {
        sku: item.sku,
        productId: item.sku,
        name: item.sku,
        quantity: item.quantity,
        quoteMode: "manual",
        basePriceGrosz: null,
        baseHours: null,
        extraHours: 0,
        extraHourPriceGrosz: null,
        lineTotalGrosz: null,
      };
    }

    const rule = findPriceRule(product.id);
    if (!rule || rule.quoteMode === "manual" || rule.basePriceGrosz === null || rule.baseHours === null) {
      return {
        sku: product.sku,
        productId: product.id,
        name: product.namePl,
        quantity: item.quantity,
        quoteMode: "manual",
        basePriceGrosz: null,
        baseHours: null,
        extraHours: 0,
        extraHourPriceGrosz: null,
        lineTotalGrosz: null,
      };
    }

    const extraHours = Math.max(0, input.event.durationHours - rule.baseHours);
    const extraHourPriceGrosz = Math.round((rule.basePriceGrosz * rule.extraHourPercent) / 100);
    const lineTotalGrosz = item.quantity * (rule.basePriceGrosz + extraHours * extraHourPriceGrosz);
    return {
      sku: product.sku,
      productId: product.id,
      name: product.namePl,
      quantity: item.quantity,
      quoteMode: "automatic",
      basePriceGrosz: rule.basePriceGrosz,
      baseHours: rule.baseHours,
      extraHours,
      extraHourPriceGrosz,
      lineTotalGrosz,
    };
  });

  const hasManualLine = lines.some((line) => line.quoteMode === "manual");
  const subtotalGrosz = lines.reduce((sum, line) => sum + (line.lineTotalGrosz ?? 0), 0);
  const quoteMode: QuoteMode = hasManualLine ? "manual" : "automatic_with_manual_travel_fee";
  const warnings = ["Cena nie obejmuje kosztu dojazdu.", "Dostępność wymaga potwierdzenia przez obsługę."];
  if (hasManualLine) warnings.unshift("Część pozycji wymaga ręcznej wyceny.");

  const quote: Quote = {
    id: makeId("quote"),
    quoteMode,
    currency: "PLN",
    durationHours: input.event.durationHours,
    lines,
    subtotalGrosz,
    travelFee: {
      mode: "manual",
      amountGrosz: null,
      label: "Koszt dojazdu do potwierdzenia",
    },
    totalEstimateGrosz: hasManualLine ? null : subtotalGrosz,
    warnings,
    event: {
      date: input.event.date,
      startTime: input.event.startTime ?? "10:00",
      postalCode: input.event.postalCode,
      city: input.event.city,
    },
    createdAt: nowIso(),
  };

  state.quotes.unshift(quote);
  recordAnalytics("quote_calculated", "quote", quote.id, { itemCount: input.items.length });
  return quote;
}
