import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const summary = useQuery(trpc.admin.dashboard.summary.queryOptions());
  const cards = summary.data?.cards;

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards
          ? Object.entries(cards).map(([label, value]) => (
              <Card key={label}>
                <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
                <CardContent className="text-2xl font-semibold">{value}</CardContent>
              </Card>
            ))
          : null}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ostatnie zapytania</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Klient</TableHead><TableHead>Status</TableHead><TableHead>Szacunek</TableHead></TableRow></TableHeader>
              <TableBody>
                {summary.data?.latestRequests.map((request) =>
                  request ? (
                    <TableRow key={request.id}>
                      <TableCell><Link to="/admin/requests/$id" params={{ id: request.id }}>{request.customer?.name}</Link></TableCell>
                      <TableCell><StatusBadge status={request.status} /></TableCell>
                      <TableCell><Money amountGrosz={request.totalEstimateGrosz} /></TableCell>
                    </TableRow>
                  ) : null,
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Nadchodzące rezerwacje</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Klient</TableHead><TableHead>Start</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {summary.data?.latestBookings.map((booking) =>
                  booking ? (
                    <TableRow key={booking.id}>
                      <TableCell><Link to="/admin/bookings/$id" params={{ id: booking.id }}>{booking.customer?.name}</Link></TableCell>
                      <TableCell>{formatDateTime(booking.eventStartAt)}</TableCell>
                      <TableCell><StatusBadge status={booking.status} /></TableCell>
                    </TableRow>
                  ) : null,
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
