// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── جلب الإعلان النشط ──
export const getActiveSplashAd = query({
  args: {},
  handler: async (ctx) => {
    const ad = await ctx.db
      .query("splashAds")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .first();
    if (!ad) return null;
    let imageUrl = ad.imageUrl;
    if (ad.imageStorageId && !imageUrl) {
      imageUrl = await ctx.storage.getUrl(ad.imageStorageId) ?? undefined;
    }
    return { ...ad, imageUrl };
  },
});

// ── رفع إعلان جديد ──
export const generateSplashAdUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createSplashAd = mutation({
  args: {
    imageStorageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("gif")),
    title: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");

    // إلغاء تفعيل كل الإعلانات السابقة
    const existing = await ctx.db.query("splashAds").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    for (const ad of existing) {
      await ctx.db.patch(ad._id, { isActive: false });
    }

    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    await ctx.db.insert("splashAds", {
      uploaderId: userId,
      imageStorageId: args.imageStorageId,
      imageUrl: imageUrl ?? undefined,
      mediaType: args.mediaType,
      isActive: true,
      durationSeconds: args.durationSeconds ?? 5,
      title: args.title,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── تفعيل/إلغاء إعلان ──
export const toggleSplashAd = mutation({
  args: { adId: v.id("splashAds"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");

    if (args.isActive) {
      // إلغاء تفعيل الآخرين أولاً
      const existing = await ctx.db.query("splashAds").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
      for (const ad of existing) {
        await ctx.db.patch(ad._id, { isActive: false });
      }
    }
    await ctx.db.patch(args.adId, { isActive: args.isActive });
    return { success: true };
  },
});

// ── حذف إعلان ──
export const deleteSplashAd = mutation({
  args: { adId: v.id("splashAds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");
    const ad = await ctx.db.get(args.adId);
    if (!ad) throw new Error("الإعلان غير موجود");
    if (ad.imageStorageId) await ctx.storage.delete(ad.imageStorageId);
    await ctx.db.delete(args.adId);
    return { success: true };
  },
});

// ── جلب كل الإعلانات (للأدمن) ──
export const getAllSplashAds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) return [];
    const ads = await ctx.db.query("splashAds").order("desc").take(20);
    return await Promise.all(ads.map(async (ad) => {
      let imageUrl = ad.imageUrl;
      if (ad.imageStorageId && !imageUrl) {
        imageUrl = await ctx.storage.getUrl(ad.imageStorageId) ?? undefined;
      }
      return { ...ad, imageUrl };
    }));
  },
});
