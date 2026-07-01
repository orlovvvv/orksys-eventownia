import type { EstimateSummary } from "@orksys-eventownia/api/mock/eventownia/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";

import { Money } from "@/components/money";

export function EstimateSummaryView({
  compact = false,
  summary,
}: {
  compact?: boolean;
  summary: EstimateSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Podsumowanie wyceny</CardTitle>
        <CardDescription>Czas wynajmu: {summary.billableHours} h</CardDescription>
      </CardHeader>
      <CardContent className={compact ? "flex flex-col gap-3" : "flex flex-col gap-5"}>
        <div className="flex flex-col gap-3">
          {summary.lines.map((line) => (
            <div key={`${line.productId}-${line.sku}`} className="rounded-xl bg-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{line.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {line.quantity} x <Money amountZloty={line.hourlyPriceZloty} />/h x {line.billableHours} h
                  </div>
                </div>
                <div className="shrink-0 font-semibold">
                  <Money amountZloty={line.lineTotalZloty} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-secondary p-4 text-secondary-foreground">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold">Produkty razem</div>
            <div className="text-xl font-bold">
              <Money amountZloty={summary.itemsSubtotalZloty} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border/70 p-4 text-sm">
          <div className="font-semibold">{summary.travel.label}</div>
          <p className="text-muted-foreground">{summary.travel.message}</p>
          <p className="text-muted-foreground">{summary.finalQuote.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
