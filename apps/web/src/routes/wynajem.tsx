import { createFileRoute } from "@tanstack/react-router";

import { QuoteBuilder } from "@/components/quote-builder";

export const Route = createFileRoute("/wynajem")({
  validateSearch: (search: Record<string, unknown>): { product?: string } => {
    return typeof search.product === "string" ? { product: search.product } : {};
  },
  component: RentRoute,
});

function RentRoute() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Formularz wyceny i zapytania</h1>
        <p className="max-w-2xl text-sm/relaxed text-muted-foreground">
          Pełny mock publicznego procesu: wycena, zgody, token Turnstile, zapis zapytania, powiadomienia i status publiczny.
        </p>
      </div>
      <QuoteBuilder />
    </main>
  );
}
