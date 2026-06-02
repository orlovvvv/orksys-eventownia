import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { getLandingPage } from "@/lib/landing-pages";
import { getCategoryImage } from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

export function SeoLanding({ path }: { path: string }) {
  const page = getLandingPage(path);
  const category = useQuery(
    trpc.catalog.categoryBySlug.queryOptions({ slug: page?.categorySlug ?? "dmuchane-zjezdzalnie" }),
  );
  const image = getCategoryImage(page?.categorySlug ?? "dmuchane-zjezdzalnie");

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-10 px-4 py-10 md:px-6">
      <section className="relative min-h-80 overflow-hidden rounded-3xl bg-surface-container-high shadow-soft">
        <img src={image.src} alt={image.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface/80 to-transparent" />
        <div className="relative flex min-h-80 max-w-3xl flex-col justify-end gap-4 p-8 text-primary-foreground md:p-12">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{page?.title}</h1>
          <p className="text-base/relaxed text-primary-foreground/85">{page?.description}</p>
          <div>
            <Button render={<Link to="/wynajem" search={{}} />}>
              Zapytaj o dostępność
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>
      <Alert>
        <AlertTitle>Oferta z ręcznym potwierdzeniem</AlertTitle>
        <AlertDescription>
          Dostępność, dojazd i warunki montażu są potwierdzane przed finalną rezerwacją.
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {category.data?.products.slice(0, 3).map((product) => (product ? <ProductCard key={product.id} product={product} /> : null))}
      </div>
    </main>
  );
}
