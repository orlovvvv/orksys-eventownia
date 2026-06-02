import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Money } from "@/components/money";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/products/$id")({
  component: AdminProductDetailRoute,
});

function AdminProductDetailRoute() {
  const { id } = Route.useParams();
  const product = useQuery(trpc.admin.products.detail.queryOptions({ id }));
  const [namePl, setNamePl] = useState("");
  const [shortDescriptionPl, setShortDescriptionPl] = useState("");
  const [active, setActive] = useState(true);
  const [basePriceGrosz, setBasePriceGrosz] = useState<number | null>(null);
  const [baseHours, setBaseHours] = useState<number | null>(5);
  const [extraHourPercent, setExtraHourPercent] = useState(20);
  const invalidate = () => queryClient.invalidateQueries();
  const update = useMutation(trpc.admin.products.update.mutationOptions({ onSuccess: invalidate }));
  const updatePricing = useMutation(trpc.admin.products.updatePricing.mutationOptions({ onSuccess: invalidate }));
  const attachAsset = useMutation(trpc.admin.products.attachAsset.mutationOptions({ onSuccess: invalidate }));

  useEffect(() => {
    if (!product.data) return;
    setNamePl(product.data.namePl);
    setShortDescriptionPl(product.data.shortDescriptionPl);
    setActive(product.data.active);
    setBasePriceGrosz(product.data.pricing?.basePriceGrosz ?? null);
    setBaseHours(product.data.pricing?.baseHours ?? null);
    setExtraHourPercent(product.data.pricing?.extraHourPercent ?? 20);
  }, [product.data]);

  return (
    <AdminShell title="Edycja produktu">
      {!product.data ? (
        <Card><CardContent>Brak produktu.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader><CardTitle>{product.data.namePl}</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field><FieldLabel>Nazwa</FieldLabel><Input value={namePl} onChange={(event) => setNamePl(event.target.value)} /></Field>
                <Field><FieldLabel>Opis krótki</FieldLabel><Textarea value={shortDescriptionPl} onChange={(event) => setShortDescriptionPl(event.target.value)} /></Field>
                <label className="flex items-center gap-2 text-xs"><Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} /> Aktywny publicznie</label>
                <Button onClick={() => update.mutate({ id, data: { namePl, shortDescriptionPl, active, publicVisible: active } })}>Zapisz produkt</Button>
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cennik i media</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="text-sm">Aktualnie: <Money amountGrosz={product.data.pricing?.basePriceGrosz} /></div>
                <Field><FieldLabel>Cena bazowa (grosz)</FieldLabel><Input type="number" value={basePriceGrosz ?? ""} onChange={(event) => setBasePriceGrosz(event.target.value ? Number(event.target.value) : null)} /></Field>
                <Field><FieldLabel>Godziny bazowe</FieldLabel><Input type="number" value={baseHours ?? ""} onChange={(event) => setBaseHours(event.target.value ? Number(event.target.value) : null)} /></Field>
                <Field><FieldLabel>Dodatkowa godzina (%)</FieldLabel><Input type="number" value={extraHourPercent} onChange={(event) => setExtraHourPercent(Number(event.target.value))} /></Field>
                <Button onClick={() => updatePricing.mutate({ id, quoteMode: basePriceGrosz ? "automatic" : "manual", basePriceGrosz, baseHours, extraHourPercent })}>Zapisz cennik</Button>
                <Button variant="outline" onClick={() => attachAsset.mutate({ id, altTextPl: `${product.data?.namePl} - zdjęcie mock`, licenseStatus: "illustrative" })}>Dodaj mock media</Button>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
