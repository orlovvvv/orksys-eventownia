import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricingRoute,
});

function AdminPricingRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  return (
    <AdminShell title="Cennik">
      <Card>
        <CardHeader><CardTitle>Reguły cenowe</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Produkt</TableHead><TableHead>Tryb</TableHead><TableHead>Cena</TableHead><TableHead>Czas</TableHead><TableHead>Extra</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.data?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.namePl}</TableCell>
                  <TableCell>{product.pricing?.quoteMode}</TableCell>
                  <TableCell><Money amountGrosz={product.pricing?.basePriceGrosz} /></TableCell>
                  <TableCell>{product.pricing?.baseHours ?? "manual"}h</TableCell>
                  <TableCell>{product.pricing?.extraHourPercent ?? 20}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
