import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle, Clock, Plus, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { bookingMetrics } from "@/lib/admin-metrics";
import { compactId, isUnpaidBooking, itemSummary } from "@/lib/admin-status";
import { formatDateTime, todayPlus } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/bookings/")({
  component: AdminBookingsRoute,
});

function AdminBookingsRoute() {
  const bookings = useQuery(trpc.admin.bookings.list.queryOptions());
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [showManualForm, setShowManualForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customerName, setCustomerName] = useState("Rezerwacja ręczna");
  const [phone, setPhone] = useState("+48 600 000 000");
  const [productId, setProductId] = useState("");
  const [date, setDate] = useState(todayPlus(14));
  const [startTime, setStartTime] = useState("10:00");
  const [durationHours, setDurationHours] = useState(5);
  const [totalGrosz, setTotalGrosz] = useState(100000);
  const createBooking = useMutation(
    trpc.admin.bookings.create.mutationOptions({
      onSuccess: () => {
        toast.success("Dodano ręczną rezerwację mock.");
        setShowManualForm(false);
        void queryClient.invalidateQueries();
      },
    }),
  );
  const allBookings = useMemo(() => (bookings.data ?? []).flatMap((booking) => (booking ? [booking] : [])), [bookings.data]);
  const metrics = bookingMetrics(allBookings);
  const productOptions = useMemo(
    () => (products.data ?? []).map((product) => ({ value: product.id, label: product.namePl })),
    [products.data],
  );

  useEffect(() => {
    if (!productId && productOptions[0]) setProductId(productOptions[0].value);
  }, [productId, productOptions]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    return allBookings.filter((booking) => {
      const start = new Date(booking.eventStartAt);
      const matchesStatus =
        statusFilter === "all" ||
        booking.status === statusFilter ||
        (statusFilter === "unpaid" && isUnpaidBooking(booking.status));
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "week" && start >= today && start <= weekFromNow) ||
        (dateFilter === "upcoming" && start >= today);
      const searchable = [
        booking.id,
        booking.customer?.name,
        booking.customer?.phone,
        booking.customer?.email,
        booking.location?.city,
        itemSummary(booking.items),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesDate && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allBookings, dateFilter, search, statusFilter]);

  return (
    <AdminShell
      title="Rezerwacje"
      description="Pilnuj realizacji, płatności i ręcznie dodawanych terminów."
      actions={[{ label: "Nowa rezerwacja", icon: Plus, onClick: () => setShowManualForm((current) => !current) }]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Nadchodzące" value={metrics.upcomingCount} detail="W kalendarzu" icon={CalendarDays} tone="primary" />
        <AdminKpiCard label="Bez wpłaty" value={metrics.unpaidCount} detail="Do kontroli" icon={WalletCards} tone="warning" />
        <AdminKpiCard label="Zaliczki" value={metrics.depositPaidCount} detail="Opłacone" icon={CheckCircle} tone="neutral" />
        <AdminKpiCard label="Zakończone" value={metrics.completedCount} detail="Historia realizacji" icon={Clock} tone="neutral" />
      </div>

      {showManualForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Nowa rezerwacja ręczna</CardTitle>
            <CardDescription>Dodaje uproszczony termin offline do mock danych.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field><FieldLabel>Klient</FieldLabel><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></Field>
                <Field><FieldLabel>Telefon</FieldLabel><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
                <Field>
                  <FieldLabel>Produkt</FieldLabel>
                  <Select items={productOptions} value={productId} onValueChange={(value) => setProductId(String(value))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {productOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field><FieldLabel>Kwota (grosz)</FieldLabel><Input type="number" value={totalGrosz} onChange={(event) => setTotalGrosz(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Data</FieldLabel><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
                <Field><FieldLabel>Start</FieldLabel><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></Field>
                <Field><FieldLabel>Czas (h)</FieldLabel><Input type="number" value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} /></Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!productId || createBooking.isPending}
                  onClick={() => createBooking.mutate({ customerName, phone, productId, date, startTime, durationHours, totalGrosz })}
                >
                  Dodaj rezerwację
                </Button>
                <Button variant="outline" onClick={() => setShowManualForm(false)}>Anuluj</Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      <AdminListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Szukaj klienta, produktu, miasta..."
      >
        <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Wszystkie</Button>
        <Button variant={statusFilter === "unpaid" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("unpaid")}>Bez wpłaty</Button>
        <Button variant={dateFilter === "upcoming" ? "secondary" : "outline"} size="sm" onClick={() => setDateFilter(dateFilter === "upcoming" ? "all" : "upcoming")}>Nadchodzące</Button>
        <Button variant={dateFilter === "week" ? "secondary" : "outline"} size="sm" onClick={() => setDateFilter(dateFilter === "week" ? "all" : "week")}>7 dni</Button>
      </AdminListToolbar>

      <Card>
        <CardHeader>
          <CardTitle>Lista rezerwacji</CardTitle>
          <CardDescription>Pokazuje {filteredBookings.length} z {allBookings.length} rezerwacji.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Produkty</TableHead>
                <TableHead>Płatność</TableHead>
                <TableHead>Kwota</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Brak rezerwacji dla filtrów.</TableCell></TableRow>
              ) : null}
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold">{compactId(booking.id)}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{booking.customer?.name ?? "Klient"}</div>
                    <div className="text-xs text-muted-foreground">{booking.customer?.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatDateTime(booking.eventStartAt)}</div>
                    <div className="text-xs text-muted-foreground">do {formatDateTime(booking.eventEndAt)}</div>
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{itemSummary(booking.items)}</TableCell>
                  <TableCell><StatusBadge status={booking.status} /></TableCell>
                  <TableCell className="font-semibold"><Money amountGrosz={booking.totalGrosz} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" render={<Link to="/admin/bookings/$id" params={{ id: booking.id }} />}>Otwórz</Button>
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
