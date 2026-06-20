import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { History, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminListToolbar } from "@/components/admin-list-toolbar";
import { AdminShell } from "@/components/admin-shell";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditRoute,
});

function AdminAuditRoute() {
  const audit = useQuery(trpc.admin.auditLogs.list.queryOptions());
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = audit.data ?? [];
  const entityItems = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.entityType).filter(Boolean)));
    return [{ value: "all", label: "Encja: wszystkie" }, ...values.map((value) => ({ value, label: value }))];
  }, [rows]);
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesEntity = entityFilter === "all" || row.entityType === entityFilter;
      const searchable = [row.action, row.entityType, row.entityId, row.adminUserId].filter(Boolean).join(" ").toLowerCase();
      return matchesEntity && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [entityFilter, rows, search]);
  const selectedRow = rows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null;

  return (
    <AdminShell title="Audyt" description="Historia zmian w mock panelu operatora.">
      <AdminListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Szukaj akcji, encji, ID...">
        <Select items={entityItems} value={entityFilter} onValueChange={(value) => setEntityFilter(String(value))}>
          <SelectTrigger size="sm" className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{entityItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </AdminListToolbar>

      <Card>
        <CardHeader>
          <CardTitle>Historia akcji admina</CardTitle>
          <CardDescription>Pokazuje {filteredRows.length} z {rows.length} zdarzeń.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Czas</TableHead><TableHead>Akcja</TableHead><TableHead>Encja</TableHead><TableHead>ID</TableHead><TableHead>Zmiana</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Brak zdarzeń audytu dla filtrów.</TableCell></TableRow>
              ) : null}
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.entityType}</TableCell>
                  <TableCell>{compactId(row.entityId)}</TableCell>
                  <TableCell>{row.beforeJson || row.afterJson ? "tak" : "brak"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedId(row.id)}>
                      Szczegóły
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History data-icon="inline-start" /> Szczegóły wpisu</CardTitle>
          <CardDescription>{selectedRow ? `${selectedRow.action} · ${formatDateTime(selectedRow.createdAt)}` : "Wybierz wpis audytu."}</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedRow ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <JsonPreview title="Przed" value={selectedRow.beforeJson} />
              <JsonPreview title="Po" value={selectedRow.afterJson} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              <Search data-icon="inline-start" />
              Brak wpisu do wyświetlenia.
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function JsonPreview({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted p-4">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{title}</div>
      <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-card p-3 text-xs leading-relaxed">
        {value ? formatJson(value) : "Brak danych"}
      </pre>
    </div>
  );
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
