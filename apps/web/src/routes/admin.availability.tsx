import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarX, PackageX, ShieldAlert, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { compactId, itemSummary } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/availability")({
  component: AdminAvailabilityRoute,
});

function AdminAvailabilityRoute() {
  const blocks = useQuery(trpc.admin.availabilityBlocks.list.queryOptions());
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const bookings = useQuery(trpc.admin.bookings.list.queryOptions());
  const [productId, setProductId] = useState<string>("global");
  const [startsAt, setStartsAt] = useState("2026-06-22T08:00");
  const [endsAt, setEndsAt] = useState("2026-06-22T18:00");
  const [reasonType, setReasonType] = useState<"manual" | "maintenance" | "blackout">("maintenance");
  const [reason, setReason] = useState("Prace serwisowe / blackout mock.");
  const createBlock = useMutation(trpc.admin.availabilityBlocks.create.mutationOptions({ onSuccess: () => {
    toast.success("Dodano blokadę dostępności.");
    void queryClient.invalidateQueries();
  } }));
  const deleteBlock = useMutation(trpc.admin.availabilityBlocks.delete.mutationOptions({ onSuccess: () => {
    toast.success("Usunięto blokadę.");
    void queryClient.invalidateQueries();
  } }));
  const allBlocks = blocks.data ?? [];
  const allBookings = useMemo(() => (bookings.data ?? []).flatMap((booking) => (booking ? [booking] : [])), [bookings.data]);
  const productOptions = [
    { value: "global", label: "Globalnie" },
    ...(products.data ?? []).map((product) => ({ value: product.id, label: product.namePl })),
  ];
  const reasonTypeItems = [
    { value: "maintenance", label: "Serwis" },
    { value: "blackout", label: "Blackout" },
    { value: "manual", label: "Ręczna blokada" },
  ];
  const upcomingBlocks = allBlocks.filter((block) => new Date(block.endsAt) >= new Date());
  const selectedStart = new Date(startsAt);
  const selectedEnd = new Date(endsAt);
  const impactedBookings = allBookings.filter((booking) => {
    const overlaps = new Date(booking.eventStartAt) <= selectedEnd && new Date(booking.eventEndAt) >= selectedStart;
    const productMatches = productId === "global" || booking.items.some((item) => item.productId === productId);
    return overlaps && productMatches;
  });

  function submitBlock() {
    if (!reason.trim()) {
      toast.error("Podaj powód blokady.");
      return;
    }
    if (selectedEnd <= selectedStart) {
      toast.error("Data końca musi być późniejsza niż data początku.");
      return;
    }
    createBlock.mutate({
      productId: productId === "global" ? null : productId,
      startsAt: selectedStart.toISOString(),
      endsAt: selectedEnd.toISOString(),
      reasonType,
      reason,
    });
  }

  return (
    <AdminShell title="Dostępność" description="Zarządzaj blackoutami, serwisem i blokadami konkretnych atrakcji.">
      <div className="grid gap-4 md:grid-cols-3">
        <AdminKpiCard label="Globalne" value={allBlocks.filter((block) => !block.productId).length} detail="Dla całej firmy" icon={CalendarX} tone="warning" />
        <AdminKpiCard label="Produktowe" value={allBlocks.filter((block) => block.productId).length} detail="Dla atrakcji" icon={PackageX} tone="neutral" />
        <AdminKpiCard label="Nadchodzące" value={upcomingBlocks.length} detail="Aktywne lub przyszłe" icon={ShieldAlert} tone="primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Blokady i serwis</CardTitle>
            <CardDescription>Wpisy, które wpływają na kalendarz rezerwacji.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Produkt</TableHead><TableHead>Typ</TableHead><TableHead>Od</TableHead><TableHead>Do</TableHead><TableHead>Powód</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {allBlocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-semibold">{compactId(block.id)}</TableCell>
                    <TableCell>{block.product?.namePl ?? "Globalnie"}</TableCell>
                    <TableCell><StatusBadge status={block.reasonType} /></TableCell>
                    <TableCell>{formatDateTime(block.startsAt)}</TableCell>
                    <TableCell>{formatDateTime(block.endsAt)}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal">{block.reason}</TableCell>
                    <TableCell><Button variant="destructive" size="sm" disabled={deleteBlock.isPending} onClick={() => deleteBlock.mutate({ id: block.id })}>Usuń</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nowa blokada</CardTitle>
            <CardDescription>Sprawdź wpływ przed dodaniem wpisu.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Produkt</FieldLabel>
                <Select items={productOptions} value={productId} onValueChange={(value) => setProductId(String(value))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{productOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Typ</FieldLabel>
                <Select items={reasonTypeItems} value={reasonType} onValueChange={(value) => setReasonType(String(value) as "manual" | "maintenance" | "blackout")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{reasonTypeItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field><FieldLabel>Od</FieldLabel><Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
              <Field><FieldLabel>Do</FieldLabel><Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
              <Field><FieldLabel>Powód</FieldLabel><Input value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
              <Button disabled={createBlock.isPending} onClick={submitBlock}>
                <Wrench data-icon="inline-start" />
                Dodaj blokadę
              </Button>
              <div className="rounded-xl bg-muted p-4">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Wpływ na rezerwacje</div>
                {impactedBookings.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Brak kolizji z obecnymi rezerwacjami.</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {impactedBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg bg-card p-3 text-sm">
                        <div className="font-semibold">{booking.customer?.name}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(booking.eventStartAt)} · {itemSummary(booking.items)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
