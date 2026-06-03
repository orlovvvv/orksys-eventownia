import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export function LegalPage({ type }: { type: "terms" | "privacy" | "cookies" }) {
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const doc = settings.data?.legalDocuments.find((item) => item.type === type && item.active);
  return (
    <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">{doc?.title ?? "Dokument prawny"}</CardTitle>
        </CardHeader>
        <CardContent className="max-w-3xl text-base/relaxed text-muted-foreground">
          {doc?.bodyMd}
          <p className="mt-4">Dokument ma charakter informacyjny. Aktualną treść regulaminu potwierdzimy przed finalną rezerwacją.</p>
        </CardContent>
      </Card>
    </main>
  );
}
