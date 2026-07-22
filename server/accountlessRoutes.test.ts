import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { prefetchForPath, type SsrPrefetch } from "../client/src/ssr/prefetch";

const unusedPrefetch = {} as SsrPrefetch;

describe("accountless SSR routes", () => {
  it.each([
    ["/watchlist", "Your Skool community watchlist"],
    ["/compare?slugs=one,two", "Compare Skool communities"],
  ])("serves %s as a real noindex page", async (path, title) => {
    const head = await prefetchForPath(path, new QueryClient(), unusedPrefetch);
    expect(head.notFound).not.toBe(true);
    expect(head.noindex).toBe(true);
    expect(head.title).toContain(title);
  });
});
