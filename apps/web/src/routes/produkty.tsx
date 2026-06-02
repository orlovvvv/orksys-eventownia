import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/produkty")({
  component: ProductsLayout,
});

function ProductsLayout() {
  return <Outlet />;
}
