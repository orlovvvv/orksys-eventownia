import { Button } from "@orksys-eventownia/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ProductCard } from "@/components/product-card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/kategorie/$slug")({
  component: CategoryRoute,
});

function CategoryRoute() {
  const { slug } = Route.useParams();
  const category = useQuery(trpc.catalog.categoryBySlug.queryOptions({ slug }));

  if (!category.data) return <main className="mx-auto w-full max-w-7xl px-4 py-8">Kategoria nie znaleziona.</main>;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">{category.data.namePl}</h1>
        <p className="max-w-2xl text-sm/relaxed text-muted-foreground">{category.data.descriptionPl}</p>
        <div>
          <Button variant="outline" render={<Link to="/wynajem" search={{}} />}>Zapytaj o zestaw</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {category.data.products.map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
      </div>
    </main>
  );
}
