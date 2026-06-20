import { Input } from "@orksys-eventownia/ui/components/input";
import { Search } from "lucide-react";

export function AdminListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Szukaj...",
  children,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft ring-1 ring-white/70 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
