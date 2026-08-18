import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    // Enrich with actor profile
    return await Promise.all(notifs.map(async (n) => {
      let actorProfile = null;
      if (n.actorUserId) {
        const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", n.actorUserId!)).unique();
        if (p) {
          let avatarUrl = p.avatarUrl;
          if (p.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(p.avatarStorageId) ?? undefined;
          actorProfile = { ...p, avatarUrl };
        }
      }
      let imageUrl = (n as any).imageUrl;
      if ((n as any).imageStorageId && !imageUrl) {
        imageUrl = await ctx.storage.getUrl((n as any).imageStorageId) ?? undefined;
      }
      return { ...n, actorProfile, imageUrl };
    }));
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();
    return unread.length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const markOneRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const n = await ctx.db.get(args.notificationId);
    if (n && n.userId === userId) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

// Internal: create a notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("like_moment"),
      v.literal("comment_moment"),
      v.literal("like_reel"),
      v.literal("comment_reel"),
      v.literal("follow"),
      v.literal("gift_received"),
      v.literal("charge"),
      v.literal("family_invite"),
      v.literal("system"),
      v.literal("diamond_received"),
      v.literal("cp_ring")
    ),
    title: v.string(),
    body: v.string(),
    actorUserId: v.optional(v.id("users")),
    refId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      isRead: false,
      actorUserId: args.actorUserId,
      refId: args.refId,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyUser, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      tag: `notif-${args.type}`,
      url: "/?page=messages",
    });
  },
});
