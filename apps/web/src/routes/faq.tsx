import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  component: FaqRoute,
});

const items = [
  ["Czy mogę zarezerwować od razu?", "Nie w MVP. Każdy termin wymaga potwierdzenia operatora."],
  ["Czy dojazd jest w cenie?", "Nie. Publiczna wycena pokazuje koszt dojazdu jako pozycję do potwierdzenia."],
  ["Czy potrzebny jest prąd?", "Większość dmuchańców wymaga dostępu do 230V i bezpiecznego podłoża."],
  ["Co z pogodą?", "Decyzja o realizacji lub zmianie terminu jest operacyjna i pozostaje po stronie admina."],
  ["Jak działa zaliczka?", "Mock płatności tworzy link po potwierdzeniu rezerwacji przez admina."],
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
