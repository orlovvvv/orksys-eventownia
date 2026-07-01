import { Badge } from "@orksys-eventownia/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@orksys-eventownia/ui/components/card";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { AddToOrderButton } from "@/components/add-to-order-button";
import { getProductFallbackGradient, getProductImage } from "@/lib/mock-images";
import { Money } from "./money";

export type ProductCardProduct = {
  id?: string;
  slug: string;
  sku: string;
  namePl: string;
  shortDescriptionPl: string;
  inventoryCount?: number;
  visualTone: string;
  category?: { slug: string; namePl: string } | null;
  assets?: { publicUrl: string | null; altTextPl: string; isPrimary: boolean }[] | null;
  pricing?: {
    hourlyPriceZloty: number;
  } | null;
};

export type ProductCardViewProps = {
  addControl: React.ReactNode;
  detailsLink: React.ReactElement<{ className?: string }>;
  product: ProductCardProduct;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  return (
    <ProductCardView
      product={product}
      addControl={
        <AddToOrderButton
          buttonClassName="w-full"
          containerClassName="relative z-20 w-full sm:w-auto md:w-full 2xl:w-auto"
          product={product}
          showQuantityStatus
        />
      }
      detailsLink={
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          aria-label={`Zobacz szczegóły: ${product.namePl}`}
        />
      }
    />
  );
}

export function ProductCardView({
  addControl,
  detailsLink,
  product,
}: ProductCardViewProps) {
  const image = getProductImage(product);

  return (
    <Card className="group relative min-h-full pt-0">
      {React.cloneElement(detailsLink, {
        className: "absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
      })}
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
        <div className="mt-auto flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-end sm:justify-between md:flex-col md:items-stretch 2xl:flex-row 2xl:items-end">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-primary">
              <Money amountZloty={product.pricing?.hourlyPriceZloty} />/h
            </span>
          </div>
          {addControl}
        </div>
      </CardContent>
    </Card>
  );
}
