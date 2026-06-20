import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CalendarDays, CreditCard, Download, ImageOff, Inbox, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId, itemSummary } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const summary = useQuery(trpc.admin.dashboard.summary.queryOptions());
  const cards = summary.data?.cards;
  const latestRequests = summary.data?.latestRequests.filter((request) => Boolean(request)) ?? [];
  const latestBookings = summary.data?.latestBookings.filter((booking) => Boolean(booking)) ?? [];
  const attentionItems = [
    {
      label: "Zapytania do wyceny",
      value: cards?.pendingRequests ?? 0,
      description: "Wymagają kontaktu, korekty dojazdu albo potwierdzenia terminu.",
      to: "/admin/requests",
      tone: "primary",
    },
    {
      label: "Rezerwacje bez wpłaty",
      value: cards?.awaitingPayment ?? 0,
      description: "Sprawdź linki płatności i przelewy przed realizacją.",
      to: "/admin/payments",
      tone: "warning",
    },
    {
      label: "Produkty bez zdjęć",
      value: cards?.missingPhotos ?? 0,
      description: "Braki w galerii obniżają jakość katalogu publicznego.",
      to: "/admin/products",
      tone: "danger",
    },
    {
      label: "Powiadomienia",
      value: cards?.notifications ?? 0,
      description: "Wiadomości mock do przejrzenia lub ponownej wysyłki.",
      to: "/admin/settings",
      tone: "neutral",
    },
  ];

  return (
    <AdminShell
      title="Pulpit administratora"
      description="Najważniejsze sprawy do obsłużenia dzisiaj."
      actions={[
        {
          label: "Pobierz raport",
          icon: Download,
          variant: "outline",
          onClick: () => toast.info("Raport jest elementem makiety i nie generuje pliku."),
        },
        { label: "Nowa rezerwacja", icon: Plus, to: "/admin/bookings", variant: "default" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard
          label="Nowe zapytania"
          value={cards?.pendingRequests ?? 0}
          detail="Do ręcznej wyceny"
          icon={Inbox}
          tone="primary"
        />
        <AdminKpiCard
          label="Nadchodzące"
          value={cards?.upcomingBookings ?? 0}
          detail="Rezerwacje w kalendarzu"
          icon={CalendarDays}
          tone="neutral"
        />
        <AdminKpiCard
          label="Płatności"
          value={cards?.awaitingPayment ?? 0}
          detail="Wymagają kontroli"
          icon={CreditCard}
          tone="warning"
        />
        <AdminKpiCard
          label="Braki w zdjęciach"
          value={cards?.missingPhotos ?? 0}
          detail="Produkty bez galerii"
          icon={ImageOff}
          tone={cards?.missingPhotos ? "danger" : "neutral"}
        />
        <AdminKpiCard
          label="Powiadomienia"
          value={cards?.notifications ?? 0}
          detail="E-mail/SMS mock"
          icon={Bell}
          tone="neutral"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie zapytania</CardTitle>
            <CardDescription>Krótka lista spraw, które najczęściej wymagają decyzji operatora.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link to="/admin/requests" />}>
                Wszystkie
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Szacunek</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Brak nowych zapytań w makiecie.
                    </TableCell>
                  </TableRow>
                ) : null}
                {latestRequests.map((request) =>
                  request ? (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-semibold">{request.customer?.name ?? "Klient"}</div>
                        <div className="text-xs text-muted-foreground">{compactId(request.id)}</div>
                      </TableCell>
                      <TableCell>{request.eventDate} {request.startTime}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        <Money amountGrosz={request.totalEstimateGrosz} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" render={<Link to="/admin/requests/$id" params={{ id: request.id }} />}>
                          Otwórz
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : null,
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nadchodzące realizacje</CardTitle>
            <CardDescription>Najbliższe montaże, płatności i statusy operacyjne.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link to="/admin/calendar" />}>
                Kalendarz
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {latestBookings.length === 0 ? (
              <div className="rounded-xl bg-muted p-5 text-sm text-muted-foreground">Brak nadchodzących rezerwacji.</div>
            ) : null}
            {latestBookings.map((booking) =>
                  booking ? (
                    <Link
                      key={booking.id}
                      to="/admin/bookings/$id"
                      params={{ id: booking.id }}
                      className="flex gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-center">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">
                          {new Intl.DateTimeFormat("pl-PL", { month: "short" }).format(new Date(booking.eventStartAt))}
                        </div>
                        <div className="text-lg font-bold leading-none">{new Date(booking.eventStartAt).getDate()}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{booking.customer?.name ?? "Rezerwacja"}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(booking.eventStartAt)}</div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">{itemSummary(booking.items)}</div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </Link>
                  ) : null,
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kolejka uwagi</CardTitle>
          <CardDescription>Mała lista rzeczy, które mogą blokować sprzedaż lub realizację.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertTriangle />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold leading-none">{item.value}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <p className="mt-1 text-xs/relaxed text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
