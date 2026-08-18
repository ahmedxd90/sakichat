import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createLog = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    action: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("roomLogs", {
      roomId: args.roomId,
      userId: args.userId,
      targetUserId: args.targetUserId,
      action: args.action,
      details: args.details,
      createdAt: Date.now(),
    });
  },
});

export const getRoomLogs = query({
  args: {
    roomId: v.id("rooms"),
    actionType: v.optional(v.string()), // "all", "kick", "mute", "seat", "clear"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const room = await ctx.db.get(args.roomId);
    if (!room) return [];

    // Only owner and admins can see logs
    const myMember = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin")) {
      return [];
    }

    let logsQuery = ctx.db.query("roomLogs")
      .withIndex("by_room_and_created", (q) => q.eq("roomId", args.roomId))
      .order("desc");

    const logs = await logsQuery.take(100);

    return await Promise.all(logs.map(async (log) => {
      const actor = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", log.userId)).unique();
      const targetUserId = log.targetUserId;
      const target = targetUserId
        ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", targetUserId)).unique()
        : null;
      
      return {
        ...log,
        actorName: actor?.name ?? "مجهول",
        actorAvatar: actor?.avatarUrl,
        targetName: target?.name,
        targetAvatar: target?.avatarUrl,
      };
    }));
  },
});
