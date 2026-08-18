// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const inviteCoHost = mutation({
  args: {
    livestreamId: v.id("livestreams"),
    invitedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || stream.hostId !== userId) throw new Error("Not authorized");

    const existing = await ctx.db
      .query("liveCoHosts")
      .withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId))
      .collect();
    if (existing.length >= 5) throw new Error("الحد الأقصى 5 ضيوف");

    const alreadyInvited = await ctx.db
      .query("liveCoHostInvites")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("invitedUserId", args.invitedUserId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();
    if (alreadyInvited) throw new Error("تم إرسال الدعوة بالفعل");

    const invitedProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.invitedUserId))
      .unique();

    await ctx.db.insert("liveCoHostInvites", {
      livestreamId: args.livestreamId,
      hostId: userId,
      invitedUserId: args.invitedUserId,
      invitedUserName: invitedProfile?.name,
      status: "pending",
      createdAt: Date.now(),
    });
    return null;
  },
});

export const respondCoHostInvite = mutation({
  args: {
    livestreamId: v.id("livestreams"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("liveCoHostInvites")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("invitedUserId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();
    if (!invite) throw new Error("لا توجد دعوة");

    await ctx.db.patch(invite._id, {
      status: args.accept ? "accepted" : "rejected",
    });

    if (args.accept) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) {
        avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
      }
      await ctx.db.insert("liveCoHosts", {
        livestreamId: args.livestreamId,
        userId,
        userName: profile?.name,
        userAvatarUrl: avatarUrl,
        joinedAt: Date.now(),
      });
    }
    return null;
  },
});

export const removeCoHost = mutation({
  args: {
    livestreamId: v.id("livestreams"),
    coHostUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const stream = await ctx.db.get(args.livestreamId);
    if (!stream || (stream.hostId !== userId && args.coHostUserId !== userId)) {
      throw new Error("Not authorized");
    }
    const coHost = await ctx.db
      .query("liveCoHosts")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("userId", args.coHostUserId)
      )
      .unique();
    if (coHost) await ctx.db.delete(coHost._id);

    const invite = await ctx.db
      .query("liveCoHostInvites")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("invitedUserId", args.coHostUserId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .unique();
    if (invite) await ctx.db.patch(invite._id, { status: "ended" });
    return null;
  },
});

export const getCoHosts = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liveCoHosts")
      .withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId))
      .collect();
  },
});

export const getMyCoHostInvite = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("liveCoHostInvites")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("invitedUserId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();
  },
});

export const getPendingCoHostInvites = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liveCoHostInvites")
      .withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const getMyCoHostStatus = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("liveCoHosts")
      .withIndex("by_livestream_and_user", (q) =>
        q.eq("livestreamId", args.livestreamId).eq("userId", userId)
      )
      .unique();
  },
});
