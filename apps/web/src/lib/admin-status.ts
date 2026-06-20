type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

const statusLabels: Record<string, string> = {
  active: "Aktywny",
  inactive: "Nieaktywny",
  pending_admin_review: "Do wyceny",
  confirmed: "Potwierdzone",
  declined: "Odrzucone",
  cancelled: "Anulowane",
  expired: "Wygasłe",
  confirmed_unpaid: "Bez wpłaty",
  payment_pending: "Płatność oczekuje",
  confirmed_deposit_paid: "Zaliczka opłacona",
  confirmed_paid: "Opłacone",
  confirmed_cash_or_bank_transfer: "Gotówka/przelew",
  in_progress: "W realizacji",
  completed: "Zakończone",
  cancelled_by_customer: "Anulowane przez klienta",
  cancelled_by_operator: "Anulowane przez operatora",
  not_required: "Nie wymaga",
  checkout_created: "Link utworzony",
  pending: "Oczekuje",
  paid: "Opłacone",
  failed: "Błąd",
  refunded: "Zwrócone",
  sent: "Wysłane",
  manual: "Ręcznie",
  maintenance: "Serwis",
  blackout: "Blokada",
  automatic: "Automatyczny",
  deposit: "Zaliczka",
  full_payment: "Całość",
  refund: "Zwrot",
  stripe: "Stripe",
  przelewy24: "Przelewy24",
  bank_transfer: "Przelew",
  cash: "Gotówka",
};

const positiveStatuses = new Set([
  "active",
  "confirmed",
  "confirmed_deposit_paid",
  "confirmed_paid",
  "confirmed_cash_or_bank_transfer",
  "paid",
  "completed",
  "sent",
  "automatic",
]);

const destructiveStatuses = new Set([
  "inactive",
  "declined",
  "cancelled",
  "cancelled_by_customer",
  "cancelled_by_operator",
  "failed",
  "expired",
  "refunded",
  "blackout",
]);

const warningStatuses = new Set([
  "pending_admin_review",
  "confirmed_unpaid",
  "payment_pending",
  "checkout_created",
  "pending",
  "maintenance",
  "manual",
]);

export function getStatusLabel(status: string | null | undefined) {
  if (!status) return "Brak";
  return statusLabels[status] ?? status.replaceAll("_", " ");
}

export function getStatusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return "outline";
  if (destructiveStatuses.has(status)) return "destructive";
  if (positiveStatuses.has(status)) return "default";
  if (warningStatuses.has(status)) return "secondary";
  return "outline";
}

export function compactId(id: string | null | undefined) {
  if (!id) return "#----";
  const clean = id.replace(/^(req|book|prod|pay|block|asset|audit|cust|loc)_?/i, "");
  return `#${clean.slice(-6).toUpperCase()}`;
}

export function initials(name: string | null | undefined) {
  if (!name) return "EA";
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return letters || "EA";
}

export function itemSummary(items: Array<{ product?: { namePl: string } | null; quantity?: number }> | undefined) {
  if (!items || items.length === 0) return "Brak pozycji";
  const firstItems = items.slice(0, 2).map((item) => {
    const quantity = item.quantity && item.quantity > 1 ? `${item.quantity}x ` : "";
    return `${quantity}${item.product?.namePl ?? "Pozycja"}`;
  });
  return items.length > 2 ? `${firstItems.join(", ")} +${items.length - 2}` : firstItems.join(", ");
}

export function isUnpaidBooking(status: string | null | undefined) {
  return status === "confirmed_unpaid" || status === "payment_pending";
}

export function isActiveOrUpcomingDate(value: string | null | undefined) {
  if (!value) return false;
  return new Date(value) >= new Date();
}
