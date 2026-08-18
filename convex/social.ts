// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const followUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك متابعة نفسك");
    const existing = await ctx.db.query("follows").withIndex("by_follower_and_following", (q) => q.eq("followerId", userId).eq("followingId", args.targetUserId)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      const targetProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
      if (myProfile) await ctx.db.patch(myProfile._id, { followingCount: Math.max(0, (myProfile.followingCount ?? 0) - 1) });
      if (targetProfile) await ctx.db.patch(targetProfile._id, { followersCount: Math.max(0, (targetProfile.followersCount ?? 0) - 1) });
      return false;
    } else {
      await ctx.db.insert("follows", { followerId: userId, followingId: args.targetUserId, createdAt: Date.now() });
      const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      const targetProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
      if (myProfile) await ctx.db.patch(myProfile._id, { followingCount: (myProfile.followingCount ?? 0) + 1 });
      if (targetProfile) await ctx.db.patch(targetProfile._id, { followersCount: (targetProfile.followersCount ?? 0) + 1 });
      await ctx.db.insert("notifications", { userId: args.targetUserId, type: "follow", title: "👤 متابع جديد", body: `قام ${myProfile?.name ?? "مستخدم"} بمتابعتك`, isRead: false, actorUserId: userId, createdAt: Date.now() });
      // Push notification
      await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
        userId: args.targetUserId, title: "👤 متابع جديد", body: `قام ${myProfile?.name ?? "مستخدم"} بمتابعتك`, tag: "follow", url: "/",
      });
      // Daily task: follow_user
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "follow_user", increment: 1, userId });
      return true;
    }
  },
});

export const isFollowing = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db.query("follows").withIndex("by_follower_and_following", (q) => q.eq("followerId", userId).eq("followingId", args.targetUserId)).unique();
    return !!existing;
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const q = args.query.trim().toLowerCase();
    const allProfiles = await ctx.db.query("profiles").collect();
    const filtered = allProfiles.filter((p) => p.name.toLowerCase().includes(q) || p.sakiId.includes(q)).slice(0, 20);
    return await Promise.all(filtered.map(async (p) => {
      let avatarUrl = p.avatarUrl;
      if (p.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(p.avatarStorageId) ?? undefined;
      return { ...p, avatarUrl };
    }));
  },
});

export const getUserMoments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    const moments = await ctx.db.query("moments").withIndex("by_user", (q) => q.eq("userId", args.userId)).order("desc").take(30);
    return await Promise.all(moments.map(async (m) => {
      let imageUrl = m.imageUrl;
      if (m.imageStorageId) {
        const freshImageUrl = await ctx.storage.getUrl(m.imageStorageId);
        if (freshImageUrl) imageUrl = freshImageUrl;
      }
      const storedImages = (m as any).images ?? [];
      let images = await Promise.all(storedImages.map(async (img: any) => {
        if (img?.storageId) {
          const freshUrl = await ctx.storage.getUrl(img.storageId);
          if (freshUrl) return freshUrl;
        }
        return img?.url;
      }));
      if (imageUrl && images.length === 0) images = [imageUrl];
      return {
        ...m,
        imageUrl,
        images: images.filter(Boolean),
        isLiked: Boolean(viewerId && (m.likedBy ?? []).includes(viewerId)),
      };
    }));
  },
});

export const getUserReels = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reels = await ctx.db.query("reels").withIndex("by_user", (q) => q.eq("userId", args.userId)).order("desc").take(30);
    return await Promise.all(reels.map(async (r) => {
      let videoUrl = r.videoUrl;
      if (r.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(r.videoStorageId) ?? undefined;
      return { ...r, videoUrl };
    }));
  },
});

export const likeMoment = mutation({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("المنشور غير موجود");
    const likedBy = moment.likedBy ?? [];
    const alreadyLiked = likedBy.includes(userId);
    if (alreadyLiked) {
      await ctx.db.patch(args.momentId, { likes: Math.max(0, moment.likes - 1), likedBy: likedBy.filter(id => id !== userId) });
      return false;
    } else {
      await ctx.db.patch(args.momentId, { likes: moment.likes + 1, likedBy: [...likedBy, userId] });
      if (moment.userId !== userId) {
        const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        await ctx.db.insert("notifications", { userId: moment.userId, type: "like_moment", title: "❤️ إعجاب بمنشورك", body: `أعجب ${myProfile?.name ?? "مستخدم"} بمنشورك`, isRead: false, actorUserId: userId, refId: args.momentId, createdAt: Date.now() });
        await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
          userId: moment.userId, title: "❤️ إعجاب بمنشورك", body: `أعجب ${myProfile?.name ?? "مستخدم"} بمنشورك`, tag: "like_moment", url: "/",
        });
      }
      return true;
    }
  },
});

export const commentOnMoment = mutation({
  args: { momentId: v.id("moments"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("المنشور غير موجود");
    await ctx.db.insert("comments", { momentId: args.momentId, userId, content: args.content, createdAt: Date.now() });
    await ctx.db.patch(args.momentId, { commentsCount: (moment.commentsCount ?? 0) + 1 });
    if (moment.userId !== userId) {
      const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", { userId: moment.userId, type: "comment_moment", title: "💬 تعليق على منشورك", body: `علّق ${myProfile?.name ?? "مستخدم"} على منشورك: "${args.content.slice(0, 50)}"`, isRead: false, actorUserId: userId, refId: args.momentId, createdAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
        userId: moment.userId, title: "💬 تعليق على منشورك", body: `علّق ${myProfile?.name ?? "مستخدم"} على منشورك`, tag: "comment_moment", url: "/",
      });
    }
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
      await ctx.db.patch(args.reelId, { likes: Math.max(0, reel.likes - 1), likedBy: likedBy.filter(id => id !== userId) });
      return false;
    } else {
      await ctx.db.patch(args.reelId, { likes: reel.likes + 1, likedBy: [...likedBy, userId] });
      if (reel.userId !== userId) {
        const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        await ctx.db.insert("notifications", { userId: reel.userId, type: "like_reel", title: "❤️ إعجاب بريلزك", body: `أعجب ${myProfile?.name ?? "مستخدم"} بريلزك`, isRead: false, actorUserId: userId, refId: args.reelId, createdAt: Date.now() });
        await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
          userId: reel.userId, title: "❤️ إعجاب بريلزك", body: `أعجب ${myProfile?.name ?? "مستخدم"} بريلزك`, tag: "like_reel", url: "/",
        });
      }
      return true;
    }
  },
});

export const commentOnReel = mutation({
  args: { reelId: v.id("reels"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("الريل غير موجود");
    await ctx.db.insert("reelComments", { reelId: args.reelId, userId, content: args.content, createdAt: Date.now() });
    await ctx.db.patch(args.reelId, { commentsCount: (reel.commentsCount ?? 0) + 1 });
    if (reel.userId !== userId) {
      const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", { userId: reel.userId, type: "comment_reel", title: "💬 تعليق على ريلزك", body: `علّق ${myProfile?.name ?? "مستخدم"} على ريلزك: "${args.content.slice(0, 50)}"`, isRead: false, actorUserId: userId, refId: args.reelId, createdAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
        userId: reel.userId, title: "💬 تعليق على ريلزك", body: `علّق ${myProfile?.name ?? "مستخدم"} على ريلزك`, tag: "comment_reel", url: "/",
      });
    }
  },
});

export const getMomentComments = query({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("comments").withIndex("by_moment", (q) => q.eq("momentId", args.momentId)).order("desc").take(50);
    return await Promise.all(comments.map(async (c) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...c, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});

export const getReelComments = query({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("reelComments").withIndex("by_reel", (q) => q.eq("reelId", args.reelId)).order("desc").take(50);
    return await Promise.all(comments.map(async (c) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...c, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});
