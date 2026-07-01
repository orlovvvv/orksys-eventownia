import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/requests/")({
  beforeLoad: () => {
    redirect({ to: "/admin/orders", throw: true });
  },
});
