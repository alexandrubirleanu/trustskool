import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAdminOpportunityView,
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
  toggleOwnerJoined,
  upsertOwnerProfile,
} from "./dbCommunities";
import { runIngestion } from "./ingestion";
import { insertFraudReport, listFraudReports } from "./dbFraudReports";
import { sendFraudReportEmail } from "./emailNotify";
import { computeMrrEstimate, type MrrStatus } from "./mrrEstimate";
import { createHeartbeatJob, listHeartbeatJobs } from "./_core/heartbeat";
import {
  getCategoryPage,
  getContentPage,
  getFounderPage,
  listContentPages,
  listContentPagesByTypes,
} from "./dbContent";
import {
  ADMIN_EMAIL_ALLOWLIST,
  ADMIN_OTP_COOKIE_NAME,
  consumeOtp,
  createOtp,
  sendOtpEmail,
} from "./adminOtp";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ENV } from "./_core/env";
import {
  computeCategoryRankings,
  getCategoryRanking,
  getCategoryRankingsSummary,
  getLatestSnapshotMonth,
} from "./dbRankings";

/** Read a cookie by name from the raw Cookie header (no cookie-parser middleware needed) */
function getCookieFromRequest(req: { headers: { cookie?: string } }, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  return parseCookieHeader(raw)[name];
}

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
          mrrVerified: z.boolean().optional(),
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
          type: z.enum(["founder", "review", "category", "guide", "pillar", "faq", "skool-news"]),
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
      .input(z.object({ type: z.enum(["founder", "review", "category", "guide", "pillar", "faq", "skool-news"]) }))
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

  /** Public fraud/scam report submission */
  fraudReport: router({
    submit: publicProcedure
      .input(
        z.object({
          communityRef: z.string().min(2).max(512),
          reporterEmail: z.string().email(),
          description: z.string().min(20).max(5000),
          evidence: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await insertFraudReport(input);
        const rows = await listFraudReports(1);
        const reportId = rows[0]?.id ?? 0;
        sendFraudReportEmail({
          communityRef: input.communityRef,
          reporterEmail: input.reporterEmail,
          description: input.description,
          evidence: input.evidence ?? null,
          reportId,
        }).catch(err => console.error("[FraudReport] Email send failed:", err));
        return { success: true, reportId };
      }),
    list: adminProcedure.query(() => listFraudReports(100)),
  }),

  adminOtp: router({
    /** Request an OTP — only allowed emails can proceed */
    requestOtp: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        if (!ADMIN_EMAIL_ALLOWLIST.has(email)) {
          // Return success to avoid leaking the allowlist
          return { sent: false };
        }
        const code = await createOtp(email);
        await sendOtpEmail(email, code);
        return { sent: true };
      }),

    /** Verify OTP and set admin session cookie (30 min) */
    verifyOtp: publicProcedure
      .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        if (!ADMIN_EMAIL_ALLOWLIST.has(email)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorised" });
        }
        const valid = await consumeOtp(email, input.code);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired code" });
        }
        // Sign a 30-minute admin session JWT
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ email, role: "admin_otp" })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("30m")
          .sign(secret);
        const cookieOpts = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_OTP_COOKIE_NAME, token, {
          ...cookieOpts,
          maxAge: 30 * 60 * 1000,
        });
        return { ok: true };
      }),

    /** Check if the current admin OTP session cookie is valid */
    checkSession: publicProcedure.query(async ({ ctx }) => {
      const token = getCookieFromRequest(ctx.req, ADMIN_OTP_COOKIE_NAME);
      if (!token) return { authenticated: false };
      try {
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
        const email = payload.email as string | undefined;
        if (!email || !ADMIN_EMAIL_ALLOWLIST.has(email)) return { authenticated: false };
        return { authenticated: true, email };
      } catch {
        return { authenticated: false };
      }
    }),

    /** Logout: clear the admin OTP session cookie */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOpts = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_OTP_COOKIE_NAME, { ...cookieOpts, maxAge: -1 });
      return { ok: true };
    }),
  }),

  admin: router({
    clickStats: adminProcedure.query(() => getClickStats()),
    clicks: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(2000).default(500) }).optional())
      .query(({ input }) => listClicks(input?.limit ?? 500)),
    /** Decision-support view: click count + TrustSkore + afl_percent + ownerJoined per community */
    opportunityView: adminProcedure.query(() => getAdminOpportunityView()),
    /** Toggle ownerJoined for a community */
    toggleOwnerJoined: adminProcedure
      .input(z.object({ slug: z.string().min(1), joined: z.boolean() }))
      .mutation(({ input }) => toggleOwnerJoined(input.slug, input.joined)),
    lastIngestion: adminProcedure.query(async () => (await getLatestIngestionRun()) ?? null),
    runIngestion: adminProcedure
      .input(z.object({ datasetUrl: z.string().url().optional() }).optional())
      .mutation(({ input }) => runIngestion(input?.datasetUrl)),
    /** Provision the daily digest cron job (idempotent: checks if already exists first) */
    provisionDigestJob: adminProcedure.mutation(async ({ ctx }) => {
      const session = ctx.req.cookies?.session ?? "";
      // Check existing jobs to avoid duplicates
      const existing = await listHeartbeatJobs(session);
      const alreadyExists = existing.jobs.some((j: { name: string }) => j.name === "daily-digest");
      if (alreadyExists) return { created: false, message: "Daily digest job already provisioned" };
      const result = await createHeartbeatJob(
        {
          name: "daily-digest",
          cron: "0 0 9 * * *", // 09:00 UTC daily
          path: "/api/scheduled/digest",
          method: "POST",
          description: "Daily email digest of Tier B affiliate clicks (free/unknown-commission communities)",
        },
        session,
      );
      return { created: true, taskUid: result.taskUid, nextExecutionAt: result.nextExecutionAt };
    }),
    /** Register (idempotent) the nightly full-dataset ingestion cron at 03:00 UTC */
    provisionNightlyIngestion: adminProcedure.mutation(async ({ ctx }) => {
      const session = ctx.req.cookies?.session ?? "";
      const existing = await listHeartbeatJobs(session);
      const alreadyExists = existing.jobs.some((j: { name: string }) => j.name === "nightly-ingestion");
      if (alreadyExists) return { created: false, message: "Nightly ingestion job already provisioned" };
      const result = await createHeartbeatJob(
        {
          name: "nightly-ingestion",
          cron: "0 0 3 * * *", // 03:00 UTC daily
          path: "/api/scheduled/ingest",
          method: "POST",
          description: "Nightly full dataset ingestion from GitHub pipeline (communities.json → DB upsert)",
        },
        session,
      );
      return { created: true, taskUid: result.taskUid, nextExecutionAt: result.nextExecutionAt };
    }),
    /** List all scheduled heartbeat jobs */
    listScheduledJobs: adminProcedure.query(async ({ ctx }) => {
      const session = ctx.req.cookies?.session ?? "";
      return listHeartbeatJobs(session);
    }),
    /** Manually trigger a category rankings snapshot (admin only) */
    recomputeRankings: adminProcedure
      .input(z.object({ snapshotMonth: z.string().regex(/^\d{4}-\d{2}$/).optional() }).optional())
      .mutation(async ({ input }) => {
        const results = await computeCategoryRankings(input?.snapshotMonth);
        const total = results.reduce((s, r) => s + r.inserted, 0);
        return { ok: true, categories: results, totalInserted: total };
      }),
  }),
  rankings: router({
    /** Summary of latest snapshot for all 9 categories (for /rankings index page) */
    summary: publicProcedure.query(() => getCategoryRankingsSummary()),
    /** Latest snapshot month */
    latestMonth: publicProcedure.query(() => getLatestSnapshotMonth()),
    /** Ranked list for a single category */
    byCategory: publicProcedure
      .input(z.object({ category: z.string().min(1).max(64) }))
      .query(({ input }) => getCategoryRanking(input.category)),
  }),
});

export type AppRouter = typeof appRouter;
