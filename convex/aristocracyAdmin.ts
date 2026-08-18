// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAristocracyLevel = query({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aristocracyLevels")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();
  },
});

export const getAllAristocracyLevels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("aristocracyLevels").order("asc").collect();
  },
});

export const generateAristocracyUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isSuperAdmin) throw new Error("يجب أن تكون مشرفًا");
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertAristocracyLevel = mutation({
  args: {
    level: v.number(),
    name: v.string(),
    price30: v.optional(v.number()),
    price90: v.optional(v.number()),
    price365: v.optional(v.number()),
    dailyCoins: v.optional(v.number()),
    badgeStorageId: v.optional(v.id("_storage")),
    frameStorageId: v.optional(v.id("_storage")),
    chatBubbleStorageId: v.optional(v.id("_storage")),
    entryEffectStorageId: v.optional(v.id("_storage")),
    entryEffectType: v.optional(v.string()),
    heartStorageId: v.optional(v.id("_storage")),
    features: v.optional(v.array(v.object({ icon: v.string(), title: v.string(), desc: v.string() }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile?.isSuperAdmin) throw new Error("يجب أن تكون مشرفًا");

    const existing = await ctx.db
      .query("aristocracyLevels")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();

    let badgeUrl = existing?.badgeUrl;
    let frameUrl = existing?.frameUrl;
    let chatBubbleUrl = existing?.chatBubbleUrl;
    let entryEffectUrl = existing?.entryEffectUrl;
    let heartUrl = existing?.heartUrl;

    if (args.badgeStorageId) badgeUrl = (await ctx.storage.getUrl(args.badgeStorageId)) ?? undefined;
    if (args.frameStorageId) frameUrl = (await ctx.storage.getUrl(args.frameStorageId)) ?? undefined;
    if (args.chatBubbleStorageId) chatBubbleUrl = (await ctx.storage.getUrl(args.chatBubbleStorageId)) ?? undefined;
    if (args.entryEffectStorageId) entryEffectUrl = (await ctx.storage.getUrl(args.entryEffectStorageId)) ?? undefined;
    if (args.heartStorageId) heartUrl = (await ctx.storage.getUrl(args.heartStorageId)) ?? undefined;

    const data = {
      level: args.level,
      name: args.name,
      price30: args.price30 ?? existing?.price30,
      price90: args.price90 ?? existing?.price90,
      price365: args.price365 ?? existing?.price365,
      dailyCoins: args.dailyCoins ?? existing?.dailyCoins,
      badgeStorageId: args.badgeStorageId ?? existing?.badgeStorageId,
      badgeUrl,
      frameStorageId: args.frameStorageId ?? existing?.frameStorageId,
      frameUrl,
      chatBubbleStorageId: args.chatBubbleStorageId ?? existing?.chatBubbleStorageId,
      chatBubbleUrl,
      entryEffectStorageId: args.entryEffectStorageId ?? existing?.entryEffectStorageId,
      entryEffectUrl,
      entryEffectType: args.entryEffectType ?? existing?.entryEffectType,
      heartStorageId: args.heartStorageId ?? existing?.heartStorageId,
      heartUrl,
      features: args.features ?? existing?.features,
      createdAt: existing?.createdAt ?? Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("aristocracyLevels", data);
    }
    return { success: true };
  },
});

export const getAristocracyConfigForUser = query({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    if (!args.level || args.level < 1) return null;
    return await ctx.db
      .query("aristocracyLevels")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();
  },
});

export const getAristocracyLevelName = query({
  args: { level: v.number() },
  handler: async (ctx, args) => {
    if (!args.level || args.level < 1) return null;
    const dbLevel = await ctx.db
      .query("aristocracyLevels")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();
    return dbLevel?.name ?? null;
  },
});
