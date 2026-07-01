import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CheckCircle, Clock, Inbox, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId, itemSummary } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrdersRoute,
});

type OrderFilter = "pending" | "confirmed" | "due" | "completed" | "cancelled" | "all";

function AdminOrdersRoute() {
  const orders = useQuery(trpc.admin.orders.list.queryOptions());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("pending");
  const allOrders = orders.data ?? [];
  const metrics = useMemo(() => {
    return {
      pending: allOrders.filter((order) => order.kind === "pending" && order.status === "pending_admin_review").length,
      confirmed: allOrders.filter((order) => order.kind === "booking" && order.status === "confirmed").length,
      due: allOrders.filter((order) => order.kind === "booking" && order.manualPaymentStatus !== "paid" && order.manualPaymentStatus !== "not_required").length,
      completed: allOrders.filter((order) => order.status === "completed").length,
    };
  }, [allOrders]);
  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allOrders.filter((order) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && order.kind === "pending" && order.status === "pending_admin_review") ||
        (filter === "confirmed" && order.kind === "booking" && (order.status === "confirmed" || order.status === "in_progress")) ||
        (filter === "due" && order.kind === "booking" && order.manualPaymentStatus !== "paid" && order.manualPaymentStatus !== "not_required") ||
        (filter === "completed" && order.status === "completed") ||
        (filter === "cancelled" && String(order.status).startsWith("cancelled"));
      const searchable = [
        order.id,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.email,
        order.location?.city,
        itemSummary(order.items),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allOrders, filter, search]);

  return (
    <AdminShell title="Zamówienia" description="Jedno miejsce dla zamówień do potwierdzenia, rezerwacji i ręcznych rozliczeń.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Do potwierdzenia" value={metrics.pending} detail="Nowe zamówienia" icon={Inbox} tone="warning" />
        <AdminKpiCard label="Potwierdzone" value={metrics.confirmed} detail="Blokują dostępność" icon={CalendarCheck} tone="primary" />
        <AdminKpiCard label="Do rozliczenia" value={metrics.due} detail="Płatności ręczne" icon={WalletCards} tone="warning" />
        <AdminKpiCard label="Zakończone" value={metrics.completed} detail="Historia realizacji" icon={CheckCircle} tone="neutral" />
      </div>

      <AdminListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj klienta, telefonu, produktu...">
        <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Do potwierdzenia</Button>
        <Button variant={filter === "confirmed" ? "default" : "outline"} size="sm" onClick={() => setFilter("confirmed")}>Potwierdzone</Button>
        <Button variant={filter === "due" ? "default" : "outline"} size="sm" onClick={() => setFilter("due")}>Do rozliczenia</Button>
        <Button variant={filter === "completed" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("completed")}>
          <Clock data-icon="inline-start" />
          Zakończone
        </Button>
        <Button variant={filter === "cancelled" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("cancelled")}>Anulowane</Button>
        <Button variant={filter === "all" ? "secondary" : "outline"} size="sm" onClick={() => setFilter("all")}>Wszystkie</Button>
      </AdminListToolbar>

      <Card>
        <CardHeader>
          <CardTitle>Lista zamówień</CardTitle>
          <CardDescription>Pokazuje {filteredOrders.length} z {allOrders.length} wpisów.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Produkty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rozliczenie</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Brak zamówień dla wybranych filtrów.
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredOrders.map((order) => (
                <TableRow key={`${order.kind}-${order.id}`}>
                  <TableCell className="font-semibold">{compactId(order.id)}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{order.customer?.name ?? "Klient"}</div>
                    <div className="text-xs text-muted-foreground">{order.customer?.phone ?? order.customer?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatDateTime(order.eventStartAt)}</div>
                    <div className="text-xs text-muted-foreground">{order.durationHours}h · {order.location?.city ?? "brak miasta"}</div>
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal text-muted-foreground">{itemSummary(order.items)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell><StatusBadge status={order.manualPaymentStatus} /></TableCell>
                  <TableCell className="font-semibold"><Money amountZloty={order.totalZloty} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" render={<Link to="/admin/orders/$id" params={{ id: order.id }} />}>Otwórz</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
