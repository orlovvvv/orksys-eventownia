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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@orksys-eventownia/ui/components/select";
import { Switch } from "@orksys-eventownia/ui/components/switch";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { TimePicker } from "@orksys-eventownia/ui/components/time-picker";
import { useForm, useStore, type ReactFormExtendedApi } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { EstimateSummary, PublicProduct } from "@orksys-eventownia/api/mock/eventownia/types";
import { ArrowLeft, CalendarCheck, CheckCircle2, Minus, PackageOpen, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { toast } from "sonner";
import z from "zod";

import { EstimateSummaryView } from "@/components/estimate-summary";
import { useOrderCart } from "@/components/order-cart-provider";
import { clampCartQuantity, getCartMaxQuantity, MAX_CART_QUANTITY } from "@/lib/order-cart";
import { formatMoney, todayPlus } from "@/lib/format";
import { getProductFallbackGradient, getProductImage } from "@/lib/mock-images";
import { queryClient, trpc } from "@/utils/trpc";

type CartSearch = {
  product?: string;
  date?: string;
};

type CatalogProduct = PublicProduct;

type CartRow = {
  sku: string;
  quantity: number;
  product: CatalogProduct | null;
};

type ExactAvailability = {
  available: boolean;
  items: Array<{
    productId: string;
    name: string;
    available: boolean;
    availableQuantity: number;
    requestedQuantity: number;
    conflictReasons: string[];
  }>;
  warnings: string[];
} | null;

type OrderFormValues = {
  event: {
    date: string;
    startTime: string;
    durationOption: string;
    street: string;
    addressDetails: string;
    postalCode: string;
    city: string;
    powerAvailable: boolean;
    accessNotes: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    message: string;
  };
  consents: {
    privacyAccepted: boolean;
    termsAccepted: boolean;
    marketingAccepted: boolean;
  };
};

const polishPhoneRegex = /^\+48\d{9}$/;
const postalCodeRegex = /^\d{2}-\d{3}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const durationOptions = [
  ...Array.from({ length: 8 }, (_, index) => {
    const hours = index + 5;
    return { label: `${hours} godzin`, value: String(hours) };
  }),
  { label: "Niestandardowy czas", value: "custom" },
] as const;

const orderEventSchema = z.object({
  date: z
    .string()
    .min(1, "Wybierz datę wydarzenia.")
    .refine((value) => value >= todayPlus(1), "Data musi być najwcześniej jutro."),
  startTime: z.string().regex(timeRegex, "Wybierz poprawną godzinę."),
  durationOption: z.enum(["5", "6", "7", "8", "9", "10", "11", "12", "custom"], {
    error: "Wybierz czas wynajmu.",
  }),
  street: z.string().trim().min(3, "Podaj ulicę i numer budynku."),
  addressDetails: z.string().max(500, "Szczegóły adresu mogą mieć maksymalnie 500 znaków."),
  postalCode: z.string().trim().regex(postalCodeRegex, "Podaj kod w formacie 00-000."),
  city: z.string().trim().min(2, "Podaj miasto."),
  powerAvailable: z.boolean(),
  accessNotes: z.string().max(1000, "Notatki mogą mieć maksymalnie 1000 znaków."),
});

const orderFormSchema = z.object({
  event: orderEventSchema,
  customer: z.object({
    name: z.string().trim().min(2, "Podaj imię i nazwisko."),
    phone: z.string().regex(polishPhoneRegex, "Podaj polski numer telefonu."),
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.email().safeParse(value).success, "Podaj poprawny e-mail."),
    message: z.string().max(1000, "Wiadomość może mieć maksymalnie 1000 znaków."),
  }),
  consents: z.object({
    privacyAccepted: z.literal(true, { error: "Akceptacja polityki prywatności jest wymagana." }),
    termsAccepted: z.literal(true, { error: "Akceptacja regulaminu jest wymagana." }),
    marketingAccepted: z.boolean(),
  }),
});

type OrderFormApi = ReactFormExtendedApi<
  OrderFormValues,
  undefined,
  typeof orderFormSchema,
  undefined,
  undefined,
  undefined,
  typeof orderFormSchema,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
>;

function getOrderFormDefaults(date: string | undefined): OrderFormValues {
  return {
    event: {
      date: date ?? todayPlus(14),
      startTime: "12:00",
      durationOption: "5",
      street: "",
      addressDetails: "",
      postalCode: "",
      city: "",
      powerAvailable: true,
      accessNotes: "",
    },
    customer: {
      name: "",
      phone: "+48",
      email: "",
      message: "",
    },
    consents: {
      privacyAccepted: false,
      termsAccepted: false,
      marketingAccepted: false,
    },
  };
}

function normalizePolishPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("48")) {
    return `+48${digits.slice(2, 11)}`;
  }

  return `+48${digits.slice(0, 9)}`;
}

function formatPolishPhone(value: string) {
  const normalized = normalizePolishPhone(value);
  const digits = normalized.replace(/^\+48/, "");
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);

  return ["+48", first, second, third].filter(Boolean).join(" ");
}

function formatPostalCode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function getDurationHours(durationOption: string) {
  return durationOption === "custom" ? 12 : Number(durationOption);
}

function getMaxQuantity(product: CatalogProduct | null) {
  if (!product) return MAX_CART_QUANTITY;
  return getCartMaxQuantity(product.inventoryCount);
}

function isUnavailableRow(row: CartRow) {
  return row.product === null || getMaxQuantity(row.product) <= 0;
}

function isAvailableRow(row: CartRow): row is CartRow & { product: CatalogProduct } {
  return row.product !== null && getMaxQuantity(row.product) > 0;
}

export function OrderBuilder() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as CartSearch;
  const { addItem, clearCart, items, removeItem, setQuantity } = useOrderCart();
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const handledSearchProductRef = useRef<string | null>(null);
  const catalogProducts = useMemo(
    () => products.data?.items.filter((product): product is CatalogProduct => Boolean(product)) ?? [],
    [products.data?.items],
  );
  const productBySku = useMemo(() => new Map(catalogProducts.map((product) => [product.sku, product])), [catalogProducts]);
  const rows = useMemo<CartRow[]>(
    () => items.map((item) => ({ ...item, product: productBySku.get(item.sku) ?? null })),
    [items, productBySku],
  );
  const orderItems = useMemo(
    () =>
      rows.filter(isAvailableRow).map((row) => ({
        productId: row.product.id,
        quantity: clampCartQuantity(row.quantity, getMaxQuantity(row.product)),
      })),
    [rows],
  );
  const hasUnavailableRows = rows.some(isUnavailableRow);
  const hasValidItems = orderItems.length > 0 && !hasUnavailableRows;
  const submitOrder = useMutation(
    trpc.orders.submit.mutationOptions({
      onSuccess: (data) => {
        clearCart();
        void navigate({ to: "/reservation/$publicToken", params: { publicToken: data.publicToken } });
      },
      onError: (error) => {
        toast.error("Nie udało się wysłać zamówienia", { description: error.message });
        void queryClient.invalidateQueries();
      },
    }),
  );
  const form = useForm({
    defaultValues: getOrderFormDefaults(search.date),
    validators: {
      onSubmit: orderFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!hasValidItems) {
        toast.error("Nie można wysłać zamówienia", { description: "Dodaj dostępne produkty do zamówienia." });
        return;
      }
      if (orderPreview.isPending) {
        toast.info("Sprawdzamy dostępność", { description: "Spróbuj ponownie za chwilę." });
        return;
      }
      if (!exactAvailability?.available) {
        toast.error("Nie można wysłać zamówienia", { description: "Wybrane produkty są niedostępne w tym terminie." });
        return;
      }
      submitOrder.mutate(buildSubmitPayload(value, orderItems));
    },
  }) as OrderFormApi;
  const formValues = useStore(form.store, (state) => state.values);
  const formIsSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const durationHours = getDurationHours(formValues.event.durationOption);
  const hasEventDetails = hasValidItems && orderEventSchema.safeParse(formValues.event).success;
  const orderPreview = useQuery({
    ...trpc.orders.preview.queryOptions({
      event: {
        date: formValues.event.date,
        startTime: formValues.event.startTime,
        durationHours,
        postalCode: formValues.event.postalCode,
        city: formValues.event.city,
      },
      items: orderItems,
    }),
    enabled: hasEventDetails,
  });

  const exactAvailability = orderPreview.data?.availability ?? null;
  const estimateSummary = orderPreview.data?.quote.estimateSummary ?? null;
  const hasCartItems = rows.length > 0;
  const submitDisabled = submitOrder.isPending || formIsSubmitting;

  useEffect(() => {
    if (!search.product || handledSearchProductRef.current === search.product || products.isPending) return;

    const product = productBySku.get(search.product);
    const maxQuantity = getMaxQuantity(product ?? null);
    if (product && maxQuantity > 0) {
      addItem(search.product, 1, { maxQuantity });
    } else {
      toast.warning("Nie dodano produktu", { description: "Produkt jest niedostępny lub nie istnieje." });
    }

    handledSearchProductRef.current = search.product;
    if (search.date) form.setFieldValue("event.date", search.date);
    void navigate({ to: "/cart", search: search.date ? { date: search.date } : {}, replace: true });
  }, [addItem, form, navigate, productBySku, products.isPending, search.date, search.product]);

  function updateQuantity(row: CartRow, quantity: number) {
    setQuantity(row.sku, clampCartQuantity(quantity, getMaxQuantity(row.product)));
  }

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-5">
        <Button className="w-fit" variant="ghost" render={<Link to="/products" />}>
          <ArrowLeft data-icon="inline-start" />
          Wróć do katalogu
        </Button>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Zamówienie wynajmu</h1>
          <p className="max-w-3xl text-base/relaxed text-muted-foreground">
            Dodaj produkty, wybierz jeden termin wydarzenia i sprawdź prostą dostępność. Rezerwacja jest potwierdzana ręcznie przez obsługę.
          </p>
        </div>
      </div>

      {hasCartItems ? (
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="flex min-w-0 flex-col gap-6">
            <ItemsSection productsPending={products.isPending} removeItem={removeItem} rows={rows} updateQuantity={updateQuantity} />
            <EventSection
              availability={exactAvailability}
              availabilityPending={orderPreview.isPending && hasEventDetails}
              form={form}
              showAvailabilityResult={hasEventDetails}
            />
            <CustomerSection form={form} />
          </div>

          <SubmitOrderPanel
            disabled={submitDisabled}
            estimateSummary={estimateSummary}
            hasValidItems={hasValidItems}
            previewPending={orderPreview.isPending && hasEventDetails}
            submitPending={submitOrder.isPending}
          />
        </div>
      ) : (
        <div className="w-full">
          <ItemsSection productsPending={products.isPending} removeItem={removeItem} rows={rows} updateQuantity={updateQuantity} />
        </div>
      )}
    </form>
  );
}

function buildSubmitPayload(value: OrderFormValues, orderItems: Array<{ productId: string; quantity: number }>) {
  return {
    customer: {
      name: value.customer.name.trim(),
      email: value.customer.email.trim(),
      phone: value.customer.phone,
    },
    event: {
      date: value.event.date,
      startTime: value.event.startTime,
      durationHours: getDurationHours(value.event.durationOption),
      location: {
        street: value.event.street.trim(),
        addressDetails: value.event.addressDetails.trim(),
        postalCode: value.event.postalCode.trim(),
        city: value.event.city.trim(),
        country: "PL" as const,
        powerAvailable: value.event.powerAvailable,
        accessNotes: value.event.accessNotes.trim(),
      },
    },
    items: orderItems,
    consents: {
      privacyAccepted: value.consents.privacyAccepted,
      termsAccepted: value.consents.termsAccepted,
      marketingAccepted: value.consents.marketingAccepted,
    },
    turnstileToken: "mock-turnstile-token",
    message: [value.customer.message.trim(), value.event.durationOption === "custom" ? "Niestandardowy czas wynajmu do ustalenia." : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

function ItemsSection({
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produkty</CardTitle>
        <CardDescription>Wszystkie pozycje będą wynajęte w tym samym terminie.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <PackageOpen />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-xl font-semibold">Koszyk jest pusty</h2>
              <p className="text-sm/relaxed text-muted-foreground">Dodaj atrakcję lub dodatek z katalogu, aby rozpocząć zamówienie.</p>
            </div>
            <Button render={<Link to="/products" />}>Przejdź do katalogu</Button>
          </div>
        ) : null}
        {rows.map((row) =>
          row.product && !isUnavailableRow(row) ? (
            <AvailableCartItem key={row.sku} row={{ ...row, product: row.product }} removeItem={removeItem} updateQuantity={updateQuantity} />
          ) : (
            <UnavailableCartItem key={row.sku} productsPending={productsPending} row={row} removeItem={removeItem} />
          ),
        )}
      </CardContent>
    </Card>
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
  const maxQuantity = getMaxQuantity(row.product);

  return (
    <div className="grid gap-4 rounded-xl bg-muted p-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
      <div className="aspect-square overflow-hidden rounded-lg bg-surface-container" style={{ background: getProductFallbackGradient(row.product) }}>
        <img src={image.src} alt={image.alt} className="size-full object-cover" loading="lazy" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{row.product.namePl}</h3>
          {row.product.category?.namePl ? <Badge variant="outline">{row.product.category.namePl}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMoney(row.product.pricing?.hourlyPriceZloty)} / h
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center rounded-xl bg-card p-1 ring-1 ring-border/60">
          <Button aria-label={`Zmniejsz ilość ${row.product.namePl}`} disabled={row.quantity <= 1} size="icon-sm" type="button" variant="ghost" onClick={() => updateQuantity(row, row.quantity - 1)}>
            <Minus data-icon="inline-start" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold">{row.quantity}</span>
          <Button aria-label={`Zwiększ ilość ${row.product.namePl}`} disabled={row.quantity >= maxQuantity} size="icon-sm" type="button" variant="ghost" onClick={() => updateQuantity(row, row.quantity + 1)}>
            <Plus data-icon="inline-start" />
          </Button>
        </div>
        <RemoveCartItemButton productName={row.product.namePl} removeItem={removeItem} sku={row.sku} />
      </div>
    </div>
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
  const productName = row.product?.namePl ?? row.sku;
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold">{row.product?.namePl ?? (productsPending ? "Sprawdzanie produktu" : "Produkt niedostępny")}</div>
        <p className="text-sm text-muted-foreground">Usuń tę pozycję, aby kontynuować zamówienie.</p>
      </div>
      <RemoveCartItemButton productName={productName} removeItem={removeItem} sku={row.sku} />
    </div>
  );
}

function RemoveCartItemButton({
  productName,
  removeItem,
  sku,
  variant = "outline",
}: {
  productName: string;
  removeItem: (sku: string) => void;
  sku: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    removeItem(sku);
    setOpen(false);
    toast.success("Usunięto pozycję z zamówienia", { description: productName });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button aria-label={`Usuń ${productName}`} size="icon-sm" type="button" variant={variant} />}>
        <Trash2 data-icon="inline-start" />
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć pozycję?</AlertDialogTitle>
          <AlertDialogDescription>Pozycja zostanie usunięta z bieżącego zamówienia.</AlertDialogDescription>
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

function EventSection({
  availability,
  availabilityPending,
  form,
  showAvailabilityResult,
}: {
  availability: ExactAvailability;
  availabilityPending: boolean;
  form: OrderFormApi;
  showAvailabilityResult: boolean;
}) {
  const unavailableItems = availability?.items.filter((item) => !item.available) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wydarzenie</CardTitle>
        <CardDescription>Podaj jeden termin i miejsce dla całego zamówienia.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-3">
            <form.Field name="event.date">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Data wydarzenia</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    min={todayPlus(1)}
                    value={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="event.startTime">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Start</FieldLabel>
                  <TimePicker id={field.name} value={field.state.value} minuteStep={15} onValueChange={field.handleChange} />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="event.durationOption">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Czas wynajmu</FieldLabel>
                  <Select items={durationOptions} value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                    <SelectTrigger id={field.name} className="w-full" aria-invalid={field.state.meta.errors.length > 0 || undefined} onBlur={field.handleBlur}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Ten sam czas obowiązuje dla wszystkich pozycji. Niestandardowy czas potwierdzimy ręcznie.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>
          <div className="grid gap-5 md:grid-cols-[2fr_1fr_1fr]">
            <form.Field name="event.street">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Ulica i numer budynku</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    autoComplete="street-address"
                    placeholder="np. Polna 59"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="event.postalCode">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Kod pocztowy</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00-000"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(formatPostalCode(event.target.value))}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="event.city">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Miasto</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    autoComplete="address-level2"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="event.addressDetails">
              {(field) => (
                <Field className="md:col-span-3">
                  <FieldLabel htmlFor={field.name}>Szczegóły adresu</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    autoComplete="address-line2"
                    placeholder="np. lokal 62, klatka B, wejście od parkingu"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldDescription>Opcjonalnie: lokal, klatka, piętro, nazwa obiektu lub punkt wejścia.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_auto]">
            <form.Field name="event.powerAvailable">
              {(field) => (
                <Field className="justify-end">
                  <FieldLabel htmlFor={field.name}>Dostęp do prądu</FieldLabel>
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onCheckedChange={(powerAvailable) => field.handleChange(powerAvailable)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>
          <form.Field name="event.accessNotes">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Notatki montażowe</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <EventAvailabilityFeedback
            availability={availability}
            pending={availabilityPending}
            show={showAvailabilityResult}
            unavailableItems={unavailableItems}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function EventAvailabilityFeedback({
  availability,
  pending,
  show,
  unavailableItems,
}: {
  availability: ExactAvailability;
  pending: boolean;
  show: boolean;
  unavailableItems: NonNullable<ExactAvailability>["items"];
}) {
  if (!show) return null;

  if (pending) {
    return <p className="text-sm/relaxed text-muted-foreground">Sprawdzamy wybrany termin.</p>;
  }

  if (!availability) return null;

  if (unavailableItems.length === 0) {
    return (
      <Alert>
        <CheckCircle2 data-icon="inline-start" />
        <AlertTitle>Wybrane produkty wyglądają dostępnie</AlertTitle>
        <AlertDescription>Obsługa potwierdzi zamówienie ręcznie po wysłaniu formularza.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Niektóre produkty są niedostępne</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2">
          {unavailableItems.map((item) => (
            <div key={item.productId} className="rounded-lg bg-background/70 p-3 text-sm">
              <div className="font-medium">{item.name}</div>
              <div>
                Zamówiono {item.requestedQuantity}, dostępne {item.availableQuantity}.
              </div>
              {item.conflictReasons[0] ? <div>{item.conflictReasons[0]}</div> : null}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function FieldError({ errors }: { errors: unknown[] }) {
  const message = errors
    .map((error) => {
      if (typeof error === "string") return error;
      if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
      return null;
    })
    .find(Boolean);

  if (!message) return null;

  return <FieldDescription className="text-destructive">{message}</FieldDescription>;
}

function CustomerSection({ form }: { form: OrderFormApi }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Klient</CardTitle>
        <CardDescription>Dane potrzebne do ręcznego potwierdzenia zamówienia.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <form.Field name="customer.name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Imię i nazwisko</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  autoComplete="name"
                  aria-invalid={field.state.meta.errors.length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <div className="grid gap-5 md:grid-cols-2">
            <form.Field name="customer.phone">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Telefon</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={formatPolishPhone(field.state.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+48 600 000 000"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(normalizePolishPhone(event.target.value))}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="customer.email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>E-mail opcjonalnie</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    autoComplete="email"
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>
          <form.Field name="customer.message">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Wiadomość</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  aria-invalid={field.state.meta.errors.length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <div className="flex flex-col gap-3">
            <form.Field name="consents.privacyAccepted">
              {(field) => (
                <Field>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0 || undefined}
                      onBlur={field.handleBlur}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <FieldLabel htmlFor={field.name} className="font-normal">Akceptuję politykę prywatności.</FieldLabel>
                  </div>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="consents.termsAccepted">
              {(field) => (
                <Field>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0 || undefined}
                      onBlur={field.handleBlur}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <FieldLabel htmlFor={field.name} className="font-normal">Akceptuję regulamin wynajmu.</FieldLabel>
                  </div>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="consents.marketingAccepted">
              {(field) => (
                <Field className="flex-row items-start gap-3">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    aria-invalid={field.state.meta.errors.length > 0 || undefined}
                    onBlur={field.handleBlur}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <FieldLabel htmlFor={field.name} className="font-normal">Chcę otrzymywać informacje o ofertach.</FieldLabel>
                </Field>
              )}
            </form.Field>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function SubmitOrderPanel({
  disabled,
  estimateSummary,
  hasValidItems,
  previewPending,
  submitPending,
}: {
  disabled: boolean;
  estimateSummary: EstimateSummary | null;
  hasValidItems: boolean;
  previewPending: boolean;
  submitPending: boolean;
}) {
  const submitLabel = submitPending ? "Wysyłamy zamówienie" : "Wyślij zamówienie do potwierdzenia";

  return (
    <div className="flex flex-col gap-4 self-start xl:sticky xl:top-28">
      {estimateSummary ? (
        <EstimateSummaryView compact summary={estimateSummary} />
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {previewPending
              ? "Przygotowujemy podsumowanie wyceny."
              : hasValidItems
                ? "Uzupełnij termin i lokalizację, aby zobaczyć podsumowanie wyceny."
                : "Dodaj dostępne produkty, aby zobaczyć podsumowanie wyceny."}
          </CardContent>
        </Card>
      )}
      <Button className="w-full" size="lg" type="submit" disabled={disabled}>
        <CalendarCheck data-icon="inline-start" />
        {submitLabel}
      </Button>
    </div>
  );
}
