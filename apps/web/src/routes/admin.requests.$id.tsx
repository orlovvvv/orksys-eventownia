import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/requests/$id")({
  component: AdminRequestDetailRoute,
});

function AdminRequestDetailRoute() {
  const { id } = Route.useParams();
  const request = useQuery(trpc.admin.rentalRequests.detail.queryOptions({ id }));
  const [travelFeeGrosz, setTravelFeeGrosz] = useState(8000);
  const [depositRequiredGrosz, setDepositRequiredGrosz] = useState(30000);
  const [adminNotes, setAdminNotes] = useState("Dojazd i montaż potwierdzone telefonicznie.");
  const invalidate = () => queryClient.invalidateQueries();
  const adjust = useMutation(trpc.admin.rentalRequests.addQuoteAdjustment.mutationOptions({ onSuccess: invalidate }));
  const confirm = useMutation(trpc.admin.rentalRequests.confirm.mutationOptions({ onSuccess: invalidate }));
  const decline = useMutation(trpc.admin.rentalRequests.decline.mutationOptions({ onSuccess: invalidate }));
  const requestInfo = useMutation(trpc.admin.rentalRequests.requestInfo.mutationOptions({ onSuccess: invalidate }));

  const data = request.data;

  return (
    <AdminShell title="Szczegóły zapytania">
      {!data ? (
        <Card><CardContent>Brak danych.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between gap-3">{data.customer?.name}<StatusBadge status={data.status} /></CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">Telefon</div>{data.customer?.phone}</div>
                <div><div className="text-xs text-muted-foreground">E-mail</div>{data.customer?.email}</div>
                <div><div className="text-xs text-muted-foreground">Termin</div>{data.eventDate} {data.startTime}</div>
              </div>
              <div className="text-sm/relaxed text-muted-foreground">{data.location?.street}, {data.location?.postalCode} {data.location?.city}. {data.location?.accessNotes}</div>
              <Table>
                <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Ilość</TableHead><TableHead>Kwota</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.namePl}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell><Money amountGrosz={item.lineTotalGrosz} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid gap-3 md:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">Produkty</div><Money amountGrosz={data.subtotalGrosz} /></div>
                <div><div className="text-xs text-muted-foreground">Dojazd</div><Money amountGrosz={data.travelFeeGrosz} /></div>
                <div><div className="text-xs text-muted-foreground">Razem</div><Money amountGrosz={data.totalEstimateGrosz} /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Akcje admina</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field><FieldLabel>Dojazd (grosz)</FieldLabel><Input type="number" value={travelFeeGrosz} onChange={(event) => setTravelFeeGrosz(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Zaliczka (grosz)</FieldLabel><Input type="number" value={depositRequiredGrosz} onChange={(event) => setDepositRequiredGrosz(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Notatki</FieldLabel><Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} /></Field>
                <Button variant="outline" onClick={() => adjust.mutate({ id, travelFeeGrosz, adminNotes })}>Zapisz korektę</Button>
                <Button onClick={() => confirm.mutate({ id, travelFeeGrosz, depositRequiredGrosz, adminNotes, sendPaymentLink: true })}>Potwierdź i utwórz link</Button>
                <Button variant="outline" onClick={() => requestInfo.mutate({ id, message: "Prośba o więcej informacji." })}>Poproś o informacje</Button>
                <Button variant="destructive" onClick={() => decline.mutate({ id, reason: "Termin niedostępny w makiecie." })}>Odrzuć</Button>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
