import { makeId, nowIso } from "./ids";
import { findActiveHourlyPrice, findPriceSetForVariant, findProductById, findVariantForProductKey, getState, recordAnalytics } from "./store";
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
    discountZloty: 0,
    finalQuote: {
      status: "pending_manual_distance",
      totalZloty: null,
      message: "Pełna wycena zostanie przygotowana po ręcznym obliczeniu kosztu dojazdu.",
    },
  };
}

export function buildFinalizedEstimateSummary(input: {
  currency: Currency;
  durationHours: number;
  lines: EstimateSummaryLine[];
  travelFeeZloty: number;
  discountZloty: number;
  totalZloty: number;
}): EstimateSummary {
  return {
    currency: input.currency,
    billableHours: input.durationHours,
    lines: input.lines,
    itemsSubtotalZloty: input.lines.reduce((sum, line) => sum + (line.lineTotalZloty ?? 0), 0),
    travel: {
      mode: "manual_distance",
      amountZloty: input.travelFeeZloty,
      label: "Dojazd",
      message: "Koszt dojazdu został wyliczony ręcznie po sprawdzeniu odległości.",
    },
    discountZloty: input.discountZloty,
    finalQuote: {
      status: "finalized",
      totalZloty: input.totalZloty,
      message: "Pełna wycena została przygotowana po ręcznym obliczeniu kosztu dojazdu.",
    },
  };
}

export function calculateQuote(input: QuoteInput, options: { persist?: boolean } = {}): Quote {
  const state = getState();
  const billableHours = input.event.durationHours;
  const lines: QuoteLine[] = input.items.map((item) => {
    const variant = findVariantForProductKey(item.sku);
    const product = variant ? findProductById(variant.productId) : null;
    if (!variant || !product) {
      return {
        variantId: variant?.id ?? null,
        sku: item.sku,
        productId: product?.id ?? item.sku,
        name: product?.namePl ?? item.sku,
        quantity: item.quantity,
        hourlyPriceZloty: null,
        billableHours,
        lineTotalZloty: null,
        pricingStatus: "missing_hourly_price",
      };
    }

    const priceSet = findPriceSetForVariant(variant.id);
    const price = priceSet ? findActiveHourlyPrice(priceSet.id) : null;
    if (!priceSet || !price) {
      return {
        variantId: variant.id,
        sku: variant.sku,
        productId: product.id,
        name: product.namePl,
        quantity: item.quantity,
        hourlyPriceZloty: null,
        billableHours,
        lineTotalZloty: null,
        pricingStatus: "missing_hourly_price",
      };
    }

    const lineTotalZloty = item.quantity * price.amountZloty * billableHours;
    return {
      variantId: variant.id,
      sku: variant.sku,
      productId: product.id,
      name: product.namePl,
      quantity: item.quantity,
      hourlyPriceZloty: price.amountZloty,
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
