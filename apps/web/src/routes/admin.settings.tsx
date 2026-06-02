import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Switch } from "@orksys-eventownia/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsRoute,
});

function AdminSettingsRoute() {
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const flags = useQuery(trpc.admin.featureFlags.list.queryOptions());
  const notifications = useQuery(trpc.admin.notifications.list.queryOptions());
  const updateFlag = useMutation(trpc.admin.featureFlags.update.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  const resend = useMutation(trpc.admin.notifications.resend.mutationOptions({ onSuccess: () => queryClient.invalidateQueries() }));
  return (
    <AdminShell title="Ustawienia">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Business settings</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div>{settings.data?.settings.businessName}</div>
            <div>{settings.data?.settings.publicPhone}</div>
            <div>{settings.data?.settings.publicEmail}</div>
            <div className="text-xs text-muted-foreground">{settings.data?.settings.serviceAreaDescription}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feature flags</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {flags.data?.map((flag) => (
              <label key={flag.key} className="flex items-center justify-between gap-3 border p-2 text-xs">
                <span><strong>{flag.key}</strong><br />{flag.description}</span>
                <Switch checked={flag.enabled} onCheckedChange={(checked) => updateFlag.mutate({ key: flag.key, enabled: checked })} />
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Powiadomienia mock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Szablon</TableHead><TableHead>Odbiorca</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {notifications.data?.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.templateKey}</TableCell>
                  <TableCell>{notification.recipient}</TableCell>
                  <TableCell><StatusBadge status={notification.status} /></TableCell>
                  <TableCell><Button variant="outline" onClick={() => resend.mutate({ id: notification.id })}>Wyślij ponownie</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
