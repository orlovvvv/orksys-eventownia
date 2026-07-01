import { Button } from "@orksys-eventownia/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

import { AdminAuditDetailSection } from "@/components/admin-audit-detail";
import { AdminShell } from "@/components/admin-shell";
import { buildAuditDisplayRows } from "@/lib/audit-display";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/audit/$id")({
  component: AdminAuditDetailRoute,
});

function AdminAuditDetailRoute() {
  const { id } = Route.useParams();
  const audit = useQuery(trpc.admin.auditLogs.list.queryOptions());
  const rows = audit.data ?? [];
  const displayRows = useMemo(() => buildAuditDisplayRows(rows, "grouped"), [rows]);
  const selectedRow = displayRows.find((row) => row.id === id || row.primaryId === id || row.rowIds.includes(id)) ?? null;

  return (
    <AdminShell
      title={selectedRow ? compactId(selectedRow.entityId) : "Wpis audytu"}
      description={selectedRow ? `${selectedRow.action} · ${formatDateTime(selectedRow.lastSeenAt)}` : "Nie znaleziono wpisu audytu."}
    >
      <div className="grid gap-4">
        <Button variant="ghost" className="w-fit" render={<Link to="/admin/audit" search={{ entity: "all", mode: "grouped", page: 1 }} />}>
          <ArrowLeft data-icon="inline-start" />
          Wróć do audytu
        </Button>
        <AdminAuditDetailSection row={selectedRow} />
      </div>
    </AdminShell>
  );
}
