import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { ToggleGroup, ToggleGroupItem } from "@orksys-eventownia/ui/components/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminDataToolbar } from "@/components/admin-data-toolbar";
import { AdminEmptyState } from "@/components/admin-empty-state";
import {
  AdminSection,
  AdminSectionActions,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
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
      <AdminDataToolbar
        actions={
          <label className="flex h-8 items-center gap-2 rounded-md border border-border/70 px-3 text-xs font-semibold">
            <Checkbox checked={showBlocks} onCheckedChange={(checked) => setShowBlocks(checked === true)} />
            Blokady
          </label>
        }
      >
        <Select
          items={[{ value: "all", label: "Kategoria: Wszystkie" }, ...categories.map((category) => ({ value: category.slug, label: category.namePl }))]}
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(String(value))}
        >
          <SelectTrigger size="sm" className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Kategoria: Wszystkie</SelectItem>
              {categories.map((category) => <SelectItem key={category.slug} value={category.slug}>{category.namePl}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
        <ToggleGroup value={[statusFilter]} onValueChange={(value) => value[0] ? setStatusFilter(String(value[0])) : undefined} spacing={1} className="flex-wrap">
          <ToggleGroupItem value="all" variant="outline" size="sm">Wszystkie</ToggleGroupItem>
          <ToggleGroupItem value="confirmed" variant="outline" size="sm">Potwierdzone</ToggleGroupItem>
          <ToggleGroupItem value="completed" variant="outline" size="sm">Zakończone</ToggleGroupItem>
        </ToggleGroup>
      </AdminDataToolbar>

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>{new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(visibleMonth)}</AdminSectionTitle>
            <AdminSectionDescription>{filteredBookings.length} rezerwacji · {filteredBlocks.length} blokad</AdminSectionDescription>
          </div>
          <AdminSectionActions>
            <Button variant="outline" size="icon-sm" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Poprzedni miesiąc">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const today = new Date();
              today.setDate(1);
              setVisibleMonth(today);
              setSelectedDay(toDateKey(new Date()));
            }}>
              Dzisiaj
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Następny miesiąc">
              <ChevronRight />
            </Button>
          </AdminSectionActions>
        </AdminSectionHeader>
        <AdminSectionContent>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-lg border border-border/70">
              <div className="grid grid-cols-7 bg-muted">
                {["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"].map((day) => (
                  <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-border/70">
                {monthCells.map((cell) => {
                  const cellBookings = filteredBookings.filter((booking) => toDateKey(new Date(booking.eventStartAt)) === cell.key);
                  const cellBlocks = filteredBlocks.filter((block) => doesRangeOverlapDay(cell.key, block.startsAt, block.endsAt));
                  const selected = selectedDay === cell.key;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDay(cell.key)}
                      className={[
                        "min-h-28 bg-card p-2 text-left transition-colors hover:bg-muted/60",
                        selected ? "ring-2 ring-primary ring-inset" : "",
                        cell.inMonth ? "" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={cell.isToday ? "flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground" : "text-sm font-semibold"}>
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
          </div>

          <div className="grid gap-2 md:hidden">
            {filteredBookings.length === 0 && filteredBlocks.length === 0 ? (
              <AdminEmptyState icon={Filter} title="Brak wpisów" description="Nie ma rezerwacji ani blokad dla wybranych filtrów." />
            ) : null}
            {filteredBookings.slice(0, 20).map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
            {filteredBlocks.slice(0, 20).map((block) => (
              <BlockRow key={block.id} block={block} />
            ))}
          </div>
        </AdminSectionContent>
      </AdminSection>

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>{formatDate(selectedDay)}</AdminSectionTitle>
            <AdminSectionDescription>Rezerwacje i blokady w wybranym dniu.</AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="grid gap-3 md:grid-cols-2">
          {selectedBookings.length === 0 && selectedBlocks.length === 0 ? (
            <div className="md:col-span-2">
              <AdminEmptyState icon={Filter} title="Brak wpisów" description="Nie ma zaplanowanych wpisów dla tego dnia." />
            </div>
          ) : null}
          {selectedBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
          {selectedBlocks.map((block) => <BlockRow key={block.id} block={block} />)}
        </AdminSectionContent>
      </AdminSection>
    </AdminShell>
  );
}

type CalendarBooking = {
  id: string;
  customer?: { name?: string | null } | null;
  eventStartAt: string;
  status: string;
  items: Array<{ product?: { namePl: string } | null; quantity?: number }>;
};

function BookingRow({ booking }: { booking: CalendarBooking }) {
  return (
    <Link key={booking.id} to="/admin/orders/$id" params={{ id: booking.id }} className="rounded-lg border border-border/70 p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{booking.customer?.name ?? "Rezerwacja"}</div>
          <div className="text-xs text-muted-foreground">{compactId(booking.id)} · {formatDateTime(booking.eventStartAt)}</div>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{itemSummary(booking.items)}</div>
    </Link>
  );
}

function BlockRow({ block }: { block: { id: string; startsAt: string; endsAt: string; reasonType: string; reason: string; product?: { namePl: string } | null } }) {
  return (
    <div key={block.id} className="rounded-lg border border-border/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{block.product?.namePl ?? "Globalna blokada"}</div>
          <div className="text-xs text-muted-foreground">{formatDateTime(block.startsAt)} - {formatDateTime(block.endsAt)}</div>
        </div>
        <Badge variant="destructive"><Filter data-icon="inline-start" />{block.reasonType}</Badge>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{block.reason}</div>
    </div>
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
