import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Table, TableBody, TableCell, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Money } from "@/components/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/produkty/$slug")({
  component: ProductDetailRoute,
});

function ProductDetailRoute() {
  const { slug } = Route.useParams();
  const product = useQuery(trpc.catalog.productBySlug.queryOptions({ slug }));

  if (!product.data) {
    return <main className="mx-auto w-full max-w-7xl px-4 py-8">Produkt nie znaleziony.</main>;
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-5">
        <div className="h-72 border bg-muted p-4 text-xs text-muted-foreground">
          Ilustracyjny placeholder produktu: {product.data.sku}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{product.data.category?.namePl}</Badge>
            <Badge variant={product.data.active ? "default" : "destructive"}>{product.data.active ? "aktywny" : "nieaktywny"}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">{product.data.namePl}</h1>
          <p className="text-sm/relaxed text-muted-foreground">{product.data.longDescriptionPl}</p>
        </div>
        <Alert>
          <ShieldCheck data-icon="inline-start" />
          <AlertTitle>Bezpieczeństwo i montaż</AlertTitle>
          <AlertDescription>Obsługa potwierdza podłoże, dostęp do prądu, dojazd, pogodę i bufor montażowy przed rezerwacją.</AlertDescription>
        </Alert>
      </section>
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Warunki wynajmu</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-2xl font-semibold">
              {product.data.pricing?.quoteMode === "automatic" ? <Money amountGrosz={product.data.pricing.basePriceGrosz} /> : "Cena do ustalenia"}
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>{product.data.sku}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Czas bazowy</TableCell>
                  <TableCell>{product.data.pricing?.baseHours ?? "manual"}h</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dodatkowa godzina</TableCell>
                  <TableCell>{product.data.pricing?.extraHourPercent ?? 20}% ceny bazowej</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Montaż/demontaż</TableCell>
                  <TableCell>{product.data.setupMinutes} / {product.data.teardownMinutes} min</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Prąd</TableCell>
                  <TableCell>{product.data.requiresPower ? "wymagany" : "niewymagany"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button render={<Link to="/wynajem" search={{ product: product.data.sku }} />}>Zapytaj o wynajem</Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}
