// @ts-nocheck
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveFcmToken = mutation({
  args: {
    token: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const existing = await ctx.db
      .query("fcmSubscriptions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (existing) {
      if (existing.userId !== userId) {
        await ctx.db.patch(existing._id, { userId });
      }
      return existing._id;
    }

    return await ctx.db.insert("fcmSubscriptions", {
      userId,
      token: args.token,
      platform: args.platform,
      createdAt: Date.now(),
    });
  },
});

export const removeFcmToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const sub = await ctx.db
      .query("fcmSubscriptions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (sub && sub.userId === userId) {
      await ctx.db.delete(sub._id);
    }
  },
});

export const getSubscriptionsForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fcmSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteSubscription = internalMutation({
  args: { subscriptionId: v.id("fcmSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
  },
});
