import { Button } from "@orksys-eventownia/ui/components/button";
import { Badge } from "@orksys-eventownia/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@orksys-eventownia/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";

import { getProductFallbackGradient, getProductImage } from "@/lib/mock-images";
import { Money } from "./money";

type ProductCardProduct = {
  id?: string;
  slug: string;
  sku: string;
  namePl: string;
  shortDescriptionPl: string;
  visualTone: string;
  category?: { slug: string; namePl: string } | null;
  assets?: { publicUrl: string | null; altTextPl: string; isPrimary: boolean }[] | null;
  pricing?: {
    quoteMode: "automatic" | "manual";
    basePriceGrosz: number | null;
    baseHours: number | null;
    extraHourPercent: number;
  } | null;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const image = getProductImage(product);

  return (
    <Card className="group min-h-full pt-0">
      <div className="relative h-52 overflow-hidden bg-muted" style={{ background: getProductFallbackGradient(product) }}>
        <img
          src={image.src}
          alt={image.alt}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.category?.namePl ? <Badge variant="outline">{product.category.namePl}</Badge> : null}
        </div>
      </div>
      <CardHeader>
        <CardTitle>{product.namePl}</CardTitle>
        <CardDescription>{product.sku}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-2 text-sm/relaxed text-muted-foreground">{product.shortDescriptionPl}</p>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-border/50 pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">od</span>
            <span className="text-2xl font-bold text-primary">
              {product.pricing?.quoteMode === "automatic" ? (
                <Money amountGrosz={product.pricing.basePriceGrosz} />
              ) : (
                "Cena do ustalenia"
              )}
            </span>
          </div>
          <Button
            size="icon"
            variant="outline"
            render={<Link to="/wynajem" search={{ product: product.sku }} aria-label={`Zapytaj o ${product.namePl}`} />}
          >
            <Plus data-icon="inline-start" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <Button variant="outline" render={<Link to="/produkty/$slug" params={{ slug: product.slug }} />}>
          Szczegóły
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button render={<Link to="/wynajem" search={{ product: product.sku }} />}>Zapytaj</Button>
      </CardFooter>
    </Card>
  );
}
