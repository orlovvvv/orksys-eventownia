import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardTitle } from "@orksys-eventownia/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, ShieldCheck, Sparkles, Timer, Truck } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { getCategoryImage, getHeroImage } from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 6 }));
  const categories = useQuery(trpc.catalog.categories.queryOptions());
  const hero = getHeroImage();

  return (
    <main className="flex flex-col gap-16 pb-16">
      <section className="mx-auto w-full max-w-page px-4 pt-8 md:px-6 md:pt-12">
        <div className="relative min-h-[520px] overflow-hidden rounded-3xl bg-surface-container-high shadow-soft">
          <img src={hero.src} alt={hero.alt} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-inverse-surface/25" />
          <div className="relative flex min-h-[520px] items-center p-4 sm:p-6 md:p-14">
            <div className="flex w-full max-w-xl flex-col gap-6 rounded-2xl bg-surface/90 p-6 shadow-floating ring-1 ring-white/70 backdrop-blur-md sm:p-8 md:p-12">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">
                Wynajem atrakcji eventowych
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  Katalog atrakcji z wstępną wyceną i spokojnym potwierdzeniem rezerwacji.
                </h1>
                <p className="text-base/relaxed text-muted-foreground md:text-lg/relaxed">
                  Wybierz atrakcje, podaj szczegóły wydarzenia i otrzymaj potwierdzenie dostępności od obsługi.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button render={<Link to="/produkty" />}>
                  Zobacz ofertę
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button variant="outline" render={<Link to="/wynajem" search={{}} />}>
                  <CalendarCheck data-icon="inline-start" />
                  Szybka wycena
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-page px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Bezpieczeństwo i higiena", text: "Każda atrakcja przechodzi kontrolę przed realizacją." },
            { icon: Timer, title: "Wstępna wycena", text: "Koszt produktów poznasz przed wysłaniem zapytania." },
            { icon: Truck, title: "Profesjonalny montaż", text: "Obsługa potwierdza dojazd, podłoże i warunki montażu." },
          ].map((item) => (
            <Card key={item.title} className="items-center justify-center text-center md:min-h-[220px]">
              <CardContent className="flex h-full w-full max-w-sm flex-col items-center justify-center gap-4 px-6 py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                  <item.icon />
                </div>
                <CardTitle className="max-w-64 text-center text-xl leading-tight">{item.title}</CardTitle>
                <p className="text-sm/relaxed text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 md:px-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold">Kategorie atrakcji</h2>
          <p className="max-w-2xl text-base/relaxed text-muted-foreground">
            Wybierz kategorię i sprawdź produkty dostępne na wydarzenie.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2">
          {categories.data?.slice(0, 4).map((category, index) => {
            const image = getCategoryImage(category.slug);
            return (
              <Link
                key={category.id}
                to="/kategorie/$slug"
                params={{ slug: category.slug }}
                className={[
                  "group relative min-h-64 overflow-hidden rounded-3xl bg-surface-container-high shadow-soft",
                  index === 0 ? "md:col-span-2 md:row-span-2" : "",
                  index === 3 ? "md:col-span-2" : "",
                ].join(" ")}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 text-primary-foreground">
                  <h3 className="text-2xl font-bold">{category.namePl}</h3>
                  <p className="line-clamp-2 text-sm/relaxed text-primary-foreground/85">{category.descriptionPl}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
              <Sparkles data-icon="inline-start" />
              Polecane
            </div>
            <h2 className="text-3xl font-bold">Polecane produkty</h2>
          </div>
          <Button variant="outline" render={<Link to="/produkty" />}>
            Katalog
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.data?.items.map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
        </div>
      </section>
    </main>
  );
}
