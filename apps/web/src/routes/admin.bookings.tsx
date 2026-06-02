import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsRoute,
});

function AdminBookingsRoute() {
  const bookings = useQuery(trpc.admin.bookings.list.queryOptions());
  return (
    <AdminShell title="Rezerwacje">
      <Card>
        <CardHeader><CardTitle>Lista rezerwacji</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Klient</TableHead><TableHead>Start</TableHead><TableHead>Status</TableHead><TableHead>Kwota</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {bookings.data?.map((booking) =>
                booking ? (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.customer?.name}</TableCell>
                    <TableCell>{formatDateTime(booking.eventStartAt)}</TableCell>
                    <TableCell><StatusBadge status={booking.status} /></TableCell>
                    <TableCell><Money amountGrosz={booking.totalGrosz} /></TableCell>
                    <TableCell><Button variant="outline" render={<Link to="/admin/bookings/$id" params={{ id: booking.id }} />}>Otwórz</Button></TableCell>
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
