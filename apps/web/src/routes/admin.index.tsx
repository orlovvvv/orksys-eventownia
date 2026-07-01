import { Button } from "@orksys-eventownia/ui/components/button";
import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CalendarDays, ImageOff, Inbox, PackageSearch, Plus, Tag, WalletCards } from "lucide-react";

import { AdminEmptyState } from "@/components/admin-empty-state";
import { AdminMetricStrip } from "@/components/admin-metric-strip";
import {
  AdminSection,
  AdminSectionActions,
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
      to: "/admin/orders",
      icon: Inbox,
      tone: "primary" as const,
    },
    {
      label: "Brak stawek godzinowych",
      value: cards?.missingPrices ?? 0,
      description: "Pozycje bez stawki blokują automatyczną wycenę.",
      to: "/admin/pricing",
      icon: Tag,
      tone: (cards?.missingPrices ?? 0) > 0 ? "danger" as const : "neutral" as const,
    },
    {
      label: "Produkty bez zdjęć",
      value: cards?.missingPhotos ?? 0,
      description: "Braki w galerii obniżają jakość katalogu publicznego.",
      to: "/admin/products",
      icon: ImageOff,
      tone: (cards?.missingPhotos ?? 0) > 0 ? "warning" as const : "neutral" as const,
    },
    {
      label: "Ręczne rozliczenia",
      value: cards?.awaitingPayment ?? 0,
      description: "Sprawdź status wpłat oznaczanych ręcznie przy rezerwacjach.",
      to: "/admin/orders",
      icon: WalletCards,
      tone: "warning" as const,
    },
  ];

  return (
    <AdminShell
      title="Pulpit administratora"
      description="Najważniejsze sprawy do obsłużenia w panelu operatora."
      actions={[{ label: "Zamówienia", icon: Plus, to: "/admin/orders", variant: "default" }]}
    >
      <AdminMetricStrip
        metrics={[
          { label: "Nowe zapytania", value: cards?.pendingRequests ?? 0, detail: "Do ręcznej wyceny", icon: Inbox, tone: "primary", to: "/admin/orders" },
          { label: "Nadchodzące", value: cards?.upcomingBookings ?? 0, detail: "Rezerwacje w kalendarzu", icon: CalendarDays, to: "/admin/calendar" },
          { label: "Brak stawek", value: cards?.missingPrices ?? 0, detail: "Wymaga cennika /h", icon: Tag, tone: (cards?.missingPrices ?? 0) > 0 ? "danger" : "neutral", to: "/admin/pricing" },
          { label: "Powiadomienia", value: cards?.notifications ?? 0, detail: "E-mail/SMS mock", icon: Bell, to: "/admin/settings" },
        ]}
      />

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>Kolejka uwagi</AdminSectionTitle>
            <AdminSectionDescription>Rzeczy, które mogą blokować sprzedaż, wycenę albo realizację.</AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => (
            <Link key={item.label} to={item.to} className="rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{item.label}</div>
                  <p className="mt-1 text-xs/relaxed text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant={item.tone === "danger" ? "destructive" : item.tone === "primary" ? "default" : item.tone === "warning" ? "secondary" : "outline"}>
                  <item.icon data-icon="inline-start" />
                  {item.value}
                </Badge>
              </div>
            </Link>
          ))}
        </AdminSectionContent>
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Ostatnie zapytania</AdminSectionTitle>
              <AdminSectionDescription>Sprawy, które najczęściej wymagają decyzji operatora.</AdminSectionDescription>
            </div>
            <AdminSectionActions>
              <Button variant="outline" size="sm" render={<Link to="/admin/orders" />}>Wszystkie</Button>
            </AdminSectionActions>
          </AdminSectionHeader>
          <AdminSectionContent className="p-0">
            {latestRequests.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState icon={Inbox} title="Brak nowych zapytań" description="W makiecie nie ma zapytań do obsłużenia." />
              </div>
            ) : (
              <>
                <div className="hidden md:block">
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
                      {latestRequests.map((request) =>
                        request ? (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="font-semibold">{request.customer?.name ?? "Klient"}</div>
                              <div className="text-xs text-muted-foreground">{compactId(request.id)}</div>
                            </TableCell>
                            <TableCell>{request.eventDate} {request.startTime}</TableCell>
                            <TableCell><StatusBadge status={request.status} /></TableCell>
                            <TableCell><Money amountZloty={request.totalEstimateZloty} /></TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" render={<Link to="/admin/orders/$id" params={{ id: request.id }} />}>Otwórz</Button>
                            </TableCell>
                          </TableRow>
                        ) : null,
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-2 p-3 md:hidden">
                  {latestRequests.map((request) =>
                    request ? (
                      <Link key={request.id} to="/admin/orders/$id" params={{ id: request.id }} className="rounded-lg border border-border/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{request.customer?.name ?? "Klient"}</div>
                            <div className="text-xs text-muted-foreground">{compactId(request.id)} · {request.eventDate} {request.startTime}</div>
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="mt-2 text-sm"><Money amountZloty={request.totalEstimateZloty} /></div>
                      </Link>
                    ) : null,
                  )}
                </div>
              </>
            )}
          </AdminSectionContent>
        </AdminSection>

        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Nadchodzące realizacje</AdminSectionTitle>
              <AdminSectionDescription>Najbliższe montaże, płatności i statusy.</AdminSectionDescription>
            </div>
            <AdminSectionActions>
              <Button variant="outline" size="sm" render={<Link to="/admin/calendar" />}>Kalendarz</Button>
            </AdminSectionActions>
          </AdminSectionHeader>
          <AdminSectionContent className="flex flex-col gap-2">
            {latestBookings.length === 0 ? (
              <AdminEmptyState icon={PackageSearch} title="Brak realizacji" description="Nie ma nadchodzących rezerwacji w makiecie." />
            ) : null}
            {latestBookings.map((booking) =>
              booking ? (
                <Link
                  key={booking.id}
                  to="/admin/orders/$id"
                  params={{ id: booking.id }}
                  className="rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{booking.customer?.name ?? "Rezerwacja"}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(booking.eventStartAt)}</div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-2 truncate text-xs text-muted-foreground">{itemSummary(booking.items)}</div>
                </Link>
              ) : null,
            )}
          </AdminSectionContent>
        </AdminSection>
      </div>

      {(cards?.missingPrices ?? 0) > 0 ? (
        <AdminSection>
          <AdminSectionContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 text-destructive" />
              <div>
                <div className="font-semibold">Część produktów nie ma stawki godzinowej.</div>
                <p className="text-sm text-muted-foreground">Zapytania z tymi pozycjami przechodzą w tryb ręcznej wyceny.</p>
              </div>
            </div>
            <Button variant="outline" render={<Link to="/admin/pricing" />}>Uzupełnij cennik</Button>
          </AdminSectionContent>
        </AdminSection>
      ) : null}
    </AdminShell>
  );
}
