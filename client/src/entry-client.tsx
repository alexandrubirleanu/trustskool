import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  type DehydratedState,
} from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import superjson from "superjson";
import { Router } from "wouter";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

// Keep the template's client behavior; add ONLY staleTime so just-hydrated
// data is not immediately refetched (TanStack v5 defaults staleTime to 0).
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies,
        // the runtime mirrors the session into sessionStorage so we can forward
        // it as a Bearer token. The OAuth cookie flow takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const rawState = (window as unknown as { __RQ_STATE__?: unknown }).__RQ_STATE__;
const dehydratedState = (
  rawState ? superjson.deserialize(rawState as Parameters<typeof superjson.deserialize>[0]) : undefined
) as DehydratedState | undefined;

const appTree = (
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <Router>
          <App />
        </Router>
      </HydrationBoundary>
    </QueryClientProvider>
  </trpc.Provider>
);

const rootEl = document.getElementById("root")!;
// If the SSR fallback served an empty shell, render fresh instead of hydrating
// to avoid a guaranteed hydration mismatch error.
if (rootEl.firstChild) {
  hydrateRoot(rootEl, appTree);
} else {
  createRoot(rootEl).render(appTree);
}
