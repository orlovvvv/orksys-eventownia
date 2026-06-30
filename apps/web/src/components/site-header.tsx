import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@orksys-eventownia/ui/components/drawer";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck,
  CircleHelp,
  Cookie,
  FileText,
  Home,
  Menu,
  Package,
  Phone,
  ShieldCheck,
  ShoppingCart,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "./brand-logo";
import { ModeToggle } from "./mode-toggle";
import { useOrderCart } from "./order-cart-provider";

const desktopLinks = [
  { to: "/produkty", label: "Produkty" },
  { to: "/wynajem", label: "Wynajem" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

const primaryMobileLinks = [
  { to: "/", label: "Strona główna", icon: Home },
  { to: "/produkty", label: "Produkty", icon: Package },
  { to: "/wynajem", label: "Wynajem", icon: CalendarCheck },
  { to: "/faq", label: "FAQ", icon: CircleHelp },
  { to: "/kontakt", label: "Kontakt", icon: Phone },
] as const;

const secondaryMobileLinks = [
  { to: "/regulamin", label: "Regulamin", icon: FileText },
  { to: "/polityka-prywatnosci", label: "Prywatność", icon: ShieldCheck },
  { to: "/cookies", label: "Cookies", icon: Cookie },
] as const;

export default function SiteHeader() {
  const { itemCount } = useOrderCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const previousItemCountRef = useRef(itemCount);
  const [cartBadgePulsing, setCartBadgePulsing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (itemCount > previousItemCountRef.current) {
      setCartBadgePulsing(true);
      const timeoutId = window.setTimeout(() => setCartBadgePulsing(false), 650);
      previousItemCountRef.current = itemCount;
      return () => window.clearTimeout(timeoutId);
    }
    previousItemCountRef.current = itemCount;
  }, [itemCount]);

  return (
    <header className="sticky top-0 z-50 bg-background/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="min-w-0">
            <BrandLogo imageClassName="h-12 md:h-14" nameClassName="text-lg md:text-xl" />
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Przejdź do koszyka"
              className="relative [&_svg:not([class*='size-'])]:size-[1.2rem]"
              render={<Link to="/wynajem" search={{}} />}
            >
              <ShoppingCart />
              <CartCountBadge itemCount={itemCount} pulsing={cartBadgePulsing} floating />
            </Button>
            <ModeToggle />
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} swipeDirection="right">
              <DrawerTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Otwórz menu"
                    className="[&_svg:not([class*='size-'])]:size-[1.2rem]"
                  />
                }
              >
                <Menu />
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
                  <Link to="/" className="min-w-0" onClick={() => setMobileMenuOpen(false)}>
                    <BrandLogo
                      imageClassName="h-9"
                      nameClassName="text-sm"
                      locationClassName="text-[0.7rem]"
                      className="gap-2"
                    />
                  </Link>
                  <DrawerClose render={<Button variant="ghost" size="icon-sm" aria-label="Zamknij menu" />}>
                    <X />
                  </DrawerClose>
                </div>
                <DrawerTitle className="sr-only">Menu</DrawerTitle>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
                  <nav className="flex flex-col gap-2" aria-label="Główne menu">
                    {primaryMobileLinks.map((link) => (
                      <MobileMenuLink
                        key={link.to}
                        currentPath={pathname}
                        icon={link.icon}
                        label={link.label}
                        onNavigate={() => setMobileMenuOpen(false)}
                        to={link.to}
                      />
                    ))}
                  </nav>

                  <div className="my-5 h-px bg-border/70" />

                  <nav className="flex flex-col gap-1" aria-label="Informacje prawne">
                    {secondaryMobileLinks.map((link) => (
                      <MobileMenuLink
                        key={link.to}
                        currentPath={pathname}
                        icon={link.icon}
                        label={link.label}
                        onNavigate={() => setMobileMenuOpen(false)}
                        secondary
                        to={link.to}
                      />
                    ))}
                  </nav>
                </div>

                <div className="border-t border-border/70 p-4">
                  <Button
                    className="w-full justify-between"
                    render={<Link to="/wynajem" search={{}} onClick={() => setMobileMenuOpen(false)} />}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShoppingCart data-icon="inline-start" />
                      Przejdź do koszyka
                    </span>
                    <CartCountBadge itemCount={itemCount} pulsing={cartBadgePulsing} />
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <nav className="hidden flex-wrap items-center gap-4 text-sm text-muted-foreground md:flex md:gap-8">
          {desktopLinks.map((link) => (
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
          <Button render={<Link to="/wynajem" search={{}} />}>
            <ShoppingCart data-icon="inline-start" />
            Koszyk
            <CartCountBadge itemCount={itemCount} pulsing={cartBadgePulsing} />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

function MobileMenuLink({
  currentPath,
  icon: Icon,
  label,
  onNavigate,
  secondary = false,
  to,
}: {
  currentPath: string;
  icon: LucideIcon;
  label: string;
  onNavigate: () => void;
  secondary?: boolean;
  to: (typeof primaryMobileLinks)[number]["to"] | (typeof secondaryMobileLinks)[number]["to"];
}) {
  const active = to === "/" ? currentPath === to : currentPath === to || currentPath.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 font-semibold transition-colors",
        secondary ? "text-sm" : "text-base",
        active
          ? "border-primary/20 bg-primary/5 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <Icon data-icon="inline-start" />
      <span>{label}</span>
    </Link>
  );
}

function CartCountBadge({
  floating = false,
  itemCount,
  pulsing,
}: {
  floating?: boolean;
  itemCount: number;
  pulsing: boolean;
}) {
  if (itemCount <= 0) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "origin-center transition-[transform,box-shadow] duration-300 motion-reduce:scale-100 motion-reduce:ring-0",
        floating ? "absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[0.7rem] shadow-soft" : "",
        pulsing ? "scale-125 ring-2 ring-primary/30" : "scale-100",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {itemCount}
    </Badge>
  );
}
