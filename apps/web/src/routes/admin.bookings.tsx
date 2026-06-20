import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsLayoutRoute,
});

function AdminBookingsLayoutRoute() {
  return <Outlet />;
}
