import { Button } from "@orksys-eventownia/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@orksys-eventownia/ui/components/field";
import { Input } from "@orksys-eventownia/ui/components/input";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { GalleryVerticalEndIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  className,
  redirectTo = "/admin",
  ...props
}: React.ComponentProps<"div"> & {
  redirectTo?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && password.length >= 8 && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    await authClient.signIn.email(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: () => {
          toast.success("Zalogowano do panelu");
          window.location.assign(redirectTo);
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Nie udało się zalogować.");
        },
      },
    );

    setIsSubmitting(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-md border border-border/70 bg-card">
              <GalleryVerticalEndIcon aria-hidden="true" />
            </div>
            <BrandLogo imageClassName="h-10" nameClassName="text-lg" locationClassName="text-xs" />
            <div className="grid gap-1">
              <h1 className="text-xl font-bold">Panel administratora</h1>
              <FieldDescription>Logowanie dla operatorów Eventownia.</FieldDescription>
            </div>
          </div>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
              required
            />
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="password">Hasło</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              required
            />
            {error ? <FieldDescription role="alert" className="text-destructive">{error}</FieldDescription> : null}
          </Field>
          <Field>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Logowanie…" : "Zaloguj"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Dostęp jest ograniczony do kont administracyjnych skonfigurowanych dla platformy.
      </FieldDescription>
    </div>
  );
}
