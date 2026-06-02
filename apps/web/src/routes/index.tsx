import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, ShieldCheck, Truck } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 6 }));
  const categories = useQuery(trpc.catalog.categories.queryOptions());

  return (
    <main className="flex flex-col">
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Wynajem atrakcji eventowych</div>
            <div className="flex flex-col gap-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-5xl">
                Katalog atrakcji z wyceną i ręcznym potwierdzeniem rezerwacji.
              </h1>
              <p className="max-w-2xl text-sm/relaxed text-muted-foreground">
                Makieta MVP obsługuje katalog, zapytania, wyceny, panel operatora, dostępność, płatności
                zaliczkowe i historię działań bez prawdziwych integracji zewnętrznych.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button render={<Link to="/wynajem" search={{}} />}>
                <CalendarCheck data-icon="inline-start" />
                Zapytaj o termin
              </Button>
              <Button variant="outline" render={<Link to="/produkty" />}>
                Zobacz katalog
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: ShieldCheck, title: "Admin potwierdza", text: "Brak automatycznych rezerwacji i płatności przed weryfikacją." },
              { icon: Truck, title: "Dojazd ręcznie", text: "Koszt dojazdu pozostaje do potwierdzenia przez operatora." },
              { icon: CalendarCheck, title: "Dostępność mock", text: "Rezerwacje i blackouty blokują produkty w makietowym kalendarzu." },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon data-icon="inline-start" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs/relaxed text-muted-foreground">{item.text}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Kategorie</h2>
            <p className="text-xs text-muted-foreground">Wszystkie główne segmenty z dokumentu MVP.</p>
          </div>
          <Button variant="outline" render={<Link to="/produkty" />}>Katalog</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {categories.data?.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.namePl}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs/relaxed text-muted-foreground">{category.descriptionPl}</p>
                <Button variant="outline" render={<Link to="/kategorie/$slug" params={{ slug: category.slug }} />}>
                  Otwórz kategorię
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-10">
        <h2 className="text-2xl font-semibold tracking-normal">Polecane produkty</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.data?.items.map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
        </div>
      </section>
    </main>
  );
}
