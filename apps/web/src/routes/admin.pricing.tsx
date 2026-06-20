import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, CircleDollarSign, Edit, Save, Tag, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { productMetrics } from "@/lib/admin-metrics";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricingRoute,
});

function AdminPricingRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quoteMode, setQuoteMode] = useState<"automatic" | "manual">("automatic");
  const [basePriceGrosz, setBasePriceGrosz] = useState<number | null>(null);
  const [baseHours, setBaseHours] = useState<number | null>(5);
  const [extraHourPercent, setExtraHourPercent] = useState(20);
  const [depositAmountGrosz, setDepositAmountGrosz] = useState<number | null>(30000);
  const updatePricing = useMutation(trpc.admin.products.updatePricing.mutationOptions({ onSuccess: () => {
    toast.success("Reguła cenowa zapisana.");
    setEditingId(null);
    void queryClient.invalidateQueries();
  } }));
  const allProducts = products.data ?? [];
  const metrics = productMetrics(allProducts);

  function beginEdit(product: (typeof allProducts)[number]) {
    setEditingId(product.id);
    setQuoteMode(product.pricing?.quoteMode ?? "automatic");
    setBasePriceGrosz(product.pricing?.basePriceGrosz ?? null);
    setBaseHours(product.pricing?.baseHours ?? null);
    setExtraHourPercent(product.pricing?.extraHourPercent ?? 20);
    setDepositAmountGrosz(product.pricing?.depositAmountGrosz ?? null);
  }

  return (
    <AdminShell title="Cennik" description="Zarządzaj regułami cenowymi i trybem wyceny produktów.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Automatyczne" value={metrics.allCount - metrics.manualPricingCount} detail="Z ceną bazową" icon={CircleDollarSign} tone="primary" />
        <AdminKpiCard label="Ręczna wycena" value={metrics.manualPricingCount} detail="Do decyzji operatora" icon={Tag} tone="warning" />
        <AdminKpiCard label="Extra godzina" value={`${settings.data?.settings.defaultExtraHourPercent ?? 20}%`} detail="Domyślna wartość" icon={BadgePercent} tone="neutral" />
        <AdminKpiCard label="Bez ceny" value={metrics.missingPriceCount} detail="Wymagają uwagi" icon={TriangleAlert} tone="danger" />
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
                <TableHead>Tryb</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Czas</TableHead>
                <TableHead>Extra</TableHead>
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
                      <Button variant={quoteMode === "automatic" ? "secondary" : "outline"} size="sm" onClick={() => setQuoteMode(quoteMode === "automatic" ? "manual" : "automatic")}>
                        {quoteMode === "automatic" ? "Automatyczny" : "Ręczny"}
                      </Button>
                    ) : (
                      <StatusBadge status={product.pricing?.quoteMode} />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-32" type="number" value={basePriceGrosz ?? ""} onChange={(event) => setBasePriceGrosz(event.target.value ? Number(event.target.value) : null)} />
                    ) : (
                      <Money amountGrosz={product.pricing?.basePriceGrosz} />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-24" type="number" value={baseHours ?? ""} onChange={(event) => setBaseHours(event.target.value ? Number(event.target.value) : null)} />
                    ) : (
                      `${product.pricing?.baseHours ?? "manual"}h`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-24" type="number" value={extraHourPercent} onChange={(event) => setExtraHourPercent(Number(event.target.value))} />
                    ) : (
                      `${product.pricing?.extraHourPercent ?? 20}%`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product.id ? (
                      <Input className="w-32" type="number" value={depositAmountGrosz ?? ""} onChange={(event) => setDepositAmountGrosz(event.target.value ? Number(event.target.value) : null)} />
                    ) : (
                      <Money amountGrosz={product.pricing?.depositAmountGrosz} />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === product.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={updatePricing.isPending} onClick={() => updatePricing.mutate({ id: product.id, quoteMode, basePriceGrosz, baseHours, extraHourPercent, depositAmountGrosz })}>
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
