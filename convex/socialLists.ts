// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Get followers list ──────────────────────────────────────────────────────
export const getMyFollowers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .order("desc")
      .take(200);
    return await Promise.all(
      follows.map(async (f) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", f.followerId))
          .unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl)
          avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
        return {
          followId: f._id,
          userId: f.followerId,
          createdAt: f.createdAt,
          profile: profile ? { ...profile, avatarUrl } : null,
        };
      })
    );
  },
});

// ── Get following list ──────────────────────────────────────────────────────
export const getMyFollowing = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .order("desc")
      .take(200);
    return await Promise.all(
      follows.map(async (f) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", f.followingId))
          .unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl)
          avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
        return {
          followId: f._id,
          userId: f.followingId,
          createdAt: f.createdAt,
          profile: profile ? { ...profile, avatarUrl } : null,
        };
      })
    );
  },
});

// ── Record a profile visit ──────────────────────────────────────────────────
export const recordProfileVisit = mutation({
  args: { profileOwnerId: v.id("users") },
  handler: async (ctx, args) => {
    const visitorId = await getAuthUserId(ctx);
    if (!visitorId) return;
    if (visitorId === args.profileOwnerId) return;
    const visitorProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", visitorId))
      .unique();
    let avatarUrl = visitorProfile?.avatarUrl;
    if (visitorProfile?.avatarStorageId && !avatarUrl)
      avatarUrl = (await ctx.storage.getUrl(visitorProfile.avatarStorageId)) ?? undefined;
    const existing = await ctx.db
      .query("profileVisitors")
      .withIndex("by_owner_and_visitor", (q) =>
        q.eq("profileOwnerId", args.profileOwnerId).eq("visitorId", visitorId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        visitedAt: Date.now(),
        visitorName: visitorProfile?.name,
        visitorAvatarUrl: avatarUrl,
        visitorVipLevel: visitorProfile?.vipLevel,
        visitorIsVip: visitorProfile?.isVip,
      });
    } else {
      await ctx.db.insert("profileVisitors", {
        profileOwnerId: args.profileOwnerId,
        visitorId,
        visitorName: visitorProfile?.name,
        visitorAvatarUrl: avatarUrl,
        visitorVipLevel: visitorProfile?.vipLevel,
        visitorIsVip: visitorProfile?.isVip,
        visitedAt: Date.now(),
      });
    }
  },
});

// ── Get visitors count (public, for stats) ─────────────────────────────────
export const getMyVisitorsCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const visitors = await ctx.db
      .query("profileVisitors")
      .withIndex("by_owner", (q) => q.eq("profileOwnerId", userId))
      .collect();
    return visitors.length;
  },
});

// ── Get profile visitors (only for VIP4+) ──────────────────────────────────
export const getMyVisitors = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile) return null;
    const vipLevel = myProfile.vipLevel ?? 0;
    const isVip = myProfile.isVip ?? false;
    const isSuperAdmin = myProfile.isSuperAdmin ?? false;
    if (!isSuperAdmin && !(isVip && vipLevel >= 4)) {
      return { locked: true, visitors: [] as any[] };
    }
    const visitors = await ctx.db
      .query("profileVisitors")
      .withIndex("by_owner", (q) => q.eq("profileOwnerId", userId))
      .order("desc")
      .take(100);
    return { locked: false, visitors };
  },
});
