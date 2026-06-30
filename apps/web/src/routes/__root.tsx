import { Toaster } from "@orksys-eventownia/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND } from "@/lib/brand";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: BRAND.fullName,
      },
      {
        name: "description",
        content: BRAND.description,
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/brand/logo-mark-light.webp",
        type: "image/webp",
      },
      {
        rel: "icon",
        href: "/brand/logo-mark-dark.webp",
        type: "image/webp",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  }),
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminRoute = pathname.startsWith("/admin");
  const showFooter =
    !isAdminRoute &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/todos") &&
    !pathname.startsWith("/login");
  const showDevtools = import.meta.env.DEV && isAdminRoute;

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <OrderCartProvider>
          {isAdminRoute ? (
            <Outlet />
          ) : (
            <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
              <SiteHeader />
              <Outlet />
              {showFooter ? <SiteFooter /> : null}
            </div>
          )}
          <Toaster richColors />
        </OrderCartProvider>
      </ThemeProvider>
      {showDevtools ? (
        <>
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        </>
      ) : null}
    </>
  );
}
