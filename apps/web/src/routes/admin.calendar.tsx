import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Separator } from "@orksys-eventownia/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { compactId, itemSummary } from "@/lib/admin-status";
import { formatDate, formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/calendar")({
  component: AdminCalendarRoute,
});

function AdminCalendarRoute() {
  const calendar = useQuery(trpc.admin.calendar.list.queryOptions());
  const blocks = useQuery(trpc.admin.availabilityBlocks.list.queryOptions());
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()));
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBlocks, setShowBlocks] = useState(true);
  const bookings = useMemo(() => (calendar.data ?? []).flatMap((booking) => (booking ? [booking] : [])), [calendar.data]);
  const availabilityBlocks = blocks.data ?? [];
  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const product of products.data ?? []) {
      if (product.category) unique.set(product.category.slug, product.category.namePl);
    }
    return Array.from(unique, ([slug, namePl]) => ({ slug, namePl }));
  }, [products.data]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        booking.items.some((item) => item.product?.category?.slug === categoryFilter);
      return matchesStatus && matchesCategory;
    });
  }, [bookings, categoryFilter, statusFilter]);
  const filteredBlocks = useMemo(() => {
    if (!showBlocks) return [];
    return availabilityBlocks.filter((block) => {
      if (categoryFilter === "all") return true;
      return block.product?.category?.slug === categoryFilter;
    });
  }, [availabilityBlocks, categoryFilter, showBlocks]);
  const selectedBookings = filteredBookings.filter((booking) => toDateKey(new Date(booking.eventStartAt)) === selectedDay);
  const selectedBlocks = filteredBlocks.filter((block) => doesRangeOverlapDay(selectedDay, block.startsAt, block.endsAt));

  return (
    <AdminShell
      title="Kalendarz rezerwacji"
      description="Miesięczny widok realizacji, blokad i prac serwisowych."
      actions={[{ label: "Zamówienia", icon: Plus, to: "/admin/orders" }]}
    >
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle>Filtry</CardTitle>
            <CardDescription>Zawęź kalendarz do kategorii i statusów.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Kategorie</div>
              <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter("all")}>
                Wszystkie
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.slug}
                  variant={categoryFilter === category.slug ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => setCategoryFilter(category.slug)}
                >
                  {category.namePl}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</div>
              <Button variant={statusFilter === "all" ? "secondary" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Wszystkie</Button>
              <Button variant={statusFilter === "confirmed" ? "secondary" : "outline"} size="sm" onClick={() => setStatusFilter("confirmed")}>Potwierdzone</Button>
              <Button variant={statusFilter === "completed" ? "secondary" : "outline"} size="sm" onClick={() => setStatusFilter("completed")}>Zakończone</Button>
            </div>
            <label className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm">
              <Checkbox checked={showBlocks} onCheckedChange={(checked) => setShowBlocks(checked === true)} />
              Pokaż blokady i serwis
            </label>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(visibleMonth)}</CardTitle>
                  <CardDescription>{filteredBookings.length} rezerwacji · {filteredBlocks.length} blokad</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Poprzedni miesiąc">
                    <ChevronLeft />
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const today = new Date();
                    today.setDate(1);
                    setVisibleMonth(today);
                    setSelectedDay(toDateKey(new Date()));
                  }}>
                    Dzisiaj
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Następny miesiąc">
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[760px] overflow-hidden rounded-2xl border border-border/70">
                <div className="grid grid-cols-7 bg-muted">
                  {["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"].map((day) => (
                    <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 bg-border/70">
                  {monthCells.map((cell, index) => {
                    const cellBookings = filteredBookings.filter((booking) => toDateKey(new Date(booking.eventStartAt)) === cell.key);
                    const cellBlocks = filteredBlocks.filter((block) => doesRangeOverlapDay(cell.key, block.startsAt, block.endsAt));
                    const selected = selectedDay === cell.key;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => setSelectedDay(cell.key)}
                        className={[
                          "min-h-32 bg-card p-2 text-left transition-colors hover:bg-muted/60",
                          index === 35 ? "rounded-bl-2xl" : "",
                          index === 41 ? "rounded-br-2xl" : "",
                          selected ? "ring-2 ring-primary ring-inset" : "",
                          cell.inMonth ? "" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={cell.isToday ? "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" : "text-sm font-semibold"}>
                            {cell.date.getDate()}
                          </span>
                          {cellBookings.length + cellBlocks.length > 2 ? <span className="text-xs text-muted-foreground">+{cellBookings.length + cellBlocks.length}</span> : null}
                        </div>
                        <div className="flex flex-col gap-1">
                          {cellBookings.slice(0, 2).map((booking) => (
                            <div key={booking.id} className="truncate rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                              {booking.customer?.name ?? "Rezerwacja"}
                            </div>
                          ))}
                          {cellBlocks.slice(0, 1).map((block) => (
                            <div key={block.id} className="truncate rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                              {block.reasonType === "blackout" ? "Blokada" : "Serwis"}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{formatDate(selectedDay)}</CardTitle>
              <CardDescription>Rezerwacje i blokady w wybranym dniu.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {selectedBookings.length === 0 && selectedBlocks.length === 0 ? (
                <div className="rounded-xl bg-muted p-5 text-sm text-muted-foreground md:col-span-2">
                  Brak zaplanowanych wpisów dla tego dnia.
                </div>
              ) : null}
              {selectedBookings.map((booking) => (
                <Link key={booking.id} to="/admin/orders/$id" params={{ id: booking.id }} className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{booking.customer?.name ?? "Rezerwacja"}</div>
                      <div className="text-xs text-muted-foreground">{compactId(booking.id)} · {formatDateTime(booking.eventStartAt)}</div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">{itemSummary(booking.items)}</div>
                </Link>
              ))}
              {selectedBlocks.map((block) => (
                <div key={block.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{block.product?.namePl ?? "Globalna blokada"}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(block.startsAt)} - {formatDateTime(block.endsAt)}</div>
                    </div>
                    <Badge variant="destructive"><Filter data-icon="inline-start" />{block.reasonType}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">{block.reason}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  next.setDate(1);
  return next;
}

function buildMonthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  const todayKey = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    return {
      date,
      key,
      inMonth: date.getMonth() === month.getMonth(),
      isToday: key === todayKey,
    };
  });
}

function doesRangeOverlapDay(dayKey: string, startsAt: string, endsAt: string) {
  const dayStart = new Date(`${dayKey}T00:00:00`);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(dayStart.getDate() + 1);

  return new Date(startsAt) < nextDayStart && new Date(endsAt) > dayStart;
}
