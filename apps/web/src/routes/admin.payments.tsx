import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/payments")({
  beforeLoad: () => {
    redirect({ to: "/admin/orders", throw: true });
  },
});
