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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-normal">FAQ</h1>
      {items.map(([title, text]) => (
        <Card key={title}>
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent className="text-sm/relaxed text-muted-foreground">{text}</CardContent>
        </Card>
      ))}
    </main>
  );
}
