import { Badge } from "@orksys-eventownia/ui/components/badge";
import { History, Search } from "lucide-react";

import { AdminDetailRow } from "@/components/admin-detail-row";
import { AdminEmptyState } from "@/components/admin-empty-state";
import {
  AdminSection,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
import { compactId } from "@/lib/admin-status";
import type { AuditDisplayRow } from "@/lib/audit-display";
import { formatDateTime } from "@/lib/format";

export function AdminAuditDetailSection({ row }: { row: AuditDisplayRow | null }) {
  return (
    <AdminSection>
      <AdminSectionHeader>
        <div className="min-w-0">
          <AdminSectionTitle className="flex min-w-0 items-center gap-2">
            <History aria-hidden="true" data-icon="inline-start" /> Szczegóły wpisu
          </AdminSectionTitle>
          <AdminSectionDescription className="break-words">
            {row ? `${row.action} · ${formatDateTime(row.lastSeenAt)}` : "Wybierz wpis audytu."}
          </AdminSectionDescription>
        </div>
      </AdminSectionHeader>
      <AdminSectionContent className="p-0">
        <AuditDetailContent row={row} />
      </AdminSectionContent>
    </AdminSection>
  );
}

export function AuditChangeBadge({ hasChange }: { hasChange: boolean }) {
  return <Badge variant={hasChange ? "secondary" : "outline"}>{hasChange ? "tak" : "brak"}</Badge>;
}

export function AuditDuplicateBadge({ duplicateCount }: { duplicateCount: number }) {
  if (duplicateCount <= 1) return <Badge variant="outline">1</Badge>;
  return <Badge variant="default">x{duplicateCount}</Badge>;
}

function AuditDetailContent({ row }: { row: AuditDisplayRow | null }) {
  if (!row) {
    return <AdminEmptyState icon={Search} title="Brak wpisu" description="Nie znaleziono wpisu audytu." />;
  }

  return (
    <div className="grid gap-0">
      <AdminDetailRow label="Akcja" value={<span className="break-words">{row.action}</span>} />
      <AdminDetailRow label="Encja" value={<span className="break-words">{row.entityType}</span>} />
      <AdminDetailRow label="ID encji" value={<span translate="no">{compactId(row.entityId)}</span>} description={row.entityId} />
      <AdminDetailRow label="Administrator" value={<span className="break-words">{row.adminUserId ?? "brak"}</span>} />
      <AdminDetailRow label="Pierwsze wystąpienie" value={<span className="tabular-nums">{formatDateTime(row.firstSeenAt)}</span>} />
      <AdminDetailRow label="Ostatnie wystąpienie" value={<span className="tabular-nums">{formatDateTime(row.lastSeenAt)}</span>} />
      <AdminDetailRow label="Liczba duplikatów" value={row.duplicateCount} />
      <AdminDetailRow
        label="Zmienione pola"
        value={row.changedFields.length > 0 ? <span className="break-words">{row.changedFields.join(", ")}</span> : "brak"}
      />
      <div className="grid gap-4 border-t border-border/70 p-4 lg:grid-cols-2">
        <JsonPreview title="Przed" value={row.beforeJson} />
        <JsonPreview title="Po" value={row.afterJson} />
      </div>
    </div>
  );
}

function JsonPreview({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{title}</div>
      <pre className="mt-3 max-h-[min(60svh,32rem)] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs leading-relaxed">
        {value ? formatJson(value) : "Brak danych"}
      </pre>
    </div>
  );
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
