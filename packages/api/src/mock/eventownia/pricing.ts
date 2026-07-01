import { makeId, nowIso } from "./ids";
import { findPriceRule, findProductBySkuOrId, getState, recordAnalytics } from "./store";
import type { Currency, EstimateSummary, EstimateSummaryLine, Quote, QuoteLine, QuoteMode } from "./types";

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

export function buildEstimateSummary(input: {
  currency: Currency;
  durationHours: number;
  lines: EstimateSummaryLine[];
}): EstimateSummary {
  return {
    currency: input.currency,
    billableHours: input.durationHours,
    lines: input.lines,
    itemsSubtotalZloty: input.lines.reduce((sum, line) => sum + (line.lineTotalZloty ?? 0), 0),
    travel: {
      mode: "manual_distance",
      amountZloty: null,
      label: "Dojazd do wyceny",
      message: "Koszt dojazdu zostanie wyliczony ręcznie po sprawdzeniu odległości.",
    },
    finalQuote: {
      status: "pending_manual_distance",
      totalZloty: null,
      message: "Pełna wycena zostanie przygotowana po ręcznym obliczeniu kosztu dojazdu.",
    },
  };
}

export function calculateQuote(input: QuoteInput, options: { persist?: boolean } = {}): Quote {
  const state = getState();
  const billableHours = input.event.durationHours;
  const lines: QuoteLine[] = input.items.map((item) => {
    const product = findProductBySkuOrId(item.sku);
    if (!product) {
      return {
        sku: item.sku,
        productId: item.sku,
        name: item.sku,
        quantity: item.quantity,
        hourlyPriceZloty: null,
        billableHours,
        lineTotalZloty: null,
        pricingStatus: "missing_hourly_price",
      };
    }

    const rule = findPriceRule(product.id);
    if (!rule) {
      return {
        sku: product.sku,
        productId: product.id,
        name: product.namePl,
        quantity: item.quantity,
        hourlyPriceZloty: null,
        billableHours,
        lineTotalZloty: null,
        pricingStatus: "missing_hourly_price",
      };
    }

    const lineTotalZloty = item.quantity * rule.hourlyPriceZloty * billableHours;
    return {
      sku: product.sku,
      productId: product.id,
      name: product.namePl,
      quantity: item.quantity,
      hourlyPriceZloty: rule.hourlyPriceZloty,
      billableHours,
      lineTotalZloty,
      pricingStatus: "priced",
    };
  });

  const hasMissingPriceLine = lines.some((line) => line.pricingStatus === "missing_hourly_price");
  const subtotalZloty = lines.reduce((sum, line) => sum + (line.lineTotalZloty ?? 0), 0);
  const quoteMode: QuoteMode = hasMissingPriceLine ? "requires_hourly_price" : "automatic_with_manual_travel_fee";
  const estimateSummary = buildEstimateSummary({
    currency: "PLN",
    durationHours: input.event.durationHours,
    lines,
  });
  const warnings = ["Cena nie obejmuje kosztu dojazdu.", "Dostępność wymaga potwierdzenia przez obsługę."];
  if (hasMissingPriceLine) warnings.unshift("Część pozycji nie ma ustawionej stawki godzinowej.");

  const quote: Quote = {
    id: makeId("quote"),
    quoteMode,
    currency: "PLN",
    durationHours: input.event.durationHours,
    lines,
    estimateSummary,
    subtotalZloty,
    travelFee: {
      mode: "manual",
      amountZloty: null,
      label: "Koszt dojazdu do potwierdzenia",
    },
    totalEstimateZloty: hasMissingPriceLine ? null : subtotalZloty,
    warnings,
    event: {
      date: input.event.date,
      startTime: input.event.startTime ?? "10:00",
      postalCode: input.event.postalCode,
      city: input.event.city,
    },
    createdAt: nowIso(),
  };

  if (options.persist ?? true) {
    state.quotes.unshift(quote);
    recordAnalytics("quote_calculated", "quote", quote.id, { itemCount: input.items.length });
  }
  return quote;
}
