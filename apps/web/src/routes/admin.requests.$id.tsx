import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, HelpCircle, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/requests/$id")({
  component: AdminRequestDetailRoute,
});

function AdminRequestDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const request = useQuery(trpc.admin.rentalRequests.detail.queryOptions({ id }));
  const [travelFeeGrosz, setTravelFeeGrosz] = useState(0);
  const [discountGrosz, setDiscountGrosz] = useState(0);
  const [depositRequiredGrosz, setDepositRequiredGrosz] = useState(30000);
  const [sendPaymentLink, setSendPaymentLink] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [infoMessage, setInfoMessage] = useState("Prosimy o doprecyzowanie dojazdu, podłoża i dostępu do zasilania.");
  const [declineReason, setDeclineReason] = useState("Termin lub asortyment niedostępny.");
  const invalidate = () => void queryClient.invalidateQueries();
  const adjust = useMutation(trpc.admin.rentalRequests.addQuoteAdjustment.mutationOptions({ onSuccess: () => {
    toast.success("Korekta wyceny zapisana.");
    invalidate();
  } }));
  const confirm = useMutation(trpc.admin.rentalRequests.confirm.mutationOptions({ onSuccess: (booking) => {
    toast.success("Zapytanie potwierdzone i zamienione w rezerwację.");
    invalidate();
    if (booking?.id) {
      void navigate({ to: "/admin/bookings/$id", params: { id: booking.id } });
    }
  } }));
  const decline = useMutation(trpc.admin.rentalRequests.decline.mutationOptions({ onSuccess: () => {
    toast.success("Zapytanie oznaczone jako odrzucone.");
    invalidate();
  } }));
  const requestInfo = useMutation(trpc.admin.rentalRequests.requestInfo.mutationOptions({ onSuccess: () => {
    toast.success("Utworzono mock prośbę o informacje.");
    invalidate();
  } }));

  const data = request.data;

  useEffect(() => {
    if (!data) return;
    setTravelFeeGrosz(data.travelFeeGrosz ?? 0);
    setDiscountGrosz(data.discountGrosz ?? 0);
    setAdminNotes(data.adminNotes ?? "Dojazd, montaż i warunki techniczne do potwierdzenia.");
  }, [data]);

  return (
    <AdminShell
      title="Szczegóły zapytania"
      description={data ? `${compactId(data.id)} · ${data.customer?.name ?? "Klient"}` : "Decyzja i wycena zapytania klienta."}
      actions={[{ label: "Wróć do zapytań", icon: ArrowLeft, to: "/admin/requests", variant: "outline" }]}
    >
      {!data ? (
        <Card><CardContent>Brak danych.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{data.customer?.name ?? "Klient"}</CardTitle>
                    <CardDescription>{data.customer?.phone} · {data.customer?.email ?? "brak e-maila"}</CardDescription>
                  </div>
                  <StatusBadge status={data.status} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <InfoTile label="Termin" value={`${data.eventDate} ${data.startTime}`} helper={`${data.durationHours}h wydarzenia`} />
                <InfoTile label="Lokalizacja" value={`${data.location?.city ?? "Brak miasta"}`} helper={`${data.location?.street ?? ""}, ${data.location?.postalCode ?? ""}`} />
                <InfoTile label="Źródło" value={data.source === "website" ? "Strona publiczna" : "Panel admina"} helper={formatDateTime(data.createdAt)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warunki realizacji</CardTitle>
                <CardDescription>{data.location?.accessNotes ?? "Brak dodatkowych notatek o dostępie."}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <InfoTile label="Powierzchnia" value={data.location?.surfaceType ?? "Do potwierdzenia"} />
                <InfoTile label="Zasilanie" value={data.location?.powerAvailable ? "Dostępne" : "Do potwierdzenia"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produkty i wycena</CardTitle>
                <CardDescription>Pozycje z koszyka klienta oraz korekty operatora.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Ilość</TableHead>
                      <TableHead>Tryb</TableHead>
                      <TableHead>Kwota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product?.namePl}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell><StatusBadge status={item.quoteMode} /></TableCell>
                        <TableCell><Money amountGrosz={item.lineTotalGrosz} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="grid gap-3 md:grid-cols-4">
                  <InfoTile label="Produkty" value={<Money amountGrosz={data.subtotalGrosz} />} />
                  <InfoTile label="Dojazd" value={<Money amountGrosz={data.travelFeeGrosz} />} />
                  <InfoTile label="Rabat" value={<Money amountGrosz={data.discountGrosz} />} />
                  <InfoTile label="Razem" value={<Money amountGrosz={data.totalEstimateGrosz} />} emphasis />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wiadomość i notatki</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-muted p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Wiadomość klienta</div>
                  <p className="mt-2 text-sm/relaxed">{data.message ?? "Klient nie dodał wiadomości."}</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Notatka admina</div>
                  <p className="mt-2 text-sm/relaxed">{data.adminNotes ?? "Brak notatki."}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
            <CardHeader>
              <CardTitle>Decyzja operatora</CardTitle>
              <CardDescription>Ustal dojazd, zaliczkę i finalny status zapytania.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Dojazd (grosz)</FieldLabel>
                  <Input type="number" value={travelFeeGrosz} onChange={(event) => setTravelFeeGrosz(Number(event.target.value))} />
                  <FieldDescription>Kwota doliczana do zamówienia.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Rabat (grosz)</FieldLabel>
                  <Input type="number" value={discountGrosz} onChange={(event) => setDiscountGrosz(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Zaliczka (grosz)</FieldLabel>
                  <Input type="number" value={depositRequiredGrosz} onChange={(event) => setDepositRequiredGrosz(Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Notatki admina</FieldLabel>
                  <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
                </Field>
                <label className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm">
                  <Checkbox checked={sendPaymentLink} onCheckedChange={(checked) => setSendPaymentLink(checked === true)} />
                  Utwórz mock link płatności po potwierdzeniu
                </label>
                <Button
                  variant="outline"
                  disabled={adjust.isPending}
                  onClick={() => adjust.mutate({ id, travelFeeGrosz, discountGrosz, adminNotes })}
                >
                  <Save data-icon="inline-start" />
                  Zapisz korektę
                </Button>
                <Button
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate({ id, travelFeeGrosz, depositRequiredGrosz, adminNotes, sendPaymentLink })}
                >
                  <CheckCircle data-icon="inline-start" />
                  Potwierdź rezerwację
                </Button>
                <Field>
                  <FieldLabel>Prośba o informacje</FieldLabel>
                  <Textarea value={infoMessage} onChange={(event) => setInfoMessage(event.target.value)} />
                </Field>
                <Button variant="outline" disabled={requestInfo.isPending} onClick={() => requestInfo.mutate({ id, message: infoMessage })}>
                  <HelpCircle data-icon="inline-start" />
                  Poproś o informacje
                </Button>
                <Field>
                  <FieldLabel>Powód odrzucenia</FieldLabel>
                  <Input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} />
                </Field>
                <Button variant="destructive" disabled={decline.isPending} onClick={() => decline.mutate({ id, reason: declineReason })}>
                  <XCircle data-icon="inline-start" />
                  Odrzuć
                </Button>
                <Button variant="ghost" render={<Link to="/admin/requests" />}>Wróć do listy</Button>
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
