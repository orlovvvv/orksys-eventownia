import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequestsRoute,
});

function AdminRequestsRoute() {
  const requests = useQuery(trpc.admin.rentalRequests.list.queryOptions({}));

  return (
    <AdminShell title="Zapytania">
      <Card>
        <CardHeader><CardTitle>Inbox zapytań</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Klient</TableHead><TableHead>Termin</TableHead><TableHead>Status</TableHead><TableHead>Szacunek</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {requests.data?.map((request) =>
                request ? (
                  <TableRow key={request.id}>
                    <TableCell>{request.customer?.name}<div className="text-xs text-muted-foreground">{request.customer?.phone}</div></TableCell>
                    <TableCell>{request.eventDate} {request.startTime}</TableCell>
                    <TableCell><StatusBadge status={request.status} /></TableCell>
                    <TableCell><Money amountGrosz={request.totalEstimateGrosz} /></TableCell>
                    <TableCell><Button variant="outline" render={<Link to="/admin/requests/$id" params={{ id: request.id }} />}>Otwórz</Button></TableCell>
                  </TableRow>
                ) : null,
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
