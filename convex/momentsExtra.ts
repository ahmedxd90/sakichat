// @ts-nocheck
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserMomentsWithProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    const moments = await ctx.db
      .query("moments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    let avatarUrl = profile?.avatarUrl;
    if (profile?.avatarStorageId) {
      const freshAvatarUrl = await ctx.storage.getUrl(profile.avatarStorageId);
      if (freshAvatarUrl) avatarUrl = freshAvatarUrl;
    }
    const p = profile ? { ...profile, avatarUrl } : null;
    return await Promise.all(
      moments.map(async (moment) => {
        let imageUrl = moment.imageUrl;
        if (moment.imageStorageId) {
          const freshImageUrl = await ctx.storage.getUrl(moment.imageStorageId);
          if (freshImageUrl) imageUrl = freshImageUrl;
        }
        const storedImages = (moment as any).images ?? [];
        let images = await Promise.all(storedImages.map(async (img: any) => {
          if (img?.storageId) {
            const freshUrl = await ctx.storage.getUrl(img.storageId);
            if (freshUrl) return freshUrl;
          }
          return img?.url;
        }));
        if (imageUrl && images.length === 0) images = [imageUrl];
        return {
          ...moment,
          imageUrl,
          images: images.filter(Boolean),
          isLiked: Boolean(viewerId && (moment.likedBy ?? []).includes(viewerId)),
          profile: p,
        };
      })
    );
  },
});

export const getFollowingMoments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) => q.eq("followerId", userId))
      .collect();
    const ids = follows.map((f) => f.followingId);
    if (ids.length === 0) return [];
    const all = await ctx.db.query("moments").order("desc").take(200);
    const filtered = all.filter((m) => ids.includes(m.userId));
    const result = await Promise.all(
      filtered.slice(0, 50).map(async (moment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", moment.userId))
          .unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId) {
          const freshAvatarUrl = await ctx.storage.getUrl(profile.avatarStorageId);
          if (freshAvatarUrl) avatarUrl = freshAvatarUrl;
        }
        let imageUrl = moment.imageUrl;
        if (moment.imageStorageId) {
          const freshImageUrl = await ctx.storage.getUrl(moment.imageStorageId);
          if (freshImageUrl) imageUrl = freshImageUrl;
        }
        const storedImages = (moment as any).images ?? [];
        let images = await Promise.all(storedImages.map(async (img: any) => {
          if (img?.storageId) {
            const freshUrl = await ctx.storage.getUrl(img.storageId);
            if (freshUrl) return freshUrl;
          }
          return img?.url;
        }));
        if (imageUrl && images.length === 0) images = [imageUrl];
        return {
          ...moment,
          imageUrl,
          images: images.filter(Boolean),
          isLiked: Boolean((moment.likedBy ?? []).includes(userId)),
          profile: profile ? { ...profile, avatarUrl } : null,
        };
      })
    );
    return result.filter(Boolean);
  },
});
