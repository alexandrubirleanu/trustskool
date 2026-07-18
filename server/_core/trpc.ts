import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import superjson from "superjson";
import { ENV } from "./env";
import type { TrpcContext } from "./context";
import { ADMIN_EMAIL_ALLOWLIST, ADMIN_OTP_COOKIE_NAME } from "../adminOtp";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/** Check if the request carries a valid admin OTP session cookie */
async function hasValidOtpSession(req: TrpcContext["req"]): Promise<boolean> {
  const token = req.cookies?.[ADMIN_OTP_COOKIE_NAME];
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const email = payload.email as string | undefined;
    return !!(email && ADMIN_EMAIL_ALLOWLIST.has(email));
  } catch {
    return false;
  }
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Accept either: Manus OAuth admin role OR valid OTP session cookie
    const isOAuthAdmin = ctx.user?.role === 'admin';
    const isOtpAdmin = await hasValidOtpSession(ctx.req);

    if (!isOAuthAdmin && !isOtpAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        // Provide a synthetic user object if only OTP auth is present
        user: ctx.user ?? { id: 0, openId: "otp-admin", name: "Admin", role: "admin" as const, createdAt: new Date() },
      },
    });
  }),
);
