import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsRoute,
});

function AdminProductsRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const deactivate = useMutation(trpc.admin.products.deactivate.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  return (
    <AdminShell title="Produkty">
      <Card>
        <CardHeader><CardTitle>Produkty i dodatki</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Kategoria</TableHead><TableHead>Status</TableHead><TableHead>Cena</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {products.data?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.namePl}<div className="text-xs text-muted-foreground">{product.sku}</div></TableCell>
                  <TableCell>{product.category?.namePl}</TableCell>
                  <TableCell><StatusBadge status={product.active ? "active" : "inactive"} /></TableCell>
                  <TableCell><Money amountGrosz={product.pricing?.basePriceGrosz} /></TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" render={<Link to="/admin/products/$id" params={{ id: product.id }} />}>Edytuj</Button>
                    {product.active ? <Button variant="destructive" onClick={() => deactivate.mutate({ id: product.id })}>Wyłącz</Button> : null}
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
