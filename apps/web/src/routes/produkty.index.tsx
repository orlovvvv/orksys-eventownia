import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@orksys-eventownia/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orksys-eventownia/ui/components/select";
import { Slider } from "@orksys-eventownia/ui/components/slider";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/produkty/")({
  component: ProductsRoute,
});

const sortItems = [
  { label: "Rekomendowane", value: "recommended" },
  { label: "Cena rosnąco", value: "price-asc" },
  { label: "Cena malejąco", value: "price-desc" },
  { label: "Nazwa A-Z", value: "name" },
];

function ProductsRoute() {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState([300000]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = useQuery(trpc.catalog.categories.queryOptions());
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const pageSize = 6;

  const filtered = useMemo(() => {
    const items =
      products.data?.items.filter((product) => {
        if (!product) return false;
        const categoryMatches = category === "all" || product.category?.slug === category;
        const textMatches = [product.namePl, product.shortDescriptionPl, product.sku]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
        const price = product.pricing?.basePriceGrosz ?? 0;
        const priceMatches = price === 0 || price <= maxPrice[0];
        return categoryMatches && textMatches && priceMatches;
      }) ?? [];

    return items.sort((a, b) => {
      if (sort === "price-asc") {
        return (a?.pricing?.basePriceGrosz ?? Number.MAX_SAFE_INTEGER) - (b?.pricing?.basePriceGrosz ?? Number.MAX_SAFE_INTEGER);
      }
      if (sort === "price-desc") return (b?.pricing?.basePriceGrosz ?? 0) - (a?.pricing?.basePriceGrosz ?? 0);
      if (sort === "name") return (a?.namePl ?? "").localeCompare(b?.namePl ?? "", "pl");
      return (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
    });
  }, [category, maxPrice, products.data?.items, q, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setFilterCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const renderFilters = (searchId: string) => (
    <FilterControls
      categories={categories.data ?? []}
      category={category}
      maxPrice={maxPrice}
      q={q}
      searchId={searchId}
      setFilterCategory={setFilterCategory}
      setMaxPrice={(value) => {
        setMaxPrice(value);
        setPage(1);
      }}
      setQ={(value) => {
        setQ(value);
        setPage(1);
      }}
    />
  );

  return (
    <main className="mx-auto grid w-full max-w-page grid-cols-1 gap-8 px-4 py-10 md:px-6 lg:grid-cols-[300px_1fr]">
      <header className="lg:col-span-2">
        <div className="flex max-w-3xl flex-col gap-4">
          <Badge variant="secondary">Katalog</Badge>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Katalog produktów</h1>
          <p className="text-base/relaxed text-muted-foreground md:text-lg/relaxed">
            Produkty i dodatki są widoczne publicznie, ale wszystkie zapytania wymagają ręcznego
            potwierdzenia dostępności, warunków montażu i dojazdu.
          </p>
        </div>
      </header>

      <aside className="hidden lg:block">
        <Card className="sticky top-28">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Filtry</CardTitle>
            <SlidersHorizontal className="text-muted-foreground" />
          </CardHeader>
          <CardContent>{renderFilters("catalog-search-desktop")}</CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-8">
        <div className="lg:hidden">
          <Button type="button" variant="outline" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal data-icon="inline-start" />
            Filtry
          </Button>
          {filtersOpen ? (
            <Card className="mt-4">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Filtry</CardTitle>
                <SlidersHorizontal className="text-muted-foreground" />
              </CardHeader>
              <CardContent>{renderFilters("catalog-search-mobile")}</CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">Znaleziono: {filtered.length} produktów</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sortuj:</span>
            <Select items={sortItems} value={sort} onValueChange={(value) => setSort(String(value))}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts
            .filter((product): product is NonNullable<typeof product> => product !== null)
            .map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setPage(Math.max(1, currentPage - 1));
                }}
              />
            </PaginationItem>
            {[1, 2, 3].filter((item) => item <= pageCount).map((item) => (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pageCount > 3 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setPage(Math.min(pageCount, currentPage + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </section>
    </main>
  );
}

type CategoryFilter = {
  id: string;
  slug: string;
  namePl: string;
};

function FilterControls({
  categories,
  category,
  maxPrice,
  q,
  searchId,
  setFilterCategory,
  setMaxPrice,
  setQ,
}: {
  categories: CategoryFilter[];
  category: string;
  maxPrice: number[];
  q: string;
  searchId: string;
  setFilterCategory: (category: string) => void;
  setMaxPrice: (value: number[]) => void;
  setQ: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor={searchId}>Szukaj</FieldLabel>
        <Input
          id={searchId}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="nazwa, SKU"
        />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Kategoria</div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox checked={category === "all"} onCheckedChange={() => setFilterCategory("all")} />
          Wszystkie
        </label>
        {categories.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={category === item.slug}
              onCheckedChange={(checked) => setFilterCategory(checked === true ? item.slug : "all")}
            />
            {item.namePl}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Zakres cenowy</div>
        <Slider
          value={maxPrice}
          min={0}
          max={300000}
          step={5000}
          onValueChange={(value) => setMaxPrice(value as number[])}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0 zł</span>
          <span>{Math.round(maxPrice[0] / 100)} zł</span>
        </div>
      </div>
    </div>
  );
}
