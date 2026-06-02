import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export function LegalPage({ type }: { type: "terms" | "privacy" | "cookies" }) {
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const doc = settings.data?.legalDocuments.find((item) => item.type === type && item.active);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{doc?.title ?? "Dokument prawny"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm/relaxed text-muted-foreground">
          {doc?.bodyMd}
          <p className="mt-4">To roboczy dokument makietowy. Przed produkcją wymaga przeglądu prawnego.</p>
        </CardContent>
      </Card>
    </main>
  );
}
