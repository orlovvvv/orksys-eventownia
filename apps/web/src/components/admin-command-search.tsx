import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@orksys-eventownia/ui/components/command";
import { Button } from "@orksys-eventownia/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Gauge,
  Grid2X2,
  History,
  Package,
  Search,
  Settings,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";

const adminRoutes = [
  { to: "/admin", label: "Pulpit", description: "Najważniejsze sprawy", icon: Gauge },
  { to: "/admin/orders", label: "Zamówienia", description: "Zapytania, rezerwacje i płatności", icon: CalendarDays },
  { to: "/admin/calendar", label: "Kalendarz", description: "Realizacje i blokady", icon: Grid2X2 },
  { to: "/admin/products", label: "Produkty", description: "Asortyment i media", icon: Package },
  { to: "/admin/pricing", label: "Cennik", description: "Stawki godzinowe", icon: Tag },
  { to: "/admin/availability", label: "Dostępność", description: "Blackouty i serwis", icon: SlidersHorizontal },
  { to: "/admin/settings", label: "Ustawienia", description: "Firma, flagi i powiadomienia", icon: Settings },
  { to: "/admin/audit", label: "Audyt", description: "Historia zmian", icon: History },
] as const;

export function AdminCommandSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button variant="outline" className="h-9 w-full justify-start gap-2 text-muted-foreground md:w-72" onClick={() => setOpen(true)}>
        <Search data-icon="inline-start" />
        <span className="truncate">Szukaj w panelu...</span>
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">⌘K</span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Szukaj w panelu"
        description="Przejdź do sekcji administracyjnej."
        className="sm:max-w-lg"
      >
        <Command>
          <CommandInput placeholder="Wpisz nazwę sekcji..." />
          <CommandList>
            <CommandEmpty>Brak pasujących sekcji.</CommandEmpty>
            <CommandGroup heading="Panel">
              {adminRoutes.map((item) => (
                <CommandItem
                  key={item.to}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => {
                    setOpen(false);
                    void navigate({ to: item.to });
                  }}
                >
                  <item.icon data-icon="inline-start" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
