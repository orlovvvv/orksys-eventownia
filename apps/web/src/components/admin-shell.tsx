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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@orksys-eventownia/ui/components/tooltip";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Grid2X2,
  History,
  Home,
  Menu,
  Package,
  Settings,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminCommandSearch } from "@/components/admin-command-search";
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

const sidebarStorageKey = "eventownia.admin.sidebarCollapsed";

export function AdminShell({ title, description, eyebrow, actions = [], children }: AdminShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const adminName = "Mock Admin";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(sidebarStorageKey) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(sidebarStorageKey, String(next));
      return next;
    });
  }

  return (
    <TooltipProvider>
      <div className={cn("min-h-svh bg-background text-foreground lg:grid", collapsed ? "lg:grid-cols-[68px_1fr]" : "lg:grid-cols-[240px_1fr]")}>
        <aside className="sticky top-0 hidden h-svh flex-col border-r border-border/70 bg-card lg:flex">
          <div className={cn("flex h-14 items-center border-b border-border/70 px-3", collapsed ? "justify-center" : "justify-between gap-3")}>
            <Link to="/admin" className="min-w-0">
              <BrandLogo
                showLocation={!collapsed}
                imageClassName={collapsed ? "h-9" : "h-9"}
                nameClassName={collapsed ? "sr-only" : "text-base"}
                locationClassName={collapsed ? "sr-only" : "text-xs"}
              />
            </Link>
            {!collapsed ? (
              <Button variant="ghost" size="icon-sm" onClick={toggleCollapsed} aria-label="Zwiń panel">
                <ChevronLeft />
              </Button>
            ) : null}
          </div>

          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
            {collapsed ? (
              <Button variant="ghost" size="icon-sm" onClick={toggleCollapsed} aria-label="Rozwiń panel" className="mx-auto">
                <ChevronRight />
              </Button>
            ) : null}
            {adminSections.map((section) => (
              <div key={section.label} className="flex flex-col gap-1.5">
                {!collapsed ? (
                  <div className="px-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    {section.label}
                  </div>
                ) : null}
                <div className="flex flex-col gap-1">
                  {section.links.map((link) => (
                    <AdminNavLink key={link.to} currentPath={pathname} collapsed={collapsed} {...link} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className={cn("border-t border-border/70 p-3", collapsed ? "flex justify-center" : "flex items-center gap-2")}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              {initials(adminName)}
            </div>
            {!collapsed ? (
              <div className="min-w-0 text-xs">
                <div className="truncate font-semibold">{adminName}</div>
                <div className="truncate text-muted-foreground">owner</div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center gap-2 px-4 md:px-6">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" className="lg:hidden" />}>
                  <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel className="normal-case">
                    <BrandLogo imageClassName="h-9" nameClassName="text-sm" locationClassName="text-[0.7rem]" />
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

              <AdminCommandSearch />

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" aria-label="Powiadomienia">
                  <Bell />
                </Button>
                <Button variant="outline" render={<Link to="/" />} className="hidden md:inline-flex">
                  <Home data-icon="inline-start" />
                  Publiczna strona
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                {eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">{eyebrow}</div> : null}
                <h1 className="text-xl font-semibold leading-tight md:text-2xl">{title}</h1>
                {description ? <p className="max-w-3xl text-sm/relaxed text-muted-foreground">{description}</p> : null}
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
    </TooltipProvider>
  );
}

function AdminNavLink({
  to,
  label,
  icon: Icon,
  currentPath,
  collapsed,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  currentPath: string;
  collapsed: boolean;
}) {
  const isActive = to === "/admin" ? currentPath === to : currentPath.startsWith(to);
  const link = (
    <Link
      to={to}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors",
        collapsed ? "justify-center" : "justify-start",
        isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <Icon data-icon="inline-start" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
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
