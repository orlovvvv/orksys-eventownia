import { Button } from "@orksys-eventownia/ui/components/button";
import { Field, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { ToggleGroup, ToggleGroupItem } from "@orksys-eventownia/ui/components/toggle-group";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign, Edit, Save, Tag, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminDataToolbar } from "@/components/admin-data-toolbar";
import { AdminEmptyState } from "@/components/admin-empty-state";
import { AdminMetricStrip } from "@/components/admin-metric-strip";
import {
  AdminSection,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { productMetrics } from "@/lib/admin-metrics";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricingRoute,
});

type PricingFilter = "all" | "missing" | "active" | "hidden";

function AdminPricingRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hourlyPriceInput, setHourlyPriceInput] = useState("");
  const [depositInput, setDepositInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PricingFilter>("all");
  const updatePricing = useMutation(trpc.admin.products.updatePricing.mutationOptions({ onSuccess: () => {
    toast.success("Reguła cenowa zapisana.");
    setEditingId(null);
    void queryClient.invalidateQueries();
  } }));
  const allProducts = products.data ?? [];
  const metrics = productMetrics(allProducts);
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;
      const matchesFilter =
        filter === "all" ||
        (filter === "missing" && missingRate) ||
        (filter === "active" && product.active && product.publicVisible) ||
        (filter === "hidden" && (!product.active || !product.publicVisible));
      const searchable = [product.namePl, product.sku, product.category?.namePl].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allProducts, filter, search]);
  const parsedHourlyPrice = Number(hourlyPriceInput);
  const parsedDeposit = depositInput.trim() ? Number(depositInput) : null;
  const hourlyPriceValid = hourlyPriceInput.trim() !== "" && Number.isInteger(parsedHourlyPrice) && parsedHourlyPrice >= 0;
  const depositValid = parsedDeposit === null || (Number.isInteger(parsedDeposit) && parsedDeposit >= 0);
  const canSave = hourlyPriceValid && depositValid && !updatePricing.isPending;

  function beginEdit(product: (typeof allProducts)[number]) {
    setEditingId(product.id);
    setHourlyPriceInput(String(product.pricing?.hourlyPriceZloty ?? 0));
    setDepositInput(product.pricing?.depositAmountZloty === null || product.pricing?.depositAmountZloty === undefined ? "" : String(product.pricing.depositAmountZloty));
  }

  function submit(productId: string) {
    if (!canSave) {
      toast.error("Podaj poprawną stawkę godzinową i zaliczkę.");
      return;
    }
    updatePricing.mutate({
      id: productId,
      hourlyPriceZloty: parsedHourlyPrice,
      depositAmountZloty: parsedDeposit,
    });
  }

  return (
    <AdminShell title="Cennik" description="Bieżące stawki godzinowe produktów i dodatków.">
      <AdminMetricStrip
        metrics={[
          { label: "Pozycje", value: metrics.allCount, detail: "Produkty i dodatki", icon: CircleDollarSign },
          { label: "Ze stawką", value: metrics.allCount - metrics.missingPriceCount, detail: "Gotowe do wyceny /h", icon: Tag, tone: "primary" },
          { label: "Bez stawki", value: metrics.missingPriceCount, detail: "Wymagają uwagi", icon: TriangleAlert, tone: metrics.missingPriceCount ? "danger" : "neutral" },
        ]}
        className="xl:grid-cols-3"
      />

      <AdminDataToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj produktu, SKU, kategorii...">
        <ToggleGroup value={[filter]} onValueChange={(value) => value[0] ? setFilter(value[0] as PricingFilter) : undefined} spacing={1} className="flex-wrap">
          <ToggleGroupItem value="all" variant="outline" size="sm">Wszystkie</ToggleGroupItem>
          <ToggleGroupItem value="missing" variant="outline" size="sm">Brak stawki</ToggleGroupItem>
          <ToggleGroupItem value="active" variant="outline" size="sm">Aktywne</ToggleGroupItem>
          <ToggleGroupItem value="hidden" variant="outline" size="sm">Ukryte</ToggleGroupItem>
        </ToggleGroup>
      </AdminDataToolbar>

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>Reguły cenowe</AdminSectionTitle>
            <AdminSectionDescription>Edytuj jedną pozycję naraz. Zmiany zapisują aktualną stawkę w mock state.</AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState icon={CircleDollarSign} title="Brak pozycji" description="Nie znaleziono produktów dla wybranych filtrów." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Stawka godzinowa</TableHead>
                  <TableHead>Zaliczka</TableHead>
                  <TableHead>Ostatnia zmiana</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-semibold">{product.namePl}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </TableCell>
                      <TableCell>{product.category?.namePl}</TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <Field data-invalid={!hourlyPriceValid}>
                            <FieldLabel className="sr-only">Stawka godzinowa</FieldLabel>
                            <Input
                              className="w-32"
                              type="number"
                              min={0}
                              value={hourlyPriceInput}
                              aria-invalid={!hourlyPriceValid}
                              onChange={(event) => setHourlyPriceInput(event.target.value)}
                            />
                          </Field>
                        ) : missingRate ? (
                          <StatusBadge status="requires_hourly_price" />
                        ) : (
                          <><Money amountZloty={product.pricing?.hourlyPriceZloty} />/h</>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <Field data-invalid={!depositValid}>
                            <FieldLabel className="sr-only">Zaliczka</FieldLabel>
                            <Input
                              className="w-32"
                              type="number"
                              min={0}
                              value={depositInput}
                              aria-invalid={!depositValid}
                              onChange={(event) => setDepositInput(event.target.value)}
                            />
                          </Field>
                        ) : (
                          <Money amountZloty={product.pricing?.depositAmountZloty} />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(product.pricing?.priceUpdatedAt)}</TableCell>
                      <TableCell><StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} /></TableCell>
                      <TableCell className="text-right">
                        {editingId === product.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" disabled={!canSave} onClick={() => submit(product.id)}>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </AdminSectionContent>
      </AdminSection>
    </AdminShell>
  );
}
