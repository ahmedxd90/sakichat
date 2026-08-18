import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const PRO_PRICES: Record<number, number> = {
  1: 2000000,
  2: 5000000,
  3: 10000000,
  4: 20000000,
  5: 50000000,
};

export const getMyProStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    const isPro = Boolean(profile.isPro && (profile.proExpiresAt ?? 0) > Date.now());
    return {
      isPro,
      proLevel: profile.proLevel ?? (isPro ? 1 : 0),
      proExpiresAt: profile.proExpiresAt ?? 0,
      proSettings: profile.proSettings ?? {
        glowingName: true,
        lionEntry: true,
        antiKick: true,
        privateProfile: false,
        hideRoomPresence: false,
      },
    };
  },
});

export const purchasePro = mutation({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");
    if (args.level < 1 || args.level > 5) throw new Error("مستوى PRO غير متاح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const cost = PRO_PRICES[args.level] ?? 2000000;
    const currentCoins = profile.goldCoins ?? 0;
    if (currentCoins < cost) {
      throw new Error(`رصيد العملات غير كافٍ. التكلفة المطلوبة: ${cost.toLocaleString()} عملة`);
    }

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    await ctx.db.patch(profile._id, {
      goldCoins: currentCoins - cost,
      isPro: true,
      proLevel: args.level,
      proExpiresAt: expiresAt,
      // Compatibility fields keep existing room renderers working; all visible labels are PRO.
      isVip: true,
      vipLevel: args.level,
      vipExpiresAt: expiresAt,
      proSettings: profile.proSettings ?? {
        glowingName: true,
        lionEntry: true,
        antiKick: true,
        privateProfile: false,
        hideRoomPresence: false,
      },
    });

    return { success: true, newBalance: currentCoins - cost, expiresAt };
  },
});

export const resetLegacyVip = mutation({
  args: {},
  handler: async (ctx) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) throw new Error("يجب تسجيل الدخول أولاً");
    const actor = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", actorId)).first();
    if (!actor?.isSuperAdmin) throw new Error("هذه العملية متاحة للسوبر أدمن فقط");
    const profiles = await ctx.db.query("profiles").collect();
    let cleared = 0;
    for (const profile of profiles) {
      if (profile.isVip || profile.vipLevel || profile.vipExpiresAt) {
        await ctx.db.patch(profile._id, { isVip: false, vipLevel: 0, vipExpiresAt: undefined, vipCycleCharged: undefined, vipCycleStartedAt: undefined });
        cleared += 1;
      }
    }
    return { success: true, cleared };
  },
});

export const updateProSettings = mutation({
  args: {
    glowingName: v.boolean(),
    lionEntry: v.boolean(),
    antiKick: v.boolean(),
    privateProfile: v.boolean(),
    hideRoomPresence: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const active = Boolean(profile.isPro && (profile.proExpiresAt ?? 0) > Date.now());
    const level = profile.proLevel ?? 0;
    if (!active) throw new Error("تحتاج إلى عضوية PRO مفعّلة");
    if (args.lionEntry && level < 2) throw new Error("دخولية الأسد متاحة من PRO 2");
    if (args.antiKick && level < 3) throw new Error("الحصانة متاحة من PRO 3");

    await ctx.db.patch(profile._id, {
      proSettings: {
        glowingName: args.glowingName,
        lionEntry: args.lionEntry,
        antiKick: args.antiKick,
        privateProfile: args.privateProfile,
        hideRoomPresence: args.hideRoomPresence,
      },
      isPrivateProfile: args.privateProfile,
      hideRoomPresence: args.hideRoomPresence,
    });

    return { success: true };
  },
});
