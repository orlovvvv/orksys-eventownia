import { Button } from "@orksys-eventownia/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@orksys-eventownia/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Money } from "./money";

type ProductCardProduct = {
  slug: string;
  sku: string;
  namePl: string;
  shortDescriptionPl: string;
  visualTone: string;
  category?: { namePl: string } | null;
  pricing?: {
    quoteMode: "automatic" | "manual";
    basePriceGrosz: number | null;
    baseHours: number | null;
    extraHourPercent: number;
  } | null;
};

const toneGradients: Record<string, string> = {
  amber: "linear-gradient(135deg, #f59e0b, #fef3c7)",
  blue: "linear-gradient(135deg, #2563eb, #dbeafe)",
  cyan: "linear-gradient(135deg, #0891b2, #cffafe)",
  emerald: "linear-gradient(135deg, #059669, #d1fae5)",
  indigo: "linear-gradient(135deg, #4f46e5, #e0e7ff)",
  lime: "linear-gradient(135deg, #65a30d, #ecfccb)",
  neutral: "linear-gradient(135deg, #525252, #f5f5f5)",
  orange: "linear-gradient(135deg, #ea580c, #fed7aa)",
  pink: "linear-gradient(135deg, #db2777, #fce7f3)",
  red: "linear-gradient(135deg, #dc2626, #fee2e2)",
  rose: "linear-gradient(135deg, #e11d48, #ffe4e6)",
  sky: "linear-gradient(135deg, #0284c7, #e0f2fe)",
  slate: "linear-gradient(135deg, #475569, #e2e8f0)",
  stone: "linear-gradient(135deg, #57534e, #e7e5e4)",
  teal: "linear-gradient(135deg, #0d9488, #ccfbf1)",
  violet: "linear-gradient(135deg, #7c3aed, #ede9fe)",
  yellow: "linear-gradient(135deg, #ca8a04, #fef9c3)",
  zinc: "linear-gradient(135deg, #3f3f46, #e4e4e7)",
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  return (
    <Card className="min-h-full">
      <div
        className="mx-4 h-36 border bg-muted"
        style={{
          background: toneGradients[product.visualTone] ?? toneGradients.neutral,
        }}
      >
        <div className="flex h-full items-end p-3 text-xs text-muted-foreground">
          Ilustracja produktu: {product.sku}
        </div>
      </div>
      <CardHeader>
        <CardTitle>{product.namePl}</CardTitle>
        <CardDescription>{product.category?.namePl}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-xs/relaxed text-muted-foreground">{product.shortDescriptionPl}</p>
        <div className="text-sm font-medium">
          {product.pricing?.quoteMode === "automatic" ? (
            <>
              <Money amountGrosz={product.pricing.basePriceGrosz} /> / {product.pricing.baseHours}h
            </>
          ) : (
            "Cena do ustalenia"
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button variant="outline" render={<Link to="/produkty/$slug" params={{ slug: product.slug }} />}>
          Szczegóły
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button render={<Link to="/wynajem" search={{ product: product.sku }} />}>Zapytaj</Button>
      </CardFooter>
    </Card>
  );
}
