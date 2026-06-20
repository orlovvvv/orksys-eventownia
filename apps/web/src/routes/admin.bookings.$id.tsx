import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, FileText, Mail, Save, Send, WalletCards, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/bookings/$id")({
  component: AdminBookingDetailRoute,
});

function AdminBookingDetailRoute() {
  const { id } = Route.useParams();
  const booking = useQuery(trpc.admin.bookings.detail.queryOptions({ id }));
  const [paymentAmount, setPaymentAmount] = useState(30000);
  const [adminNotes, setAdminNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const invalidate = () => void queryClient.invalidateQueries();
  const update = useMutation(trpc.admin.bookings.update.mutationOptions({ onSuccess: () => {
    toast.success("Notatki rezerwacji zapisane.");
    invalidate();
  } }));
  const complete = useMutation(trpc.admin.bookings.complete.mutationOptions({ onSuccess: () => {
    toast.success("Rezerwacja oznaczona jako zakończona.");
    invalidate();
  } }));
  const cancel = useMutation(trpc.admin.bookings.cancel.mutationOptions({ onSuccess: () => {
    toast.success("Rezerwacja anulowana w makiecie.");
    invalidate();
  } }));
  const paymentLink = useMutation(trpc.admin.bookings.createPaymentLink.mutationOptions({ onSuccess: () => {
    toast.success("Utworzono mock link płatności.");
    invalidate();
  } }));
  const sendConfirmation = useMutation(trpc.admin.bookings.sendConfirmation.mutationOptions({ onSuccess: () => {
    toast.success("Wysłano mock potwierdzenie.");
    invalidate();
  } }));
  const generateContract = useMutation(trpc.admin.bookings.generateContract.mutationOptions({ onSuccess: () => {
    toast.success("Wygenerowano mock umowę.");
    invalidate();
  } }));
  const markPaid = useMutation(trpc.payments.mockCheckoutResult.mutationOptions({ onSuccess: () => {
    toast.success("Płatność oznaczona jako opłacona.");
    invalidate();
  } }));

  const data = booking.data;

  useEffect(() => {
    if (!data) return;
    setAdminNotes(data.adminNotes ?? "");
    setCustomerNotes(data.customerNotes ?? "");
    setPaymentAmount(data.depositRequiredGrosz || 30000);
  }, [data]);

  return (
    <AdminShell
      title="Szczegóły rezerwacji"
      description={data ? `${compactId(data.id)} · ${data.customer?.name ?? "Klient"}` : "Obsługa rezerwacji i płatności."}
      actions={[{ label: "Wróć do rezerwacji", icon: ArrowLeft, to: "/admin/bookings", variant: "outline" }]}
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
              <CardContent className="grid gap-3 md:grid-cols-4">
                <InfoTile label="Start" value={formatDateTime(data.eventStartAt)} />
                <InfoTile label="Koniec" value={formatDateTime(data.eventEndAt)} />
                <InfoTile label="Montaż" value={formatDateTime(data.setupStartAt)} />
                <InfoTile label="Razem" value={<Money amountGrosz={data.totalGrosz} />} emphasis />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adres i operacje</CardTitle>
                <CardDescription>{data.location?.street}, {data.location?.postalCode} {data.location?.city}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <InfoTile label="Dostęp" value={data.location?.accessNotes ?? "Brak notatek"} />
                <InfoTile label="Podłoże" value={data.location?.surfaceType ?? "Do potwierdzenia"} />
                <InfoTile label="Zasilanie" value={data.location?.powerAvailable ? "Dostępne" : "Do potwierdzenia"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produkty</CardTitle>
                <CardDescription>Pozycje do przygotowania na realizację.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Ilość</TableHead><TableHead>Cena</TableHead><TableHead>Kwota</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product?.namePl}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell><Money amountGrosz={item.unitPriceGrosz} /></TableCell>
                        <TableCell><Money amountGrosz={item.lineTotalGrosz} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Płatności</CardTitle>
                <CardDescription>Zaliczki i linki płatności w makiecie.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Płatność</TableHead><TableHead>Cel</TableHead><TableHead>Status</TableHead><TableHead>Kwota</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {data.payments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Brak płatności.</TableCell></TableRow>
                    ) : null}
                    {data.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.providerSessionId ?? compactId(payment.id)}</TableCell>
                        <TableCell><StatusBadge status={payment.purpose} /></TableCell>
                        <TableCell><StatusBadge status={payment.status} /></TableCell>
                        <TableCell><Money amountGrosz={payment.amountGrosz} /></TableCell>
                        <TableCell className="text-right">
                          {payment.status !== "paid" ? (
                            <Button variant="outline" size="sm" disabled={markPaid.isPending} onClick={() => markPaid.mutate({ paymentId: payment.id, result: "paid" })}>
                              Oznacz opłacone
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dokumenty i powiadomienia</CardTitle>
                <CardDescription>Historia komunikacji związanej z rezerwacją.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <InfoTile label="Umowy" value={data.generatedDocuments.length} helper={data.generatedDocuments[0]?.r2Key ?? "Brak wygenerowanej umowy"} />
                <InfoTile label="Powiadomienia" value={data.notifications.length} helper={data.notifications[0]?.templateKey ?? "Brak wysyłek"} />
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
            <CardHeader>
              <CardTitle>Akcje rezerwacji</CardTitle>
              <CardDescription>Płatności, dokumenty, notatki i status realizacji.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Kwota linku płatności (grosz)</FieldLabel>
                  <Input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} />
                </Field>
                <Button disabled={paymentLink.isPending} onClick={() => paymentLink.mutate({ id, amountGrosz: paymentAmount })}>
                  <WalletCards data-icon="inline-start" />
                  Utwórz link płatności
                </Button>
                <Button variant="outline" disabled={sendConfirmation.isPending} onClick={() => sendConfirmation.mutate({ id })}>
                  <Mail data-icon="inline-start" />
                  Wyślij potwierdzenie
                </Button>
                <Button variant="outline" disabled={generateContract.isPending} onClick={() => generateContract.mutate({ id })}>
                  <FileText data-icon="inline-start" />
                  Generuj umowę
                </Button>
                <Button variant="outline" render={<Link to="/rezerwacja/$publicToken" params={{ publicToken: data.publicToken }} />}>
                  <Send data-icon="inline-start" />
                  Strona klienta
                </Button>
                <Field>
                  <FieldLabel>Notatki admina</FieldLabel>
                  <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Notatki klienta</FieldLabel>
                  <Textarea value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
                </Field>
                <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id, adminNotes, customerNotes })}>
                  <Save data-icon="inline-start" />
                  Zapisz notatki
                </Button>
                <Button variant="outline" disabled={complete.isPending} onClick={() => complete.mutate({ id })}>
                  <CheckCircle data-icon="inline-start" />
                  Oznacz zakończone
                </Button>
                <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate({ id, reason: "Anulowano w panelu mock." })}>
                  <XCircle data-icon="inline-start" />
                  Anuluj rezerwację
                </Button>
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
