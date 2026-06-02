import { Button } from "@orksys-eventownia/ui/components/button";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, Settings } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function SiteHeader() {
  const links = [
    { to: "/produkty", label: "Produkty" },
    { to: "/wynajem", label: "Wynajem" },
    { to: "/faq", label: "FAQ" },
    { to: "/kontakt", label: "Kontakt" },
  ] as const;

  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold tracking-normal">
            Eventownia
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="[&.active]:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" render={<Link to="/admin" />}>
            <Settings data-icon="inline-start" />
            Admin
          </Button>
          <Button render={<Link to="/wynajem" search={{}} />}>
            <CalendarCheck data-icon="inline-start" />
            Zapytaj o termin
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
