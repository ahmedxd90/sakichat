// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendHeart = mutation({
  args: { roomId: v.id("rooms"), color: v.string(), x: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const profile = userId
      ? await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
      : null;
    await ctx.db.insert("roomHearts", {
      roomId: args.roomId,
      userId: userId ?? undefined,
      userName: profile?.name ?? "",
      color: args.color,
      x: args.x,
      createdAt: Date.now(),
    });
    const room = await ctx.db.get(args.roomId);
    if (room) {
      await ctx.db.patch(args.roomId, {
        heartsCount: ((room as any).heartsCount ?? 0) + 1,
      });
    }
  },
});

export const getRoomHeartsCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    return (room as any)?.heartsCount ?? 0;
  },
});

export const getLatestHearts = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomHearts")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(20);
  },
});
