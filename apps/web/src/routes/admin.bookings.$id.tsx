import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/bookings/$id")({
  beforeLoad: ({ params }) => {
    redirect({ to: "/admin/orders/$id", params: { id: params.id }, throw: true });
  },
});
