import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { DatePicker } from "@orksys-eventownia/ui/components/date-picker";
import { Field, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, ChevronRight, Plug, Ruler, Users } from "lucide-react";
import { useState } from "react";

import { AddToOrderButton } from "@/components/add-to-order-button";
import { Money } from "@/components/money";
import { useOrderCart } from "@/components/order-cart-provider";
import { todayPlus } from "@/lib/format";
import { getCartMaxQuantity } from "@/lib/order-cart";
import {
  getProductFallbackGradient,
  getProductGallery,
  getProductHighlights,
  getProductSpecs,
} from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailRoute,
});

const specIcons = [Ruler, Plug, Users, Calendar] as const;

function ProductDetailRoute() {
  const { slug } = Route.useParams();
  const product = useQuery(trpc.catalog.productBySlug.queryOptions({ slug }));
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const { addItem } = useOrderCart();
  const [rentalDate, setRentalDate] = useState(todayPlus(14));
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product.data) {
    return <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">Produkt nie znaleziony.</main>;
  }

  const productData = product.data;
  const maxQuantity = getCartMaxQuantity(productData.inventoryCount);
  const unavailable = maxQuantity <= 0;
  const gallery = getProductGallery(productData);
  const selectedImage = gallery[selectedImageIndex] ?? gallery[0];
  const specs = getProductSpecs(productData);
  const highlights = getProductHighlights(productData);
  const addonProducts =
    (products.data?.items ?? [])
      .flatMap((item) => (!item || item.productType === "rental_product" ? [] : [item]))
      .slice(0, 3);
  const price = <><Money amountZloty={productData.pricing?.hourlyPriceZloty} />/h</>;

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-12 px-4 py-10 md:px-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/">
          Strona główna
        </Link>
        <ChevronRight />
        <Link to="/products">
          Katalog
        </Link>
        <ChevronRight />
        <span className="font-semibold text-foreground">{productData.category?.namePl}</span>
      </nav>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-container-high shadow-soft"
            style={{ background: getProductFallbackGradient(productData) }}
          >
            <img src={selectedImage.src} alt={selectedImage.alt} className="size-full object-cover" />
            <Badge variant="outline" className="absolute left-4 top-4 bg-card/90">
              Bestseller
            </Badge>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto px-1 py-1">
            {gallery.slice(0, 4).map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                aria-label={`Pokaż zdjęcie ${index + 1}`}
                aria-pressed={selectedImageIndex === index}
                className={[
                  "size-24 shrink-0 rounded-2xl border-2 bg-surface-container-low p-1 shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  selectedImageIndex === index ? "border-primary" : "border-transparent",
                ].join(" ")}
                onClick={() => setSelectedImageIndex(index)}
              >
                <span className="block size-full overflow-hidden rounded-xl">
                  <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-7 lg:col-span-5">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">{productData.namePl}</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{price}</span>
            </div>
            <p className="text-base/relaxed text-muted-foreground">{productData.longDescriptionPl}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rezerwacja</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="rental-date">Data wynajmu</FieldLabel>
                <DatePicker
                  id="rental-date"
                  value={rentalDate}
                  min={todayPlus(1)}
                  onValueChange={setRentalDate}
                />
              </Field>
              {unavailable ? (
                <Button disabled type="button">
                  Chwilowo niedostępne
                </Button>
              ) : (
                <Button
                  render={<Link to="/cart" search={{ date: rentalDate }} />}
                  onClick={() => addItem(productData.sku, 1, { maxQuantity })}
                >
                  Sprawdź dostępność
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
              <p className="text-center text-sm text-muted-foreground">Nie pobieramy opłaty z góry.</p>
            </CardContent>
          </Card>

          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-primary" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold">Specyfikacja techniczna</h2>
          <div className="hidden h-px flex-1 bg-border sm:block" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {specs.map((spec, index) => {
            const Icon = specIcons[index] ?? Calendar;
            return (
              <Card key={spec.label} size="sm">
                <CardContent className="flex flex-col gap-4 pt-1">
                  <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{spec.label}</div>
                    <div className="text-xl font-semibold">{spec.value}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold">Polecane dodatki</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {addonProducts.map((addon) => {
            const image = getProductGallery(addon)[0];
            return (
              <Card key={addon.sku} size="sm">
                <CardContent className="flex items-center gap-4 pt-1">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low text-muted-foreground">
                    {image ? <img src={image.src} alt={image.alt} className="size-full object-cover" /> : <Plug />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{addon.namePl}</div>
                    <div className="text-sm text-muted-foreground">
                      <Money amountZloty={addon.pricing?.hourlyPriceZloty} />/h
                    </div>
                  </div>
                  <AddToOrderButton iconOnly product={addon} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
