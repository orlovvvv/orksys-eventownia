import { Button } from "@orksys-eventownia/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Switch } from "@orksys-eventownia/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, FileText, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminEmptyState } from "@/components/admin-empty-state";
import { AdminMetricStrip } from "@/components/admin-metric-strip";
import {
  AdminSection,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
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
  const [bookingLeadTimeHours, setBookingLeadTimeHours] = useState(24);
  const [requestExpirationDays, setRequestExpirationDays] = useState(7);
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
    setBookingLeadTimeHours(data.bookingLeadTimeHours);
    setRequestExpirationDays(data.requestExpirationDays);
  }, [settings.data]);

  return (
    <AdminShell title="Ustawienia" description="Dane firmy, domyślne reguły obsługi i systemowe przełączniki mock.">
      <AdminMetricStrip
        metrics={[
          { label: "Flagi funkcji", value: flags.data?.filter((flag) => flag.enabled).length ?? 0, detail: "Włączone", icon: Settings2, tone: "primary" },
          { label: "Powiadomienia", value: notifications.data?.length ?? 0, detail: `${notificationStats.failedCount} błędów`, icon: Bell, tone: notificationStats.failedCount ? "danger" : "neutral" },
          { label: "Dokumenty", value: settings.data?.legalDocuments.filter((doc) => doc.active).length ?? 0, detail: "Aktywne wersje", icon: FileText },
        ]}
        className="xl:grid-cols-3"
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Profil biznesowy</AdminSectionTitle>
              <AdminSectionDescription>Dane widoczne w panelu i publicznych miejscach kontaktu.</AdminSectionDescription>
            </div>
          </AdminSectionHeader>
          <AdminSectionContent>
            <FieldGroup>
              <Field><FieldLabel>Nazwa firmy</FieldLabel><Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field><FieldLabel>Telefon</FieldLabel><Input value={publicPhone} onChange={(event) => setPublicPhone(event.target.value)} /></Field>
                <Field><FieldLabel>E-mail</FieldLabel><Input value={publicEmail} onChange={(event) => setPublicEmail(event.target.value)} /></Field>
              </div>
              <Field><FieldLabel>Obszar działania</FieldLabel><Input value={serviceAreaDescription} onChange={(event) => setServiceAreaDescription(event.target.value)} /></Field>
            </FieldGroup>
          </AdminSectionContent>
        </AdminSection>

        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Domyślne reguły rezerwacji</AdminSectionTitle>
              <AdminSectionDescription>Wartości używane przez mock wyceny i ręczne potwierdzenie rezerwacji.</AdminSectionDescription>
            </div>
          </AdminSectionHeader>
          <AdminSectionContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field><FieldLabel>Lead time (h)</FieldLabel><Input type="number" value={bookingLeadTimeHours} onChange={(event) => setBookingLeadTimeHours(Number(event.target.value))} /></Field>
                <Field><FieldLabel>Ważność zapytania (dni)</FieldLabel><Input type="number" value={requestExpirationDays} onChange={(event) => setRequestExpirationDays(Number(event.target.value))} /></Field>
              </div>
              <Button
                disabled={updateSettings.isPending}
                onClick={() => updateSettings.mutate({ businessName, publicPhone, publicEmail, serviceAreaDescription, bookingLeadTimeHours, requestExpirationDays })}
              >
                <Save data-icon="inline-start" />
                Zapisz ustawienia
              </Button>
            </FieldGroup>
          </AdminSectionContent>
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Feature flags</AdminSectionTitle>
              <AdminSectionDescription>Przełączniki demonstracyjne dla funkcji aplikacji.</AdminSectionDescription>
            </div>
          </AdminSectionHeader>
          <AdminSectionContent className="grid gap-2 md:grid-cols-2">
            {flags.data?.map((flag) => (
              <label key={flag.key} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3 text-sm">
                <span className="min-w-0">
                  <strong className="block truncate">{flag.key}</strong>
                  <span className="text-xs text-muted-foreground">{flag.description}</span>
                </span>
                <Switch checked={flag.enabled} disabled={updateFlag.isPending} onCheckedChange={(checked) => updateFlag.mutate({ key: flag.key, enabled: checked })} />
              </label>
            ))}
          </AdminSectionContent>
        </AdminSection>

        <AdminSection>
          <AdminSectionHeader>
            <div>
              <AdminSectionTitle>Dokumenty prawne</AdminSectionTitle>
              <AdminSectionDescription>Aktywne wersje treści legalnych w mock state.</AdminSectionDescription>
            </div>
          </AdminSectionHeader>
          <AdminSectionContent className="flex flex-col gap-2">
            {settings.data?.legalDocuments.map((document) => (
              <div key={document.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{document.title}</div>
                  <StatusBadge status={document.active ? "active" : "inactive"} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{document.type} · {document.version} · {document.publishedAt ? formatDateTime(document.publishedAt) : "nieopublikowany"}</div>
              </div>
            ))}
          </AdminSectionContent>
        </AdminSection>
      </div>

      <AdminSection>
        <AdminSectionHeader>
          <div>
            <AdminSectionTitle>Powiadomienia mock</AdminSectionTitle>
            <AdminSectionDescription>Ostatnie wiadomości e-mail/SMS i możliwość ponowienia wysyłki.</AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="p-0">
          {notifications.data?.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState icon={Bell} title="Brak powiadomień" description="Nie ma powiadomień w mock state." />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Szablon</TableHead><TableHead>Odbiorca</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
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
              </div>
              <div className="grid gap-2 p-3 md:hidden">
                {notifications.data?.map((notification) => (
                  <div key={notification.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{notification.templateKey}</div>
                        <div className="truncate text-xs text-muted-foreground">{notification.recipient}</div>
                      </div>
                      <StatusBadge status={notification.status} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</div>
                    <Button className="mt-3" variant="outline" size="sm" disabled={resend.isPending} onClick={() => resend.mutate({ id: notification.id })}>Wyślij ponownie</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </AdminSectionContent>
      </AdminSection>
    </AdminShell>
  );
}
