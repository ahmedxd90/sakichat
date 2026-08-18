// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const assignBodyguard = mutation({
  args: { targetUserId: v.id("users"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.targetUserId) throw new Error("لا يمكنك حماية نفسك");

    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile) throw new Error("الملف الشخصي غير موجود");

    const targetProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    // Check if already guarding someone in this room
    const existing = await ctx.db.query("bodyguards")
      .withIndex("by_guard_and_room", (q) => q.eq("guardId", userId).eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (existing) {
      // Remove old assignment
      await ctx.db.patch(existing._id, { isActive: false, endedAt: Date.now() });
    }

    await ctx.db.insert("bodyguards", {
      guardId: userId,
      guardName: myProfile.name,
      guardAvatarUrl: myProfile.avatarUrl,
      protectedId: args.targetUserId,
      protectedName: targetProfile.name,
      protectedAvatarUrl: targetProfile.avatarUrl,
      roomId: args.roomId,
      isActive: true,
      createdAt: Date.now(),
    });

    // Notify protected user
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "bodyguard_assigned",
      title: "حارس شخصي 🛡️",
      body: `${myProfile.name} أصبح حارسك الشخصي في الغرفة`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
  },
});

export const removeBodyguard = mutation({
  args: { bodyguardId: v.id("bodyguards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const bg = await ctx.db.get(args.bodyguardId);
    if (!bg) throw new Error("غير موجود");
    if (bg.guardId !== userId && bg.protectedId !== userId) throw new Error("غير مصرح");

    await ctx.db.patch(args.bodyguardId, { isActive: false, endedAt: Date.now() });
  },
});

export const getRoomBodyguards = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const bgs = await ctx.db.query("bodyguards")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return bgs;
  },
});

export const getMyBodyguardInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Am I guarding someone?
    const asGuard = await ctx.db.query("bodyguards")
      .withIndex("by_guard_and_room", (q) => q.eq("guardId", userId).eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // Am I being guarded?
    const asProtected = await ctx.db.query("bodyguards")
      .withIndex("by_protected_and_room", (q) => q.eq("protectedId", userId).eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return { asGuard, asProtected };
  },
});

export const getUserBodyguardStatus = query({
  args: { userId: v.id("users"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const asGuard = await ctx.db.query("bodyguards")
      .withIndex("by_guard_and_room", (q) => q.eq("guardId", args.userId).eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const asProtected = await ctx.db.query("bodyguards")
      .withIndex("by_protected_and_room", (q) => q.eq("protectedId", args.userId).eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return { asGuard, asProtected };
  },
});
