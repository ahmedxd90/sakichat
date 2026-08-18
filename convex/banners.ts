// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBanners = query({
  args: {},
  handler: async (ctx) => {
    const banners = await ctx.db
      .query("banners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return banners.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
});

export const seedBanners = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("banners").collect();
    if (existing.length > 0) return;

    const bannerData = [
      {
        imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1280&h=720&fit=crop",
        title: "غرف صوتية حية",
        order: 1,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&h=720&fit=crop",
        title: "تواصل مع الأصدقاء",
        order: 2,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1280&h=720&fit=crop",
        title: "اكتشف غرف جديدة",
        order: 3,
        isActive: true,
        createdAt: Date.now(),
      },
    ];

    for (const banner of bannerData) {
      await ctx.db.insert("banners", banner);
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

export const addBanner = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("فشل رفع الصورة");

    const allBanners = await ctx.db.query("banners").collect();
    const maxOrder = allBanners.reduce((max, b) => Math.max(max, b.order ?? 0), 0);

    await ctx.db.insert("banners", {
      imageStorageId: args.storageId,
      imageUrl: url,
      title: args.title,
      isActive: true,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const deleteBanner = mutation({
  args: { bannerId: v.id("banners") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    await ctx.db.delete(args.bannerId);
  },
});

export const getAllBannersAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return null;
    return await ctx.db.query("banners").collect();
  },
});
