import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@orksys-eventownia/ui/components/alert-dialog";
import { Badge } from "@orksys-eventownia/ui/components/badge";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { DatePicker } from "@orksys-eventownia/ui/components/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Separator } from "@orksys-eventownia/ui/components/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orksys-eventownia/ui/components/select";
import { Switch } from "@orksys-eventownia/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { TimePicker } from "@orksys-eventownia/ui/components/time-picker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { Category, PriceRule, Product, ProductAsset } from "@orksys-eventownia/api/mock/eventownia/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Info,
  Minus,
  PackageOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import { useOrderCart } from "@/components/order-cart-provider";
import { clampCartQuantity, MAX_CART_QUANTITY } from "@/lib/order-cart";
import { formatMoney, todayPlus } from "@/lib/format";
import { getProductFallbackGradient, getProductImage } from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

type Step = "koszyk" | "wydarzenie" | "kontakt" | "podsumowanie";

type CartSearch = {
  product?: string;
  date?: string;
  step?: Step;
};

type CatalogProduct = Product & {
  assets: ProductAsset[];
  category: Category | null;
  pricing: PriceRule | null;
};

type CartRow = {
  sku: string;
  quantity: number;
  product: CatalogProduct | null;
};

type QuoteResult = {
  id: string;
  lines: {
    sku: string;
    name: string;
    quantity: number;
    lineTotalGrosz: number | null;
  }[];
  subtotalGrosz: number;
  travelFee: {
    label: string;
  };
  totalEstimateGrosz: number | null;
};

const steps: { id: Step; label: string }[] = [
  { id: "koszyk", label: "Koszyk" },
  { id: "wydarzenie", label: "Wydarzenie" },
  { id: "kontakt", label: "Kontakt" },
  { id: "podsumowanie", label: "Podsumowanie" },
];

const surfaceOptions = [
  { label: "Trawa", value: "grass" },
  { label: "Kostka / beton", value: "hard_surface" },
  { label: "Hala / wnętrze", value: "indoor" },
  { label: "Do ustalenia", value: "unknown" },
];

function isStep(value: unknown): value is Step {
  return typeof value === "string" && steps.some((step) => step.id === value);
}

function getMaxQuantity(product: CatalogProduct | null) {
  if (!product?.inventoryCount) return MAX_CART_QUANTITY;
  return Math.max(1, Math.min(product.inventoryCount, MAX_CART_QUANTITY));
}

function getBaseLineAmount(product: CatalogProduct | null, quantity: number) {
  if (!product?.pricing || product.pricing.quoteMode !== "automatic" || product.pricing.basePriceGrosz === null) {
    return null;
  }
  return product.pricing.basePriceGrosz * quantity;
}

function formatSummaryAmount(amountGrosz: number, hasManualItems: boolean) {
  if (hasManualItems) {
    return amountGrosz > 0 ? `${formatMoney(amountGrosz)} + wycena indywidualna` : "wycena indywidualna";
  }
  return formatMoney(amountGrosz);
}

function quoteItemKey(items: { sku: string; quantity: number }[]) {
  return items.map((item) => `${item.sku}:${item.quantity}`).join("|");
}

export function QuoteBuilder() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as CartSearch;
  const { addItem, clearCart, items, itemCount, removeItem, setQuantity } = useOrderCart();
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const handledSearchProductRef = useRef<string | null>(null);
  const [step, setStep] = useState<Step>(isStep(search.step) ? search.step : "koszyk");
  const [calculatedQuoteKey, setCalculatedQuoteKey] = useState<string | null>(null);
  const [event, setEvent] = useState({
    date: search.date ?? todayPlus(14),
    startTime: "12:00",
    durationHours: 7,
    city: "Kraków",
    postalCode: "30-001",
    street: "ul. Testowa 1",
    surfaceType: "grass",
    powerAvailable: true,
    accessNotes: "Dostęp do gniazdka 230V, montaż na trawie.",
  });
  const [customer, setCustomer] = useState({
    name: "Jan Kowalski",
    email: "jan@example.pl",
    phone: "+48 600 000 000",
    message: "Impreza urodzinowa dla dzieci.",
    privacyAccepted: true,
    termsAccepted: true,
    marketingAccepted: false,
  });

  useEffect(() => {
    if (!search.product || handledSearchProductRef.current === search.product) return;

    addItem(search.product);
    handledSearchProductRef.current = search.product;
    if (search.date) {
      setEvent((current) => ({ ...current, date: search.date ?? current.date }));
    }

    navigate({
      to: "/wynajem",
      search: {
        ...(search.date ? { date: search.date } : {}),
        ...(isStep(search.step) ? { step: search.step } : {}),
      },
      replace: true,
    });
  }, [addItem, navigate, search.date, search.product, search.step]);

  const catalogProducts = useMemo(
    () =>
      products.data?.items.filter((product): product is CatalogProduct => Boolean(product)) ?? [],
    [products.data?.items],
  );
  const productBySku = useMemo(() => new Map(catalogProducts.map((product) => [product.sku, product])), [catalogProducts]);
  const rows = useMemo<CartRow[]>(
    () => items.map((item) => ({ ...item, product: productBySku.get(item.sku) ?? null })),
    [items, productBySku],
  );
  const quoteItems = useMemo(
    () =>
      rows
        .filter((row): row is CartRow & { product: CatalogProduct } => row.product !== null)
        .map((row) => ({
          sku: row.product.sku,
          quantity: clampCartQuantity(row.quantity, getMaxQuantity(row.product)),
        })),
    [rows],
  );

  const hasUnavailableRows = rows.some((row) => row.product === null);
  const hasManualItems = rows.some((row) => row.product?.pricing?.quoteMode !== "automatic");
  const baseValueGrosz = rows.reduce((sum, row) => sum + (getBaseLineAmount(row.product, row.quantity) ?? 0), 0);
  const cartHasItems = itemCount > 0;
  const canUseCart = quoteItems.length > 0 && !hasUnavailableRows;
  const canUseEvent =
    canUseCart &&
    event.date.length > 0 &&
    event.startTime.length > 0 &&
    event.durationHours > 0 &&
    event.street.trim().length > 0 &&
    event.postalCode.trim().length > 0 &&
    event.city.trim().length > 0;
  const canUseContact =
    canUseEvent &&
    customer.name.trim().length >= 2 &&
    customer.phone.trim().length >= 7 &&
    customer.privacyAccepted &&
    customer.termsAccepted;
  const currentStepIndex = steps.findIndex((item) => item.id === step);
  const quoteKey = [
    event.date,
    event.startTime,
    event.durationHours,
    event.city,
    event.postalCode,
    quoteItemKey(quoteItems),
  ].join("::");

  const quoteMutation = useMutation(trpc.quotes.calculate.mutationOptions());
  const submitMutation = useMutation(
    trpc.rentalRequests.submit.mutationOptions({
      onSuccess: (data) => {
        clearCart();
        navigate({ to: "/rezerwacja/$publicToken", params: { publicToken: data.publicToken } });
      },
    }),
  );
  const quote: QuoteResult | null = calculatedQuoteKey === quoteKey ? (quoteMutation.data ?? null) : null;

  useEffect(() => {
    if (calculatedQuoteKey && calculatedQuoteKey !== quoteKey) {
      setCalculatedQuoteKey(null);
    }
  }, [calculatedQuoteKey, quoteKey]);

  const calculateQuote = useCallback(() => {
    if (!canUseEvent || quoteItems.length === 0) return;

    quoteMutation.mutate(
      {
        event: {
          date: event.date,
          startTime: event.startTime,
          durationHours: event.durationHours,
          postalCode: event.postalCode,
          city: event.city,
        },
        items: quoteItems,
      },
      {
        onSuccess: () => setCalculatedQuoteKey(quoteKey),
      },
    );
  }, [canUseEvent, event.city, event.date, event.durationHours, event.postalCode, event.startTime, quoteItems, quoteKey, quoteMutation]);

  useEffect(() => {
    if (step === "podsumowanie" && canUseContact && !quote && !quoteMutation.isPending) {
      calculateQuote();
    }
  }, [calculateQuote, canUseContact, quote, quoteMutation.isPending, step]);

  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
  };

  const goNext = () => {
    const nextStep = steps[Math.min(currentStepIndex + 1, steps.length - 1)]?.id ?? "koszyk";
    goToStep(nextStep);
  };

  const goBack = () => {
    const previousStep = steps[Math.max(currentStepIndex - 1, 0)]?.id ?? "koszyk";
    goToStep(previousStep);
  };

  const updateQuantity = (row: CartRow, quantity: number) => {
    setQuantity(row.sku, clampCartQuantity(quantity, getMaxQuantity(row.product)));
  };

  const submitRequest = () => {
    if (!quote || !canUseContact) return;

    submitMutation.mutate({
      quoteId: quote.id,
      turnstileToken: "mock-turnstile-token",
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      event: {
        date: event.date,
        startTime: event.startTime,
        durationHours: event.durationHours,
        location: {
          street: event.street,
          postalCode: event.postalCode,
          city: event.city,
          country: "PL",
          surfaceType: event.surfaceType,
          powerAvailable: event.powerAvailable,
          accessNotes: event.accessNotes,
        },
      },
      items: quoteItems,
      consents: {
        privacyAccepted: customer.privacyAccepted,
        termsAccepted: customer.termsAccepted,
        marketingAccepted: customer.marketingAccepted,
      },
      message: customer.message,
    });
  };

  const primaryCta = getPrimaryCta({
    canUseCart,
    canUseContact,
    canUseEvent,
    hasQuote: Boolean(quote),
    isCalculating: quoteMutation.isPending,
    isSubmitting: submitMutation.isPending,
    step,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Button className="w-fit" variant="ghost" render={<Link to="/produkty" />}>
          <ArrowLeft data-icon="inline-start" />
          Wróć do katalogu
        </Button>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            {step === "koszyk" ? "Twój koszyk" : "Zapytanie o wynajem"}
          </h1>
          <p className="max-w-3xl text-base/relaxed text-muted-foreground">
            Wybierz sprzęt i dodatki, a potem podaj jeden termin wydarzenia. Wszystkie pozycje będą
            wynajęte na ten sam czas.
          </p>
        </div>
        <StepIndicator currentStep={step} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0">
          {step === "koszyk" ? (
            <CartStep
              rows={rows}
              productsPending={products.isPending}
              removeItem={removeItem}
              updateQuantity={updateQuantity}
            />
          ) : null}
          {step === "wydarzenie" ? <EventStep event={event} setEvent={setEvent} /> : null}
          {step === "kontakt" ? <ContactStep customer={customer} setCustomer={setCustomer} /> : null}
          {step === "podsumowanie" ? (
            <SummaryStep
              quote={quote}
              quotePending={quoteMutation.isPending}
              quoteError={quoteMutation.error?.message}
              recalculatingDisabled={!canUseEvent || quoteMutation.isPending}
              recalculate={calculateQuote}
            />
          ) : null}
        </div>

        <OrderSummaryCard
          baseValueGrosz={baseValueGrosz}
          canGoBack={step !== "koszyk"}
          cartHasItems={cartHasItems}
          goBack={goBack}
          hasManualItems={hasManualItems}
          itemCount={itemCount}
          primaryCta={primaryCta}
          quote={quote}
          submitRequest={submitRequest}
          goNext={goNext}
          recalculate={calculateQuote}
        />
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
            <div
              className={[
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                isActive ? "bg-primary text-primary-foreground shadow-primary" : "bg-card text-muted-foreground",
              ].join(" ")}
            >
              {index < currentIndex ? <Check /> : index + 1}
            </div>
            <div className={isActive ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-muted-foreground"}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CartStep({
  productsPending,
  removeItem,
  rows,
  updateQuantity,
}: {
  productsPending: boolean;
  removeItem: (sku: string) => void;
  rows: CartRow[];
  updateQuantity: (row: CartRow, quantity: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
            <PackageOpen />
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <h2 className="text-2xl font-semibold">Koszyk jest pusty</h2>
            <p className="text-sm/relaxed text-muted-foreground">
              Dodaj atrakcję lub dodatek z katalogu, aby rozpocząć zapytanie o wynajem.
            </p>
          </div>
          <Button render={<Link to="/produkty" />}>Wróć do katalogu</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row) => {
        const product = row.product;
        return product ? (
          <AvailableCartItem
            key={row.sku}
            row={{ ...row, product }}
            removeItem={removeItem}
            updateQuantity={updateQuantity}
          />
        ) : (
          <UnavailableCartItem key={row.sku} productsPending={productsPending} row={row} removeItem={removeItem} />
        );
      })}
    </div>
  );
}

function AvailableCartItem({
  removeItem,
  row,
  updateQuantity,
}: {
  removeItem: (sku: string) => void;
  row: CartRow & { product: CatalogProduct };
  updateQuantity: (row: CartRow, quantity: number) => void;
}) {
  const image = getProductImage(row.product);
  const lineAmount = getBaseLineAmount(row.product, row.quantity);
  const maxQuantity = getMaxQuantity(row.product);

  return (
    <Card className="relative">
      <RemoveCartItemButton
        className="absolute right-4 top-4 text-muted-foreground"
        productName={row.product.namePl}
        removeItem={removeItem}
        sku={row.sku}
        triggerLabel="Usuń"
        triggerMode="icon"
        variant="ghost"
      />
      <CardContent className="grid gap-5 pr-14 sm:grid-cols-[12rem_1fr]">
        <div
          className="aspect-square overflow-hidden rounded-xl bg-surface-container"
          style={{ background: getProductFallbackGradient(row.product) }}
        >
          <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
        </div>
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="flex min-w-0 flex-col gap-3">
            {row.product.category?.namePl ? (
              <Badge variant={row.product.productType === "rental_product" ? "secondary" : "outline"} className="w-fit">
                {row.product.category.namePl}
              </Badge>
            ) : null}
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-2xl font-semibold leading-snug">
                <Link
                  to="/produkty/$slug"
                  params={{ slug: row.product.slug }}
                  className="cursor-pointer rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {row.product.namePl}
                </Link>
              </h2>
              <p className="text-sm/relaxed text-muted-foreground">
                {row.product.pricing?.baseHours
                  ? `Wynajem podstawowy: ${row.product.pricing.baseHours} godzin`
                  : "Wycena indywidualna"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-fit items-center rounded-xl bg-surface-container p-1 ring-1 ring-border/60">
              <Button
                aria-label={`Zmniejsz ilość ${row.product.namePl}`}
                disabled={row.quantity <= 1}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={() => updateQuantity(row, row.quantity - 1)}
              >
                <Minus data-icon="inline-start" />
              </Button>
              <span className="w-12 text-center text-sm font-semibold">{row.quantity}</span>
              <Button
                aria-label={`Zwiększ ilość ${row.product.namePl}`}
                disabled={row.quantity >= maxQuantity}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={() => updateQuantity(row, row.quantity + 1)}
              >
                <Plus data-icon="inline-start" />
              </Button>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Cena bazowa</p>
              <p className="text-2xl font-bold text-primary">{formatMoney(lineAmount)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UnavailableCartItem({
  productsPending,
  removeItem,
  row,
}: {
  productsPending: boolean;
  removeItem: (sku: string) => void;
  row: CartRow;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-container text-muted-foreground">
            <PackageOpen />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {productsPending ? "Sprawdzanie produktu" : "Produkt niedostępny"}
            </h2>
            <p className="text-sm text-muted-foreground">{row.sku}</p>
            <p className="text-sm/relaxed text-muted-foreground">
              Usuń tę pozycję, aby kontynuować wycenę.
            </p>
          </div>
        </div>
        <RemoveCartItemButton
          productName={row.sku}
          removeItem={removeItem}
          sku={row.sku}
          triggerLabel="Usuń"
          variant="outline"
        />
      </CardContent>
    </Card>
  );
}

function RemoveCartItemButton({
  className,
  productName,
  removeItem,
  sku,
  triggerLabel,
  triggerMode = "label",
  variant = "outline",
}: {
  className?: string;
  productName: string;
  removeItem: (sku: string) => void;
  sku: string;
  triggerLabel: string;
  triggerMode?: "icon" | "label";
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = useState(false);
  const isIconTrigger = triggerMode === "icon";

  function handleConfirm() {
    try {
      removeItem(sku);
      setOpen(false);
      toast.success("Usunięto pozycję z koszyka", {
        description: productName,
      });
    } catch {
      toast.error("Nie udało się usunąć pozycji", {
        description: productName,
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            aria-label={`Usuń ${productName} z koszyka`}
            className={className}
            size={isIconTrigger ? "icon-sm" : "default"}
            type="button"
            variant={variant}
          />
        }
      >
        <Trash2 data-icon="inline-start" />
        {isIconTrigger ? null : triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć pozycję z koszyka?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta pozycja zostanie usunięta z zamówienia. Możesz dodać ją ponownie z katalogu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Anuluj</AlertDialogCancel>
          <AlertDialogAction type="button" variant="destructive" onClick={handleConfirm}>
            <Trash2 data-icon="inline-start" />
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EventStep({
  event,
  setEvent,
}: {
  event: {
    date: string;
    startTime: string;
    durationHours: number;
    city: string;
    postalCode: string;
    street: string;
    surfaceType: string;
    powerAvailable: boolean;
    accessNotes: string;
  };
  setEvent: Dispatch<SetStateAction<{
    date: string;
    startTime: string;
    durationHours: number;
    city: string;
    postalCode: string;
    street: string;
    surfaceType: string;
    powerAvailable: boolean;
    accessNotes: string;
  }>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Informacje o wydarzeniu</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="date">Data wydarzenia</FieldLabel>
              <DatePicker id="date" value={event.date} min={todayPlus(1)} onValueChange={(date) => setEvent({ ...event, date })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="time">Start</FieldLabel>
              <TimePicker id="time" value={event.startTime} onValueChange={(startTime) => setEvent({ ...event, startTime })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="duration">Czas wynajmu</FieldLabel>
              <Input
                id="duration"
                type="number"
                min={1}
                value={event.durationHours}
                onChange={(eventValue) => setEvent({ ...event, durationHours: Number(eventValue.target.value) })}
              />
              <FieldDescription>Ten sam czas obowiązuje dla wszystkich pozycji.</FieldDescription>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="street">Adres</FieldLabel>
              <Input id="street" value={event.street} onChange={(eventValue) => setEvent({ ...event, street: eventValue.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="postal">Kod pocztowy</FieldLabel>
              <Input id="postal" value={event.postalCode} onChange={(eventValue) => setEvent({ ...event, postalCode: eventValue.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="city">Miasto</FieldLabel>
              <Input id="city" value={event.city} onChange={(eventValue) => setEvent({ ...event, city: eventValue.target.value })} />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_auto]">
            <Field>
              <FieldLabel htmlFor="surface">Powierzchnia montażu</FieldLabel>
              <Select items={surfaceOptions} value={event.surfaceType} onValueChange={(surfaceType) => setEvent({ ...event, surfaceType: String(surfaceType) })}>
                <SelectTrigger id="surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {surfaceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="justify-end">
              <FieldLabel htmlFor="power">Dostęp do prądu</FieldLabel>
              <Switch id="power" checked={event.powerAvailable} onCheckedChange={(powerAvailable) => setEvent({ ...event, powerAvailable })} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="access">Notatki montażowe</FieldLabel>
            <Textarea id="access" value={event.accessNotes} onChange={(eventValue) => setEvent({ ...event, accessNotes: eventValue.target.value })} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function ContactStep({
  customer,
  setCustomer,
}: {
  customer: {
    name: string;
    email: string;
    phone: string;
    message: string;
    privacyAccepted: boolean;
    termsAccepted: boolean;
    marketingAccepted: boolean;
  };
  setCustomer: Dispatch<SetStateAction<{
    name: string;
    email: string;
    phone: string;
    message: string;
    privacyAccepted: boolean;
    termsAccepted: boolean;
    marketingAccepted: boolean;
  }>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Dane kontaktowe</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Imię i nazwisko</FieldLabel>
            <Input id="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Telefon</FieldLabel>
              <Input id="phone" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="message">Wiadomość</FieldLabel>
            <Textarea id="message" value={customer.message} onChange={(event) => setCustomer({ ...customer, message: event.target.value })} />
          </Field>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={customer.privacyAccepted} onCheckedChange={(checked) => setCustomer({ ...customer, privacyAccepted: checked === true })} />
              Akceptuję politykę prywatności.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={customer.termsAccepted} onCheckedChange={(checked) => setCustomer({ ...customer, termsAccepted: checked === true })} />
              Akceptuję regulamin wynajmu.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={customer.marketingAccepted} onCheckedChange={(checked) => setCustomer({ ...customer, marketingAccepted: checked === true })} />
              Chcę otrzymywać informacje o ofertach i terminach.
            </label>
            <FieldDescription>Formularz jest zabezpieczony przed automatycznym spamem.</FieldDescription>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function SummaryStep({
  quote,
  quoteError,
  quotePending,
  recalculatingDisabled,
  recalculate,
}: {
  quote: QuoteResult | null;
  quoteError?: string;
  quotePending: boolean;
  recalculatingDisabled: boolean;
  recalculate: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Podsumowanie zapytania</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Alert>
          <Info data-icon="inline-start" />
          <AlertTitle>Potwierdzimy szczegóły</AlertTitle>
          <AlertDescription>Po wysłaniu zapytania obsługa potwierdzi dostępność, dojazd i warunki montażu.</AlertDescription>
        </Alert>

        {quotePending ? (
          <p className="text-sm/relaxed text-muted-foreground">Przygotowujemy wstępną wycenę…</p>
        ) : null}
        {quoteError ? (
          <Alert variant="destructive">
            <AlertTitle>Nie udało się obliczyć wyceny</AlertTitle>
            <AlertDescription>{quoteError}</AlertDescription>
          </Alert>
        ) : null}
        {!quote && !quotePending ? (
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-5">
            <p className="text-sm/relaxed text-muted-foreground">
              Odśwież wstępną wycenę przed wysłaniem zapytania.
            </p>
            <Button className="w-fit" type="button" variant="outline" disabled={recalculatingDisabled} onClick={recalculate}>
              Odśwież wycenę
            </Button>
          </div>
        ) : null}
        {quote ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pozycja</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Kwota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((line) => (
                  <TableRow key={line.sku}>
                    <TableCell>{line.name}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{formatMoney(line.lineTotalGrosz)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-5 text-sm">
              <div className="flex justify-between gap-2">
                <span>Suma produktów</span>
                <strong>{formatMoney(quote.subtotalGrosz)}</strong>
              </div>
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span>Dojazd</span>
                <span>{quote.travelFee.label}</span>
              </div>
              <Separator />
              <div className="flex justify-between gap-2">
                <span>Wstępna wycena</span>
                <strong>{formatMoney(quote.totalEstimateGrosz)}</strong>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OrderSummaryCard({
  baseValueGrosz,
  canGoBack,
  cartHasItems,
  goBack,
  goNext,
  hasManualItems,
  itemCount,
  primaryCta,
  quote,
  recalculate,
  submitRequest,
}: {
  baseValueGrosz: number;
  canGoBack: boolean;
  cartHasItems: boolean;
  goBack: () => void;
  goNext: () => void;
  hasManualItems: boolean;
  itemCount: number;
  primaryCta: { label: string; disabled: boolean; mode: "next" | "calculate" | "submit" };
  quote: QuoteResult | null;
  recalculate: () => void;
  submitRequest: () => void;
}) {
  const totalLabel = quote ? formatMoney(quote.totalEstimateGrosz) : formatSummaryAmount(baseValueGrosz, hasManualItems);
  const handlePrimary = () => {
    if (primaryCta.mode === "submit") {
      submitRequest();
      return;
    }
    if (primaryCta.mode === "calculate") {
      recalculate();
      return;
    }
    goNext();
  };

  return (
    <Card className="self-start lg:sticky lg:top-28">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">Zamówienie</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-2xl bg-surface-container-low p-4 ring-1 ring-border/50">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Pozycje</span>
            <strong>{itemCount}</strong>
          </div>
          <Separator className="my-3" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Wstępna wycena</span>
              <span className="text-xs text-muted-foreground">Dojazd potwierdzimy po lokalizacji</span>
            </div>
            <strong className="max-w-48 break-words text-right text-2xl leading-tight text-primary">
              ~ {totalLabel}
            </strong>
          </div>
        </div>

        <Button className="w-full" type="button" size="lg" disabled={primaryCta.disabled || !cartHasItems} onClick={handlePrimary}>
          {primaryCta.label}
          {primaryCta.mode === "next" ? <ArrowRight data-icon="inline-end" /> : null}
          {primaryCta.mode === "calculate" ? <ClipboardList data-icon="inline-end" /> : null}
        </Button>
        {canGoBack ? (
          <Button className="w-full" type="button" variant="ghost" onClick={goBack}>
            <ArrowLeft data-icon="inline-start" />
            Wróć
          </Button>
        ) : null}
        <p className="text-center text-xs/relaxed text-muted-foreground">
          Zapytanie jest niezobowiązujące. Koszt dojazdu potwierdzimy po lokalizacji.
        </p>
      </CardContent>
    </Card>
  );
}

function getPrimaryCta({
  canUseCart,
  canUseContact,
  canUseEvent,
  hasQuote,
  isCalculating,
  isSubmitting,
  step,
}: {
  canUseCart: boolean;
  canUseContact: boolean;
  canUseEvent: boolean;
  hasQuote: boolean;
  isCalculating: boolean;
  isSubmitting: boolean;
  step: Step;
}) {
  if (step === "koszyk") {
    return { label: "Przejdź do wydarzenia", disabled: !canUseCart, mode: "next" as const };
  }
  if (step === "wydarzenie") {
    return { label: "Dalej: kontakt", disabled: !canUseEvent, mode: "next" as const };
  }
  if (step === "kontakt") {
    return { label: "Podsumowanie", disabled: !canUseContact, mode: "next" as const };
  }
  if (!hasQuote) {
    return {
      label: isCalculating ? "Przygotowujemy wycenę" : "Odśwież wycenę",
      disabled: !canUseContact || isCalculating,
      mode: "calculate" as const,
    };
  }
  return {
    label: isSubmitting ? "Wysyłamy zapytanie" : "Wyślij zapytanie",
    disabled: !canUseContact || isSubmitting,
    mode: "submit" as const,
  };
}
