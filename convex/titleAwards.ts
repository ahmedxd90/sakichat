// @ts-nocheck
// نظام منح الألقاب التلقائي
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const checkAndAwardReelsKing = internalMutation({
  args: { reelOwnerUserId: v.id("users"), newLikesCount: v.number() },
  handler: async (ctx, args) => {
    if (args.newLikesCount < 100) return;
    const ownerProf = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.reelOwnerUserId))
      .unique();
    if (!ownerProf || ownerProf.isReelsKing) return;
    await ctx.db.patch(ownerProf._id, { isReelsKing: true });
    await ctx.db.insert("notifications", {
      userId: args.reelOwnerUserId,
      type: "title_unlocked",
      title: "تم منحك لقب ملك الريلز",
      body: "حصل ريلزك على 100 إعجاب! حصلت على اللقب اللامع",
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── إعادة حساب إعجابات اللحظات لمستخدم معين ومنح اللقب إذا استحق ──
export const recalcMomentsLikesForUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin && me?.userId !== args.targetUserId) throw new Error("غير مصرح");

    // جلب كل لحظات المستخدم
    const moments = await ctx.db.query("moments")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    // حساب إجمالي الإعجابات من كل اللحظات
    let totalLikes = 0;
    for (const m of moments) {
      totalLikes += (m.likes ?? 0);
    }

    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!profile) throw new Error("المستخدم غير موجود");

    // تحديث العداد
    await ctx.db.patch(profile._id, { totalMomentsLikesReceived: totalLikes });

    // منح اللقب إذا استحق
    if (totalLikes >= 100 && !profile.isMomentsKing) {
      await ctx.db.patch(profile._id, { isMomentsKing: true });
      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        type: "title_unlocked",
        title: "تم منحك لقب ملك اللحظات",
        body: "حصلت على 100 إعجاب على لحظاتك! حصلت على اللقب اللامع",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { totalLikes, awarded: totalLikes >= 100 };
  },
});

// ── منح لقب يدوياً من الأدمن ──
export const grantTitleManually = mutation({
  args: {
    targetUserId: v.id("users"),
    titleKey: v.union(
      v.literal("isMomentsKing"),
      v.literal("isMomentWriter"),
      v.literal("isMillionaireTitle"),
      v.literal("isReelsKing")
    ),
    grant: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");

    const target = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!target) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(target._id, { [args.titleKey]: args.grant });

    if (args.grant) {
      const titleNames: Record<string, string> = {
        isMomentsKing: "ملك اللحظات",
        isMomentWriter: "كاتب منشور",
        isMillionaireTitle: "المليونير",
        isReelsKing: "ملك الريلز",
      };
      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        type: "title_unlocked",
        title: `تم منحك لقب ${titleNames[args.titleKey]}`,
        body: "تهانينا! حصلت على لقب جديد لامع",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ── جلب إحصائيات الألقاب لمستخدم ──
export const getUserTitleStats = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!profile) return null;

    // حساب الإعجابات الفعلية من اللحظات
    const moments = await ctx.db.query("moments")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();
    const actualMomentsLikes = moments.reduce((sum, m) => sum + (m.likes ?? 0), 0);
    const momentsCount = moments.length;

    // حساب أعلى إعجابات ريلز
    const reels = await ctx.db.query("reels")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();
    const maxReelLikes = reels.reduce((max, r) => Math.max(max, r.likes ?? 0), 0);

    return {
      isMomentsKing: profile.isMomentsKing ?? false,
      isMomentWriter: profile.isMomentWriter ?? false,
      isMillionaireTitle: profile.isMillionaireTitle ?? false,
      isReelsKing: profile.isReelsKing ?? false,
      totalMomentsLikesReceived: profile.totalMomentsLikesReceived ?? 0,
      actualMomentsLikes,
      momentsCount,
      maxReelLikes,
      totalCoinsCharged: profile.totalCoinsCharged ?? 0,
      totalMomentsPosted: profile.totalMomentsPosted ?? 0,
    };
  },
});

// ── إعادة حساب تلقائية عند فتح الملف الشخصي ──
export const autoCheckAndAwardTitles = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!profile) return null;

    const updates: Record<string, any> = {};
    const notifications: any[] = [];

    // ── فحص لقب ملك اللحظات ──
    if (!profile.isMomentsKing) {
      const moments = await ctx.db.query("moments")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
        .collect();
      const totalLikes = moments.reduce((sum, m) => sum + (m.likes ?? 0), 0);
      updates.totalMomentsLikesReceived = totalLikes;
      if (totalLikes >= 100) {
        updates.isMomentsKing = true;
        notifications.push({
          userId: args.targetUserId,
          type: "title_unlocked",
          title: "تم منحك لقب ملك اللحظات",
          body: "حصلت على 100 إعجاب على لحظاتك! حصلت على اللقب اللامع",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // ── فحص لقب كاتب منشور ──
    if (!profile.isMomentWriter) {
      const momentsCount = await ctx.db.query("moments")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
        .collect();
      const count = momentsCount.length;
      updates.totalMomentsPosted = count;
      if (count >= 100) {
        updates.isMomentWriter = true;
        notifications.push({
          userId: args.targetUserId,
          type: "title_unlocked",
          title: "تم منحك لقب كاتب منشور",
          body: "نشرت 100 منشور في اللحظات! حصلت على اللقب اللامع",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // ── فحص لقب ملك الريلز ──
    if (!profile.isReelsKing) {
      const reels = await ctx.db.query("reels")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
        .collect();
      const maxLikes = reels.reduce((max, r) => Math.max(max, r.likes ?? 0), 0);
      if (maxLikes >= 100) {
        updates.isReelsKing = true;
        notifications.push({
          userId: args.targetUserId,
          type: "title_unlocked",
          title: "تم منحك لقب ملك الريلز",
          body: "حصل ريلزك على 100 إعجاب! حصلت على اللقب اللامع",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    }
    for (const notif of notifications) {
      await ctx.db.insert("notifications", notif);
    }

    return { updates, notificationsCount: notifications.length };
  },
});
