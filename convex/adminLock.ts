// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

export const adminLockRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    isLocked: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    await ctx.db.patch(args.roomId, {
      isAdminLocked: args.isLocked,
      adminLockReason: args.isLocked ? (args.reason ?? "مخالفة شروط الاستخدام") : undefined,
    });
    await ctx.db.insert("notifications", {
      userId: room.ownerId,
      type: "system",
      title: args.isLocked ? "🔒 تم قفل غرفتك إدارياً" : "🔓 تم فتح قفل غرفتك",
      body: args.isLocked
        ? `تم قفل غرفة "${room.name}" إدارياً. السبب: ${args.reason ?? "مخالفة شروط الاستخدام"}`
        : `تم رفع القفل الإداري عن غرفة "${room.name}"`,
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const getRoomAdminLockStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    return {
      isAdminLocked: (room as any).isAdminLocked ?? false,
      adminLockReason: (room as any).adminLockReason ?? null,
      roomName: room.name,
    };
  },
});

// ── Report a direct message ───────────────────────────────────────────────
export const reportDirectMessage = mutation({
  args: {
    reportedUserId: v.id("users"),
    messageContent: v.string(),
    messageType: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    await ctx.db.insert("userReports", {
      reporterId: userId,
      reportedUserId: args.reportedUserId,
      reason: args.reason,
      details: `[رسالة خاصة - ${args.messageType ?? "نص"}]: ${args.messageContent.substring(0, 200)}`,
      status: "pending",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── Admin: Delete moment or reel ──────────────────────────────────────────
export const adminDeleteMoment = mutation({
  args: { momentId: v.id("moments") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const moment = await ctx.db.get(args.momentId);
    if (!moment) throw new Error("اللحظة غير موجودة");
    if (moment.imageStorageId) await ctx.storage.delete(moment.imageStorageId);
    const likes = await ctx.db.query("momentLikes").withIndex("by_moment", (q) => q.eq("momentId", args.momentId)).collect();
    for (const l of likes) await ctx.db.delete(l._id);
    const comments = await ctx.db.query("momentComments").withIndex("by_moment", (q) => q.eq("momentId", args.momentId)).collect();
    for (const c of comments) await ctx.db.delete(c._id);
    await ctx.db.delete(args.momentId);
    return { success: true };
  },
});

export const adminDeleteReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("الريل غير موجود");
    if (reel.videoStorageId) await ctx.storage.delete(reel.videoStorageId);
    const likes = await ctx.db.query("reelLikes").withIndex("by_reel", (q) => q.eq("reelId", args.reelId)).collect();
    for (const l of likes) await ctx.db.delete(l._id);
    const comments = await ctx.db.query("reelComments").withIndex("by_reel", (q) => q.eq("reelId", args.reelId)).collect();
    for (const c of comments) await ctx.db.delete(c._id);
    await ctx.db.delete(args.reelId);
    return { success: true };
  },
});

export const adminListMoments = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];
    const moments = await ctx.db.query("moments").order("desc").take(args.limit ?? 30);
    return await Promise.all(moments.map(async (m) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", m.userId)).unique();
      let imageUrl = m.imageUrl;
      if (m.imageStorageId && !imageUrl) imageUrl = await ctx.storage.getUrl(m.imageStorageId) ?? undefined;
      return { ...m, imageUrl, authorName: profile?.name ?? "مجهول", authorSakiId: profile?.sakiId ?? "" };
    }));
  },
});

export const adminListReels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!myProfile?.isSuperAdmin) return [];
    const reels = await ctx.db.query("reels").order("desc").take(args.limit ?? 30);
    return await Promise.all(reels.map(async (r) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.userId)).unique();
      let videoUrl = r.videoUrl;
      if (r.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(r.videoStorageId) ?? undefined;
      return { ...r, videoUrl, authorName: profile?.name ?? "مجهول", authorSakiId: profile?.sakiId ?? "" };
    }));
  },
});
