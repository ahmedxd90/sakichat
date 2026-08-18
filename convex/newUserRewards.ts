import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const NEW_USER_BADGE_DAYS = 30;
const NEW_USER_VIP_DAYS = 7;
const NEW_USER_COINS = 30000;
const NEW_USER_WINDOW_MS = 7 * 86400000;
const CLAIM_RATE_LIMIT = { maxAttempts: 3, windowMs: 60_000 };

export const claimNewUserReward = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    // ── Rate limiting server-side ──────────────────────────────────────────
    const windowStart = Date.now() - CLAIM_RATE_LIMIT.windowMs;
    const recentAttempts = await ctx.db
      .query("rateLimitLogs")
      .withIndex("by_user_and_action", (q) =>
        q.eq("userId", userId).eq("action", "claimNewUserReward")
      )
      .filter((q) => q.gt(q.field("createdAt"), windowStart))
      .collect();

    if (recentAttempts.length >= CLAIM_RATE_LIMIT.maxAttempts) {
      await ctx.db.insert("securityLogs", {
        userId,
        eventType: "rate_limit_exceeded",
        details: "claimNewUserReward exceeded",
        severity: "medium",
        createdAt: Date.now(),
      });
      throw new Error("محاولات كثيرة. حاول مرة أخرى لاحقاً.");
    }

    await ctx.db.insert("rateLimitLogs", {
      userId,
      action: "claimNewUserReward",
      createdAt: Date.now(),
    });

    // ── جلب الملف الشخصي ──────────────────────────────────────────────────
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    // ── التحقق من عدم الاستلام مسبقاً ────────────────────────────────────
    if (profile.newUserRewardClaimed) {
      throw new Error("تم استلام مكافأة المستخدم الجديد مسبقاً");
    }

    // ── التحقق من أن المستخدم جديد فعلاً ────────────────────────────────
    const now = Date.now();
    const isNewUser = (now - profile.createdAt) < NEW_USER_WINDOW_MS;
    if (!isNewUser) {
      await ctx.db.insert("securityLogs", {
        userId,
        eventType: "invalid_reward_claim",
        details: "User tried to claim new-user reward after window expired",
        severity: "medium",
        createdAt: now,
      });
      throw new Error("انتهت صلاحية مكافأة المستخدم الجديد");
    }

    // ── تطبيق المكافآت ────────────────────────────────────────────────────
    const currentCoins = profile.goldCoins ?? 0;
    const currentExpiry =
      profile.vipExpiresAt && profile.vipExpiresAt > now
        ? profile.vipExpiresAt
        : now;

    await ctx.db.patch(profile._id, {
      goldCoins: currentCoins + NEW_USER_COINS,
      isVip: true,
      vipLevel: Math.max(profile.vipLevel ?? 0, 1),
      vipExpiresAt: currentExpiry + NEW_USER_VIP_DAYS * 86400000,
      newUserRewardClaimed: true,
      newUserBadgeExpiresAt: now + NEW_USER_BADGE_DAYS * 86400000,
      hasNewUserFrame: true,
    });

    return { success: true };
  },
});

export const getNewUserStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    const now = Date.now();
    const claimed = !!profile.newUserRewardClaimed;
    const badgeActive =
      claimed &&
      !!profile.newUserBadgeExpiresAt &&
      profile.newUserBadgeExpiresAt > now;
    const hasFrame = !!profile.hasNewUserFrame;
    const isNewUser = (now - profile.createdAt) < NEW_USER_WINDOW_MS;

    return {
      claimed,
      badgeActive,
      hasFrame,
      isNewUser,
      badgeExpiresAt: profile.newUserBadgeExpiresAt ?? null,
    };
  },
});
