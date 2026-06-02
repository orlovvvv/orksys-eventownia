import { makeId, nowIso } from "./ids";
import { getMockAdmin, getState } from "./store";

export function appendAuditLog(
  action: string,
  entityType: string,
  entityId: string | null,
  before: unknown = null,
  after: unknown = null,
) {
  const state = getState();
  const admin = getMockAdmin();
  const row = {
    id: makeId("audit"),
    adminUserId: admin?.id ?? null,
    action,
    entityType,
    entityId,
    beforeJson: before === null ? null : JSON.stringify(before),
    afterJson: after === null ? null : JSON.stringify(after),
    ipAddress: "127.0.0.1",
    userAgent: "mock-admin",
    createdAt: nowIso(),
  };
  state.auditLogs.unshift(row);
  return row;
}
