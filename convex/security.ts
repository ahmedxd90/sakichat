// @ts-nocheck
/**
 * SAKU Backend Security
 * - Rate Limiting
 * - Security event logging
 * - Auto-ban on repeated violations
 * - Session validation
 */
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const RATE_LIMITS = {
  sensitive: { maxRequests: 10, windowMs: 60_000 },
  normal: { maxRequests: 60, windowMs: 60_000 },
  auth: { maxRequests: 5, windowMs: 300_000 },
};

export const logSecurityEvent = mutation({
  args: {
    eventType: v.string(),
    fingerprint: v.optional(v.string()),
    details: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    await ctx.db.insert("securityLogs", {
      userId: userId ?? undefined,
      eventType: args.eventType,
      fingerprint: args.fingerprint,
      details: args.details,
      severity: args.severity,
      createdAt: Date.now(),
    });

    if (args.severity === "critical" && userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      const violations = (profile?.securityViolations ?? 0) + 1;
      if (profile) {
        await ctx.db.patch(profile._id, { securityViolations: violations });
      }

      if (violations >= 3 && profile && !profile.isBanned) {
        await ctx.db.patch(profile._id, {
          isBanned: true,
          banReason: "حظر تلقائي: محاولات اختراق متعددة",
          bannedAt: Date.now(),
        });

        if (args.fingerprint) {
          const existingBan = await ctx.db
            .query("deviceBans")
            .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
            .first();

          if (!existingBan) {
            await ctx.db.insert("deviceBans", {
              fingerprint: args.fingerprint,
              userId,
              bannedBy: userId,
              reason: "حظر تلقائي: محاولات اختراق متعددة",
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    return { logged: true };
  },
});

export const checkRateLimit = mutation({
  args: {
    action: v.string(),
    limitType: v.union(v.literal("sensitive"), v.literal("normal"), v.literal("auth")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false, reason: "غير مصرح" };

    const limit = RATE_LIMITS[args.limitType];
    const windowStart = Date.now() - limit.windowMs;

    const recentRequests = await ctx.db
      .query("rateLimitLogs")
      .withIndex("by_user_and_action", (q) =>
        q.eq("userId", userId).eq("action", args.action)
      )
      .filter((q) => q.gt(q.field("createdAt"), windowStart))
      .collect();

    if (recentRequests.length >= limit.maxRequests) {
      await ctx.db.insert("securityLogs", {
        userId,
        eventType: "rate_limit_exceeded",
        details: `Action: ${args.action}, Count: ${recentRequests.length}`,
        severity: "medium",
        createdAt: Date.now(),
      });

      return {
        allowed: false,
        reason: "تجاوزت الحد المسموح به. حاول مرة أخرى لاحقاً.",
        retryAfter: Math.ceil(limit.windowMs / 1000),
      };
    }

    await ctx.db.insert("rateLimitLogs", {
      userId,
      action: args.action,
      createdAt: Date.now(),
    });

    return { allowed: true };
  },
});

export const getSecurityLogs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.isSuperAdmin) return [];

    const logs = await ctx.db
      .query("securityLogs")
      .order("desc")
      .take(100);

    return await Promise.all(
      logs.map(async (log) => {
        let userName = "مجهول";
        if (log.userId) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", log.userId))
            .unique();
          userName = profile?.name ?? "مجهول";
        }
        return { ...log, userName };
      })
    );
  },
});

export const cleanupRateLimitLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 3_600_000;
    const old = await ctx.db
      .query("rateLimitLogs")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(500);

    for (const log of old) {
      await ctx.db.delete(log._id);
    }
  },
});

export const validateSession = query({
  args: {
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { valid: false, reason: "no_auth" };

    const deviceBan = await ctx.db
      .query("deviceBans")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (deviceBan) {
      return { valid: false, reason: "device_banned", message: deviceBan.reason };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile?.isBanned) {
      return { valid: false, reason: "account_banned", message: profile.banReason };
    }

    return { valid: true };
  },
});
