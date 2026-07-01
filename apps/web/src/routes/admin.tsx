import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: string } | undefined)?.role;

    if (!session.data || (role !== "admin" && role !== "superadmin")) {
      redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
        throw: true,
      });
    }
  },
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return <Outlet />;
}
