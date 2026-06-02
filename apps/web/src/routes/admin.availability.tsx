import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/availability")({
  component: AdminAvailabilityRoute,
});

function AdminAvailabilityRoute() {
  const blocks = useQuery(trpc.admin.availabilityBlocks.list.queryOptions());
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [productId, setProductId] = useState<string>("global");
  const [startsAt, setStartsAt] = useState("2026-06-22T08:00");
  const [endsAt, setEndsAt] = useState("2026-06-22T18:00");
  const [reason, setReason] = useState("Prace serwisowe / blackout mock.");
  const createBlock = useMutation(trpc.admin.availabilityBlocks.create.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  const deleteBlock = useMutation(trpc.admin.availabilityBlocks.delete.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));

  return (
    <AdminShell title="Dostępność">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Blokady i serwis</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Od</TableHead><TableHead>Do</TableHead><TableHead>Powód</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {blocks.data?.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.product?.namePl ?? "Globalnie"}</TableCell>
                    <TableCell>{block.startsAt}</TableCell>
                    <TableCell>{block.endsAt}</TableCell>
                    <TableCell>{block.reason}</TableCell>
                    <TableCell><Button variant="destructive" onClick={() => deleteBlock.mutate({ id: block.id })}>Usuń</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Nowa blokada</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Produkt</FieldLabel>
                <select className="h-8 border bg-background px-2 text-xs" value={productId} onChange={(event) => setProductId(event.target.value)}>
                  <option value="global">Globalnie</option>
                  {products.data?.map((product) => <option key={product.id} value={product.id}>{product.namePl}</option>)}
                </select>
              </Field>
              <Field><FieldLabel>Od</FieldLabel><Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
              <Field><FieldLabel>Do</FieldLabel><Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
              <Field><FieldLabel>Powód</FieldLabel><Input value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
              <Button onClick={() => createBlock.mutate({ productId: productId === "global" ? null : productId, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), reasonType: "maintenance", reason })}>Dodaj blokadę</Button>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
