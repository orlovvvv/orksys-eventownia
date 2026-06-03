import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  component: FaqRoute,
});

const items = [
  ["Czy mogę zarezerwować od razu?", "Po wysłaniu zapytania obsługa potwierdzi termin i przygotuje rezerwację."],
  ["Czy dojazd jest w cenie?", "Wstępna wycena nie dolicza automatycznie dojazdu. Potwierdzimy go po lokalizacji."],
  ["Czy potrzebny jest prąd?", "Większość dmuchańców wymaga dostępu do 230V i bezpiecznego podłoża."],
  ["Co z pogodą?", "Przy niesprzyjających warunkach obsługa pomoże potwierdzić bezpieczne rozwiązanie lub nowy termin."],
  ["Jak działa zaliczka?", "Po potwierdzeniu rezerwacji otrzymasz informacje o płatności lub zaliczce."],
];

function FaqRoute() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-10 md:px-6">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">FAQ</h1>
        <p className="text-base/relaxed text-muted-foreground">
          Najczęstsze pytania o dostępność, dojazd, pogodę i płatności w procesie wynajmu.
        </p>
      </div>
      {items.map(([title, text]) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm/relaxed text-muted-foreground">{text}</CardContent>
        </Card>
      ))}
    </main>
  );
}
