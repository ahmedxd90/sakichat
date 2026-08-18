// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const takeSeat = mutation({
  args: { roomId: v.id("rooms"), seatIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const mine = members.find((m: any) => m.userId === userId);
    if (!mine) throw new Error("لست عضواً في هذه الغرفة");
    await ctx.db.patch(mine._id, { seatIndex: args.seatIndex });
    return null;
  },
});

export const leaveSeat = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const mine = members.find((m: any) => m.userId === userId);
    if (!mine) return null;
    await ctx.db.patch(mine._id, { seatIndex: undefined });
    return null;
  },
});

export const joinRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const existing = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    if (existing.find((m: any) => m.userId === userId)) return null;
    await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId,
      role: "member",
      isMuted: false,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(args.roomId, { memberCount: (room.memberCount ?? 0) + 1 });
    return null;
  },
});
