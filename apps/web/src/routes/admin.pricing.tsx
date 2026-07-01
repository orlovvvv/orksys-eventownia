import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign, Edit, Save, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { productMetrics } from "@/lib/admin-metrics";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricingRoute,
});

function AdminPricingRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hourlyPriceZloty, setHourlyPriceZloty] = useState(0);
  const [depositAmountZloty, setDepositAmountZloty] = useState<number | null>(300);
  const updatePricing = useMutation(trpc.admin.products.updatePricing.mutationOptions({ onSuccess: () => {
    toast.success("Reguła cenowa zapisana.");
    setEditingId(null);
    void queryClient.invalidateQueries();
  } }));
  const allProducts = products.data ?? [];
  const metrics = productMetrics(allProducts);

  function beginEdit(product: (typeof allProducts)[number]) {
    setEditingId(product.id);
    setHourlyPriceZloty(product.pricing?.hourlyPriceZloty ?? 0);
    setDepositAmountZloty(product.pricing?.depositAmountZloty ?? null);
  }

  return (
    <AdminShell title="Cennik" description="Zarządzaj godzinowymi stawkami produktów.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Pozycje" value={metrics.allCount} detail="Produkty i dodatki" icon={CircleDollarSign} tone="neutral" />
        <AdminKpiCard label="Ze stawką" value={metrics.allCount - metrics.missingPriceCount} detail="Gotowe do wyceny godzinowej" icon={CircleDollarSign} tone="primary" />
        <AdminKpiCard label="Bez stawki" value={metrics.missingPriceCount} detail="Wymagają uwagi" icon={TriangleAlert} tone="danger" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reguły cenowe</CardTitle>
          <CardDescription>Edytuj jedną pozycję naraz. Wszystkie zmiany pozostają w mock state.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Stawka godzinowa</TableHead>
                <TableHead>Zaliczka</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-semibold">{product.namePl}</div>
                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                  </TableCell>
                  <TableCell>{product.category?.namePl}</TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-32" type="number" min={0} value={hourlyPriceZloty} onChange={(event) => setHourlyPriceZloty(Number(event.target.value))} />
                    ) : (
                      <><Money amountZloty={product.pricing?.hourlyPriceZloty} />/h</>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-32" type="number" value={depositAmountZloty ?? ""} onChange={(event) => setDepositAmountZloty(event.target.value ? Number(event.target.value) : null)} />
                    ) : (
                      <Money amountZloty={product.pricing?.depositAmountZloty} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === product.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={updatePricing.isPending} onClick={() => updatePricing.mutate({ id: product.id, hourlyPriceZloty, depositAmountZloty })}>
                          <Save data-icon="inline-start" />
                          Zapisz
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Anuluj</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => beginEdit(product)}>
                        <Edit data-icon="inline-start" />
                        Edytuj
                      </Button>
                    )}
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
