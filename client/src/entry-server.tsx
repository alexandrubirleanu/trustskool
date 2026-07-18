import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToString } from "react-dom/server";
import superjson from "superjson";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import App from "./App";
import { prefetchForPath, type HeadMeta, type SsrPrefetch } from "./ssr/prefetch";

export type RenderResult = {
  html: string;
  dehydratedState: unknown;
  head: HeadMeta;
};

export async function render(url: string, prefetch: SsrPrefetch): Promise<RenderResult> {
  // Server-only QueryClient: fail fast into the shell fallback, no focus refetch.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });

  // Split at the FIRST "?" ourselves and pass ssrPath/ssrSearch explicitly —
  // wouter's own split mishandles a bare trailing "?" and drops content after
  // a second "?".
  const qi = url.indexOf("?");
  const ssrPath = qi === -1 ? url : url.slice(0, qi);
  const ssrSearch = qi === -1 ? "" : url.slice(qi + 1);

  const head = await prefetchForPath(url, queryClient, prefetch);

  // Dummy client: plain useQuery hooks issue no requests during renderToString;
  // everything the page needs is already in the cache from prefetch.
  const trpcClient = trpc.createClient({
    links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
  });

  const html = renderToString(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={ssrPath} ssrSearch={ssrSearch}>
          <App />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>,
  );

  return { html, dehydratedState: dehydrate(queryClient), head };
}
