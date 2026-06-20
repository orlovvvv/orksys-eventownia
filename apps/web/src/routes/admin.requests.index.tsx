import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CheckCircle, Filter, Inbox, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId, itemSummary } from "@/lib/admin-status";
import { requestMetrics } from "@/lib/admin-metrics";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/requests/")({
  component: AdminRequestsRoute,
});

function AdminRequestsRoute() {
  const requests = useQuery(trpc.admin.rentalRequests.list.queryOptions({}));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const confirm = useMutation(
    trpc.admin.rentalRequests.confirm.mutationOptions({
      onSuccess: () => {
        toast.success("Zapytanie potwierdzone w makiecie.");
        void queryClient.invalidateQueries();
      },
    }),
  );

  const allRequests = useMemo(() => (requests.data ?? []).flatMap((request) => (request ? [request] : [])), [requests.data]);
  const metrics = requestMetrics(allRequests);
  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    return allRequests.filter((request) => {
      const requestDate = new Date(`${request.eventDate}T${request.startTime || "00:00"}`);
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "week" && requestDate >= today && requestDate <= weekFromNow) ||
        (dateFilter === "upcoming" && requestDate >= today);
      const searchable = [
        request.id,
        request.customer?.name,
        request.customer?.phone,
        request.customer?.email,
        request.location?.city,
        itemSummary(request.items),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesDate && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allRequests, dateFilter, search, statusFilter]);

  return (
    <AdminShell title="Zapytania ofertowe" description="Zarządzaj zapytaniami klientów w jednym miejscu.">
      <div className="grid gap-4 md:grid-cols-3">
        <AdminKpiCard label="Oczekujące" value={metrics.pendingCount} detail="Do obsłużenia" icon={Inbox} tone="primary" />
        <AdminKpiCard
          label="Potwierdzone"
          value={metrics.confirmedCount}
          detail="Zamienione w rezerwacje"
          icon={CheckCircle}
          tone="neutral"
        />
        <AdminKpiCard
          label="Wartość oczekujących"
          value={<Money amountGrosz={metrics.pendingValueGrosz} />}
          detail="Szacunek z koszyka"
          icon={WalletCards}
          tone="warning"
        />
      </div>

      <AdminListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Szukaj ID, klienta, telefonu..."
      >
        <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
          Wszystkie
        </Button>
        <Button
          variant={statusFilter === "pending_admin_review" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending_admin_review")}
        >
          Do wyceny
        </Button>
        <Button variant={statusFilter === "confirmed" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("confirmed")}>
          Potwierdzone
        </Button>
        <Button variant={dateFilter === "week" ? "secondary" : "outline"} size="sm" onClick={() => setDateFilter(dateFilter === "week" ? "all" : "week")}>
          <Filter data-icon="inline-start" />
          7 dni
        </Button>
      </AdminListToolbar>

      <Card>
        <CardHeader>
          <CardTitle>Inbox zapytań</CardTitle>
          <CardDescription>Pokazuje {filteredRequests.length} z {allRequests.length} zapytań.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Data eventu</TableHead>
                  <TableHead>Produkty</TableHead>
                  <TableHead>Szacunek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Brak zapytań dla wybranych filtrów.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-semibold">{compactId(request.id)}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{request.customer?.name ?? "Klient"}</div>
                      <div className="text-xs text-muted-foreground">{request.customer?.phone ?? request.customer?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.eventDate}</div>
                      <div className="text-xs text-muted-foreground">{request.startTime} / {request.durationHours}h</div>
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{itemSummary(request.items)}</TableCell>
                    <TableCell className="font-semibold"><Money amountGrosz={request.totalEstimateGrosz} /></TableCell>
                    <TableCell><StatusBadge status={request.status} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" render={<Link to="/admin/requests/$id" params={{ id: request.id }} />}>
                          Szczegóły
                        </Button>
                        {request.status === "pending_admin_review" ? (
                          <Button
                            size="sm"
                            disabled={confirm.isPending}
                            onClick={() =>
                              confirm.mutate({
                                id: request.id,
                                travelFeeGrosz: request.travelFeeGrosz ?? 0,
                                depositRequiredGrosz: 30000,
                                adminNotes: "Potwierdzone z listy zapytań.",
                                sendPaymentLink: true,
                              })
                            }
                          >
                            Potwierdź
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filteredRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{compactId(request.id)}</div>
                    <div className="text-base font-semibold">{request.customer?.name ?? "Klient"}</div>
                    <div className="text-sm text-muted-foreground">{request.customer?.phone}</div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarCheck data-icon="inline-start" />
                    {request.eventDate} {request.startTime}
                  </div>
                  <div>{itemSummary(request.items)}</div>
                  <div className="text-lg font-bold"><Money amountGrosz={request.totalEstimateGrosz} /></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" variant="outline" render={<Link to="/admin/requests/$id" params={{ id: request.id }} />}>
                    Szczegóły
                  </Button>
                  {request.status === "pending_admin_review" ? (
                    <Button className="flex-1" disabled={confirm.isPending} onClick={() => confirm.mutate({ id: request.id, travelFeeGrosz: request.travelFeeGrosz ?? 0, depositRequiredGrosz: 30000, sendPaymentLink: true })}>
                      Potwierdź
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
