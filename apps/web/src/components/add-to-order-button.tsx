import { Button } from "@orksys-eventownia/ui/components/button";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useOrderCart } from "@/components/order-cart-provider";
import { getCartMaxQuantity } from "@/lib/order-cart";

type AddToOrderProduct = {
  inventoryCount?: number | null;
  namePl: string;
  sku: string;
};

type AddFeedbackState = "idle" | "added" | "max-reached";

type AddToOrderButtonProps = {
  buttonClassName?: string;
  containerClassName?: string;
  iconOnly?: boolean;
  label?: string;
  product: AddToOrderProduct;
  showQuantityStatus?: boolean;
  size?: "default" | "icon" | "icon-lg" | "icon-sm" | "icon-xs" | "lg" | "sm" | "xs";
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
};

function formatCartQuantity(quantity: number) {
  return `${quantity} w koszyku`;
}

export function AddToOrderButton({
  buttonClassName,
  containerClassName,
  iconOnly = false,
  label = "Dodaj do zamówienia",
  product,
  showQuantityStatus = false,
  size = iconOnly ? "icon" : "sm",
  variant = "outline",
}: AddToOrderButtonProps) {
  const navigate = useNavigate();
  const { addItem, items } = useOrderCart();
  const [feedback, setFeedback] = useState<AddFeedbackState>("idle");
  const [announcement, setAnnouncement] = useState("");
  const resetTimerRef = useRef<number | null>(null);
  const currentQuantity = items.find((item) => item.sku === product.sku)?.quantity ?? 0;
  const maxQuantity = getCartMaxQuantity(product.inventoryCount);
  const unavailable = maxQuantity <= 0;
  const maxReached = !unavailable && currentQuantity >= maxQuantity;

  const buttonLabel = useMemo(() => {
    if (unavailable) return "Niedostępne";
    if (feedback === "added") return "Dodano";
    if (maxReached || feedback === "max-reached") return "Limit w koszyku";
    if (currentQuantity > 0) return "Dodaj kolejny";
    return label;
  }, [currentQuantity, feedback, label, maxReached, unavailable]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function flashFeedback(nextFeedback: AddFeedbackState) {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    setFeedback(nextFeedback);
    resetTimerRef.current = window.setTimeout(() => {
      setFeedback("idle");
      resetTimerRef.current = null;
    }, 1500);
  }

  function handleAddToOrder() {
    const result = addItem(product.sku, 1, { maxQuantity });

    if (result.status === "added") {
      flashFeedback("added");
      setAnnouncement(`Dodano ${product.namePl} do zamówienia. ${formatCartQuantity(result.quantity)}.`);
      toast.success("Dodano do zamówienia", {
        description: product.namePl,
        action: {
          label: "Zobacz koszyk",
          onClick: () => {
            void navigate({ to: "/wynajem" });
          },
        },
      });
      return;
    }

    if (result.status === "max-reached") {
      flashFeedback("max-reached");
      setAnnouncement(`Osiągnięto maksymalną liczbę dla ${product.namePl}. ${formatCartQuantity(result.quantity)}.`);
      toast.warning("Limit w koszyku", {
        description: `W koszyku jest już maksymalna dostępna liczba: ${result.maxQuantity} szt.`,
        action: {
          label: "Zobacz koszyk",
          onClick: () => {
            void navigate({ to: "/wynajem" });
          },
        },
      });
    }

    if (result.status === "unavailable") {
      setAnnouncement(`${product.namePl} jest obecnie niedostępny.`);
      toast.warning("Produkt niedostępny", {
        description: product.namePl,
      });
    }
  }

  const Icon = feedback === "added" ? Check : Plus;
  const quantityStatus = currentQuantity > 0 ? formatCartQuantity(currentQuantity) : "";
  const accessibleLabel =
    unavailable
      ? `${product.namePl} jest obecnie niedostępny`
      : feedback === "added"
      ? `Dodano ${product.namePl} do zamówienia. ${quantityStatus}`
      : maxReached
        ? `Limit w koszyku dla ${product.namePl}. ${quantityStatus}`
        : currentQuantity > 0
          ? `Dodaj kolejny ${product.namePl} do zamówienia. ${quantityStatus}`
          : `Dodaj ${product.namePl} do zamówienia`;

  return (
    <div
      className={cn("relative flex items-stretch", containerClassName)}
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        aria-label={accessibleLabel}
        className={buttonClassName}
        disabled={unavailable || maxReached}
        size={size}
        type="button"
        variant={variant}
        onClick={handleAddToOrder}
      >
        <Icon data-icon="inline-start" />
        {iconOnly ? (
          <span className="sr-only">{buttonLabel}</span>
        ) : (
          <>
            <span className="min-w-0 truncate">{buttonLabel}</span>
            {showQuantityStatus && currentQuantity > 0 ? (
              <span
                className="ml-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold leading-none text-primary ring-1 ring-primary/15"
                aria-hidden="true"
              >
                {currentQuantity}
              </span>
            ) : null}
          </>
        )}
      </Button>
      {showQuantityStatus && currentQuantity > 0 ? (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {quantityStatus}
        </span>
      ) : null}
      {iconOnly && currentQuantity > 0 ? (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-soft ring-2 ring-card"
          aria-hidden="true"
        >
          {currentQuantity}
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
