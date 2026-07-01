import { Button } from "@orksys-eventownia/ui/components/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@orksys-eventownia/ui/components/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { ToggleGroup, ToggleGroupItem } from "@orksys-eventownia/ui/components/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";

import { AuditChangeBadge, AuditDuplicateBadge } from "@/components/admin-audit-detail";
import { AdminDataToolbar } from "@/components/admin-data-toolbar";
import { AdminEmptyState } from "@/components/admin-empty-state";
import {
  AdminSection,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionHeader,
  AdminSectionTitle,
} from "@/components/admin-section";
import { AdminShell } from "@/components/admin-shell";
import {
  buildAuditDisplayRows,
  filterAuditDisplayRows,
  paginateAuditRows,
  type AuditDisplayRow,
  type AuditViewMode,
} from "@/lib/audit-display";
import { compactId } from "@/lib/admin-status";
import { formatDateTime } from "@/lib/format";
import { trpc } from "@/utils/trpc";

type AuditSearch = {
  q?: string;
  entity: string;
  mode: AuditViewMode;
  page: number;
};

const pageSize = 25;
const auditDefaultSearch = { entity: "all", mode: "grouped" as const, page: 1 };

export const Route = createFileRoute("/admin/audit/")({
  validateSearch: (search: Record<string, unknown>): AuditSearch => {
    const rawPage = typeof search.page === "string" ? Number(search.page) : Number(search.page ?? 1);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    return {
      ...(typeof search.q === "string" && search.q.trim() ? { q: search.q } : {}),
      entity: typeof search.entity === "string" && search.entity ? search.entity : "all",
      mode: search.mode === "raw" ? "raw" : "grouped",
      page,
    };
  },
  component: AdminAuditRoute,
});

function AdminAuditRoute() {
  const audit = useQuery(trpc.admin.auditLogs.list.queryOptions());
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const rows = audit.data ?? [];
  const displayRows = useMemo(() => buildAuditDisplayRows(rows, searchParams.mode), [rows, searchParams.mode]);
  const entityItems = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.entityType).filter(Boolean)));
    return [{ value: "all", label: "Encja: wszystkie" }, ...values.map((value) => ({ value, label: value }))];
  }, [rows]);
  const filteredRows = useMemo(
    () => filterAuditDisplayRows(displayRows, { q: searchParams.q, entity: searchParams.entity }),
    [displayRows, searchParams.entity, searchParams.q],
  );
  const { currentPage, pageCount, pageRows } = paginateAuditRows(filteredRows, searchParams.page, pageSize);
  const hiddenDuplicateCount = searchParams.mode === "grouped" ? rows.length - displayRows.length : 0;

  function updateSearch(next: Partial<AuditSearch>) {
    void navigate({
      search: {
        ...searchParams,
        ...next,
      },
    });
  }

  function setPage(page: number) {
    updateSearch({ page: Math.min(Math.max(page, 1), pageCount) });
  }

  return (
    <AdminShell title="Audyt" description="Historia zmian w mock panelu operatora.">
      <AdminDataToolbar
        searchValue={searchParams.q ?? ""}
        onSearchChange={(value) => updateSearch({ q: value || undefined, page: 1 })}
        searchPlaceholder="Szukaj akcji, encji, ID…"
        searchName="audit-search"
        searchAriaLabel="Szukaj zdarzeń audytu"
      >
        <Select
          items={entityItems}
          value={searchParams.entity}
          onValueChange={(value) => updateSearch({ entity: String(value), page: 1 })}
        >
          <SelectTrigger aria-label="Filtr encji audytu" size="sm" className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {entityItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <ToggleGroup
          aria-label="Tryb widoku audytu"
          value={[searchParams.mode]}
          onValueChange={(value) => {
            if (value[0]) updateSearch({ mode: value[0] as AuditViewMode, page: 1 });
          }}
          spacing={1}
          className="flex-wrap"
        >
          <ToggleGroupItem value="grouped" variant="outline" size="sm">
            Grupowane
          </ToggleGroupItem>
          <ToggleGroupItem value="raw" variant="outline" size="sm">
            Surowe
          </ToggleGroupItem>
        </ToggleGroup>
      </AdminDataToolbar>

      <AdminSection>
        <AdminSectionHeader>
          <div className="min-w-0">
            <AdminSectionTitle>Historia akcji admina</AdminSectionTitle>
            <AdminSectionDescription>
              Pokazuje {filteredRows.length} z {displayRows.length} wpisów
              {searchParams.mode === "grouped" ? ` · Ukryto ${hiddenDuplicateCount} duplikatów` : ""}.
            </AdminSectionDescription>
          </div>
        </AdminSectionHeader>
        <AdminSectionContent className="p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState icon={Search} title="Brak zdarzeń" description="Nie znaleziono zdarzeń audytu dla filtrów." />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Czas</TableHead>
                      <TableHead>Akcja</TableHead>
                      <TableHead>Encja</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Zmiana</TableHead>
                      <TableHead>Duplikaty</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="tabular-nums">{formatDateTime(row.lastSeenAt)}</TableCell>
                        <TableCell className="max-w-[13rem]">
                          <span className="block truncate font-medium" title={row.action}>
                            {row.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[9rem]">
                          <span className="block truncate" title={row.entityType}>
                            {row.entityType}
                          </span>
                        </TableCell>
                        <TableCell>{compactId(row.entityId)}</TableCell>
                        <TableCell>
                          <AuditChangeBadge hasChange={row.hasChange} />
                        </TableCell>
                        <TableCell>
                          <AuditDuplicateBadge duplicateCount={row.duplicateCount} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            render={<Link to="/admin/audit/$id" params={{ id: row.id }} search={auditDefaultSearch} />}
                          >
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-0 divide-y divide-border/70 md:hidden">
                {pageRows.map((row) => (
                  <AuditMobileCard key={row.id} row={row} />
                ))}
              </div>
            </>
          )}
        </AdminSectionContent>
        {filteredRows.length > pageSize ? (
          <div className="border-t border-border/70 px-3 py-3">
            <AuditPagination currentPage={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        ) : null}
      </AdminSection>
    </AdminShell>
  );
}

function AuditPagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount]))
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b);

  return (
    <Pagination>
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onPageChange(currentPage - 1);
            }}
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {visiblePages.map((page, index) => (
          <PaginationItem key={page}>
            {index > 0 && visiblePages[index - 1] !== page - 1 ? <PaginationEllipsis /> : null}
            <PaginationLink
              href="#"
              isActive={page === currentPage}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(page);
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onPageChange(currentPage + 1);
            }}
            aria-disabled={currentPage === pageCount}
            className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function AuditMobileCard({
  row,
}: {
  row: AuditDisplayRow;
}) {
  return (
    <div className="grid gap-3 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold" title={row.action}>
            {row.action}
          </div>
          <div className="mt-1 text-xs tabular-nums text-muted-foreground">{formatDateTime(row.lastSeenAt)}</div>
        </div>
        <AuditDuplicateBadge duplicateCount={row.duplicateCount} />
      </div>
      <div className="grid min-w-0 gap-1 text-sm text-muted-foreground">
        <div className="min-w-0 truncate">
          <span className="font-medium text-foreground">{row.entityType}</span> · {compactId(row.entityId)}
        </div>
        <div>
          <AuditChangeBadge hasChange={row.hasChange} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" render={<Link to="/admin/audit/$id" params={{ id: row.id }} search={auditDefaultSearch} />}>
          Szczegóły
        </Button>
      </div>
    </div>
  );
}
