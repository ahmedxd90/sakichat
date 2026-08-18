// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const adminListPremiumSakiIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isSuperAdmin) return [];

    const records = await ctx.db.query("premiumSakiIds").order("desc").collect();
    const now = Date.now();
    return await Promise.all(
      records.map(async (r) => {
        const userProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", r.userId))
          .unique();
        let userAvatarUrl = userProfile?.avatarUrl ?? null;
        if (userProfile?.avatarStorageId && !userAvatarUrl) {
          userAvatarUrl = (await ctx.storage.getUrl(userProfile.avatarStorageId)) ?? null;
        }
        const isExpired = r.expiresAt < now;
        const daysLeft = isExpired
          ? 0
          : Math.ceil((r.expiresAt - now) / (1000 * 60 * 60 * 24));
        return {
          ...r,
          userName: userProfile?.name ?? "مجهول",
          userAvatarUrl,
          isExpired,
          daysLeft,
        };
      })
    );
  },
});

export const adminGrantPremiumSakiId = mutation({
  args: {
    targetSakiId: v.string(),
    premiumSakiId: v.string(),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!adminProfile?.isSuperAdmin) throw new Error("للمشرف فقط");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    // Revoke any existing premium saki id for this user
    const existing = await ctx.db
      .query("premiumSakiIds")
      .withIndex("by_userId", (q) => q.eq("userId", targetProfile.userId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    const expiresAt = Date.now() + args.durationDays * 24 * 60 * 60 * 1000;
    await ctx.db.insert("premiumSakiIds", {
      userId: targetProfile.userId,
      sakiId: args.premiumSakiId,
      originalSakiId: targetProfile.sakiId,
      expiresAt,
      grantedBy: userId,
      createdAt: Date.now(),
    });

    // Update profile with premium saki id
    await ctx.db.patch(targetProfile._id, {
      premiumSakiId: args.premiumSakiId,
    });

    return { targetName: targetProfile.name };
  },
});

export const adminRevokePremiumSakiId = mutation({
  args: { targetSakiId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!adminProfile?.isSuperAdmin) throw new Error("للمشرف فقط");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    const existing = await ctx.db
      .query("premiumSakiIds")
      .withIndex("by_userId", (q) => q.eq("userId", targetProfile.userId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.patch(targetProfile._id, { premiumSakiId: undefined });
  },
});
