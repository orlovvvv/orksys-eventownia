import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EstimateSummaryView } from "@/components/estimate-summary";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/reservation/$publicToken")({
  component: PublicStatusRoute,
});

function PublicStatusRoute() {
  const { publicToken } = Route.useParams();
  const [reason, setReason] = useState("Proszę o kontakt w sprawie anulowania.");
  const status = useQuery(trpc.orders.byPublicToken.queryOptions({ publicToken }));
  const cancelMutation = useMutation(
    trpc.orders.cancelRequest.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );

  if (!status.data) {
    return <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">Nie znaleziono statusu dla tokenu.</main>;
  }

  const data = status.data;
  const isBooking = status.data.kind === "booking";
  const addressLine = [data.location?.street, data.location?.addressDetails].filter(Boolean).join(", ");

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-10 md:px-6">
      <Alert>
        <AlertTitle>Status publiczny</AlertTitle>
        <AlertDescription>Link do statusu jest prywatny i nie wymaga zakładania konta.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-3xl">
            {isBooking ? "Rezerwacja" : "Zamówienie do potwierdzenia"} <StatusBadge status={data.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 text-base md:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Klient</div>
            <div>{data.customer?.name}</div>
            <div className="text-sm text-muted-foreground">{data.customer?.phone}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Lokalizacja</div>
            <div>{data.location?.city}, {data.location?.postalCode}</div>
            <div className="text-sm text-muted-foreground">{addressLine}</div>
          </div>
          {isBooking ? (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Start</div>
                <div>{formatDateTime(data.eventStartAt)}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Razem</div>
                <Money amountZloty={data.totalZloty} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Rozliczenie</div>
                <StatusBadge status={data.manualPaymentStatus} />
                {data.paidAmountZloty > 0 ? <div className="mt-1 text-sm text-muted-foreground">Wpłacono: <Money amountZloty={data.paidAmountZloty} /></div> : null}
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Data</div>
                <div>{formatDate(data.eventDate)} {data.startTime}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Produkty razem</div>
                <Money amountZloty={data.estimateSummary.itemsSubtotalZloty} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <EstimateSummaryView summary={data.estimateSummary} />
      <Card>
        <CardHeader>
          <CardTitle>Anulowanie lub zmiana</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => cancelMutation.mutate({ publicToken, reason })}>Poproś o anulowanie</Button>
            <Button variant="outline" render={<Link to="/contact" />}>Kontakt</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
