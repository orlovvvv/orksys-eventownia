import { makeId, nowIso } from "./ids";
import { getState } from "./store";
import type { Notification } from "./types";

type NotificationInput = {
  bookingId?: string | null;
  rentalRequestId?: string | null;
  customerId?: string | null;
  channel?: Notification["channel"];
  templateKey: string;
  recipient: string;
};

export function createNotification(input: NotificationInput) {
  const state = getState();
  const now = nowIso();
  const row: Notification = {
    id: makeId("notif"),
    bookingId: input.bookingId ?? null,
    rentalRequestId: input.rentalRequestId ?? null,
    customerId: input.customerId ?? null,
    channel: input.channel ?? "email",
    templateKey: input.templateKey,
    recipient: input.recipient,
    status: "sent",
    providerMessageId: makeId("msg"),
    errorMessage: null,
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };
  state.notifications.unshift(row);
  return row;
}

export function resendNotification(id: string) {
  const state = getState();
  const row = state.notifications.find((notification) => notification.id === id);
  if (!row) return null;
  row.status = "sent";
  row.providerMessageId = makeId("msg");
  row.sentAt = nowIso();
  row.updatedAt = row.sentAt;
  return row;
}
