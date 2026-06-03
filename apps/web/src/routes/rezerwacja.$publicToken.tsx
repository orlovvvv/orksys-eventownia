import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/rezerwacja/$publicToken")({
  component: PublicStatusRoute,
});

function PublicStatusRoute() {
  const { publicToken } = Route.useParams();
  const [reason, setReason] = useState("Proszę o kontakt w sprawie anulowania.");
  const status = useQuery(trpc.rentalRequests.byPublicToken.queryOptions({ publicToken }));
  const cancelMutation = useMutation(
    trpc.rentalRequests.cancelRequest.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    }),
  );

  if (!status.data) {
    return <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">Nie znaleziono statusu dla tokenu.</main>;
  }

  const data = status.data.data;
  const isBooking = status.data.type === "booking";

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-10 md:px-6">
      <Alert>
        <AlertTitle>Status publiczny</AlertTitle>
        <AlertDescription>Link do statusu jest prywatny i nie wymaga zakładania konta.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-3xl">
            {isBooking ? "Rezerwacja" : "Zapytanie"} <StatusBadge status={data.status} />
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
            <div className="text-sm text-muted-foreground">{data.location?.street}</div>
          </div>
          {"eventStartAt" in data ? (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Start</div>
                <div>{formatDateTime(data.eventStartAt)}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Razem</div>
                <Money amountGrosz={data.totalGrosz} />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Data</div>
                <div>{data.eventDate} {data.startTime}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Wstępna wycena</div>
                <Money amountGrosz={data.totalEstimateGrosz} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Anulowanie lub zmiana</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => cancelMutation.mutate({ publicToken, reason })}>Poproś o anulowanie</Button>
            <Button variant="outline" render={<Link to="/kontakt" />}>Kontakt</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
