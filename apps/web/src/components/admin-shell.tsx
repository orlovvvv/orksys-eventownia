import { Button } from "@orksys-eventownia/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orksys-eventownia/ui/components/dropdown-menu";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Separator } from "@orksys-eventownia/ui/components/separator";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Gauge,
  Grid2X2,
  History,
  Home,
  Menu,
  Package,
  Search,
  Settings,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { initials } from "@/lib/admin-status";

export type AdminShellAction = {
  label: string;
  icon?: LucideIcon;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
};

type AdminShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: AdminShellAction[];
  children: React.ReactNode;
};

const adminSections = [
  {
    label: "Główne",
    links: [
      { to: "/admin", label: "Pulpit", icon: Gauge },
      { to: "/admin/orders", label: "Zamówienia", icon: CalendarDays },
      { to: "/admin/calendar", label: "Kalendarz", icon: Grid2X2 },
    ],
  },
  {
    label: "Operacje",
    links: [
      { to: "/admin/products", label: "Produkty", icon: Package },
      { to: "/admin/pricing", label: "Cennik", icon: Tag },
      { to: "/admin/availability", label: "Dostępność", icon: SlidersHorizontal },
    ],
  },
  {
    label: "System",
    links: [
      { to: "/admin/settings", label: "Ustawienia", icon: Settings },
      { to: "/admin/audit", label: "Audyt", icon: History },
    ],
  },
] as const;

export function AdminShell({ title, description, eyebrow, actions = [], children }: AdminShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const adminName = "Mock Admin";

  return (
    <div className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-border/70 bg-card lg:flex">
        <div className="flex flex-col gap-4 p-6">
          <Link to="/admin" className="min-w-0">
            <BrandLogo imageClassName="h-12" nameClassName="text-xl" />
          </Link>
          <div>
            <div className="text-sm font-semibold">Panel operatora</div>
            <div className="text-xs text-muted-foreground">Mock admin bez logowania</div>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {adminSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-2">
              <div className="px-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {section.label}
              </div>
              <div className="flex flex-col gap-1">
                {section.links.map((link) => (
                  <AdminNavLink key={link.to} currentPath={pathname} {...link} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}>
                <Menu />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel className="normal-case">
                  <BrandLogo imageClassName="h-10" nameClassName="text-sm" locationClassName="text-[0.7rem]" />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminSections.map((section) => (
                  <DropdownMenuGroup key={section.label}>
                    <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                    {section.links.map((link) => (
                      <DropdownMenuItem key={link.to} render={<Link to={link.to} />}>
                        <link.icon data-icon="inline-start" />
                        {link.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative hidden min-w-64 max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 rounded-full pl-10" placeholder="Szukaj..." />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Powiadomienia" className="relative">
                <Bell />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
              </Button>
              <Button variant="outline" render={<Link to="/" />} className="hidden md:inline-flex">
                <Home data-icon="inline-start" />
                Publiczna strona
              </Button>
              <div className="flex items-center gap-2 rounded-full bg-card px-2 py-1 shadow-soft ring-1 ring-white/70">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials(adminName)}
                </div>
                <div className="hidden pr-2 text-xs md:block">
                  <div className="font-semibold">{adminName}</div>
                  <div className="text-muted-foreground">owner</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 lg:py-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              {eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">{eyebrow}</div> : null}
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
              {description ? <p className="max-w-3xl text-base/relaxed text-muted-foreground">{description}</p> : null}
            </div>
            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <AdminShellButton key={action.label} action={action} />
                ))}
              </div>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  to,
  label,
  icon: Icon,
  currentPath,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  currentPath: string;
}) {
  const isActive = to === "/admin" ? currentPath === to : currentPath.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Link>
  );
}

function AdminShellButton({ action }: { action: AdminShellAction }) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon ? <Icon data-icon="inline-start" /> : null}
      {action.label}
    </>
  );

  if (action.to) {
    return (
      <Button variant={action.variant ?? "outline"} render={<Link to={action.to} />}>
        {content}
      </Button>
    );
  }

  return (
    <Button variant={action.variant ?? "outline"} onClick={action.onClick}>
      {content}
    </Button>
  );
}
