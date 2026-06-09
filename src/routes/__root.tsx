import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { SessionProvider } from "../lib/session";
import { ThemeProvider } from "../lib/theme";

function NotFoundComponent() {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1 style={{ fontSize: 56, margin: 0 }}>404</h1>
      <p style={{ color: "#5b6b7c" }}>This page doesn't exist.</p>
      <a href="/" style={{ color: "#0066cc", fontWeight: 600 }}>Return to welcome</a>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#5b6b7c" }}>{error.message}</p>
      <a href="/" style={{ color: "#0066cc", fontWeight: 600 }}>Return to welcome</a>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Open Sovereign AI Cloud" },
      { name: "description", content: "OSAC — sovereign, role-based AI cloud control plane." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Restore path from GitHub Pages 404.html redirect */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=window.location.search.slice(1);if(p.indexOf('p=')===0){var path=decodeURIComponent(p.slice(2).replace(/&q=/,'?'));window.history.replaceState(null,null,'/'+path);}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SessionProvider>
          <Outlet />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
