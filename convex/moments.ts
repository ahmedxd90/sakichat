// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getMoments = query({
  args: { hashtag: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const moments = await ctx.db.query("moments").order("desc").take(100);
    const filtered = args.hashtag
      ? moments.filter((m) => (m.hashtags ?? []).includes(args.hashtag!))
      : moments;
    const result = await Promise.all(
      filtered.slice(0, 50).map(async (moment) => {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", moment.userId)).unique();
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
        
        let images = moment.images ?? [];
        if (moment.imageStorageId && images.length === 0) {
          images = [{ storageId: moment.imageStorageId, url: imageUrl }];
        }
        
        const resolvedImages = await Promise.all(images.map(async (img) => {
          if (img.storageId) {
            const freshUrl = await ctx.storage.getUrl(img.storageId);
            if (freshUrl) return freshUrl;
          }
          return img.url;
        }));
        // friends-only visibility check
        if (moment.visibility === "friends" && userId && moment.userId !== userId) {
          const u1 = userId < moment.userId ? userId : moment.userId;
          const u2 = userId < moment.userId ? moment.userId : userId;
          const friendship = await ctx.db.query("friendships").withIndex("by_users", (q) => q.eq("userId1", u1).eq("userId2", u2)).unique();
          if (!friendship) return null;
        }
        let vipConfig = null;
        if (profile?.isVip && profile.vipLevel) {
          vipConfig = await ctx.db.query("vipLevels").withIndex("by_level", (q) => q.eq("level", profile.vipLevel!)).first() ?? null;
        }
        return {
          ...moment,
          imageUrl,
          images: resolvedImages.filter(Boolean),
          isLiked: Boolean(userId && (moment.likedBy ?? []).includes(userId)),
          profile: profile ? { ...profile, avatarUrl } : null,
          vipConfig,
        };
      })
    );
    return result.filter(Boolean);
  },
});

export const createMoment = mutation({
  args: {
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    hashtags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal("public"), v.literal("friends"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    if (!profile.isVip || !profile.vipLevel || profile.vipLevel < 1) {
      throw new Error("نشر المنشورات متاح لأعضاء PRO1 وأعلى فقط 👑");
    }
    const imageStorageIds = args.imageStorageIds ?? (args.imageStorageId ? [args.imageStorageId] : []);
    const images = imageStorageIds.map(id => ({ storageId: id }));

    await ctx.db.insert("moments", {
      userId, 
      content: args.content, 
      imageStorageId: imageStorageIds[0] ?? undefined,
      images: images.length > 0 ? images : undefined,
      hashtags: args.hashtags ?? [],
      visibility: args.visibility ?? "public",
      likes: 0, likedBy: [], commentsCount: 0, createdAt: Date.now(),
    });
    // تتبع عدد المنشورات ومنح لقب كاتب منشور
    const newTotal = (profile.totalMomentsPosted ?? 0) + 1;
    const WRITER_THRESHOLD = 100;
    const wasWriter = profile.isMomentWriter ?? false;
    await ctx.db.patch(profile._id, { totalMomentsPosted: newTotal });
    if (newTotal >= WRITER_THRESHOLD && !wasWriter) {
      await ctx.db.patch(profile._id, { isMomentWriter: true });
      await ctx.db.insert("notifications", {
        userId, type: "title_unlocked",
        title: "✍️ مبروك! حصلت على لقب كاتب منشور",
        body: "نشرت 100 منشور في اللحظات! حصلت على اللقب اللامع 🎉",
        isRead: false, createdAt: Date.now(),
      });
    }
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "post_moment", increment: 1, userId });
  },
});

export const likeMoment = mutation({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("اللحظة غير موجودة");
    const likedBy = moment.likedBy ?? [];
    const alreadyLiked = likedBy.includes(userId);
    if (alreadyLiked) {
      await ctx.db.patch(args.momentId, { likes: Math.max(0, (moment.likes ?? 0) - 1), likedBy: likedBy.filter((id) => id !== userId) });
    } else {
      const newLikes = (moment.likes ?? 0) + 1;
      await ctx.db.patch(args.momentId, { likes: newLikes, likedBy: [...likedBy, userId] });
      if (moment.userId !== userId) {
        const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
        await ctx.db.insert("notifications", {
          userId: moment.userId, type: "like_moment",
          title: "❤️ إعجاب جديد", body: `${senderProfile?.name ?? "مستخدم"} أعجب بلحظتك`,
          isRead: false, actorUserId: userId, refId: args.momentId, createdAt: Date.now(),
        });
        await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
          userId: moment.userId,
          title: "❤️ إعجاب جديد",
          body: `${senderProfile?.name ?? "مستخدم"} أعجب بلحظتك`,
          tag: `like-${args.momentId}`,
          url: "/?page=moments",
        });
        // تتبع إعجابات اللحظات لمنح لقب ملك اللحظات
        const ownerProf = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", moment.userId)).unique();
        if (ownerProf) {
          const newTotal = (ownerProf.totalMomentsLikesReceived ?? 0) + 1;
          await ctx.db.patch(ownerProf._id, { totalMomentsLikesReceived: newTotal });
          if (newTotal >= 100 && !ownerProf.isMomentsKing) {
            await ctx.db.patch(ownerProf._id, { isMomentsKing: true });
            await ctx.db.insert("notifications", {
              userId: moment.userId, type: "title_unlocked",
              title: "تم منحك لقب ملك اللحظات",
              body: "حصلت على 100 إعجاب على لحظاتك! حصلت على اللقب اللامع",
              isRead: false, createdAt: Date.now(),
            });
          }
        }
      }
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "like_content", increment: 1, userId });
    }
  },
});

export const deleteMoment = mutation({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("اللحظة غير موجودة");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (moment.userId !== userId && !profile?.isSuperAdmin) throw new Error("غير مصرح");
    if (moment.imageStorageId) await ctx.storage.delete(moment.imageStorageId);
    await ctx.db.delete(args.momentId);
  },
});

export const generateMomentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const addComment = mutation({
  args: { momentId: v.id("moments"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    await ctx.db.insert("momentComments", { momentId: args.momentId, userId, content: args.content, createdAt: Date.now() });
    const moment = await ctx.db.get(args.momentId);
    if (moment) await ctx.db.patch(args.momentId, { commentsCount: (moment.commentsCount ?? 0) + 1 });
    if (moment && moment.userId !== userId) {
      const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
      await ctx.db.insert("notifications", {
        userId: moment.userId, type: "comment_moment",
        title: "💬 تعليق جديد", body: `${senderProfile?.name ?? "مستخدم"} علّق على لحظتك`,
        isRead: false, actorUserId: userId, refId: args.momentId, createdAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
        userId: moment.userId,
        title: "💬 تعليق جديد",
        body: `${senderProfile?.name ?? "مستخدم"} علّق على لحظتك`,
        tag: `comment-${args.momentId}`,
        url: "/?page=moments",
      });
    }
  },
});

export const getComments = query({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("momentComments").withIndex("by_moment", (q) => q.eq("momentId", args.momentId)).order("asc").collect();
    return await Promise.all(comments.map(async (c) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.userId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { ...c, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});

export const shareMomentToDM = mutation({
  args: { momentId: v.id("moments"), receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("اللحظة غير موجودة");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    const content = `📸 شارك لحظة: ${moment.content?.slice(0, 80) ?? ""}`;
    await ctx.db.insert("directMessages", {
      senderId: userId, receiverId: args.receiverId,
      content, type: "text", isRead: false, createdAt: Date.now(),
    });
  },
});
