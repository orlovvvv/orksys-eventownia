import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Settings, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "./brand-logo";
import { ModeToggle } from "./mode-toggle";
import { useOrderCart } from "./order-cart-provider";

export default function SiteHeader() {
  const { itemCount } = useOrderCart();
  const previousItemCountRef = useRef(itemCount);
  const [cartBadgePulsing, setCartBadgePulsing] = useState(false);
  const links = [
    { to: "/produkty", label: "Produkty" },
    { to: "/wynajem", label: "Wynajem" },
    { to: "/faq", label: "FAQ" },
    { to: "/kontakt", label: "Kontakt" },
  ] as const;

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
            <Button variant="outline" size="sm" render={<Link to="/wynajem" search={{}} />}>
              <ShoppingCart data-icon="inline-start" />
              Koszyk
              <CartCountBadge itemCount={itemCount} pulsing={cartBadgePulsing} />
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

function CartCountBadge({ itemCount, pulsing }: { itemCount: number; pulsing: boolean }) {
  if (itemCount <= 0) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "origin-center transition-[transform,box-shadow] duration-300 motion-reduce:scale-100 motion-reduce:ring-0",
        pulsing ? "scale-125 ring-2 ring-primary/30" : "scale-100",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {itemCount}
    </Badge>
  );
}
