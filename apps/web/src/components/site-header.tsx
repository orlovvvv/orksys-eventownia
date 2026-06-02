import { Button } from "@orksys-eventownia/ui/components/button";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, Grid2X2, Settings } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function SiteHeader() {
  const links = [
    { to: "/produkty", label: "Produkty" },
    { to: "/wynajem", label: "Wynajem" },
    { to: "/faq", label: "FAQ" },
    { to: "/kontakt", label: "Kontakt" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-background/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Grid2X2 data-icon="inline-start" />
            Eventownia
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="outline" size="sm" render={<Link to="/wynajem" search={{}} />}>
              Zapytaj
            </Button>
            <ModeToggle />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground md:gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="border-b-2 border-transparent pb-1 [&.active]:border-primary [&.active]:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" render={<Link to="/admin" />}>
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
