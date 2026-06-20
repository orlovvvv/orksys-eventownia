import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequestsLayoutRoute,
});

function AdminRequestsLayoutRoute() {
  return <Outlet />;
}
