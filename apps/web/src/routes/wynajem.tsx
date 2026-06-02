import { createFileRoute } from "@tanstack/react-router";

import { QuoteBuilder } from "@/components/quote-builder";

export const Route = createFileRoute("/wynajem")({
  validateSearch: (search: Record<string, unknown>): { product?: string; date?: string } => {
    return {
      ...(typeof search.product === "string" ? { product: search.product } : {}),
      ...(typeof search.date === "string" ? { date: search.date } : {}),
    };
  },
  component: RentRoute,
});

function RentRoute() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">Formularz wyceny i zapytania</h1>
        <p className="max-w-3xl text-base/relaxed text-muted-foreground">
          Pełny publiczny proces: wycena, zgody, token Turnstile, zapis zapytania, powiadomienia i
          status publiczny.
        </p>
      </div>
      <QuoteBuilder />
    </main>
  );
}
