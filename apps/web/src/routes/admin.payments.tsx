import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CreditCard, RefreshCcw, TriangleAlert, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { paymentMetrics } from "@/lib/admin-metrics";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsRoute,
});

function AdminPaymentsRoute() {
  const payments = useQuery(trpc.admin.payments.list.queryOptions());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const markPaid = useMutation(trpc.admin.payments.markBankTransferPaid.mutationOptions({ onSuccess: () => {
    toast.success("Płatność oznaczona jako opłacona.");
    void queryClient.invalidateQueries();
  } }));
  const refund = useMutation(trpc.admin.payments.refund.mutationOptions({ onSuccess: () => {
    toast.success("Płatność zwrócona w makiecie.");
    void queryClient.invalidateQueries();
  } }));
  const allPayments = payments.data ?? [];
  const metrics = paymentMetrics(allPayments);
  const providerItems = [
    { value: "all", label: "Operator: wszyscy" },
    { value: "stripe", label: "Stripe" },
    { value: "przelewy24", label: "Przelewy24" },
    { value: "bank_transfer", label: "Przelew" },
    { value: "cash", label: "Gotówka" },
  ];
  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allPayments.filter((payment) => {
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      const matchesProvider = providerFilter === "all" || payment.provider === providerFilter;
      const searchable = [
        payment.id,
        payment.providerSessionId,
        payment.booking?.customer?.name,
        payment.booking?.customer?.phone,
        payment.bookingId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && matchesProvider && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allPayments, providerFilter, search, statusFilter]);

  return (
    <AdminShell title="Płatności" description="Kontroluj zaliczki, przelewy i zwroty w mock obiegu.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Do opłacenia" value={metrics.dueCount} detail={<Money amountGrosz={metrics.dueValueGrosz} />} icon={WalletCards} tone="warning" />
        <AdminKpiCard label="Opłacone" value={metrics.paidCount} detail="Zaksięgowane" icon={CreditCard} tone="primary" />
        <AdminKpiCard label="Błędy / wygasłe" value={metrics.expiredCount} detail="Do kontaktu" icon={TriangleAlert} tone="danger" />
        <AdminKpiCard label="Zwrócone" value={metrics.refundedCount} detail="Zwroty mock" icon={RefreshCcw} tone="neutral" />
      </div>

      <AdminListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj klienta, sesji, płatności...">
        <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Wszystkie</Button>
        <Button variant={statusFilter === "paid" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("paid")}>Opłacone</Button>
        <Button variant={statusFilter === "checkout_created" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("checkout_created")}>Linki</Button>
        <Button variant={statusFilter === "refunded" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("refunded")}>Zwroty</Button>
        <Select items={providerItems} value={providerFilter} onValueChange={(value) => setProviderFilter(String(value))}>
          <SelectTrigger size="sm" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{providerItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </AdminListToolbar>

      <Card>
        <CardHeader>
          <CardTitle>Rekonsyliacja mock</CardTitle>
          <CardDescription>Pokazuje {filteredPayments.length} z {allPayments.length} płatności.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Rezerwacja</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Cel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead>Daty</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-semibold">{payment.providerSessionId ?? compactId(payment.id)}</div>
                    <div className="text-xs text-muted-foreground">{compactId(payment.id)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{payment.booking?.customer?.name ?? "Rezerwacja"}</div>
                    {payment.booking ? <Link to="/admin/bookings/$id" params={{ id: payment.booking.id }} className="text-xs text-primary">Otwórz rezerwację</Link> : null}
                  </TableCell>
                  <TableCell><StatusBadge status={payment.provider} /></TableCell>
                  <TableCell><StatusBadge status={payment.purpose} /></TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell className="font-semibold"><Money amountGrosz={payment.amountGrosz} /></TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">Utw.: {formatDateTime(payment.createdAt)}</div>
                    {payment.paidAt ? <div className="text-xs text-muted-foreground">Opł.: {formatDateTime(payment.paidAt)}</div> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {payment.status !== "paid" ? <Button variant="outline" size="sm" disabled={markPaid.isPending} onClick={() => markPaid.mutate({ id: payment.id })}>Oznacz opłacone</Button> : null}
                      {payment.status === "paid" ? <Button variant="destructive" size="sm" disabled={refund.isPending} onClick={() => refund.mutate({ id: payment.id })}>Zwrot</Button> : null}
                    </div>
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
