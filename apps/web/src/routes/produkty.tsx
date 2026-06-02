import { Button } from "@orksys-eventownia/ui/components/button";
import { Field, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/produkty")({
  component: ProductsRoute,
});

function ProductsRoute() {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const categories = useQuery(trpc.catalog.categories.queryOptions());
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const filtered = useMemo(
    () =>
      products.data?.items.filter((product) => {
        if (!product) return false;
        const categoryMatches = category === "all" || product.category?.slug === category;
        const textMatches = [product.namePl, product.shortDescriptionPl, product.sku].join(" ").toLowerCase().includes(q.toLowerCase());
        return categoryMatches && textMatches;
      }) ?? [],
    [category, products.data?.items, q],
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Katalog produktów</h1>
        <p className="max-w-2xl text-sm/relaxed text-muted-foreground">
          Produkty i dodatki są widoczne publicznie, ale wszystkie zapytania wymagają ręcznego potwierdzenia dostępności.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="q">Szukaj</FieldLabel>
            <Input id="q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="nazwa, SKU" />
          </Field>
          <div className="flex flex-wrap gap-2 md:flex-col">
            <Button variant={category === "all" ? "default" : "outline"} onClick={() => setCategory("all")}>Wszystkie</Button>
            {categories.data?.map((item) => (
              <Button key={item.id} variant={category === item.slug ? "default" : "outline"} onClick={() => setCategory(item.slug)}>
                {item.namePl}
              </Button>
            ))}
          </div>
        </aside>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered
            .filter((product): product is NonNullable<typeof product> => product !== null)
            .map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      </div>
    </main>
  );
}
