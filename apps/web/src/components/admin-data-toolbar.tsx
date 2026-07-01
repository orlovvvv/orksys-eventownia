import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@orksys-eventownia/ui/components/input-group";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Search } from "lucide-react";

export function AdminDataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Szukaj…",
  searchName = "admin-search",
  searchAriaLabel,
  searchAutoComplete = "off",
  children,
  actions,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchName?: string;
  searchAriaLabel?: string;
  searchAutoComplete?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
        {onSearchChange ? (
          <InputGroup className="md:max-w-sm">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={searchAriaLabel ?? searchPlaceholder}
              autoComplete={searchAutoComplete}
              name={searchName}
              value={searchValue ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </InputGroup>
        ) : null}
        {children ? <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
