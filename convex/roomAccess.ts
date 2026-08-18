// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

function getDurationMs(dur: string): number | undefined {
  if (dur === "1min") return 60_000;
  if (dur === "1h") return 3_600_000;
  if (dur === "1d") return 86_400_000;
  if (dur === "7d") return 604_800_000;
  if (dur === "1m") return 2_592_000_000;
  if (dur === "1y") return 31_536_000_000;
  return undefined;
}

function getDurationLabel(dur: string): string {
  if (dur === "1min") return "دقيقة واحدة";
  if (dur === "1h") return "ساعة واحدة";
  if (dur === "1d") return "يوم واحد";
  if (dur === "7d") return "7 أيام";
  if (dur === "1m") return "شهر واحد";
  if (dur === "1y") return "سنة واحدة";
  return "دائم";
}

export const checkRoomAccess = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: true };
    const now = Date.now();
    const banCandidates = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .take(20);
    const ban = banCandidates.find((candidate) => !candidate.banExpiresAt || candidate.banExpiresAt > now);
    if (ban) {
      return {
        allowed: false,
        type: "ban",
        bannedByName: ban.bannedByName ?? "مشرف",
        banDuration: ban.banDuration ?? "permanent",
        banDurationLabel: getDurationLabel(ban.banDuration ?? "permanent"),
        banExpiresAt: ban.banExpiresAt,
      };
    }
    const kickCandidates = await ctx.db
      .query("roomKicks")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .take(20);
    const kick = kickCandidates.find((candidate) => !candidate.kickExpiresAt || candidate.kickExpiresAt > now);
    if (kick) {
      return {
        allowed: false,
        type: "kick",
        kickedByName: kick.kickedByName ?? "مشرف",
        kickDuration: kick.kickDuration ?? "1d",
        kickDurationLabel: getDurationLabel(kick.kickDuration ?? "1d"),
        kickExpiresAt: kick.kickExpiresAt,
      };
    }
    return { allowed: true };
  },
});

export const getRoomLockStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) return { isLocked: false, isOwner: false };
    // فقط المالك يدخل بدون كلمة مرور — المشرفون يجب أن يدخلوا الكلمة
    const isOwner = userId !== null && userId === room.ownerId;
    return {
      isLocked: room.isLocked ?? false,
      isOwner,
    };
  },
});

export const getMuteInfo = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const memberCandidates = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .take(20);
    const member = memberCandidates[0];
    if (!member) return null;
    return {
      isMuted: member.isMuted ?? false,
      isChatMuted: member.isChatMuted ?? false,
      mutedByName: (member as any).mutedByName,
      chatMutedByName: (member as any).chatMutedByName,
    };
  },
});

export const banMemberWithDuration = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users"), duration: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!myMember || myMember.role !== "owner") throw new Error("فقط المالك يمكنه الحظر");
    const room = await ctx.db.get(args.roomId);
    if (room && args.targetUserId === room.ownerId) throw new Error("لا يمكنك حظر صاحب الغرفة");
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const now = Date.now();
    const ms = getDurationMs(args.duration);
    const banExpiresAt = ms ? now + ms : undefined;
    const existing = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        bannedBy: userId, bannedByName: myProfile?.name,
        banDuration: args.duration, banExpiresAt, createdAt: now,
      });
    } else {
      await ctx.db.insert("roomBans", {
        roomId: args.roomId, userId: args.targetUserId,
        bannedBy: userId, bannedByName: myProfile?.name,
        banDuration: args.duration, banExpiresAt, createdAt: now,
      });
    }
    const target = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (target) {
      await ctx.db.delete(target._id);
      if (room && room.memberCount > 0) await ctx.db.patch(args.roomId, { memberCount: room.memberCount - 1 });
    }
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, targetUserId: args.targetUserId,
      action: "ban", details: `المدة: ${getDurationLabel(args.duration)}`
    });
  },
});

export const kickMemberWithDuration = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users"), duration: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin")) throw new Error("ليس لديك صلاحية");
    const room = await ctx.db.get(args.roomId);
    if (room && args.targetUserId === room.ownerId) throw new Error("لا يمكنك طرد صاحب الغرفة");
    const target = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (target && target.role === "admin" && myMember.role !== "owner") throw new Error("لا يمكن للمشرف طرد مشرف آخر");
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const now = Date.now();
    const ms = getDurationMs(args.duration);
    const kickExpiresAt = ms ? now + ms : undefined;
    const existingKick = await ctx.db
      .query("roomKicks")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (existingKick) {
      await ctx.db.patch(existingKick._id, {
        kickedBy: userId, kickedByName: myProfile?.name,
        kickDuration: args.duration, kickExpiresAt, createdAt: now,
      });
    } else {
      await ctx.db.insert("roomKicks", {
        roomId: args.roomId, userId: args.targetUserId,
        kickedBy: userId, kickedByName: myProfile?.name,
        kickDuration: args.duration, kickExpiresAt, createdAt: now,
      });
    }
    if (target) {
      await ctx.db.delete(target._id);
      if (room && room.memberCount > 0) await ctx.db.patch(args.roomId, { memberCount: room.memberCount - 1 });
    }
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, targetUserId: args.targetUserId,
      action: "kick", details: `المدة: ${getDurationLabel(args.duration)}`
    });
  },
});
