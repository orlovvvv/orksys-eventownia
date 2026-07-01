import { addHoursIso, addMinutesIso, dateTimeIso } from "./ids";
import { findDefaultVariant, findProductBySkuOrId, findVariantForProductKey, getState } from "./store";

const blockingStatuses = new Set([
  "confirmed",
  "in_progress",
]);

export type AvailabilityInput = {
  items: { productId: string; quantity: number }[];
  date: string;
  startTime?: string;
  durationHours: number;
};

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() && new Date(aEnd).getTime() > new Date(bStart).getTime();
}

export function checkAvailability(input: AvailabilityInput) {
  const state = getState();
  const eventStartAt = dateTimeIso(input.date, input.startTime ?? "10:00");
  const eventEndAt = addHoursIso(eventStartAt, input.durationHours);

  const items = input.items.map((item) => {
    const variant = findVariantForProductKey(item.productId);
    const product = findProductBySkuOrId(item.productId);
    if (!variant || !product || !product.active) {
      return {
        productId: item.productId,
        sku: item.productId,
        name: item.productId,
        available: false,
        availableQuantity: 0,
        requestedQuantity: item.quantity,
        conflictReasons: ["Produkt nie istnieje lub jest nieaktywny."],
      };
    }
    const defaultVariant = findDefaultVariant(product.id);
    const availabilityVariant = defaultVariant ?? variant;

    const requestedStart = addMinutesIso(eventStartAt, -product.setupMinutes);
    const requestedEnd = addMinutesIso(eventEndAt, product.teardownMinutes + product.cleaningBufferMinutes);
    const bookedQuantity = state.bookingItems
      .filter((bookingItem) => bookingItem.productId === product.id)
      .reduce((sum, bookingItem) => {
        const booking = state.bookings.find((item) => item.id === bookingItem.bookingId);
        if (!booking || !blockingStatuses.has(booking.status)) return sum;
        if (!overlaps(requestedStart, requestedEnd, booking.setupStartAt, booking.teardownEndAt)) return sum;
        return sum + bookingItem.quantity;
      }, 0);

    const block = state.availabilityBlocks.find(
      (availabilityBlock) =>
        (availabilityBlock.productId === null || availabilityBlock.productId === product.id) &&
        overlaps(requestedStart, requestedEnd, availabilityBlock.startsAt, availabilityBlock.endsAt),
    );
    const availableQuantity = block ? 0 : Math.max(0, availabilityVariant.inventoryCount - bookedQuantity);
    const conflictReasons: string[] = [];
    if (block) conflictReasons.push(block.reason);
    if (availableQuantity < item.quantity) conflictReasons.push("Brak wystarczającej liczby sztuk w wybranym terminie.");

    return {
      productId: product.id,
      sku: availabilityVariant.sku,
      name: product.namePl,
      available: availableQuantity >= item.quantity,
      availableQuantity,
      requestedQuantity: item.quantity,
      operationalWindow: {
        startsAt: requestedStart,
        endsAt: requestedEnd,
      },
      conflictReasons,
    };
  });

  return {
    available: items.every((item) => item.available),
    mode: "estimated" as const,
    eventStartAt,
    eventEndAt,
    items,
    warnings: ["Finalna dostępność wymaga ręcznego potwierdzenia."],
  };
}
