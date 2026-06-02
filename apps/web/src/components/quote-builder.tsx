import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { DatePicker } from "@orksys-eventownia/ui/components/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orksys-eventownia/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { TimePicker } from "@orksys-eventownia/ui/components/time-picker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Info, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { formatMoney, todayPlus } from "@/lib/format";
import { getProductImage } from "@/lib/mock-images";
import { trpc } from "@/utils/trpc";

type QuoteItem = { sku: string; quantity: number };

const steps = [
  { id: 1, label: "Dane" },
  { id: 2, label: "Szczegóły" },
  { id: 3, label: "Gotowe" },
];

export function QuoteBuilder() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { product?: string; date?: string };
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const [step, setStep] = useState(1);
  const [selectedSku, setSelectedSku] = useState(search.product ?? "SLIDE_DINOZAUR");
  const [items, setItems] = useState<QuoteItem[]>([{ sku: search.product ?? "SLIDE_DINOZAUR", quantity: 1 }]);
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
  });

  const selectedProducts = useMemo(
    () =>
      items
        .map((item) => ({
          item,
          product: products.data?.items.find((product) => product?.sku === item.sku),
        }))
        .filter((item) => item.product),
    [items, products.data?.items],
  );

  const productOptions =
    products.data?.items
      .filter((product): product is NonNullable<typeof product> => product !== null)
      .map((product) => ({ label: product.namePl, value: product.sku })) ?? [];

  const quoteMutation = useMutation(trpc.quotes.calculate.mutationOptions());
  const submitMutation = useMutation(
    trpc.rentalRequests.submit.mutationOptions({
      onSuccess: (data) => {
        navigate({ to: "/rezerwacja/$publicToken", params: { publicToken: data.publicToken } });
      },
    }),
  );

  const addItem = () => {
    setItems((current) => {
      const existing = current.find((item) => item.sku === selectedSku);
      if (existing) {
        return current.map((item) => (item.sku === selectedSku ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { sku: selectedSku, quantity: 1 }];
    });
  };

  const quotePayload = {
    event: {
      date: event.date,
      startTime: event.startTime,
      durationHours: event.durationHours,
      postalCode: event.postalCode,
      city: event.city,
    },
    items,
  };

  const submitRequest = () => {
    submitMutation.mutate({
      quoteId: quoteMutation.data?.id,
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
      items,
      consents: {
        privacyAccepted: customer.privacyAccepted,
        termsAccepted: customer.termsAccepted,
        marketingAccepted: false,
      },
      message: customer.message,
    });
  };

  const primaryProduct = selectedProducts[0]?.product;
  const summaryImage = primaryProduct ? getProductImage(primaryProduct) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader className="gap-6">
          <CardTitle className="text-3xl md:text-4xl">Rezerwacja sprzętu</CardTitle>
          <div className="grid grid-cols-3 items-start gap-3">
            {steps.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-2">
                <div
                  className={[
                    "flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    item.id <= step ? "bg-primary text-primary-foreground shadow-primary" : "bg-surface-container-high text-muted-foreground",
                  ].join(" ")}
                >
                  {item.id < step ? <Check /> : item.id}
                </div>
                <div className={item.id <= step ? "text-xs font-bold uppercase tracking-[0.08em] text-primary" : "text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {step === 1 ? (
            <FieldGroup>
              <h2 className="text-2xl font-semibold">Dane kontaktowe</h2>
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
            </FieldGroup>
          ) : null}

          {step === 2 ? (
            <FieldGroup>
              <h2 className="text-2xl font-semibold">Szczegóły rezerwacji</h2>
              <div className="grid gap-5 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="date">Data</FieldLabel>
                  <DatePicker
                    id="date"
                    value={event.date}
                    min={todayPlus(1)}
                    onValueChange={(date) => setEvent({ ...event, date })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="time">Start</FieldLabel>
                  <TimePicker
                    id="time"
                    value={event.startTime}
                    onValueChange={(startTime) => setEvent({ ...event, startTime })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">Liczba godzin</FieldLabel>
                  <Input id="duration" type="number" min={1} value={event.durationHours} onChange={(eventValue) => setEvent({ ...event, durationHours: Number(eventValue.target.value) })} />
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
              <Field>
                <FieldLabel htmlFor="product">Produkty i dodatki</FieldLabel>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Select items={productOptions} value={selectedSku} onValueChange={(value) => setSelectedSku(String(value))}>
                    <SelectTrigger id="product" className="w-full flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {productOptions.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            {product.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addItem}>
                    <Plus data-icon="inline-start" />
                    Dodaj pozycję
                  </Button>
                </div>
              </Field>
              <div className="flex flex-col gap-3">
                {selectedProducts.map(({ item, product }) => (
                  <div key={item.sku} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4">
                    <div>
                      <div className="font-semibold">{product?.namePl}</div>
                      <div className="text-sm text-muted-foreground">{product?.sku}</div>
                    </div>
                    <Input
                      className="w-24"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(eventValue) =>
                        setItems((current) =>
                          current.map((currentItem) =>
                            currentItem.sku === item.sku ? { ...currentItem, quantity: Number(eventValue.target.value) } : currentItem,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <Field>
                <FieldLabel htmlFor="access">Notatki montażowe</FieldLabel>
                <Textarea id="access" value={event.accessNotes} onChange={(eventValue) => setEvent({ ...event, accessNotes: eventValue.target.value })} />
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
                <FieldDescription>Turnstile jest makietą: formularz wysyła token `mock-turnstile-token`.</FieldDescription>
              </div>
            </FieldGroup>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold">Podsumowanie zapytania</h2>
              <Alert>
                <Info data-icon="inline-start" />
                <AlertTitle>Ręczne potwierdzenie</AlertTitle>
                <AlertDescription>Dojazd, dostępność i warunki montażu zawsze zatwierdza obsługa.</AlertDescription>
              </Alert>
              {quoteMutation.data ? (
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
                      {quoteMutation.data.lines.map((line) => (
                        <TableRow key={line.sku}>
                          <TableCell>{line.name}</TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{formatMoney(line.lineTotalGrosz)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span>Suma produktów</span>
                      <strong>{formatMoney(quoteMutation.data.subtotalGrosz)}</strong>
                    </div>
                    <div className="flex justify-between gap-2 text-muted-foreground">
                      <span>Dojazd</span>
                      <span>{quoteMutation.data.travelFee.label}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-border/50 pt-3">
                      <span>Szacunek</span>
                      <strong>{formatMoney(quoteMutation.data.totalEstimateGrosz)}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm/relaxed text-muted-foreground">
                  Oblicz wycenę, aby zobaczyć pozycje, dodatkowe godziny i szacunkową kwotę.
                </p>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-6">
            <Button
              type="button"
              variant="ghost"
              className={step === 1 ? "invisible" : undefined}
              onClick={() => setStep(Math.max(1, step - 1))}
            >
              <ArrowLeft data-icon="inline-start" />
              Wróć
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={() => setStep(Math.min(3, step + 1))}>
                Dalej
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => quoteMutation.mutate(quotePayload)} disabled={quoteMutation.isPending || items.length === 0}>
                  Oblicz wycenę
                </Button>
                <Button type="button" disabled={!quoteMutation.data || submitMutation.isPending} onClick={submitRequest}>
                  Wyślij zapytanie
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="self-start lg:sticky lg:top-28">
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="h-44 overflow-hidden rounded-2xl bg-surface-container-low">
            {summaryImage ? <img src={summaryImage.src} alt={summaryImage.alt} className="size-full object-cover" /> : null}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Wybrany sprzęt</div>
            <div className="font-semibold">{primaryProduct?.namePl ?? "Wybierz produkt"}</div>
            <div className="text-sm text-muted-foreground">{items.length} pozycje w zapytaniu</div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Termin</span>
              <span>{event.date}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Lokalizacja</span>
              <span>{event.city}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-surface p-4 ring-1 ring-border/50">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Szacowany koszt</span>
              <span className="text-2xl font-bold text-primary">
                {quoteMutation.data ? formatMoney(quoteMutation.data.totalEstimateGrosz) : "do wyceny"}
              </span>
            </div>
          </div>
          <p className="text-center text-sm/relaxed text-muted-foreground">
            Ostateczna cena zostanie potwierdzona po weryfikacji dostępności.
          </p>
          <Button variant="ghost" render={<Link to="/produkty" />}>
            Wróć do przeglądania
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
