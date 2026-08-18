// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
export const getReels = query({
  args: {},
  handler: async (ctx) => {
    const reels = await ctx.db.query("reels").order("desc").take(50);
    // Sort by views descending (TikTok-style)
    const sorted = [...reels].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return await Promise.all(
      sorted.map(async (reel) => {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", reel.userId)).unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
        let videoUrl = reel.videoUrl;
        if (reel.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(reel.videoStorageId) ?? undefined;
        let vipConfig = null;
        if (profile?.isVip && profile.vipLevel) {
          vipConfig = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first() ?? null;
        }
        return { ...reel, videoUrl, profile: profile ? { ...profile, avatarUrl } : null, vipConfig };
      })
    );
  },
});

export const getReelsByFollowing = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // Get who I follow
    const follows = await ctx.db.query("follows").withIndex("by_follower", (q) => q.eq("followerId", userId)).collect();
    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];
    // Get reels from followed users
    const allReels: any[] = [];
    for (const fId of followingIds.slice(0, 50)) {
      const userReels = await ctx.db.query("reels").withIndex("by_user", (q) => q.eq("userId", fId)).order("desc").take(5);
      allReels.push(...userReels);
    }
    allReels.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(
      allReels.slice(0, 50).map(async (reel) => {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", reel.userId)).unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
        let videoUrl = reel.videoUrl;
        if (reel.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(reel.videoStorageId) ?? undefined;
        let vipConfig = null;
        if (profile?.isVip && profile.vipLevel) {
          vipConfig = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first() ?? null;
        }
        return { ...reel, videoUrl, profile: profile ? { ...profile, avatarUrl } : null, vipConfig };
      })
    );
  },
});

export const createReel = mutation({
  args: {
    caption: v.string(),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    if (!profile.isVip || !profile.vipLevel || profile.vipLevel < 1) {
      throw new Error("نشر الريلز متاح لأعضاء VIP1 وأعلى فقط 👑");
    }
    await ctx.db.insert("reels", {
      userId, caption: args.caption,
      videoStorageId: args.videoStorageId, videoUrl: args.videoUrl,
      thumbnailUrl: args.thumbnailUrl,
      hashtags: args.hashtags ?? [],
      likes: 0, likedBy: [],
      views: 0, commentsCount: 0, createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "post_reel", increment: 1, userId });
  },
});

export const likeReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("الريل غير موجود");
    const likedBy = reel.likedBy ?? [];
    const alreadyLiked = likedBy.includes(userId);
    if (alreadyLiked) {
      await ctx.db.patch(args.reelId, { likes: Math.max(0, reel.likes - 1), likedBy: likedBy.filter((id) => id !== userId) });
    } else {
      await ctx.db.patch(args.reelId, { likes: reel.likes + 1, likedBy: [...likedBy, userId] });
      const newLikes = reel.likes + 1;
      if (reel.userId !== userId) {
        const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        await ctx.db.insert("notifications", {
          userId: reel.userId, type: "like_reel",
          title: "إعجاب جديد", body: `${senderProfile?.name ?? "مستخدم"} أعجب بريلزك`,
          isRead: false, actorUserId: userId, refId: args.reelId, createdAt: Date.now(),
        });
        if (newLikes >= 100) {
          await ctx.scheduler.runAfter(0, internal.titleAwards.checkAndAwardReelsKing, {
            reelOwnerUserId: reel.userId, newLikesCount: newLikes,
          });
        }
      }
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "like_content", increment: 1, userId });
    }
  },
});

export const viewReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) return;
    await ctx.db.patch(args.reelId, { views: (reel.views ?? 0) + 1 });
  },
});

export const deleteReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("الريل غير موجود");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (reel.userId !== userId && !profile?.isSuperAdmin) throw new Error("غير مصرح");
    if (reel.videoStorageId) await ctx.storage.delete(reel.videoStorageId);
    await ctx.db.delete(args.reelId);
  },
});

export const generateReelUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const addReelComment = mutation({
  args: { reelId: v.id("reels"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    await ctx.db.insert("reelComments", { reelId: args.reelId, userId, content: args.content, createdAt: Date.now() });
    const reel = await ctx.db.get(args.reelId);
    if (reel) await ctx.db.patch(args.reelId, { commentsCount: (reel.commentsCount ?? 0) + 1 });
    if (reel && reel.userId !== userId) {
      const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", {
        userId: reel.userId, type: "comment_reel",
        title: "تعليق جديد", body: `${senderProfile?.name ?? "مستخدم"} علّق على ريلزك`,
        isRead: false, actorUserId: userId, refId: args.reelId, createdAt: Date.now(),
      });
    }
  },
});

export const getReelComments = query({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("reelComments").withIndex("by_reel", (q) => q.eq("reelId", args.reelId)).order("asc").collect();
    return await Promise.all(comments.map(async (c) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...c, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});

export const shareReelToDM = mutation({
  args: { reelId: v.id("reels"), receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("الريل غير موجود");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    // Get video URL
    let videoUrl = reel.videoUrl;
    if (reel.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(reel.videoStorageId) ?? undefined;
    await ctx.db.insert("directMessages", {
      senderId: userId, receiverId: args.receiverId,
      content: `شارك ريلز: ${reel.caption?.slice(0, 60) ?? ""}`,
      type: "reel",
      reelId: args.reelId,
      reelVideoUrl: videoUrl,
      reelCaption: reel.caption,
      reelThumbnailUrl: reel.thumbnailUrl,
      isRead: false, createdAt: Date.now(),
    });
  },
});
