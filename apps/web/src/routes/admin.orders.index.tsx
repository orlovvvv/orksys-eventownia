import { Button } from "@orksys-eventownia/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { ToggleGroup, ToggleGroupItem } from "@orksys-eventownia/ui/components/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CheckCircle, Inbox, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminDataToolbar } from "@/components/admin-data-toolbar";
import { AdminEmptyState } from "@/components/admin-empty-state";
import { AdminMetricStrip } from "@/components/admin-metric-strip";
import {
  AdminSection,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
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
    <AdminShell title="Zamówienia" description="Zapytania do potwierdzenia, rezerwacje i ręczne rozliczenia.">
      <AdminMetricStrip
        metrics={[
          { label: "Do potwierdzenia", value: metrics.pending, detail: "Nowe zapytania", icon: Inbox, tone: "warning" },
          { label: "Potwierdzone", value: metrics.confirmed, detail: "Blokują dostępność", icon: CalendarCheck, tone: "primary" },
          { label: "Do rozliczenia", value: metrics.due, detail: "Płatności ręczne", icon: WalletCards, tone: "warning" },
          { label: "Zakończone", value: metrics.completed, detail: "Historia realizacji", icon: CheckCircle },
        ]}
      />

      <AdminDataToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj klienta, telefonu, produktu...">
        <ToggleGroup value={[filter]} onValueChange={(value) => value[0] ? setFilter(value[0] as OrderFilter) : undefined} spacing={1} className="flex-wrap">
          <ToggleGroupItem value="pending" variant="outline" size="sm">Do potwierdzenia</ToggleGroupItem>
          <ToggleGroupItem value="confirmed" variant="outline" size="sm">Potwierdzone</ToggleGroupItem>
          <ToggleGroupItem value="due" variant="outline" size="sm">Do rozliczenia</ToggleGroupItem>
          <ToggleGroupItem value="completed" variant="outline" size="sm">Zakończone</ToggleGroupItem>
          <ToggleGroupItem value="cancelled" variant="outline" size="sm">Anulowane</ToggleGroupItem>
          <ToggleGroupItem value="all" variant="outline" size="sm">Wszystkie</ToggleGroupItem>
        </ToggleGroup>
      </AdminDataToolbar>

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>Lista zamówień</AdminSectionTitle>
            <AdminSectionDescription>Pokazuje {filteredOrders.length} z {allOrders.length} wpisów.</AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState icon={Inbox} title="Brak zamówień" description="Nie znaleziono wpisów dla wybranych filtrów." />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
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
                        <TableCell className="max-w-72 whitespace-normal text-muted-foreground">
                          <div>{itemSummary(order.items)}</div>
                          {order.kind === "pending" && hasMissingHourlyRate(order.items) ? (
                            <div className="mt-1"><StatusBadge status="requires_hourly_price" /></div>
                          ) : null}
                        </TableCell>
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
              </div>
              <div className="grid gap-2 p-3 md:hidden">
                {filteredOrders.map((order) => (
                  <Link key={`${order.kind}-${order.id}`} to="/admin/orders/$id" params={{ id: order.id }} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{order.customer?.name ?? "Klient"}</div>
                        <div className="text-xs text-muted-foreground">{compactId(order.id)} · {formatDateTime(order.eventStartAt)}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{itemSummary(order.items)}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <StatusBadge status={order.manualPaymentStatus} />
                      <div className="font-semibold"><Money amountZloty={order.totalZloty} /></div>
                    </div>
                    {order.kind === "pending" && hasMissingHourlyRate(order.items) ? (
                      <div className="mt-2"><StatusBadge status="requires_hourly_price" /></div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </>
          )}
        </AdminSectionContent>
      </AdminSection>
    </AdminShell>
  );
}

function hasMissingHourlyRate(items: Array<{ pricingStatus?: string; hourlyPriceZloty?: number | null }>) {
  return items.some((item) => item.pricingStatus === "missing_hourly_price" || item.hourlyPriceZloty === null || item.hourlyPriceZloty === undefined);
}
