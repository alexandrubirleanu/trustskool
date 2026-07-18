import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getClickStats,
  getCommunityBySlug,
  getFilterOptions,
  getLatestIngestionRun,
  getSimilarCommunities,
  listClicks,
  listCommunities,
} from "./dbCommunities";
import { runIngestion } from "./ingestion";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  communities: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().max(200).optional(),
          language: z.string().max(64).optional(),
          category: z.string().max(128).optional(),
          price: z.enum(["all", "free", "paid"]).default("all"),
          sort: z.enum(["trustSkore", "totalMembers", "growthRateBp", "category"]).default("trustSkore"),
          direction: z.enum(["asc", "desc"]).default("desc"),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(60).default(24),
        }),
      )
      .query(({ input }) => listCommunities(input)),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(191) }))
      .query(async ({ input }) => {
        const community = await getCommunityBySlug(input.slug);
        return community ?? null;
      }),

    similar: publicProcedure
      .input(
        z.object({
          slug: z.string().min(1).max(191),
          language: z.string().max(64),
          category: z.string().max(128).nullable(),
        }),
      )
      .query(({ input }) => getSimilarCommunities(input.slug, input.language, input.category)),

    filters: publicProcedure.query(() => getFilterOptions()),
  }),

  admin: router({
    clickStats: adminProcedure.query(() => getClickStats()),
    clicks: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(2000).default(500) }).optional())
      .query(({ input }) => listClicks(input?.limit ?? 500)),
    lastIngestion: adminProcedure.query(async () => (await getLatestIngestionRun()) ?? null),
    runIngestion: adminProcedure
      .input(z.object({ datasetUrl: z.string().url().optional() }).optional())
      .mutation(({ input }) => runIngestion(input?.datasetUrl)),
  }),
});

export type AppRouter = typeof appRouter;
