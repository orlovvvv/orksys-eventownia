import { createFileRoute } from "@tanstack/react-router";

import { QuoteBuilder } from "@/components/quote-builder";

const steps = ["koszyk", "wydarzenie", "kontakt", "podsumowanie"] as const;
type OrderStep = (typeof steps)[number];

function isOrderStep(value: unknown): value is OrderStep {
  return typeof value === "string" && steps.includes(value as OrderStep);
}

export const Route = createFileRoute("/wynajem")({
  validateSearch: (search: Record<string, unknown>): { product?: string; date?: string; step?: OrderStep } => {
    return {
      ...(typeof search.product === "string" ? { product: search.product } : {}),
      ...(typeof search.date === "string" ? { date: search.date } : {}),
      ...(isOrderStep(search.step) ? { step: search.step } : {}),
    };
  },
  component: RentRoute,
});

function RentRoute() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
      <QuoteBuilder />
    </main>
  );
}
