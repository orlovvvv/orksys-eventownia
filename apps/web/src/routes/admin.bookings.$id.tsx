import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/bookings/$id")({
  component: AdminBookingDetailRoute,
});

function AdminBookingDetailRoute() {
  const { id } = Route.useParams();
  const booking = useQuery(trpc.admin.bookings.detail.queryOptions({ id }));
  const [paymentAmount, setPaymentAmount] = useState(30000);
  const invalidate = () => queryClient.invalidateQueries();
  const complete = useMutation(trpc.admin.bookings.complete.mutationOptions({ onSuccess: invalidate }));
  const cancel = useMutation(trpc.admin.bookings.cancel.mutationOptions({ onSuccess: invalidate }));
  const paymentLink = useMutation(trpc.admin.bookings.createPaymentLink.mutationOptions({ onSuccess: invalidate }));
  const sendConfirmation = useMutation(trpc.admin.bookings.sendConfirmation.mutationOptions({ onSuccess: invalidate }));
  const generateContract = useMutation(trpc.admin.bookings.generateContract.mutationOptions({ onSuccess: invalidate }));
  const markPaid = useMutation(trpc.payments.mockCheckoutResult.mutationOptions({ onSuccess: invalidate }));

  const data = booking.data;

  return (
    <AdminShell title="Szczegóły rezerwacji">
      {!data ? (
        <Card><CardContent>Brak danych.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between gap-3">{data.customer?.name}<StatusBadge status={data.status} /></CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">Start</div>{formatDateTime(data.eventStartAt)}</div>
                <div><div className="text-xs text-muted-foreground">Koniec</div>{formatDateTime(data.eventEndAt)}</div>
                <div><div className="text-xs text-muted-foreground">Razem</div><Money amountGrosz={data.totalGrosz} /></div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Ilość</TableHead><TableHead>Kwota</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}><TableCell>{item.product?.namePl}</TableCell><TableCell>{item.quantity}</TableCell><TableCell><Money amountGrosz={item.lineTotalGrosz} /></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <Table>
                <TableHeader><TableRow><TableHead>Płatność</TableHead><TableHead>Status</TableHead><TableHead>Kwota</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {data.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.providerSessionId}</TableCell>
                      <TableCell><StatusBadge status={payment.status} /></TableCell>
                      <TableCell><Money amountGrosz={payment.amountGrosz} /></TableCell>
                      <TableCell>{payment.status !== "paid" ? <Button variant="outline" onClick={() => markPaid.mutate({ paymentId: payment.id, result: "paid" })}>Mock paid</Button> : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Akcje</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} />
              <Button onClick={() => paymentLink.mutate({ id, amountGrosz: paymentAmount })}>Utwórz link płatności</Button>
              <Button variant="outline" onClick={() => sendConfirmation.mutate({ id })}>Wyślij potwierdzenie</Button>
              <Button variant="outline" onClick={() => generateContract.mutate({ id })}>Generuj umowę</Button>
              <Button variant="outline" onClick={() => complete.mutate({ id })}>Oznacz jako zakończone</Button>
              <Button variant="destructive" onClick={() => cancel.mutate({ id, reason: "Anulowano w panelu mock." })}>Anuluj</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
