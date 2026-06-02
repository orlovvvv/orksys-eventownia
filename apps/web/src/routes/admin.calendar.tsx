import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/calendar")({
  component: AdminCalendarRoute,
});

function AdminCalendarRoute() {
  const calendar = useQuery(trpc.admin.calendar.list.queryOptions());
  return (
    <AdminShell title="Kalendarz">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {calendar.data?.map((booking) =>
          booking ? (
            <Card key={booking.id}>
              <CardHeader><CardTitle>{booking.customer?.name}</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div>{formatDateTime(booking.eventStartAt)}</div>
                <StatusBadge status={booking.status} />
                <div className="text-xs text-muted-foreground">{booking.items.map((item) => item.product?.namePl).join(", ")}</div>
              </CardContent>
            </Card>
          ) : null,
        )}
      </div>
    </AdminShell>
  );
}
