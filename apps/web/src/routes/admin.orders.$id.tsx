import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck, CheckCircle, HelpCircle, Mail, Save, Send, WalletCards, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { EstimateSummaryView } from "@/components/estimate-summary";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/orders/$id")({
  component: AdminOrderDetailRoute,
});

const manualPaymentOptions = [
  { value: "not_required", label: "Nie wymaga" },
  { value: "unpaid", label: "Nieopłacone" },
  { value: "deposit_paid", label: "Zaliczka opłacona" },
  { value: "paid", label: "Opłacone" },
];

function formatLocationAddress(location: { street?: string | null; addressDetails?: string | null; postalCode?: string | null; city?: string | null } | null | undefined) {
  if (!location) return "Brak adresu";
  return [
    [location.street, location.addressDetails].filter(Boolean).join(", "),
    [location.postalCode, location.city].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
}

function AdminOrderDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const order = useQuery(trpc.admin.orders.detail.queryOptions({ id }));
  const data = order.data;
  const availabilityItems = useMemo(
    () => data?.items.map((item) => ({ productId: item.productId, quantity: item.quantity })) ?? [],
    [data?.items],
  );
  const availability = useQuery({
    ...trpc.availability.check.queryOptions({
      items: availabilityItems,
      date: data?.eventDate ?? "2026-01-01",
      startTime: data?.startTime ?? "12:00",
      durationHours: data?.durationHours ?? 1,
    }),
    enabled: Boolean(data) && data?.kind === "pending",
  });
  const [adminNotes, setAdminNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [travelFeeZloty, setTravelFeeZloty] = useState(0);
  const [discountZloty, setDiscountZloty] = useState(0);
  const [depositRequiredZloty, setDepositRequiredZloty] = useState(0);
  const [manualPaymentStatus, setManualPaymentStatus] = useState("unpaid");
  const [paidAmountZloty, setPaidAmountZloty] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [infoMessage, setInfoMessage] = useState("Prosimy o doprecyzowanie dojazdu, podłoża i dostępu do zasilania.");
  const [declineReason, setDeclineReason] = useState("Termin lub asortyment niedostępny.");
  const [cancelReason, setCancelReason] = useState("Anulowano w panelu operatora.");
  const invalidate = () => void queryClient.invalidateQueries();
  const updateNotes = useMutation(trpc.admin.orders.updateNotes.mutationOptions({ onSuccess: () => {
    toast.success("Notatki zapisane.");
    invalidate();
  } }));
  const confirm = useMutation(trpc.admin.orders.confirm.mutationOptions({ onSuccess: (confirmedOrder) => {
    toast.success("Zamówienie potwierdzone jako rezerwacja.");
    invalidate();
    if (confirmedOrder?.id) void navigate({ to: "/admin/orders/$id", params: { id: confirmedOrder.id } });
  } }));
  const updatePayment = useMutation(trpc.admin.orders.updatePayment.mutationOptions({ onSuccess: () => {
    toast.success("Ręczne rozliczenie zapisane.");
    invalidate();
  } }));
  const cancel = useMutation(trpc.admin.orders.cancel.mutationOptions({ onSuccess: () => {
    toast.success("Zamówienie anulowane.");
    invalidate();
  } }));
  const complete = useMutation(trpc.admin.orders.complete.mutationOptions({ onSuccess: () => {
    toast.success("Rezerwacja oznaczona jako zakończona.");
    invalidate();
  } }));
  const decline = useMutation(trpc.admin.orders.decline.mutationOptions({ onSuccess: () => {
    toast.success("Zamówienie odrzucone.");
    invalidate();
  } }));
  const requestInfo = useMutation(trpc.admin.orders.requestInfo.mutationOptions({ onSuccess: () => {
    toast.success("Utworzono prośbę o informacje.");
    invalidate();
  } }));
  const sendConfirmation = useMutation(trpc.admin.bookings.sendConfirmation.mutationOptions({ onSuccess: () => {
    toast.success("Wysłano potwierdzenie.");
    invalidate();
  } }));
  const locationAddress = formatLocationAddress(data?.location);

  useEffect(() => {
    if (!data) return;
    setAdminNotes(data.adminNotes ?? "");
    setCustomerNotes(data.customerNotes ?? "");
    setTravelFeeZloty(data.travelFeeZloty ?? 0);
    setDiscountZloty(data.discountZloty ?? 0);
    setDepositRequiredZloty(data.depositRequiredZloty ?? 0);
    setManualPaymentStatus(data.manualPaymentStatus ?? "unpaid");
    setPaidAmountZloty(data.paidAmountZloty ?? 0);
    setPaymentNotes(data.paymentNotes ?? "");
  }, [data]);

  return (
    <AdminShell
      title={data?.kind === "booking" ? "Rezerwacja" : "Zamówienie"}
      description={data ? `${compactId(data.id)} · ${data.customer?.name ?? "Klient"}` : "Szczegóły zamówienia."}
      actions={[{ label: "Wróć do zamówień", icon: ArrowLeft, to: "/admin/orders", variant: "outline" }]}
    >
      {!data ? (
        <Card><CardContent>Brak danych.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{data.customer?.name ?? "Klient"}</CardTitle>
                    <CardDescription>{data.customer?.phone} · {data.customer?.email ?? "brak e-maila"}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={data.status} />
                    <StatusBadge status={data.manualPaymentStatus} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <InfoTile label="Start" value={formatDateTime(data.eventStartAt)} />
                <InfoTile label="Czas" value={`${data.durationHours}h`} />
                <InfoTile label="Lokalizacja" value={data.location?.city ?? "Brak miasta"} helper={locationAddress} />
                <InfoTile label="Razem" value={<Money amountZloty={data.totalZloty} />} emphasis />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dostępność</CardTitle>
                <CardDescription>Pending orders nie blokują stanu; potwierdzone rezerwacje blokują ten termin.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Alert variant={data.kind === "pending" && availability.data?.available === false ? "destructive" : "default"}>
                  <CalendarCheck data-icon="inline-start" />
                  <AlertTitle>
                    {data.kind === "booking"
                      ? "Potwierdzona rezerwacja blokuje ten termin"
                      : availability.data?.available
                        ? "Termin wygląda dostępnie"
                        : "Wykryto konflikt"}
                  </AlertTitle>
                  <AlertDescription>Podgląd obejmuje potwierdzone rezerwacje i blokady dostępności.</AlertDescription>
                </Alert>
                {data.kind === "pending" ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Ilość</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(availability.data?.items ?? []).map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.requestedQuantity} / {item.availableQuantity}</TableCell>
                          <TableCell><StatusBadge status={item.available ? "available" : "blocked"} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
            </Card>

            <EstimateSummaryView summary={data.estimateSummary} />

            <Card>
              <CardHeader>
                <CardTitle>Produkty i kwoty</CardTitle>
                <CardDescription>Pozycje wybrane przez klienta lub operatora.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Table>
                  <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Ilość</TableHead><TableHead>Stawka</TableHead><TableHead>Kwota</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product?.namePl ?? "Pozycja"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell><Money amountZloty={item.hourlyPriceZloty} />/h</TableCell>
                        <TableCell><Money amountZloty={item.lineTotalZloty} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="grid gap-3 md:grid-cols-4">
                  <InfoTile label="Produkty" value={<Money amountZloty={data.subtotalZloty} />} />
                  <InfoTile label="Dojazd" value={<Money amountZloty={data.travelFeeZloty} />} />
                  <InfoTile label="Rabat" value={<Money amountZloty={data.discountZloty} />} />
                  <InfoTile label="Razem" value={<Money amountZloty={data.totalZloty} />} emphasis />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warunki realizacji</CardTitle>
                <CardDescription>{data.location?.accessNotes ?? "Brak dodatkowych notatek o dostępie."}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <InfoTile label="Adres" value={locationAddress} />
                <InfoTile label="Zasilanie" value={data.location?.powerAvailable ? "Dostępne" : "Do potwierdzenia"} />
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
            <CardHeader>
              <CardTitle>Akcje</CardTitle>
              <CardDescription>Potwierdzenie, notatki i ręczne rozliczenie.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Notatki admina</FieldLabel>
                  <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Notatki klienta</FieldLabel>
                  <Textarea value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
                </Field>
                <Button variant="outline" disabled={updateNotes.isPending} onClick={() => updateNotes.mutate({ id: data.id, adminNotes, customerNotes })}>
                  <Save data-icon="inline-start" />
                  Zapisz notatki
                </Button>

                {data.kind === "pending" ? (
                  <>
                    <Field>
                      <FieldLabel>Dojazd (zł)</FieldLabel>
                      <Input type="number" value={travelFeeZloty} onChange={(event) => setTravelFeeZloty(Number(event.target.value))} />
                    </Field>
                    <Field>
                      <FieldLabel>Rabat (zł)</FieldLabel>
                      <Input type="number" value={discountZloty} onChange={(event) => setDiscountZloty(Number(event.target.value))} />
                    </Field>
                    <Field>
                      <FieldLabel>Wymagana zaliczka (zł)</FieldLabel>
                      <Input type="number" value={depositRequiredZloty} onChange={(event) => setDepositRequiredZloty(Number(event.target.value))} />
                      <FieldDescription>Rozliczenie pozostaje ręczne, bez linków online.</FieldDescription>
                    </Field>
                    <Button
                      disabled={confirm.isPending}
                      onClick={() => confirm.mutate({ id: data.id, travelFeeZloty, discountZloty, depositRequiredZloty, adminNotes })}
                    >
                      <CheckCircle data-icon="inline-start" />
                      Potwierdź rezerwację
                    </Button>
                    <Field>
                      <FieldLabel>Prośba o informacje</FieldLabel>
                      <Textarea value={infoMessage} onChange={(event) => setInfoMessage(event.target.value)} />
                    </Field>
                    <Button variant="outline" disabled={requestInfo.isPending} onClick={() => requestInfo.mutate({ id: data.id, message: infoMessage })}>
                      <HelpCircle data-icon="inline-start" />
                      Poproś o informacje
                    </Button>
                    <Field>
                      <FieldLabel>Powód odrzucenia</FieldLabel>
                      <Input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} />
                    </Field>
                    <Button variant="destructive" disabled={decline.isPending} onClick={() => decline.mutate({ id: data.id, reason: declineReason })}>
                      <XCircle data-icon="inline-start" />
                      Odrzuć
                    </Button>
                  </>
                ) : (
                  <>
                    <Field>
                      <FieldLabel>Status rozliczenia</FieldLabel>
                      <Select items={manualPaymentOptions} value={manualPaymentStatus} onValueChange={(value) => setManualPaymentStatus(String(value))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {manualPaymentOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Wpłacono (zł)</FieldLabel>
                      <Input type="number" value={paidAmountZloty} onChange={(event) => setPaidAmountZloty(Number(event.target.value))} />
                    </Field>
                    <Field>
                      <FieldLabel>Notatka rozliczenia</FieldLabel>
                      <Textarea value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} />
                    </Field>
                    <Button
                      disabled={updatePayment.isPending}
                      onClick={() => updatePayment.mutate({ id: data.id, manualPaymentStatus: manualPaymentStatus as "not_required" | "unpaid" | "deposit_paid" | "paid", paidAmountZloty, paymentNotes })}
                    >
                      <WalletCards data-icon="inline-start" />
                      Zapisz rozliczenie
                    </Button>
                    <Button variant="outline" disabled={sendConfirmation.isPending} onClick={() => sendConfirmation.mutate({ id: data.id })}>
                      <Mail data-icon="inline-start" />
                      Wyślij potwierdzenie
                    </Button>
                    <Button variant="outline" render={<Link to="/reservation/$publicToken" params={{ publicToken: data.publicToken }} />}>
                      <Send data-icon="inline-start" />
                      Strona klienta
                    </Button>
                    <Button variant="outline" disabled={complete.isPending} onClick={() => complete.mutate({ id: data.id })}>
                      <CheckCircle data-icon="inline-start" />
                      Oznacz zakończone
                    </Button>
                    <Field>
                      <FieldLabel>Powód anulowania</FieldLabel>
                      <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
                    </Field>
                    <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: data.id, reason: cancelReason })}>
                      <XCircle data-icon="inline-start" />
                      Anuluj rezerwację
                    </Button>
                  </>
                )}
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

function InfoTile({
  label,
  value,
  helper,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className={emphasis ? "mt-2 text-xl font-bold" : "mt-2 font-semibold"}>{value}</div>
      {helper ? <div className="mt-1 text-xs text-muted-foreground">{helper}</div> : null}
    </div>
  );
}
