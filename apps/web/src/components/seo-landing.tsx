import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ProductCard } from "@/components/product-card";
import { getLandingPage } from "@/lib/landing-pages";
import { trpc } from "@/utils/trpc";

export function SeoLanding({ path }: { path: string }) {
  const page = getLandingPage(path);
  const category = useQuery(
    trpc.catalog.categoryBySlug.queryOptions({ slug: page?.categorySlug ?? "dmuchane-zjezdzalnie" }),
  );
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-normal">{page?.title}</h1>
        <p className="max-w-2xl text-sm/relaxed text-muted-foreground">{page?.description}</p>
        <div><Button render={<Link to="/wynajem" search={{}} />}>Zapytaj o dostępność</Button></div>
      </div>
      <Alert>
        <AlertTitle>SEO landing mock</AlertTitle>
        <AlertDescription>Strona zawiera oryginalny placeholder copy, notatkę o obszarze działania i CTA do zapytania.</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {category.data?.products.slice(0, 3).map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
      </div>
    </main>
  );
}
