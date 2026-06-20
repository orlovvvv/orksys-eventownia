import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Grid2X2, ImageOff, List, Package, Plus, Tag, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { productMetrics } from "@/lib/admin-metrics";
import { compactId } from "@/lib/admin-status";
import { getProductImage } from "@/lib/mock-images";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsRoute,
});

function AdminProductsRoute() {
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("NEW_PRODUCT");
  const [namePl, setNamePl] = useState("Nowa atrakcja mock");
  const [slug, setSlug] = useState("nowa-atrakcja-mock");
  const [productType, setProductType] = useState("rental_product");
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
    { value: "manual_quote_extra", label: "Ręczna wycena" },
  ];

  useEffect(() => {
    if (!categoryId && categoryItems[0]) setCategoryId(categoryItems[0].value);
  }, [categoryId, categoryItems]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      const missingMedia = product.assets.length === 0;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.active && product.publicVisible) ||
        (statusFilter === "hidden" && (!product.active || !product.publicVisible)) ||
        (statusFilter === "issues" && (missingMedia || product.pricing?.basePriceGrosz === null));
      const matchesCategory = categoryFilter === "all" || product.category?.id === categoryFilter;
      const searchable = [product.namePl, product.sku, product.category?.namePl, product.shortDescriptionPl].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && matchesCategory && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [allProducts, categoryFilter, search, statusFilter]);

  return (
    <AdminShell
      title="Zarządzanie produktami"
      description="Przeglądaj i edytuj asortyment wypożyczalni."
      actions={[
        { label: "Zarządzaj cenami", icon: Tag, to: "/admin/pricing", variant: "outline" },
        { label: "Dodaj produkt", icon: Plus, onClick: () => setShowCreateForm((current) => !current) },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Wszystkie" value={metrics.allCount} detail="Produkty i dodatki" icon={Package} tone="neutral" />
        <AdminKpiCard label="Aktywne" value={metrics.activeCount} detail="Widoczne publicznie" icon={Grid2X2} tone="primary" />
        <AdminKpiCard label="Ukryte" value={metrics.hiddenCount} detail="Wyłączone lub prywatne" icon={List} tone="neutral" />
        <AdminKpiCard label="Braki / błędy" value={metrics.missingMediaCount + metrics.missingPriceCount} detail="Media lub cennik" icon={TriangleAlert} tone="danger" />
      </div>

      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Dodaj produkt mock</CardTitle>
            <CardDescription>Tworzy produkt i domyślną ręczną regułę cenową w pamięci mock.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!categoryId || create.isPending}
                  onClick={() => create.mutate({ categoryId, sku, slug, namePl, productType: productType as "rental_product" | "addon" | "manual_quote_extra" })}
                >
                  Dodaj produkt
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Anuluj</Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      <AdminListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj nazwy, SKU, kategorii...">
        <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Wszystkie</Button>
        <Button variant={statusFilter === "active" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("active")}>Aktywne</Button>
        <Button variant={statusFilter === "hidden" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("hidden")}>Ukryte</Button>
        <Button variant={statusFilter === "issues" ? "destructive" : "outline"} size="sm" onClick={() => setStatusFilter("issues")}>Braki</Button>
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
        <Button variant={viewMode === "grid" ? "secondary" : "outline"} size="icon-sm" aria-label="Widok siatki" onClick={() => setViewMode("grid")}><Grid2X2 /></Button>
        <Button variant={viewMode === "table" ? "secondary" : "outline"} size="icon-sm" aria-label="Widok tabeli" onClick={() => setViewMode("table")}><List /></Button>
      </AdminListToolbar>

      {viewMode === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductAdminCard key={product.id} product={product} onDeactivate={() => deactivate.mutate({ id: product.id })} isDeactivating={deactivate.isPending} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Produkty i dodatki</CardTitle>
            <CardDescription>Pokazuje {filteredProducts.length} z {allProducts.length} pozycji.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Kategoria</TableHead><TableHead>Status</TableHead><TableHead>Cena</TableHead><TableHead>Magazyn</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell><div className="font-semibold">{product.namePl}</div><div className="text-xs text-muted-foreground">{product.sku} · {compactId(product.id)}</div></TableCell>
                    <TableCell>{product.category?.namePl}</TableCell>
                    <TableCell><StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} /></TableCell>
                    <TableCell><Money amountGrosz={product.pricing?.basePriceGrosz} /></TableCell>
                    <TableCell>{product.inventoryCount} szt.</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" render={<Link to="/admin/products/$id" params={{ id: product.id }} />}>Edytuj</Button>
                        {product.active ? <Button variant="destructive" size="sm" disabled={deactivate.isPending} onClick={() => deactivate.mutate({ id: product.id })}>Wyłącz</Button> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
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
  pricing: { basePriceGrosz: number | null } | null;
};

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

  return (
    <Card className={!product.active || !product.publicVisible ? "opacity-70" : ""}>
      <div className="relative h-44 bg-muted">
        {missingMedia ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff />
            <div className="text-sm font-semibold">Brak zdjęcia głównego</div>
          </div>
        ) : (
          <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
        )}
        <div className="absolute left-3 top-3 rounded-lg bg-card/90 px-2 py-1 text-xs font-bold shadow-soft">{product.sku}</div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{product.category?.namePl ?? "Bez kategorii"}</div>
          <div className="truncate text-lg font-semibold">{product.namePl}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Cena bazowa</div>
            <div className="font-semibold text-primary"><Money amountGrosz={product.pricing?.basePriceGrosz} /></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Magazyn</div>
            <div className="font-semibold">{product.inventoryCount} szt.</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={product.active && product.publicVisible ? "active" : "inactive"} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" render={<Link to="/admin/products/$id" params={{ id: product.id }} />}>Edytuj</Button>
            {product.active ? <Button variant="destructive" size="sm" disabled={isDeactivating} onClick={onDeactivate}>Wyłącz</Button> : null}
          </div>
        </div>
      </CardContent>
    </Card>
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
