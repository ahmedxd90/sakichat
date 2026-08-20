import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const getRoomMembers = (ctx: any, roomId: any) =>
  ctx.db.query("roomMembers").withIndex("by_room", (q: any) => q.eq("roomId", roomId)).collect();

export const sendSeatInvite = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    seatIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (args.seatIndex < 0) throw new Error("لا يمكن دعوة المستخدم إلى هذا المقعد");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const effectiveSeatLimit = (room as any).roomTheme === "royal" ? 22 : room.maxSeats;
    if (effectiveSeatLimit !== undefined && args.seatIndex >= effectiveSeatLimit) throw new Error("المقعد غير موجود في هذه الغرفة");

    const members = await getRoomMembers(ctx, args.roomId);
    const senderMember = members.find((member: any) => member.userId === userId);
    const targetMember = members.find((member: any) => member.userId === args.targetUserId);
    if (!targetMember) throw new Error("يجب أن يكون المستخدم داخل الغرفة أولاً");

    const isOwner = room.ownerId === userId;
    const isAdmin = senderMember?.role === "admin" || senderMember?.role === "super_admin";
    if (!isOwner && !isAdmin) throw new Error("فقط المالك والمشرفون يمكنهم دعوة المستخدمين للمقاعد");

    const occupant = members.find((member: any) => member.seatIndex === args.seatIndex && member.userId !== args.targetUserId);
    if (occupant) throw new Error("هذا المقعد مشغول حالياً");

    const existing = await ctx.db
      .query("roomSeatInvites")
      .withIndex("by_room_and_user", (q: any) => q.eq("roomId", args.roomId).eq("targetUserId", args.targetUserId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { seatIndex: args.seatIndex, createdAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("roomSeatInvites", {
      roomId: args.roomId,
      senderId: userId,
      targetUserId: args.targetUserId,
      seatIndex: args.seatIndex,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getMyPendingInvite = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invite = await ctx.db
      .query("roomSeatInvites")
      .withIndex("by_room_and_user", (q: any) => q.eq("roomId", args.roomId).eq("targetUserId", userId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();
    if (!invite) return null;

    const senderId = invite.senderId ?? invite.fromUserId;
    const senderProfile = senderId
      ? await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", senderId))
          .unique()
      : null;

    return {
      ...invite,
      senderName: senderProfile?.name ?? "المشرف",
      senderAvatar: senderProfile?.avatarUrl,
    };
  },
});

export const respondToSeatInvite = mutation({
  args: {
    inviteId: v.id("roomSeatInvites"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const invite = await ctx.db.get(args.inviteId);
    const targetUserId = invite?.targetUserId ?? invite?.toUserId;
    if (!invite || targetUserId !== userId) throw new Error("الدعوة غير موجودة");
    if (invite.status !== "pending") return;

    if (!args.accept) {
      await ctx.db.patch(invite._id, { status: "rejected" });
      return;
    }

    const room = await ctx.db.get(invite.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const members = await getRoomMembers(ctx, invite.roomId);
    const mine = members.find((member: any) => member.userId === userId);
    if (!mine) throw new Error("يجب أن تكون داخل الغرفة لقبول الدعوة");

    const occupant = members.find((member: any) => member.seatIndex === invite.seatIndex && member.userId !== userId);
    if (occupant) throw new Error("المقعد لم يعد متاحاً");

    for (const member of members) {
      if (member.userId === userId && member.seatIndex !== undefined && member.seatIndex !== null) {
        await ctx.db.patch(member._id, { seatIndex: undefined });
      }
    }
    await ctx.db.patch(mine._id, { seatIndex: invite.seatIndex });
    await ctx.db.patch(invite._id, { status: "accepted" });
  },
});
