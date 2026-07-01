export type AuditViewMode = "grouped" | "raw";

export type AuditSourceRow = {
  id: string;
  adminUserId?: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
};

export type AuditDisplayRow = {
  id: string;
  primaryId: string;
  rowIds: string[];
  duplicateCount: number;
  action: string;
  entityType: string;
  entityId: string | null;
  adminUserId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  hasChange: boolean;
  changedFields: string[];
};

export function buildAuditDisplayRows(rows: AuditSourceRow[], mode: AuditViewMode) {
  if (mode === "raw") {
    return sortDisplayRows(
      rows.map((row) => ({
        id: row.id,
        primaryId: row.id,
        rowIds: [row.id],
        duplicateCount: 1,
        action: row.action,
        entityType: row.entityType ?? "unknown",
        entityId: row.entityId,
        adminUserId: row.adminUserId ?? null,
        beforeJson: row.beforeJson,
        afterJson: row.afterJson,
        firstSeenAt: row.createdAt,
        lastSeenAt: row.createdAt,
        hasChange: Boolean(row.beforeJson || row.afterJson),
        changedFields: getChangedFields(row.beforeJson, row.afterJson),
      })),
    );
  }

  const groups = new Map<string, AuditDisplayRow>();

  for (const row of rows) {
    const key = [
      row.action,
      row.entityType ?? "unknown",
      row.entityId ?? "",
      row.adminUserId ?? "",
      row.beforeJson ?? "",
      row.afterJson ?? "",
    ].join("\u001f");
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        id: row.id,
        primaryId: row.id,
        rowIds: [row.id],
        duplicateCount: 1,
        action: row.action,
        entityType: row.entityType ?? "unknown",
        entityId: row.entityId,
        adminUserId: row.adminUserId ?? null,
        beforeJson: row.beforeJson,
        afterJson: row.afterJson,
        firstSeenAt: row.createdAt,
        lastSeenAt: row.createdAt,
        hasChange: Boolean(row.beforeJson || row.afterJson),
        changedFields: getChangedFields(row.beforeJson, row.afterJson),
      });
      continue;
    }

    existing.rowIds.push(row.id);
    existing.duplicateCount += 1;

    if (new Date(row.createdAt).getTime() > new Date(existing.lastSeenAt).getTime()) {
      existing.lastSeenAt = row.createdAt;
      existing.primaryId = row.id;
      existing.id = row.id;
    }

    if (new Date(row.createdAt).getTime() < new Date(existing.firstSeenAt).getTime()) {
      existing.firstSeenAt = row.createdAt;
    }
  }

  return sortDisplayRows(Array.from(groups.values()));
}

export function filterAuditDisplayRows(
  rows: AuditDisplayRow[],
  filters: { q?: string; entity?: string },
) {
  const normalizedSearch = filters.q?.trim().toLowerCase() ?? "";
  const entity = filters.entity ?? "all";

  return rows.filter((row) => {
    const matchesEntity = entity === "all" || row.entityType === entity;
    if (!matchesEntity) return false;
    if (!normalizedSearch) return true;

    const searchable = [
      row.action,
      row.entityType,
      row.entityId,
      compactSearchId(row.entityId),
      row.adminUserId,
      compactSearchId(row.adminUserId),
      row.changedFields.join(" "),
      row.duplicateCount > 1 ? `${row.duplicateCount} duplikaty` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });
}

export function paginateAuditRows(rows: AuditDisplayRow[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageCount,
    pageRows: rows.slice(start, start + pageSize),
  };
}

export function getChangedFields(beforeJson: string | null, afterJson: string | null) {
  const before = parseJsonRecord(beforeJson);
  const after = parseJsonRecord(afterJson);

  if (!before && !after) return [];
  if (!before) return after ? Object.keys(after).sort((a, b) => a.localeCompare(b, "pl")) : [];
  if (!after) return before ? Object.keys(before).sort((a, b) => a.localeCompare(b, "pl")) : [];

  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Array.from(fields)
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .sort((a, b) => a.localeCompare(b, "pl"));
}

function sortDisplayRows(rows: AuditDisplayRow[]) {
  return rows.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
}

function parseJsonRecord(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function compactSearchId(id: string | null | undefined) {
  if (!id) return null;
  const clean = id.replace(/^(req|book|prod|pay|block|asset|audit|cust|loc|pset|price|variant)_?/i, "");
  return clean.slice(-6);
}
