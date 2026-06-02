import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { getCategoryImage } from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/kategorie/$slug")({
  component: CategoryRoute,
});

function CategoryRoute() {
  const { slug } = Route.useParams();
  const category = useQuery(trpc.catalog.categoryBySlug.queryOptions({ slug }));

  if (!category.data) {
    return <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">Kategoria nie znaleziona.</main>;
  }

  const image = getCategoryImage(category.data.slug);

  return (
    <main className="flex flex-col gap-10 pb-16">
      <section className="mx-auto w-full max-w-page px-4 pt-10 md:px-6">
        <div className="relative min-h-80 overflow-hidden rounded-3xl bg-surface-container-high shadow-soft">
          <img src={image.src} alt={image.alt} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface/80 to-inverse-surface/10" />
          <div className="relative flex min-h-80 max-w-2xl flex-col justify-end gap-4 p-8 text-primary-foreground md:p-12">
            <Badge variant="outline" className="bg-card/90 text-foreground">
              Kategoria
            </Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">{category.data.namePl}</h1>
            <p className="text-base/relaxed text-primary-foreground/85">{category.data.descriptionPl}</p>
            <div>
              <Button render={<Link to="/wynajem" search={{}} />}>
                Zapytaj o zestaw
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Produkty w kategorii</h2>
            <p className="text-sm text-muted-foreground">Znaleziono: {category.data.products.length}</p>
          </div>
          <Button variant="outline" render={<Link to="/produkty" />}>
            Cały katalog
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {category.data.products.map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
        </div>
      </section>
    </main>
  );
}
