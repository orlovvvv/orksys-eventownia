import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsLayoutRoute,
});

function AdminProductsLayoutRoute() {
  return <Outlet />;
}
