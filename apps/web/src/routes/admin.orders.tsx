import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersLayoutRoute,
});

function AdminOrdersLayoutRoute() {
  return <Outlet />;
}
