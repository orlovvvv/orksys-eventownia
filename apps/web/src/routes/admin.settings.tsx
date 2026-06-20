import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Switch } from "@orksys-eventownia/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, FileText, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/status-badge";
import { notificationMetrics } from "@/lib/admin-metrics";
import { formatDateTime } from "@/lib/format";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsRoute,
});

function AdminSettingsRoute() {
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const flags = useQuery(trpc.admin.featureFlags.list.queryOptions());
  const notifications = useQuery(trpc.admin.notifications.list.queryOptions());
  const [businessName, setBusinessName] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [serviceAreaDescription, setServiceAreaDescription] = useState("");
  const [defaultBaseHours, setDefaultBaseHours] = useState(5);
  const [defaultExtraHourPercent, setDefaultExtraHourPercent] = useState(20);
  const [bookingLeadTimeHours, setBookingLeadTimeHours] = useState(24);
  const [requestExpirationDays, setRequestExpirationDays] = useState(7);
  const [paymentLinkExpirationHours, setPaymentLinkExpirationHours] = useState(48);
  const updateSettings = useMutation(trpc.admin.settings.update.mutationOptions({ onSuccess: () => {
    toast.success("Ustawienia biznesowe zapisane.");
    void queryClient.invalidateQueries();
  } }));
  const updateFlag = useMutation(trpc.admin.featureFlags.update.mutationOptions({ onSuccess: () => {
    toast.success("Flaga funkcji zaktualizowana.");
    void queryClient.invalidateQueries();
  } }));
  const resend = useMutation(trpc.admin.notifications.resend.mutationOptions({ onSuccess: () => {
    toast.success("Ponowiono wysyłkę mock.");
    void queryClient.invalidateQueries();
  } }));
  const notificationStats = notificationMetrics(notifications.data ?? []);

  useEffect(() => {
    const data = settings.data?.settings;
    if (!data) return;
    setBusinessName(data.businessName);
    setPublicPhone(data.publicPhone);
    setPublicEmail(data.publicEmail);
    setServiceAreaDescription(data.serviceAreaDescription);
    setDefaultBaseHours(data.defaultBaseHours);
    setDefaultExtraHourPercent(data.defaultExtraHourPercent);
    setBookingLeadTimeHours(data.bookingLeadTimeHours);
    setRequestExpirationDays(data.requestExpirationDays);
    setPaymentLinkExpirationHours(data.paymentLinkExpirationHours);
  }, [settings.data]);

  return (
    <AdminShell title="Ustawienia" description="Podstawowe dane firmy, domyślne reguły obsługi i systemowe przełączniki mock.">
      <div className="grid gap-4 md:grid-cols-3">
        <AdminKpiCard label="Flagi funkcji" value={flags.data?.filter((flag) => flag.enabled).length ?? 0} detail="Włączone" icon={Settings2} tone="primary" />
        <AdminKpiCard label="Powiadomienia" value={notifications.data?.length ?? 0} detail={`${notificationStats.failedCount} błędów`} icon={Bell} tone={notificationStats.failedCount ? "danger" : "neutral"} />
        <AdminKpiCard label="Dokumenty" value={settings.data?.legalDocuments.filter((doc) => doc.active).length ?? 0} detail="Aktywne wersje" icon={FileText} tone="neutral" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil biznesowy</CardTitle>
            <CardDescription>Dane widoczne w panelu i publicznych miejscach kontaktu.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field><FieldLabel>Nazwa firmy</FieldLabel><Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field><FieldLabel>Telefon</FieldLabel><Input value={publicPhone} onChange={(event) => setPublicPhone(event.target.value)} /></Field>
                <Field><FieldLabel>E-mail</FieldLabel><Input value={publicEmail} onChange={(event) => setPublicEmail(event.target.value)} /></Field>
              </div>
              <Field><FieldLabel>Obszar działania</FieldLabel><Input value={serviceAreaDescription} onChange={(event) => setServiceAreaDescription(event.target.value)} /></Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Domyślne reguły rezerwacji</CardTitle>
            <CardDescription>Wartości używane przez mock wyceny i linki płatności.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field><FieldLabel>Godziny bazowe</FieldLabel><Input type="number" value={defaultBaseHours} onChange={(event) => setDefaultBaseHours(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Extra godzina (%)</FieldLabel><Input type="number" value={defaultExtraHourPercent} onChange={(event) => setDefaultExtraHourPercent(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Lead time (h)</FieldLabel><Input type="number" value={bookingLeadTimeHours} onChange={(event) => setBookingLeadTimeHours(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Ważność zapytania (dni)</FieldLabel><Input type="number" value={requestExpirationDays} onChange={(event) => setRequestExpirationDays(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Ważność linku (h)</FieldLabel><Input type="number" value={paymentLinkExpirationHours} onChange={(event) => setPaymentLinkExpirationHours(Number(event.target.value))} /></Field>
              </div>
              <Button
                disabled={updateSettings.isPending}
                onClick={() => updateSettings.mutate({ businessName, publicPhone, publicEmail, serviceAreaDescription, defaultBaseHours, defaultExtraHourPercent, bookingLeadTimeHours, requestExpirationDays, paymentLinkExpirationHours })}
              >
                <Save data-icon="inline-start" />
                Zapisz ustawienia
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
            <CardDescription>Przełączniki demonstracyjne dla funkcji aplikacji.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {flags.data?.map((flag) => (
              <label key={flag.key} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4 text-sm">
                <span className="min-w-0">
                  <strong className="block truncate">{flag.key}</strong>
                  <span className="text-xs text-muted-foreground">{flag.description}</span>
                </span>
                <Switch checked={flag.enabled} disabled={updateFlag.isPending} onCheckedChange={(checked) => updateFlag.mutate({ key: flag.key, enabled: checked })} />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumenty prawne</CardTitle>
            <CardDescription>Aktywne wersje treści legalnych w mock state.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {settings.data?.legalDocuments.map((document) => (
              <div key={document.id} className="rounded-xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{document.title}</div>
                  <StatusBadge status={document.active ? "active" : "inactive"} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{document.type} · {document.version} · {document.publishedAt ? formatDateTime(document.publishedAt) : "nieopublikowany"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Powiadomienia mock</CardTitle>
          <CardDescription>Ostatnie wiadomości e-mail/SMS i możliwość ponowienia wysyłki.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Szablon</TableHead><TableHead>Odbiorca</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {notifications.data?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Brak powiadomień w makiecie.</TableCell></TableRow>
              ) : null}
              {notifications.data?.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.templateKey}</TableCell>
                  <TableCell>{notification.recipient}</TableCell>
                  <TableCell><StatusBadge status={notification.status} /></TableCell>
                  <TableCell>{formatDateTime(notification.createdAt)}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" disabled={resend.isPending} onClick={() => resend.mutate({ id: notification.id })}>Wyślij ponownie</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
