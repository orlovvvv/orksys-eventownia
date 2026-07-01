import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditLayoutRoute,
});

function AdminAuditLayoutRoute() {
  return <Outlet />;
}
