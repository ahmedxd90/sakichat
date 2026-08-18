// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const toggleSeatLock = mutation({
  args: { roomId: v.id("rooms"), seatIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const locked: number[] = (room as any).lockedSeats ?? [];
    const isLocked = locked.includes(args.seatIndex);
    if (isLocked) {
      await ctx.db.patch(args.roomId, {
        lockedSeats: locked.filter((s) => s !== args.seatIndex),
      } as any);
    } else {
      const allM = await ctx.db
        .query("roomMembers")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
      const occ = allM.find(
        (m) => m.seatIndex === args.seatIndex && m.userId !== userId
      );
      if (occ) await ctx.db.patch(occ._id, { seatIndex: undefined, isMuted: true });
      await ctx.db.patch(args.roomId, {
        lockedSeats: [...locked, args.seatIndex],
      } as any);
    }
  },
});
