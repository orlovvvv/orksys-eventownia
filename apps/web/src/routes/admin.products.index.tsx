import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@orksys-eventownia/ui/components/drawer";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { ToggleGroup, ToggleGroupItem } from "@orksys-eventownia/ui/components/toggle-group";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Grid2X2, ImageOff, List, Package, Plus, Tag, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { compactId } from "@/lib/admin-status";
import { getProductImage } from "@/lib/mock-images";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsRoute,
});

type ProductFilter = "all" | "active" | "hidden" | "issues";
type ProductViewMode = "table" | "grid";

function AdminProductsRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<ProductViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("NEW_PRODUCT");
  const [namePl, setNamePl] = useState("Nowa atrakcja mock");
  const [slug, setSlug] = useState("nowa-atrakcja-mock");
  const [productType, setProductType] = useState("rental_product");
  const [hourlyPriceZloty, setHourlyPriceZloty] = useState(500);
  const deactivate = useMutation(trpc.admin.products.deactivate.mutationOptions({ onSuccess: () => {
    toast.success("Produkt ukryty w makiecie.");
    void queryClient.invalidateQueries();
  } }));
  const create = useMutation(trpc.admin.products.create.mutationOptions({ onSuccess: () => {
    toast.success("Dodano produkt mock.");
    setShowCreateForm(false);
    void queryClient.invalidateQueries();
  } }));
  const allProducts = products.data ?? [];
  const metrics = productMetrics(allProducts);
  const categories = useMemo(() => {
    const unique = new Map<string, { id: string; namePl: string; slug: string }>();
    for (const product of allProducts) {
      if (product.category) unique.set(product.category.id, product.category);
    }
    return Array.from(unique.values());
  }, [allProducts]);
  const categoryItems = categories.map((category) => ({ value: category.id, label: category.namePl }));
  const typeItems = [
    { value: "rental_product", label: "Produkt wynajmu" },
    { value: "addon", label: "Dodatek" },
    { value: "event_extra", label: "Dodatek eventowy" },
  ];

  useEffect(() => {
    if (!categoryId && categoryItems[0]) setCategoryId(categoryItems[0].value);
  }, [categoryId, categoryItems]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      const missingMedia = product.assets.length === 0;
      const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.active && product.publicVisible) ||
        (statusFilter === "hidden" && (!product.active || !product.publicVisible)) ||
        (statusFilter === "issues" && (missingMedia || missingRate));
      const matchesCategory = categoryFilter === "all" || product.category?.id === categoryFilter;
      const searchable = [product.namePl, product.sku, product.category?.namePl, product.shortDescriptionPl].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && matchesCategory && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allProducts, categoryFilter, search, statusFilter]);

  return (
    <AdminShell
      title="Produkty"
      description="Asortyment wypożyczalni, media, widoczność i stawki godzinowe."
      actions={[
        { label: "Cennik", icon: Tag, to: "/admin/pricing", variant: "outline" },
        { label: "Dodaj produkt", icon: Plus, onClick: () => setShowCreateForm(true) },
      ]}
    >
      <AdminMetricStrip
        metrics={[
          { label: "Wszystkie", value: metrics.allCount, detail: "Produkty i dodatki", icon: Package },
          { label: "Aktywne", value: metrics.activeCount, detail: "Widoczne publicznie", icon: Grid2X2, tone: "primary" },
          { label: "Ukryte", value: metrics.hiddenCount, detail: "Wyłączone lub prywatne", icon: List },
          { label: "Braki / błędy", value: metrics.missingMediaCount + metrics.missingPriceCount, detail: "Media lub cennik", icon: TriangleAlert, tone: metrics.missingMediaCount + metrics.missingPriceCount ? "danger" : "neutral" },
        ]}
      />

      <AdminDataToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj nazwy, SKU, kategorii...">
        <ToggleGroup value={[statusFilter]} onValueChange={(value) => value[0] ? setStatusFilter(value[0] as ProductFilter) : undefined} spacing={1} className="flex-wrap">
          <ToggleGroupItem value="all" variant="outline" size="sm">Wszystkie</ToggleGroupItem>
          <ToggleGroupItem value="active" variant="outline" size="sm">Aktywne</ToggleGroupItem>
          <ToggleGroupItem value="hidden" variant="outline" size="sm">Ukryte</ToggleGroupItem>
          <ToggleGroupItem value="issues" variant="outline" size="sm">Braki</ToggleGroupItem>
        </ToggleGroup>
        <Select
          items={[{ value: "all", label: "Kategoria: Wszystkie" }, ...categoryItems]}
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(String(value))}
        >
          <SelectTrigger size="sm" className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            <SelectItem value="all">Kategoria: Wszystkie</SelectItem>
            {categoryItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectGroup></SelectContent>
        </Select>
        <ToggleGroup value={[viewMode]} onValueChange={(value) => value[0] ? setViewMode(value[0] as ProductViewMode) : undefined} spacing={1}>
          <ToggleGroupItem value="table" variant="outline" size="sm" aria-label="Widok tabeli"><List /></ToggleGroupItem>
          <ToggleGroupItem value="grid" variant="outline" size="sm" aria-label="Widok siatki"><Grid2X2 /></ToggleGroupItem>
        </ToggleGroup>
      </AdminDataToolbar>

      {viewMode === "grid" ? (
        filteredProducts.length === 0 ? (
          <AdminEmptyState icon={Package} title="Brak produktów" description="Nie znaleziono produktów dla wybranych filtrów." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductAdminCard key={product.id} product={product} onDeactivate={() => deactivate.mutate({ id: product.id })} isDeactivating={deactivate.isPending} />
            ))}
          </div>
        )
      ) : (
        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Produkty i dodatki</AdminSectionTitle>
              <AdminSectionDescription>Pokazuje {filteredProducts.length} z {allProducts.length} pozycji.</AdminSectionDescription>
            </div>
          </AdminSectionHeader>
          <AdminSectionContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState icon={Package} title="Brak produktów" description="Nie znaleziono produktów dla wybranych filtrów." />
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Kategoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stawka</TableHead>
                        <TableHead>Magazyn</TableHead>
                        <TableHead>Braki</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const missingMedia = product.assets.length === 0;
                        const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;
                        const image = getProductImage(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="size-12 overflow-hidden rounded-md bg-muted">
                                  {missingMedia ? (
                                    <div className="flex size-full items-center justify-center text-muted-foreground"><ImageOff /></div>
                                  ) : (
                                    <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">{product.namePl}</div>
                                  <div className="text-xs text-muted-foreground">{product.sku} · {compactId(product.id)}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.category?.namePl}</TableCell>
                            <TableCell><StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} /></TableCell>
                            <TableCell>{missingRate ? <StatusBadge status="requires_hourly_price" /> : <><Money amountZloty={product.pricing?.hourlyPriceZloty} />/h</>}</TableCell>
                            <TableCell>{product.inventoryCount} szt.</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {missingMedia ? <Badge variant="secondary">Media</Badge> : null}
                                {missingRate ? <Badge variant="destructive">Stawka</Badge> : null}
                                {!missingMedia && !missingRate ? <Badge variant="outline">OK</Badge> : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" render={<Link to="/admin/products/$id" params={{ id: product.id }} />}>Edytuj</Button>
                                {product.active ? <Button variant="destructive" size="sm" disabled={deactivate.isPending} onClick={() => deactivate.mutate({ id: product.id })}>Wyłącz</Button> : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-2 p-3 md:hidden">
                  {filteredProducts.map((product) => (
                    <ProductMobileRow key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </AdminSectionContent>
        </AdminSection>
      )}

      <Drawer open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DrawerContent className="w-[min(32rem,calc(100vw-2rem))]">
          <div className="border-b border-border/70 p-4">
            <DrawerTitle className="text-base font-semibold">Dodaj produkt mock</DrawerTitle>
            <p className="mt-1 text-sm text-muted-foreground">Tworzy produkt i godzinową regułę cenową w pamięci mock.</p>
          </div>
          <div className="overflow-y-auto p-4">
            <FieldGroup>
              <Field><FieldLabel>Nazwa</FieldLabel><Input value={namePl} onChange={(event) => {
                setNamePl(event.target.value);
                setSlug(toSlug(event.target.value));
              }} /></Field>
              <Field><FieldLabel>Slug</FieldLabel><Input value={slug} onChange={(event) => setSlug(event.target.value)} /></Field>
              <Field><FieldLabel>SKU</FieldLabel><Input value={sku} onChange={(event) => setSku(event.target.value)} /></Field>
              <Field>
                <FieldLabel>Kategoria</FieldLabel>
                <Select items={categoryItems} value={categoryId} onValueChange={(value) => setCategoryId(String(value))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{categoryItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Typ</FieldLabel>
                <Select items={typeItems} value={productType} onValueChange={(value) => setProductType(String(value))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup>{typeItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </Field>
              <Field><FieldLabel>Stawka godzinowa (zł)</FieldLabel><Input type="number" min={0} value={hourlyPriceZloty} onChange={(event) => setHourlyPriceZloty(Number(event.target.value))} /></Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!categoryId || create.isPending}
                  onClick={() => create.mutate({ categoryId, sku, slug, namePl, productType: productType as "rental_product" | "addon" | "event_extra", hourlyPriceZloty })}
                >
                  Dodaj produkt
                </Button>
                <DrawerClose render={<Button variant="outline" />}>Anuluj</DrawerClose>
              </div>
            </FieldGroup>
          </div>
        </DrawerContent>
      </Drawer>
    </AdminShell>
  );
}

type ProductAdminItem = {
  id: string;
  sku: string;
  slug: string;
  namePl: string;
  visualTone: string;
  active: boolean;
  publicVisible: boolean;
  inventoryCount: number;
  category: { id: string; slug: string; namePl: string } | null;
  assets: Array<{ publicUrl: string | null; altTextPl: string; isPrimary: boolean }>;
  pricing: { hourlyPriceZloty: number | null } | null;
};

function ProductMobileRow({ product }: { product: ProductAdminItem }) {
  const missingMedia = product.assets.length === 0;
  const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;
  return (
    <Link to="/admin/products/$id" params={{ id: product.id }} className="rounded-lg border border-border/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{product.namePl}</div>
          <div className="text-xs text-muted-foreground">{product.sku} · {product.category?.namePl ?? "Bez kategorii"}</div>
        </div>
        <StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {missingRate ? <StatusBadge status="requires_hourly_price" /> : <Badge variant="outline"><Money amountZloty={product.pricing?.hourlyPriceZloty} />/h</Badge>}
        {missingMedia ? <Badge variant="secondary">Brak media</Badge> : null}
        <Badge variant="outline">{product.inventoryCount} szt.</Badge>
      </div>
    </Link>
  );
}

function ProductAdminCard({
  product,
  onDeactivate,
  isDeactivating,
}: {
  product: ProductAdminItem;
  onDeactivate: () => void;
  isDeactivating: boolean;
}) {
  const image = getProductImage(product);
  const missingMedia = product.assets.length === 0;
  const missingRate = product.pricing?.hourlyPriceZloty === null || product.pricing?.hourlyPriceZloty === undefined;

  return (
    <AdminSection className={!product.active || !product.publicVisible ? "opacity-70" : ""}>
      <div className="relative h-40 bg-muted">
        {missingMedia ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff />
            <div className="text-sm font-semibold">Brak zdjęcia głównego</div>
          </div>
        ) : (
          <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
        )}
        <Badge variant="outline" className="absolute left-3 top-3 bg-card/95">{product.sku}</Badge>
      </div>
      <AdminSectionContent className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{product.category?.namePl ?? "Bez kategorii"}</div>
          <div className="truncate text-base font-semibold">{product.namePl}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Stawka godzinowa</div>
            <div className="font-semibold text-primary">{missingRate ? "Brak" : <><Money amountZloty={product.pricing?.hourlyPriceZloty} />/h</>}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Magazyn</div>
            <div className="font-semibold">{product.inventoryCount} szt.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {missingMedia ? <Badge variant="secondary">Media</Badge> : null}
          {missingRate ? <Badge variant="destructive">Stawka</Badge> : null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" render={<Link to="/admin/products/$id" params={{ id: product.id }} />}>Edytuj</Button>
            {product.active ? <Button variant="destructive" size="sm" disabled={isDeactivating} onClick={onDeactivate}>Wyłącz</Button> : null}
          </div>
        </div>
      </AdminSectionContent>
    </AdminSection>
  );
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
