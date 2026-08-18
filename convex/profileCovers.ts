// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── جلب غلاف المستخدم ──
export const getUserProfileCover = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const cover = await ctx.db
      .query("userProfileCovers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return cover ?? null;
  },
});

// ── رفع ملف SVGA (سوبر أدمن فقط) ──
export const generateProfileCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    return await ctx.storage.generateUploadUrl();
  },
});

// ── إرسال غلاف لمستخدم (سوبر أدمن فقط) ──
export const assignProfileCover = mutation({
  args: {
    targetSakiId: v.string(),
    svgaStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");

    // البحث عن المستخدم بالـ sakiId
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", args.targetSakiId))
      .unique();
    if (!targetProfile) throw new Error("المستخدم غير موجود");

    const svgaUrl = await ctx.storage.getUrl(args.svgaStorageId);
    if (!svgaUrl) throw new Error("فشل في الحصول على رابط الملف");

    // حذف الغلاف القديم إن وجد
    const existing = await ctx.db
      .query("userProfileCovers")
      .withIndex("by_userId", (q) => q.eq("userId", targetProfile.userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    // إضافة الغلاف الجديد
    await ctx.db.insert("userProfileCovers", {
      userId: targetProfile.userId,
      svgaStorageId: args.svgaStorageId,
      svgaUrl,
      assignedBy: userId,
      createdAt: Date.now(),
    });

    // إشعار للمستخدم
    await ctx.db.insert("notifications", {
      userId: targetProfile.userId,
      type: "system",
      title: "🎉 تم منحك غلاف خاص!",
      body: "تم منحك غلاف ملف شخصي حصري من الإدارة",
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });

    return { success: true, targetName: targetProfile.name };
  },
});

// ── إزالة غلاف مستخدم (سوبر أدمن فقط) ──
export const removeProfileCover = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");

    const existing = await ctx.db
      .query("userProfileCovers")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

// ── قائمة كل الغلافات المُعيّنة (سوبر أدمن) ──
export const listAllProfileCovers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!me?.isSuperAdmin) return [];

    const covers = await ctx.db
      .query("userProfileCovers")
      .order("desc")
      .collect();

    return Promise.all(
      covers.map(async (c) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", c.userId))
          .unique();
        return {
          ...c,
          userName: profile?.name ?? "مجهول",
          userSakiId: profile?.sakiId ?? "",
          userAvatarUrl: profile?.avatarUrl ?? null,
        };
      })
    );
  },
});
