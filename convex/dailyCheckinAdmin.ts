// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

export const getCheckinConfig = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const configs = await ctx.db.query("dailyCheckinConfig").collect();
    return configs.sort((a, b) => a.day - b.day);
  },
});

export const saveCheckinDayConfig = mutation({
  args: {
    day: v.number(),
    rewardType: v.union(
      v.literal("coins"), v.literal("gift"), v.literal("frame"),
      v.literal("entry"), v.literal("vip"), v.literal("aristocracy")
    ),
    coins: v.optional(v.number()),
    giftId: v.optional(v.id("customGifts")),
    giftName: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    storeItemId: v.optional(v.id("storeItems")),
    storeItemName: v.optional(v.string()),
    storeItemImageUrl: v.optional(v.string()),
    durationDays: v.optional(v.number()),
    vipLevel: v.optional(v.number()),
    vipDays: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    aristocracyDays: v.optional(v.number()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("dailyCheckinConfig")
      .withIndex("by_day", (q) => q.eq("day", args.day))
      .unique();
    const data = {
      day: args.day,
      rewardType: args.rewardType,
      coins: args.coins,
      giftId: args.giftId,
      giftName: args.giftName,
      giftImageUrl: args.giftImageUrl,
      storeItemId: args.storeItemId,
      storeItemName: args.storeItemName,
      storeItemImageUrl: args.storeItemImageUrl,
      durationDays: args.durationDays,
      vipLevel: args.vipLevel,
      vipDays: args.vipDays,
      aristocracyLevel: args.aristocracyLevel,
      aristocracyDays: args.aristocracyDays,
      label: args.label,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("dailyCheckinConfig", data);
    }
    return null;
  },
});

export const getGiftsForPicker = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const gifts = await ctx.db.query("customGifts").take(200);
    return gifts.filter((g) => g.isActive !== false).map((g) => ({
      _id: g._id,
      name: g.name,
      imageUrl: g.imageUrl,
      price: g.price,
    }));
  },
});

export const getStoreItemsForPicker = query({
  args: { type: v.union(v.literal("frame"), v.literal("entry")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const items = await ctx.db.query("storeItems").withIndex("by_type", (q) => q.eq("type", args.type)).take(200);
    return items.filter((i) => i.isActive !== false).map((i) => ({
      _id: i._id,
      name: i.name,
      imageUrl: i.imageUrl ?? i.mediaUrl,
      price: i.price,
    }));
  },
});
