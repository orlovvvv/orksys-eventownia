import { createFileRoute } from "@tanstack/react-router";

import { OrderBuilder } from "@/components/order-builder";

export const Route = createFileRoute("/cart")({
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
      <OrderBuilder />
    </main>
  );
}
