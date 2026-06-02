import { Alert, AlertDescription, AlertTitle } from "@orksys-eventownia/ui/components/alert";
import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Checkbox } from "@orksys-eventownia/ui/components/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@orksys-eventownia/ui/components/table";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";

import { formatMoney, todayPlus } from "@/lib/format";
import { trpc } from "@/utils/trpc";

type QuoteItem = { sku: string; quantity: number };

export function QuoteBuilder() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { product?: string };
  const products = useQuery(trpc.catalog.products.queryOptions({ limit: 100 }));
  const [selectedSku, setSelectedSku] = useState(search.product ?? "SLIDE_DINOZAUR");
  const [items, setItems] = useState<QuoteItem[]>([{ sku: search.product ?? "SLIDE_DINOZAUR", quantity: 1 }]);
  const [event, setEvent] = useState({
    date: todayPlus(14),
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

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle>Zapytanie o wynajem</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Termin i lokalizacja</FieldLegend>
              <div className="grid gap-3 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="date">Data</FieldLabel>
                  <Input id="date" type="date" value={event.date} onChange={(e) => setEvent({ ...event, date: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="time">Start</FieldLabel>
                  <Input id="time" type="time" value={event.startTime} onChange={(e) => setEvent({ ...event, startTime: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">Liczba godzin</FieldLabel>
                  <Input id="duration" type="number" min={1} value={event.durationHours} onChange={(e) => setEvent({ ...event, durationHours: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="street">Adres</FieldLabel>
                  <Input id="street" value={event.street} onChange={(e) => setEvent({ ...event, street: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="postal">Kod pocztowy</FieldLabel>
                  <Input id="postal" value={event.postalCode} onChange={(e) => setEvent({ ...event, postalCode: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="city">Miasto</FieldLabel>
                  <Input id="city" value={event.city} onChange={(e) => setEvent({ ...event, city: e.target.value })} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="access">Notatki montażowe</FieldLabel>
                <Textarea id="access" value={event.accessNotes} onChange={(e) => setEvent({ ...event, accessNotes: e.target.value })} />
              </Field>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Produkty i dodatki</FieldLegend>
              <div className="flex flex-col gap-2 md:flex-row">
                <select
                  className="h-8 flex-1 border bg-background px-2 text-xs"
                  value={selectedSku}
                  onChange={(event) => setSelectedSku(event.target.value)}
                >
                  {products.data?.items.map((product) =>
                    product ? (
                      <option key={product.sku} value={product.sku}>
                        {product.namePl}
                      </option>
                    ) : null,
                  )}
                </select>
                <Button type="button" onClick={addItem}>
                  Dodaj pozycję
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {selectedProducts.map(({ item, product }) => (
                  <div key={item.sku} className="flex items-center justify-between gap-2 border p-2">
                    <div>
                      <div className="font-medium">{product?.namePl}</div>
                      <div className="text-xs text-muted-foreground">{product?.sku}</div>
                    </div>
                    <Input
                      className="w-20"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((currentItem) =>
                            currentItem.sku === item.sku ? { ...currentItem, quantity: Number(event.target.value) } : currentItem,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Dane kontaktowe</FieldLegend>
              <div className="grid gap-3 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="name">Imię i nazwisko</FieldLabel>
                  <Input id="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input id="email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Telefon</FieldLabel>
                  <Input id="phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="message">Wiadomość</FieldLabel>
                <Textarea id="message" value={customer.message} onChange={(e) => setCustomer({ ...customer, message: e.target.value })} />
              </Field>
              <label className="flex items-start gap-2 text-xs">
                <Checkbox checked={customer.privacyAccepted} onCheckedChange={(checked) => setCustomer({ ...customer, privacyAccepted: checked === true })} />
                Akceptuję politykę prywatności.
              </label>
              <label className="flex items-start gap-2 text-xs">
                <Checkbox checked={customer.termsAccepted} onCheckedChange={(checked) => setCustomer({ ...customer, termsAccepted: checked === true })} />
                Akceptuję regulamin wynajmu.
              </label>
              <FieldDescription>Turnstile jest makietą: formularz wysyła token `mock-turnstile-token`.</FieldDescription>
            </FieldSet>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => quoteMutation.mutate(quotePayload)} disabled={quoteMutation.isPending || items.length === 0}>
                Oblicz wycenę
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!quoteMutation.data || submitMutation.isPending}
                onClick={() =>
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
                  })
                }
              >
                Wyślij zapytanie
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wycena robocza</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-2">
                  <span>Suma produktów</span>
                  <strong>{formatMoney(quoteMutation.data.subtotalGrosz)}</strong>
                </div>
                <div className="flex justify-between gap-2 text-muted-foreground">
                  <span>Dojazd</span>
                  <span>{quoteMutation.data.travelFee.label}</span>
                </div>
                <div className="flex justify-between gap-2 border-t pt-2">
                  <span>Szacunek</span>
                  <strong>{formatMoney(quoteMutation.data.totalEstimateGrosz)}</strong>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs/relaxed text-muted-foreground">Wypełnij dane i oblicz wycenę, aby zobaczyć pozycje oraz dodatkowe godziny.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
