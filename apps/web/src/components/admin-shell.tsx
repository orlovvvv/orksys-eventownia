import { Button } from "@orksys-eventownia/ui/components/button";
import { Separator } from "@orksys-eventownia/ui/components/separator";
import { Link } from "@tanstack/react-router";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/requests", label: "Zapytania" },
  { to: "/admin/bookings", label: "Rezerwacje" },
  { to: "/admin/calendar", label: "Kalendarz" },
  { to: "/admin/products", label: "Produkty" },
  { to: "/admin/pricing", label: "Cennik" },
  { to: "/admin/availability", label: "Dostępność" },
  { to: "/admin/payments", label: "Płatności" },
  { to: "/admin/settings", label: "Ustawienia" },
  { to: "/admin/audit", label: "Audyt" },
] as const;

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-3">
        <div>
          <div className="text-sm font-medium">Panel operatora</div>
          <div className="text-xs text-muted-foreground">Mock admin bez logowania</div>
        </div>
        <Separator />
        <nav className="flex flex-wrap gap-2 lg:flex-col">
          {adminLinks.map((link) => (
            <Button key={link.to} variant="ghost" render={<Link to={link.to} />} className="justify-start">
              {link.label}
            </Button>
          ))}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
          <Button variant="outline" render={<Link to="/" />}>
            Public site
          </Button>
        </div>
        {children}
      </section>
    </main>
  );
}
