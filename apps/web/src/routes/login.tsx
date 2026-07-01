import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const redirectTo = typeof search.redirect === "string" && search.redirect.startsWith("/admin") ? search.redirect : undefined;
    return redirectTo ? { redirect: redirectTo } : {};
  },
  beforeLoad: async ({ search }) => {
    const session = await authClient.getSession();
    if (session.data && search.redirect) {
      redirect({ to: search.redirect, throw: true });
    }
    if (session.data && !search.redirect) {
      redirect({ to: "/admin", throw: true });
    }
  },
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-page items-center justify-center px-4 py-10 md:px-6">
      <LoginForm className="w-full max-w-sm" redirectTo={search.redirect ?? "/admin"} />
    </main>
  );
}
