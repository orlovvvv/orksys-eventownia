import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsRoute,
});

function AdminPaymentsRoute() {
  const payments = useQuery(trpc.admin.payments.list.queryOptions());
  const markPaid = useMutation(trpc.admin.payments.markBankTransferPaid.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  const refund = useMutation(trpc.admin.payments.refund.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  return (
    <AdminShell title="Płatności">
      <Card>
        <CardHeader><CardTitle>Rekonsyliacja mock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Booking</TableHead><TableHead>Status</TableHead><TableHead>Kwota</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {payments.data?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.providerSessionId}</TableCell>
                  <TableCell>{payment.booking?.customer?.name}</TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell><Money amountGrosz={payment.amountGrosz} /></TableCell>
                  <TableCell className="flex gap-2">
                    {payment.status !== "paid" ? <Button variant="outline" onClick={() => markPaid.mutate({ id: payment.id })}>Oznacz opłacone</Button> : null}
                    {payment.status === "paid" ? <Button variant="destructive" onClick={() => refund.mutate({ id: payment.id })}>Zwrot</Button> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
