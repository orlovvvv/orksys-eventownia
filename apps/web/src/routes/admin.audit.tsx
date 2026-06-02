import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditRoute,
});

function AdminAuditRoute() {
  const audit = useQuery(trpc.admin.auditLogs.list.queryOptions());
  return (
    <AdminShell title="Audit log">
      <Card>
        <CardHeader><CardTitle>Historia akcji admina</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Czas</TableHead><TableHead>Akcja</TableHead><TableHead>Encja</TableHead><TableHead>ID</TableHead></TableRow></TableHeader>
            <TableBody>
              {audit.data?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.entityType}</TableCell>
                  <TableCell>{row.entityId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
