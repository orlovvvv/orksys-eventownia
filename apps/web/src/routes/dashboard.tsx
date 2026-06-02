import { redirect, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    redirect({ to: "/admin", throw: true });
  },
});
