import type { Request, Response } from "express";
import type { SsrPrefetch } from "../../client/src/ssr/prefetch";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * In-process tRPC caller for SSR prefetch. Keeps ctx.user from the cookie.
 * All procedures exposed here are public and viewer-independent.
 */
export async function buildSsrPrefetch(req: Request, res: Response): Promise<SsrPrefetch> {
  const ctx = await createContext({ req, res } as never);
  const caller = appRouter.createCaller(ctx);
  return {
    communitiesList: input => caller.communities.list(input),
    communityBySlug: slug => caller.communities.bySlug({ slug }),
    communitiesFilters: () => caller.communities.filters(),
    communitiesStats: () => caller.communities.stats(),
  };
}
