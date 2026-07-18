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
  getOwnerProfileBySlug,
  getPlatformStats,
  getSimilarCommunities,
  listClicks,
  listCommunities,
  listOwnerProfiles,
  upsertOwnerProfile,
} from "./dbCommunities";
import { runIngestion } from "./ingestion";
import { computeMrrEstimate, type MrrStatus } from "./mrrEstimate";
import {
  getCategoryPage,
  getContentPage,
  getFounderPage,
  listContentPages,
  listContentPagesByTypes,
} from "./dbContent";

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
          trending: z.boolean().optional(),
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
    stats: publicProcedure.query(() => getPlatformStats()),

    mrrEstimate: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(191) }))
      .query(async ({ input }) => {
        const community = await getCommunityBySlug(input.slug);
        if (!community) return null;

        const ownerProfile = await getOwnerProfileBySlug(input.slug);
        if (!ownerProfile) {
          // No owner profile yet — show naive ceiling only for paid communities
          return computeMrrEstimate(
            input.slug,
            community.priceAmountCents ?? null,
            community.totalMembers,
            null,
            null,
          );
        }

        return computeMrrEstimate(
          input.slug,
          community.priceAmountCents ?? null,
          community.totalMembers,
          ownerProfile.mrrStatus as MrrStatus | null,
          ownerProfile.ownedCommunities ?? null,
        );
      }),
  }),

  ownerProfiles: router({
    /** Admin-only: list all scraped owner profiles */
    list: adminProcedure.query(() => listOwnerProfiles()),
    /** Admin-only: upsert a single owner profile (used by import script / pipeline) */
    upsert: adminProcedure
      .input(
        z.object({
          handle: z.string().min(1).max(128),
          firstName: z.string().max(128).nullable().optional(),
          lastName: z.string().max(128).nullable().optional(),
          mrrStatus: z
            .enum(["none", "clover", "liftoff", "rocket", "crown", "diamond", "red_diamond", "goat", "goated"])
            .nullable()
            .optional(),
          activityStatus: z.string().max(64).nullable().optional(),
          ownedCommunities: z
            .array(
              z.object({
                slug: z.string(),
                display_name: z.string(),
                total_members: z.number(),
                afl_percent: z.number().nullable(),
              }),
            )
            .nullable()
            .optional(),
          scrapedAt: z.date().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await upsertOwnerProfile({
          handle: input.handle,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          mrrStatus: (input.mrrStatus as any) ?? null,
          activityStatus: input.activityStatus ?? null,
          ownedCommunities: input.ownedCommunities ?? null,
          scrapedAt: input.scrapedAt ?? new Date(),
        });
        return { success: true };
      }),
  }),

  content: router({
    /** Get a single content page by slug + type */
    bySlug: publicProcedure
      .input(
        z.object({
          slug: z.string().min(1).max(255),
          type: z.enum(["founder", "category", "guide", "pillar", "faq", "skool-news"]),
        }),
      )
      .query(async ({ input }) => {
        const page = await getContentPage(input.slug, input.type);
        return page ?? null;
      }),

    /** Get founder bio for a community slug (folds into community detail page) */
    founderByCommunitySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(255) }))
      .query(async ({ input }) => {
        const page = await getFounderPage(input.slug);
        return page ?? null;
      }),

    /** Get category framing copy */
    categoryBySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(128) }))
      .query(async ({ input }) => {
        const page = await getCategoryPage(input.slug);
        return page ?? null;
      }),

    /** List all pages of a given type */
    list: publicProcedure
      .input(z.object({ type: z.enum(["founder", "category", "guide", "pillar", "faq", "skool-news"]) }))
      .query(({ input }) => listContentPages(input.type)),

    /** List guides + pillar together for the Resources hub */
    resourcesList: publicProcedure.query(() =>
      listContentPagesByTypes(["guide", "pillar"]),
    ),

    /** List FAQ pages */
    faqList: publicProcedure.query(() => listContentPages("faq")),

    /** List Skool News pages (newest first) */
    newsList: publicProcedure.query(() => listContentPages("skool-news")),
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
