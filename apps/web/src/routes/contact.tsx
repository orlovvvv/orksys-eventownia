import { Button } from "@orksys-eventownia/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orksys-eventownia/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { Textarea } from "@orksys-eventownia/ui/components/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/contact")({
  component: ContactRoute,
});

function ContactRoute() {
  const settings = useQuery(trpc.admin.settings.get.queryOptions());
  const [form, setForm] = useState({ name: "Jan Kowalski", email: "jan@example.pl", phone: "+48 600 000 000", message: "Chcę zapytać o termin." });
  const contact = useMutation(trpc.contact.submit.mutationOptions());

  return (
    <main className="mx-auto grid w-full max-w-page gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-6 lg:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-base">
          <div className="font-semibold">{settings.data?.settings.businessName}</div>
          <div>{settings.data?.settings.publicPhone}</div>
          <div>{settings.data?.settings.publicEmail}</div>
          <p className="text-sm/relaxed text-muted-foreground">{settings.data?.settings.serviceAreaDescription}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Formularz kontaktowy</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field><FieldLabel htmlFor="contact-name">Imię</FieldLabel><Input id="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field><FieldLabel htmlFor="contact-email">E-mail</FieldLabel><Input id="contact-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field><FieldLabel htmlFor="contact-phone">Telefon</FieldLabel><Input id="contact-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field><FieldLabel htmlFor="contact-message">Wiadomość</FieldLabel><Textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            <Button onClick={() => contact.mutate({ ...form, turnstileToken: "mock-turnstile-token" })}>Wyślij</Button>
            {contact.data ? <p className="text-sm text-muted-foreground">Zapisano kontakt: {contact.data.contactId}</p> : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </main>
  );
}
