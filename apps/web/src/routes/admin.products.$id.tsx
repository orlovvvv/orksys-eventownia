import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ImageOff, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { compactId } from "@/lib/admin-status";
import { getProductImage } from "@/lib/mock-images";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/products/$id")({
  component: AdminProductDetailRoute,
});

function AdminProductDetailRoute() {
  const { id } = Route.useParams();
  const product = useQuery(trpc.admin.products.detail.queryOptions({ id }));
  const products = useQuery(trpc.admin.products.list.queryOptions());
  const [namePl, setNamePl] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [shortDescriptionPl, setShortDescriptionPl] = useState("");
  const [longDescriptionPl, setLongDescriptionPl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState("rental_product");
  const [active, setActive] = useState(true);
  const [publicVisible, setPublicVisible] = useState(true);
  const [requiresPower, setRequiresPower] = useState(true);
  const [requiresOperator, setRequiresOperator] = useState(true);
  const [setupMinutes, setSetupMinutes] = useState(45);
  const [teardownMinutes, setTeardownMinutes] = useState(45);
  const [cleaningBufferMinutes, setCleaningBufferMinutes] = useState(30);
  const [inventoryCount, setInventoryCount] = useState(1);
  const [hourlyPriceZloty, setHourlyPriceZloty] = useState(0);
  const [depositAmountZloty, setDepositAmountZloty] = useState<number | null>(300);
  const invalidate = () => void queryClient.invalidateQueries();
  const update = useMutation(trpc.admin.products.update.mutationOptions({ onSuccess: () => {
    toast.success("Produkt zapisany.");
    invalidate();
  } }));
  const updatePricing = useMutation(trpc.admin.products.updatePricing.mutationOptions({ onSuccess: () => {
    toast.success("Cennik zapisany.");
    invalidate();
  } }));
  const attachAsset = useMutation(trpc.admin.products.attachAsset.mutationOptions({ onSuccess: () => {
    toast.success("Dodano mock media.");
    invalidate();
  } }));
  const deleteAsset = useMutation(trpc.admin.assets.delete.mutationOptions({ onSuccess: () => {
    toast.success("Usunięto media z makiety.");
    invalidate();
  } }));
  const categoryItems = (products.data ?? [])
    .flatMap((item) => (item.category ? [item.category] : []))
    .filter((category, index, all) => all.findIndex((item) => item.id === category.id) === index)
    .map((category) => ({ value: category.id, label: category.namePl }));
  const typeItems = [
    { value: "rental_product", label: "Produkt wynajmu" },
    { value: "addon", label: "Dodatek" },
    { value: "event_extra", label: "Dodatek eventowy" },
  ];

  useEffect(() => {
    if (!product.data) return;
    setNamePl(product.data.namePl);
    setSlug(product.data.slug);
    setSku(product.data.sku);
    setShortDescriptionPl(product.data.shortDescriptionPl);
    setLongDescriptionPl(product.data.longDescriptionPl);
    setCategoryId(product.data.categoryId);
    setProductType(product.data.productType);
    setActive(product.data.active);
    setPublicVisible(product.data.publicVisible);
    setRequiresPower(product.data.requiresPower);
    setRequiresOperator(product.data.requiresOperator);
    setSetupMinutes(product.data.setupMinutes);
    setTeardownMinutes(product.data.teardownMinutes);
    setCleaningBufferMinutes(product.data.cleaningBufferMinutes);
    setInventoryCount(product.data.inventoryCount);
    setHourlyPriceZloty(product.data.pricing?.hourlyPriceZloty ?? 0);
    setDepositAmountZloty(product.data.pricing?.depositAmountZloty ?? null);
  }, [product.data]);

  return (
    <AdminShell
      title="Edycja produktu"
      description={product.data ? `${product.data.sku} · ${product.data.category?.namePl ?? "Bez kategorii"}` : "Zarządzanie produktem."}
      actions={[{ label: "Wróć do produktów", icon: ArrowLeft, to: "/admin/products", variant: "outline" }]}
    >
      {!product.data ? (
        <Card><CardContent>Brak produktu.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{product.data.namePl}</CardTitle>
                    <CardDescription>{compactId(product.data.id)} · {product.data.sku}</CardDescription>
                  </div>
                  <StatusBadge status={product.data.active && product.data.publicVisible ? "active" : "inactive"} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl bg-muted">
                  {product.data.assets.length === 0 ? (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageOff />
                      <span className="text-sm font-semibold">Brak zdjęcia</span>
                    </div>
                  ) : (
                    <img src={getProductImage(product.data).src} alt={getProductImage(product.data).alt} className="aspect-square size-full object-cover" />
                  )}
                </div>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field><FieldLabel>Nazwa</FieldLabel><Input value={namePl} onChange={(event) => setNamePl(event.target.value)} /></Field>
                    <Field><FieldLabel>SKU</FieldLabel><Input value={sku} onChange={(event) => setSku(event.target.value)} /></Field>
                    <Field><FieldLabel>Slug</FieldLabel><Input value={slug} onChange={(event) => setSlug(event.target.value)} /></Field>
                    <Field>
                      <FieldLabel>Kategoria</FieldLabel>
                      <Select items={categoryItems} value={categoryId} onValueChange={(value) => setCategoryId(String(value))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectGroup>{categoryItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Typ produktu</FieldLabel>
                      <Select items={typeItems} value={productType} onValueChange={(value) => setProductType(String(value))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectGroup>{typeItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field><FieldLabel>Opis krótki</FieldLabel><Textarea value={shortDescriptionPl} onChange={(event) => setShortDescriptionPl(event.target.value)} /></Field>
                  <Field><FieldLabel>Opis długi</FieldLabel><Textarea value={longDescriptionPl} onChange={(event) => setLongDescriptionPl(event.target.value)} /></Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operacje</CardTitle>
                <CardDescription>Ustawienia przydatne przy przygotowaniu realizacji.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field><FieldLabel>Stan magazynu</FieldLabel><Input type="number" value={inventoryCount} onChange={(event) => setInventoryCount(Number(event.target.value))} /></Field>
                    <Field><FieldLabel>Montaż (min)</FieldLabel><Input type="number" value={setupMinutes} onChange={(event) => setSetupMinutes(Number(event.target.value))} /></Field>
                    <Field><FieldLabel>Demontaż (min)</FieldLabel><Input type="number" value={teardownMinutes} onChange={(event) => setTeardownMinutes(Number(event.target.value))} /></Field>
                    <Field><FieldLabel>Bufor (min)</FieldLabel><Input type="number" value={cleaningBufferMinutes} onChange={(event) => setCleaningBufferMinutes(Number(event.target.value))} /></Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <CheckRow checked={active} onChange={setActive} label="Aktywny produkt" />
                    <CheckRow checked={publicVisible} onChange={setPublicVisible} label="Widoczny publicznie" />
                    <CheckRow checked={requiresPower} onChange={setRequiresPower} label="Wymaga zasilania" />
                    <CheckRow checked={requiresOperator} onChange={setRequiresOperator} label="Wymaga operatora" />
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cennik</CardTitle>
                <CardDescription>Aktualnie: <Money amountZloty={product.data.pricing?.hourlyPriceZloty} />/h</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field><FieldLabel>Stawka godzinowa (zł)</FieldLabel><Input type="number" min={0} value={hourlyPriceZloty} onChange={(event) => setHourlyPriceZloty(Number(event.target.value))} /></Field>
                  <Field><FieldLabel>Zaliczka (zł)</FieldLabel><Input type="number" min={0} value={depositAmountZloty ?? ""} onChange={(event) => setDepositAmountZloty(event.target.value ? Number(event.target.value) : null)} /></Field>
                  <Button disabled={updatePricing.isPending} onClick={() => updatePricing.mutate({ id, hourlyPriceZloty, depositAmountZloty })}>
                    <Save data-icon="inline-start" />
                    Zapisz cennik
                  </Button>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>{product.data.assets.length} plików w galerii mock.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {product.data.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{asset.altTextPl}</div>
                      <div className="text-xs text-muted-foreground">{asset.licenseStatus} · {asset.isPrimary ? "główne" : "galeria"}</div>
                    </div>
                    <Button variant="destructive" size="icon-sm" disabled={deleteAsset.isPending} onClick={() => deleteAsset.mutate({ id: asset.id })} aria-label="Usuń media">
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" disabled={attachAsset.isPending} onClick={() => attachAsset.mutate({ id, altTextPl: `${product.data?.namePl} - zdjęcie mock`, licenseStatus: "illustrative" })}>
                  <Plus data-icon="inline-start" />
                  Dodaj mock media
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zapis produktu</CardTitle>
                <CardDescription>Zapisuje dane podstawowe i operacyjne.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({
                      id,
                      data: {
                        categoryId,
                        sku,
                        slug,
                        namePl,
                        shortDescriptionPl,
                        longDescriptionPl,
                        productType: productType as "rental_product" | "addon" | "event_extra",
                        active,
                        publicVisible,
                        requiresPower,
                        requiresOperator,
                        setupMinutes,
                        teardownMinutes,
                        cleaningBufferMinutes,
                        inventoryCount,
                      },
                    })
                  }
                >
                  <Save data-icon="inline-start" />
                  Zapisz produkt
                </Button>
                <Button variant="ghost" render={<Link to="/admin/products" />}>Wróć do listy</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}
