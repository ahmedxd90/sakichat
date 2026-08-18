// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Get all active stories grouped by user ──────────────────────────────────
export const getActiveStories = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const myUserId = await getAuthUserId(ctx);
    const allStories = await ctx.db
      .query("stories")
      .order("desc")
      .collect();

    const active = allStories.filter((s) => s.expiresAt > now);

    // Group by userId
    const grouped = new Map<string, any[]>();
    for (const story of active) {
      const key = String(story.userId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(story);
    }

    const result = [];
    for (const [userId, stories] of grouped.entries()) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", stories[0].userId))
        .unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) {
        avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
      }

      // Resolve media URLs
      const storiesWithUrls = await Promise.all(
        stories.map(async (s) => {
          let mediaUrl = s.mediaUrl;
          if (s.mediaStorageId && !mediaUrl) {
            mediaUrl = (await ctx.storage.getUrl(s.mediaStorageId)) ?? undefined;
          }
          // Check if current user has viewed this story
          let isViewed = false;
          if (myUserId) {
            const view = await ctx.db
              .query("storyViews")
              .withIndex("by_story_and_user", (q) =>
                q.eq("storyId", s._id).eq("userId", myUserId)
              )
              .unique();
            isViewed = !!view;
          }
          // Check if liked
          let isLiked = false;
          if (myUserId) {
            const like = await ctx.db
              .query("storyLikes")
              .withIndex("by_story_and_user", (q) =>
                q.eq("storyId", s._id).eq("userId", myUserId)
              )
              .unique();
            isLiked = !!like;
          }
          return { ...s, mediaUrl, isViewed, isLiked };
        })
      );

      result.push({
        userId: stories[0].userId,
        profile: profile ? { ...profile, avatarUrl } : null,
        stories: storiesWithUrls.sort((a, b) => a.createdAt - b.createdAt),
        hasUnviewed: storiesWithUrls.some((s) => !s.isViewed),
      });
    }

    // Sort: my stories first, then unviewed, then viewed
    return result.sort((a, b) => {
      if (a.userId === myUserId) return -1;
      if (b.userId === myUserId) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });
  },
});

// ── Get my stories ───────────────────────────────────────────────────────────
export const getMyStories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      stories
        .filter((s) => s.expiresAt > now)
        .map(async (s) => {
          let mediaUrl = s.mediaUrl;
          if (s.mediaStorageId && !mediaUrl) {
            mediaUrl = (await ctx.storage.getUrl(s.mediaStorageId)) ?? undefined;
          }
          const viewsCount = await ctx.db
            .query("storyViews")
            .withIndex("by_story", (q) => q.eq("storyId", s._id))
            .collect();
          const likesCount = await ctx.db
            .query("storyLikes")
            .withIndex("by_story", (q) => q.eq("storyId", s._id))
            .collect();
          return { ...s, mediaUrl, viewsCount: viewsCount.length, likesCount: likesCount.length };
        })
    );
  },
});

// ── Create story ─────────────────────────────────────────────────────────────
export const createStory = mutation({
  args: {
    type: v.union(v.literal("image"), v.literal("video"), v.literal("text")),
    mediaStorageId: v.optional(v.id("_storage")),
    text: v.optional(v.string()),
    textBg: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("ملف شخصي غير موجود");
    // VIP10+ required
    if (!profile.isVip || !profile.vipLevel || profile.vipLevel < 10) {
      throw new Error("نشر القصص متاح لأعضاء VIP 10 وأعلى فقط 👑");
    }
    if (args.type !== "text" && !args.mediaStorageId) {
      throw new Error("يجب رفع صورة أو فيديو");
    }
    if (args.type === "text" && !args.text?.trim()) {
      throw new Error("يجب كتابة نص للقصة");
    }
    await ctx.db.insert("stories", {
      userId,
      type: args.type,
      mediaStorageId: args.mediaStorageId,
      text: args.text,
      textBg: args.textBg,
      caption: args.caption,
      likesCount: 0,
      viewsCount: 0,
      expiresAt: Date.now() + STORY_DURATION_MS,
      createdAt: Date.now(),
    });
  },
});

// ── View story ───────────────────────────────────────────────────────────────
export const viewStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", userId)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("storyViews", {
        storyId: args.storyId,
        userId,
        createdAt: Date.now(),
      });
      const story = await ctx.db.get(args.storyId);
      if (story) {
        await ctx.db.patch(args.storyId, {
          viewsCount: (story.viewsCount ?? 0) + 1,
        });
      }
    }
  },
});

// ── Like story ───────────────────────────────────────────────────────────────
export const likeStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("القصة غير موجودة");

    const existing = await ctx.db
      .query("storyLikes")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.storyId, {
        likesCount: Math.max(0, (story.likesCount ?? 0) - 1),
      });
    } else {
      await ctx.db.insert("storyLikes", {
        storyId: args.storyId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.storyId, {
        likesCount: (story.likesCount ?? 0) + 1,
      });
      // Notify story owner
      if (story.userId !== userId) {
        const senderProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
        await ctx.db.insert("notifications", {
          userId: story.userId,
          type: "story_like",
          title: "❤️ إعجاب بقصتك",
          body: `${senderProfile?.name ?? "مستخدم"} أعجب بقصتك`,
          isRead: false,
          actorUserId: userId,
          refId: args.storyId,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// ── Reply to story (sends as DM) ─────────────────────────────────────────────
export const replyToStory = mutation({
  args: {
    storyId: v.id("stories"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("القصة غير موجودة");
    if (story.userId === userId) throw new Error("لا يمكنك الرد على قصتك");

    // Get story preview
    let storyPreview = "📸 قصة";
    if (story.type === "text") storyPreview = `📝 ${story.text?.slice(0, 30) ?? "قصة نصية"}`;
    else if (story.type === "video") storyPreview = "🎥 قصة فيديو";
    else if (story.type === "image") storyPreview = "📸 قصة صورة";

    // Send as DM with story reference
    await ctx.db.insert("directMessages", {
      senderId: userId,
      receiverId: story.userId,
      content: args.content,
      isRead: false,
      storyReplyId: args.storyId,
      storyReplyPreview: storyPreview,
      createdAt: Date.now(),
    });

    // Notify story owner
    const senderProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    await ctx.db.insert("notifications", {
      userId: story.userId,
      type: "story_reply",
      title: "💬 رد على قصتك",
      body: `${senderProfile?.name ?? "مستخدم"}: ${args.content.slice(0, 50)}`,
      isRead: false,
      actorUserId: userId,
      refId: args.storyId,
      createdAt: Date.now(),
    });
  },
});

// ── Delete story ─────────────────────────────────────────────────────────────
export const deleteStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("القصة غير موجودة");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (story.userId !== userId && !profile?.isSuperAdmin) {
      throw new Error("غير مصرح");
    }
    if (story.mediaStorageId) await ctx.storage.delete(story.mediaStorageId);
    await ctx.db.delete(args.storyId);
  },
});

// ── Generate upload URL ──────────────────────────────────────────────────────
export const generateStoryUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Get story viewers ────────────────────────────────────────────────────────
export const getStoryViewers = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const story = await ctx.db.get(args.storyId);
    if (!story || story.userId !== userId) return [];
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .take(50);
    return await Promise.all(
      views.map(async (v) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", v.userId))
          .unique();
        let avatarUrl = profile?.avatarUrl;
        if (profile?.avatarStorageId && !avatarUrl) {
          avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
        }
        const liked = await ctx.db
          .query("storyLikes")
          .withIndex("by_story_and_user", (q) =>
            q.eq("storyId", args.storyId).eq("userId", v.userId)
          )
          .unique();
        return { ...v, profile: profile ? { ...profile, avatarUrl } : null, liked: !!liked };
      })
    );
  },
});
